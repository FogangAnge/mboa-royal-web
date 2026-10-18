import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageOff, Pencil, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { basculerDisponibilite, getPlatsAdmin, modifierPlat } from "../../api/admin";
import { API_URL } from "../../api/client";
import { useRestaurant } from "../../hooks/useRestaurant";
import { messagesErreur } from "../../lib/erreurs";
import { formatPrix, normaliser } from "../../lib/format";
import type { Plat } from "../../types/menu";
import FormulairePlat, { type CategorieAdmin } from "../FormulairePlat";
import Interrupteur from "../Interrupteur";

const ADMIN_DJANGO = API_URL.replace(/\/api\/?$/, "/admin/");

/** null : formulaire fermé · "nouveau" : création · un plat : modification. */
type Edition = null | "nouveau" | Plat;

export default function MenuAdmin() {
  const queryClient = useQueryClient();
  const { data: restaurant } = useRestaurant();
  const [recherche, setRecherche] = useState("");
  const [edition, setEdition] = useState<Edition>(null);
  const [annonce, setAnnonce] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const plats = useQuery({ queryKey: ["admin", "plats"], queryFn: getPlatsAdmin });

  useEffect(() => {
    if (!annonce) return;
    const minuteur = window.setTimeout(() => setAnnonce(null), 3500);
    return () => window.clearTimeout(minuteur);
  }, [annonce]);

  /** Remplace le plat dans la liste, puis prévient le menu public qu'il a changé. */
  function mettreAJour(maj: Plat) {
    queryClient.setQueryData<Plat[]>(["admin", "plats"], (liste) => liste?.map((p) => (p.id === maj.id ? maj : p)));
    queryClient.invalidateQueries({ queryKey: ["menu"] });
    setErreur(null);
  }

  const disponibilite = useMutation({
    mutationFn: basculerDisponibilite,
    onSuccess: (maj) => {
      mettreAJour(maj);
      setAnnonce(maj.est_disponible ? `« ${maj.nom} » est de nouveau disponible.` : `« ${maj.nom} » est marqué épuisé pour aujourd'hui.`);
    },
    onError: (probleme) => setErreur(messagesErreur(probleme)[0]),
  });

  const visibilite = useMutation({
    mutationFn: ({ id, est_actif }: { id: number; est_actif: boolean }) => modifierPlat(id, { est_actif }),
    onSuccess: (maj) => {
      mettreAJour(maj);
      setAnnonce(maj.est_actif ? `« ${maj.nom} » est visible sur le menu.` : `« ${maj.nom} » est masqué du menu.`);
    },
    onError: (probleme) => setErreur(messagesErreur(probleme)[0]),
  });

  const tous = plats.data ?? [];
  const occupe = disponibilite.isPending || visibilite.isPending;

  // Les catégories sont déduites des plats (on les crée dans l'admin Django).
  const categories: CategorieAdmin[] = [];
  for (const plat of tous) {
    if (!categories.some((c) => c.id === plat.categorie)) categories.push({ id: plat.categorie, nom: plat.categorie_nom });
  }

  const texte = normaliser(recherche.trim());
  const visibles = tous.filter((p) => !texte || normaliser(`${p.nom} ${p.region_origine}`).includes(texte));
  const epuises = tous.filter((p) => p.est_actif && !p.est_disponible).length;
  const masques = tous.filter((p) => !p.est_actif).length;

  function basculerVisibilite(plat: Plat, valeur: boolean) {
    if (valeur && plat.prix === 0) {
      setErreur(`Donnez d'abord un prix à « ${plat.nom} » (bouton Modifier) avant de l'afficher.`);
      return;
    }
    visibilite.mutate({ id: plat.id, est_actif: valeur });
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-titre text-4xl text-palmier-950">Menu & plats</h1>
          <p className="mt-1 text-sable-600">
            {tous.length} plat(s) · {epuises} épuisé(s) aujourd'hui · {masques} masqué(s)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEdition("nouveau")}
          disabled={categories.length === 0}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-palmier-950 px-5 font-bold text-creme-50 hover:bg-palmier-800 disabled:opacity-50"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Ajouter un plat
        </button>
      </header>

      <div className="relative max-w-md">
        <label htmlFor="recherche-plat" className="sr-only">Rechercher un plat</label>
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sable-600" />
        <input
          id="recherche-plat"
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un plat ou une région…"
          className="h-11 w-full rounded-full border-[1.5px] border-sable-300 bg-white pl-9 pr-4"
        />
      </div>

      {erreur && (
        <p role="alert" className="rounded-2xl bg-or-100 p-4 font-semibold text-argile-800">{erreur}</p>
      )}
      {plats.isPending && <p className="text-sable-600">Chargement des plats…</p>}
      {plats.isError && (
        <p role="alert" className="rounded-2xl bg-or-100 p-4 font-semibold text-argile-800">Impossible de charger les plats.</p>
      )}
      {plats.isSuccess && categories.length === 0 && (
        <p className="rounded-3xl border border-dashed border-sable-300 p-8 text-center text-sable-600">
          Aucune catégorie pour l'instant.{" "}
          <a href={ADMIN_DJANGO} target="_blank" rel="noopener noreferrer" className="font-bold text-palmier-800 underline">
            Créez-en une dans l'admin Django
          </a>
          , puis revenez ajouter vos plats.
        </p>
      )}

      {categories.map((categorie) => {
        const platsCategorie = visibles.filter((p) => p.categorie === categorie.id);
        if (platsCategorie.length === 0) return null;
        return (
          <section key={categorie.id} aria-labelledby={`categorie-${categorie.id}`} className="flex flex-col gap-3">
            <h2 id={`categorie-${categorie.id}`} className="font-titre text-2xl text-palmier-950">{categorie.nom}</h2>
            <ul className="flex flex-col gap-2">
              {platsCategorie.map((plat) => (
                <li
                  key={plat.id}
                  className={`flex flex-wrap items-center gap-4 rounded-2xl border border-[#E6DAC3] bg-creme-0 p-3 ${plat.est_actif ? "" : "opacity-70"}`}
                >
                  <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-or-100">
                    {plat.photo ? (
                      <img src={plat.photo} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <ImageOff aria-hidden="true" className="h-6 w-6 text-sable-600" />
                    )}
                  </div>

                  <div className="min-w-40 flex-1">
                    <p className="font-bold">
                      {plat.nom}
                      {plat.est_vedette && <span className="ml-2 rounded-lg bg-or-300 px-2 py-0.5 text-xs text-palmier-950">Signature</span>}
                    </p>
                    <p className="text-sm text-sable-600">
                      {plat.prix > 0 ? formatPrix(plat.prix, restaurant?.devise) : "Prix à définir"}
                      {plat.region_origine && ` · ${plat.region_origine}`}
                      {!plat.propose_aujourdhui && " · pas proposé aujourd'hui"}
                      {plat.groupes_options.length > 0 && ` · ${plat.groupes_options.length} question(s) d'options`}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                    <div className="flex items-center gap-2">
                      <Interrupteur
                        actif={plat.est_disponible}
                        onChange={() => disponibilite.mutate(plat.id)}
                        libelle={`${plat.nom} disponible aujourd'hui`}
                        desactive={occupe}
                      />
                      <span className="text-sm font-semibold">{plat.est_disponible ? "Disponible" : "Épuisé"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Interrupteur
                        actif={plat.est_actif}
                        onChange={(valeur) => basculerVisibilite(plat, valeur)}
                        libelle={`${plat.nom} visible sur le menu`}
                        desactive={occupe}
                      />
                      <span className="text-sm font-semibold">{plat.est_actif ? "Sur le menu" : "Masqué"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEdition(plat)}
                      className="inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] border-palmier-950 px-4 font-bold hover:bg-palmier-950 hover:text-creme-50"
                    >
                      <Pencil aria-hidden="true" className="h-4 w-4" />
                      Modifier
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <p className="text-sm text-sable-600">
        Les catégories et les options des plats (accompagnements, piment…) se gèrent pour l'instant dans{" "}
        <a href={ADMIN_DJANGO} target="_blank" rel="noopener noreferrer" className="font-semibold text-palmier-800 underline">l'admin Django</a>.
      </p>

      {edition !== null && (
        <FormulairePlat
          plat={edition === "nouveau" ? undefined : edition}
          categories={categories}
          nomsExistants={tous.map((p) => p.nom)}
          onFermer={() => setEdition(null)}
          onEnregistre={setAnnonce}
        />
      )}

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
        {annonce && (
          <p className="rounded-full bg-palmier-950 px-5 py-3 font-semibold text-creme-50 shadow-xl">{annonce}</p>
        )}
      </div>
    </div>
  );
}