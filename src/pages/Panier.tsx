import { useMutation, useQuery } from "@tanstack/react-query";
import { ShoppingBag, Trash2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";

import { passerCommande } from "../api/commandes";
import { getVilles, getZones } from "../api/zones";
import Quantite from "../components/Quantite";
import { useMenu } from "../hooks/useMenu";
import { useRestaurant } from "../hooks/useRestaurant";
import { messagesErreur } from "../lib/erreurs";
import { formatPrix } from "../lib/format";
import { enregistrerCommande } from "../lib/mesCommandes";
import { usePanier } from "../panier/usePanier";
import type { ModeCommande } from "../types/commande";

type Moment = "maintenant" | "programmer";

const CHAMP = "h-12 w-full rounded-xl border-[1.5px] border-sable-300 bg-white px-3 text-base";
const ETIQUETTE = "text-sm font-semibold";

/** Date → « 2026-10-18T12:30 », le format attendu par <input type="datetime-local">. */
function versChampDateHeure(date: Date): string {
  const deux = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${deux(date.getMonth() + 1)}-${deux(date.getDate())}T${deux(date.getHours())}:${deux(date.getMinutes())}`;
}

function classeChoix(actif: boolean): string {
  const base = "flex h-11 cursor-pointer items-center justify-center rounded-xl font-bold focus-within:outline focus-within:outline-3 focus-within:outline-or-500";
  return actif ? base + " bg-palmier-950 text-creme-50" : base + " text-encre-900";
}

export default function Panier() {
  const { lignes, sousTotal, changerQuantite, retirer, vider } = usePanier();
  const { data: restaurant } = useRestaurant();
  const { data: categories } = useMenu();
  const navigate = useNavigate();
  const devise = restaurant?.devise ?? "FCFA";

  const [mode, setMode] = useState<ModeCommande>("livraison");
  const [villeId, setVilleId] = useState<number | null>(null);
  const [zoneId, setZoneId] = useState<number | null>(null);
  const [repere, setRepere] = useState("");
  const [moment, setMoment] = useState<Moment>("maintenant");
  const [heure, setHeure] = useState("");
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [note, setNote] = useState("");
  const [erreurs, setErreurs] = useState<string[]>([]);

  const villes = useQuery({ queryKey: ["villes"], queryFn: getVilles });
  const villeChoisie = villeId ?? (villes.data?.length === 1 ? villes.data[0].id : null);
  const zones = useQuery({
    queryKey: ["zones", villeChoisie],
    queryFn: () => getZones(villeChoisie as number),
    enabled: villeChoisie !== null,
  });

  const zone = zones.data?.find((z) => z.id === zoneId) ?? null;
  const frais = mode === "livraison" && zone ? zone.frais : 0;

  const platsParId = useMemo(
    () => new Map((categories ?? []).flatMap((c) => c.plats).map((p) => [p.id, p])),
    [categories],
  );
  const indisponibles = categories ? lignes.filter((l) => !platsParId.get(l.platId)?.commandable) : [];

  const restaurantFerme = restaurant ? !restaurant.est_ouvert : false;
  const momentEffectif: Moment = restaurantFerme ? "programmer" : moment;
  const heureMin = versChampDateHeure(new Date(Date.now() + (restaurant?.delai_preparation_min ?? 30) * 60_000));

  const commande = useMutation({
    mutationFn: passerCommande,
    onSuccess: (creee) => {
      enregistrerCommande({
        numero: creee.numero,
        telephone: creee.telephone_client,
        code: creee.code_livraison,
        total: creee.total,
        lienWhatsapp: creee.lien_whatsapp,
        date: creee.date_creation,
      });
      vider();
      navigate(`/commande/${creee.numero}`, { state: { commande: creee } });
    },
    onError: (erreur) => setErreurs(messagesErreur(erreur)),
  });

  function envoyer(evenement: FormEvent) {
    evenement.preventDefault();
    const problemes: string[] = [];
    if (mode === "livraison" && zoneId === null) problemes.push("Choisissez votre quartier de livraison.");
    if (momentEffectif === "programmer" && !heure) problemes.push("Choisissez l'heure souhaitée.");
    if (!nom.trim()) problemes.push("Indiquez votre nom.");
    if (!telephone.trim()) problemes.push("Indiquez votre numéro de téléphone.");
    if (problemes.length > 0) {
      setErreurs(problemes);
      return;
    }

    setErreurs([]);
    commande.mutate({
      mode,
      zone_livraison: mode === "livraison" ? zoneId : null,
      repere: mode === "livraison" ? repere.trim() : "",
      nom_client: nom.trim(),
      telephone_client: telephone.trim(),
      heure_souhaitee: momentEffectif === "programmer" ? new Date(heure).toISOString() : null,
      note: note.trim(),
      lignes: lignes.map((l) => ({ plat: l.platId, quantite: l.quantite, options: l.options.map((o) => o.id) })),
    });
  }

  if (lignes.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
        <ShoppingBag aria-hidden="true" className="h-14 w-14 text-or-500" />
        <h1 className="font-titre text-4xl text-palmier-950">Votre panier est vide</h1>
        <p className="text-sable-600">Parcourez le menu et ajoutez vos plats préférés.</p>
        <Link to="/menu" className="inline-flex h-12 items-center rounded-full bg-palmier-950 px-6 font-bold text-creme-50">
          Voir le menu
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-8 font-titre text-5xl text-palmier-950">Votre panier</h1>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* ---------- Les plats ---------- */}
        <section aria-label="Plats du panier" className="flex flex-1 flex-col gap-3">
          {indisponibles.length > 0 && (
            <p className="rounded-2xl bg-or-100 p-4 font-semibold text-argile-800">
              Certains plats ne sont pas disponibles aujourd'hui :{" "}
              {indisponibles.map((l) => l.nom).join(", ")}. Retirez-les, ou programmez votre commande pour un autre jour.
            </p>
          )}

          {lignes.map((ligne) => (
            <article key={ligne.cle} className="flex flex-wrap items-center gap-4 rounded-2xl border border-sable-300 bg-creme-0 p-4">
              {ligne.photo && (
                <img src={ligne.photo} alt="" width={64} height={64} className="h-16 w-16 rounded-xl object-cover" />
              )}
              <div className="min-w-40 flex-1">
                <h2 className="font-bold">{ligne.nom}</h2>
                {ligne.options.length > 0 && (
                  <p className="text-sm text-sable-600">{ligne.options.map((o) => o.nom).join(", ")}</p>
                )}
                <p className="text-sm font-semibold">{formatPrix(ligne.prixUnitaire, devise)} l'unité</p>
              </div>
              <Quantite
                valeur={ligne.quantite}
                onChange={(quantite) => changerQuantite(ligne.cle, quantite)}
                libelle={`Quantité de ${ligne.nom}`}
              />
              <button
                type="button"
                onClick={() => retirer(ligne.cle)}
                aria-label={`Retirer ${ligne.nom} du panier`}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-argile-800 hover:bg-or-100"
              >
                <Trash2 aria-hidden="true" className="h-5 w-5" />
              </button>
            </article>
          ))}

          <Link to="/menu" className="mt-2 font-bold text-palmier-800 underline underline-offset-4">
            Ajouter d'autres plats
          </Link>
        </section>

        {/* ---------- Le formulaire ---------- */}
        <form onSubmit={envoyer} noValidate className="flex w-full flex-col gap-5 rounded-3xl border border-sable-300 bg-creme-0 p-6 lg:w-[420px]">
          <fieldset className="grid grid-cols-2 gap-2 rounded-2xl bg-or-100 p-1.5">
            <legend className="sr-only">Mode de retrait</legend>
            <label className={classeChoix(mode === "livraison")}>
              <input type="radio" name="mode" className="sr-only" checked={mode === "livraison"} onChange={() => setMode("livraison")} />
              Livraison
            </label>
            <label className={classeChoix(mode === "emporter")}>
              <input type="radio" name="mode" className="sr-only" checked={mode === "emporter"} onChange={() => setMode("emporter")} />
              À emporter
            </label>
          </fieldset>

          {mode === "livraison" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ville" className={ETIQUETTE}>Ville</label>
                <select
                  id="ville"
                  className={CHAMP}
                  value={villeChoisie ?? ""}
                  onChange={(e) => {
                    setVilleId(e.target.value ? Number(e.target.value) : null);
                    setZoneId(null);
                  }}
                >
                  <option value="">Choisir…</option>
                  {villes.data?.map((ville) => (
                    <option key={ville.id} value={ville.id}>{ville.nom}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="quartier" className={ETIQUETTE}>Quartier</label>
                <select
                  id="quartier"
                  className={CHAMP}
                  value={zoneId ?? ""}
                  disabled={villeChoisie === null}
                  onChange={(e) => setZoneId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Choisir…</option>
                  {zones.data?.map((z) => (
                    <option key={z.id} value={z.id}>{z.quartier_nom} — {formatPrix(z.frais, devise)}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <label htmlFor="repere" className={ETIQUETTE}>Point de repère</label>
                <input
                  id="repere"
                  className={CHAMP}
                  value={repere}
                  onChange={(e) => setRepere(e.target.value)}
                  placeholder="Ex. : face à la pharmacie, portail bleu"
                  maxLength={255}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="moment" className={ETIQUETTE}>Quand ?</label>
            {restaurantFerme && (
              <p className="text-sm font-semibold text-argile-800">
                Le restaurant est fermé pour le moment : programmez votre commande.
              </p>
            )}
            <select
              id="moment"
              className={CHAMP}
              value={momentEffectif}
              disabled={restaurantFerme}
              onChange={(e) => setMoment(e.target.value as Moment)}
            >
              <option value="maintenant">Dès que possible</option>
              <option value="programmer">Programmer une heure</option>
            </select>
            {momentEffectif === "programmer" && (
              <input
                type="datetime-local"
                aria-label="Date et heure souhaitées"
                className={CHAMP + " mt-2"}
                value={heure}
                min={heureMin}
                onChange={(e) => setHeure(e.target.value)}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="nom" className={ETIQUETTE}>Nom</label>
              <input id="nom" className={CHAMP} value={nom} onChange={(e) => setNom(e.target.value)} autoComplete="name" maxLength={150} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="telephone" className={ETIQUETTE}>Téléphone (WhatsApp)</label>
              <input
                id="telephone"
                type="tel"
                inputMode="tel"
                className={CHAMP}
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                autoComplete="tel"
                placeholder="6XX XX XX XX"
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <label htmlFor="note" className={ETIQUETTE}>Note pour le restaurant (facultatif)</label>
              <textarea
                id="note"
                rows={2}
                className="w-full rounded-xl border-[1.5px] border-sable-300 bg-white p-3"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
              />
            </div>
          </div>

          <dl className="flex flex-col gap-2 border-t border-dashed border-sable-300 pt-4">
            <div className="flex justify-between">
              <dt className="text-sable-600">Sous-total</dt>
              <dd>{formatPrix(sousTotal, devise)}</dd>
            </div>
            {mode === "livraison" && (
              <div className="flex justify-between">
                <dt className="text-sable-600">Livraison{zone ? ` · ${zone.quartier_nom}` : ""}</dt>
                <dd>{zone ? formatPrix(frais, devise) : "Choisissez un quartier"}</dd>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold">
              <dt>Total estimé</dt>
              <dd>{formatPrix(sousTotal + frais, devise)}</dd>
            </div>
          </dl>

          {erreurs.length > 0 && (
            <div role="alert" className="rounded-2xl bg-or-100 p-4 text-argile-800">
              <ul className="flex flex-col gap-1 font-semibold">
                {erreurs.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="submit"
            disabled={commande.isPending}
            className="h-14 rounded-full bg-whatsapp text-lg font-bold text-white transition-opacity disabled:opacity-60"
          >
            {commande.isPending ? "Envoi en cours…" : "Valider la commande"}
          </button>
          <p className="text-center text-sm text-sable-600">
            Votre commande est enregistrée, puis vous la confirmez sur WhatsApp avant sa préparation.
          </p>
        </form>
      </div>
    </div>
  );
}