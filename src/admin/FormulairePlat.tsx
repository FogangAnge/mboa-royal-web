import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";

import { creerPlat, modifierPlat } from "../api/admin";
import { messagesErreur } from "../lib/erreurs";
import { normaliser } from "../lib/format";
import type { Plat } from "../types/menu";

const CHAMP = "h-11 w-full rounded-xl border-[1.5px] border-sable-300 bg-white px-3";
const ZONE = "w-full rounded-xl border-[1.5px] border-sable-300 bg-white p-3";
const ETIQUETTE = "text-sm font-semibold";
const TAILLE_MAX_PHOTO = 5 * 1024 * 1024;

const JOURS = [
  { cle: "lundi", court: "Lun" },
  { cle: "mardi", court: "Mar" },
  { cle: "mercredi", court: "Mer" },
  { cle: "jeudi", court: "Jeu" },
  { cle: "vendredi", court: "Ven" },
  { cle: "samedi", court: "Sam" },
  { cle: "dimanche", court: "Dim" },
] as const;

type CleJour = (typeof JOURS)[number]["cle"];

export interface CategorieAdmin {
  id: number;
  nom: string;
}

interface Props {
  /** Le plat à modifier ; absent pour un nouveau plat. */
  plat?: Plat;
  categories: CategorieAdmin[];
  nomsExistants: string[];
  onFermer: () => void;
  onEnregistre: (message: string) => void;
}

export default function FormulairePlat({ plat, categories, nomsExistants, onFermer, onEnregistre }: Props) {
  const dialogue = useRef<HTMLDialogElement>(null);
  const queryClient = useQueryClient();

  const [nom, setNom] = useState(plat?.nom ?? "");
  const [nomEn, setNomEn] = useState(plat?.nom_en ?? "");
  const [categorie, setCategorie] = useState(String(plat?.categorie ?? categories[0]?.id ?? ""));
  const [prix, setPrix] = useState(plat ? String(plat.prix) : "");
  const [region, setRegion] = useState(plat?.region_origine ?? "");
  const [description, setDescription] = useState(plat?.description ?? "");
  const [descriptionEn, setDescriptionEn] = useState(plat?.description_en ?? "");
  const [ordre, setOrdre] = useState(String(plat?.ordre ?? 0));
  const [actif, setActif] = useState(plat?.est_actif ?? true);
  const [vedette, setVedette] = useState(plat?.est_vedette ?? false);
  const [jours, setJours] = useState<Record<CleJour, boolean>>(() => ({
    lundi: plat?.lundi ?? true,
    mardi: plat?.mardi ?? true,
    mercredi: plat?.mercredi ?? true,
    jeudi: plat?.jeudi ?? true,
    vendredi: plat?.vendredi ?? true,
    samedi: plat?.samedi ?? true,
    dimanche: plat?.dimanche ?? true,
  }));
  const [photo, setPhoto] = useState<File | null>(null);
  const [apercu, setApercu] = useState<string | null>(plat?.photo ?? null);
  const [erreurs, setErreurs] = useState<string[]>([]);

  useEffect(() => {
    const element = dialogue.current;
    if (element && !element.open) element.showModal();
  }, []);

  // L'aperçu d'une nouvelle photo est une adresse temporaire : on la libère en fermant.
  const adresseTemporaire = useRef<string | null>(null);
  useEffect(
    () => () => {
      if (adresseTemporaire.current) URL.revokeObjectURL(adresseTemporaire.current);
    },
    [],
  );

  const enregistrement = useMutation({
    mutationFn: (donnees: FormData) => (plat ? modifierPlat(plat.id, donnees) : creerPlat(donnees)),
    onSuccess: (enregistre) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "plats"] });
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      onEnregistre(plat ? `« ${enregistre.nom} » a été modifié.` : `« ${enregistre.nom} » a été ajouté au menu.`);
      onFermer();
    },
    onError: (probleme) => setErreurs(messagesErreur(probleme)),
  });

  function choisirPhoto(evenement: ChangeEvent<HTMLInputElement>) {
    const fichier = evenement.target.files?.[0];
    if (!fichier) return;
    if (fichier.size > TAILLE_MAX_PHOTO) {
      setErreurs(["La photo dépasse 5 Mo. Choisissez une image plus légère."]);
      return;
    }
    if (adresseTemporaire.current) URL.revokeObjectURL(adresseTemporaire.current);
    adresseTemporaire.current = URL.createObjectURL(fichier);
    setErreurs([]);
    setPhoto(fichier);
    setApercu(adresseTemporaire.current);
  }

  function envoyer(evenement: FormEvent) {
    evenement.preventDefault();
    const problemes: string[] = [];
    const prixNombre = Number(prix);
    if (!nom.trim()) problemes.push("Indiquez le nom du plat.");
    const doublon = nomsExistants.some((n) => normaliser(n) === normaliser(nom.trim()) && n !== plat?.nom);
    if (doublon) problemes.push("Un plat porte déjà ce nom.");
    if (!categorie) problemes.push("Choisissez une catégorie.");
    if (prix === "" || !Number.isInteger(prixNombre) || prixNombre < 0) problemes.push("Indiquez un prix valide.");
    if (actif && prixNombre === 0) problemes.push("Un plat visible sur le menu doit avoir un prix.");
    if (!Object.values(jours).some(Boolean)) problemes.push("Cochez au moins un jour.");
    if (problemes.length > 0) {
      setErreurs(problemes);
      return;
    }

    const donnees = new FormData();
    donnees.append("nom", nom.trim());
    donnees.append("nom_en", nomEn.trim());
    donnees.append("categorie", categorie);
    donnees.append("prix", String(prixNombre));
    donnees.append("region_origine", region.trim());
    donnees.append("description", description.trim());
    donnees.append("description_en", descriptionEn.trim());
    donnees.append("ordre", String(Number(ordre) || 0));
    donnees.append("est_actif", String(actif));
    donnees.append("est_vedette", String(vedette));
    for (const { cle } of JOURS) donnees.append(cle, String(jours[cle]));
    if (photo) donnees.append("photo", photo);

    setErreurs([]);
    enregistrement.mutate(donnees);
  }

  return (
    <dialog
      ref={dialogue}
      onClose={onFermer}
      aria-labelledby="titre-plat"
      className="m-auto max-h-[92vh] w-[min(100%-2rem,40rem)] overflow-y-auto rounded-3xl bg-creme-0 p-0 text-encre-900 backdrop:bg-palmier-950/60"
    >
      <form onSubmit={envoyer} noValidate className="flex flex-col gap-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id="titre-plat" className="font-titre text-3xl text-palmier-950">
            {plat ? `Modifier « ${plat.nom} »` : "Nouveau plat"}
          </h2>
          <button type="button" onClick={onFermer} aria-label="Fermer" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-or-100">
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        {/* La photo */}
        <div className="flex items-center gap-4">
          <div className="flex h-24 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-or-100">
            {apercu ? (
              <img src={apercu} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus aria-hidden="true" className="h-8 w-8 text-sable-600" />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="photo-plat" className="inline-flex h-11 cursor-pointer items-center self-start rounded-full border-[1.5px] border-palmier-950 px-4 font-bold hover:bg-palmier-950 hover:text-creme-50">
              {apercu ? "Changer la photo" : "Ajouter une photo"}
            </label>
            <input id="photo-plat" type="file" accept="image/jpeg,image/png,image/webp" onChange={choisirPhoto} className="sr-only" />
            <p className="text-xs text-sable-600">JPG, PNG ou WebP · 5 Mo maximum · format paysage conseillé</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nom-plat" className={ETIQUETTE}>Nom (français)</label>
            <input id="nom-plat" className={CHAMP} value={nom} onChange={(e) => setNom(e.target.value)} maxLength={120} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nom-en-plat" className={ETIQUETTE}>Nom (anglais)</label>
            <input id="nom-en-plat" className={CHAMP} value={nomEn} onChange={(e) => setNomEn(e.target.value)} maxLength={120} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="categorie-plat" className={ETIQUETTE}>Catégorie</label>
            <select id="categorie-plat" className={CHAMP} value={categorie} onChange={(e) => setCategorie(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="prix-plat" className={ETIQUETTE}>Prix (FCFA)</label>
            <input id="prix-plat" inputMode="numeric" className={CHAMP} value={prix} onChange={(e) => setPrix(e.target.value.replace(/\D/g, ""))} placeholder="Ex. : 4500" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="region-plat" className={ETIQUETTE}>Région d'origine</label>
            <input id="region-plat" className={CHAMP} value={region} onChange={(e) => setRegion(e.target.value)} maxLength={80} placeholder="Ex. : Littoral" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ordre-plat" className={ETIQUETTE}>Ordre d'affichage</label>
            <input id="ordre-plat" inputMode="numeric" className={CHAMP} value={ordre} onChange={(e) => setOrdre(e.target.value.replace(/\D/g, ""))} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="description-plat" className={ETIQUETTE}>Description (français)</label>
            <textarea id="description-plat" rows={3} className={ZONE} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="description-en-plat" className={ETIQUETTE}>Description (anglais)</label>
            <textarea id="description-en-plat" rows={2} className={ZONE} value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} />
          </div>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className={`${ETIQUETTE} mb-2`}>Jours où le plat est proposé</legend>
          <div className="flex flex-wrap gap-2">
            {JOURS.map(({ cle, court }) => (
              <label
                key={cle}
                className={`inline-flex h-11 min-w-14 cursor-pointer items-center justify-center rounded-full border-[1.5px] px-3 font-bold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-or-500 ${
                  jours[cle] ? "border-palmier-950 bg-palmier-950 text-creme-50" : "border-sable-300 bg-white text-sable-600"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={jours[cle]}
                  onChange={(e) => setJours({ ...jours, [cle]: e.target.checked })}
                />
                {court}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 font-semibold">
            <input type="checkbox" checked={actif} onChange={(e) => setActif(e.target.checked)} className="h-5 w-5 accent-palmier-800" />
            Visible sur le menu
          </label>
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 font-semibold">
            <input type="checkbox" checked={vedette} onChange={(e) => setVedette(e.target.checked)} className="h-5 w-5 accent-palmier-800" />
            Plat signature (mis en avant sur l'accueil)
          </label>
        </div>

        {erreurs.length > 0 && (
          <ul role="alert" className="flex flex-col gap-1 rounded-2xl bg-or-100 p-4 font-semibold text-argile-800">
            {erreurs.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={enregistrement.isPending}
            className="h-12 flex-1 rounded-full bg-or-500 px-6 font-bold text-palmier-950 hover:bg-or-300 disabled:opacity-50"
          >
            {enregistrement.isPending ? "Enregistrement…" : plat ? "Enregistrer les modifications" : "Ajouter le plat"}
          </button>
          <button type="button" onClick={onFermer} className="h-12 rounded-full px-5 font-bold text-palmier-800 underline underline-offset-4">
            Annuler
          </button>
        </div>
      </form>
    </dialog>
  );
}