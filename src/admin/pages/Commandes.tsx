import { ArrowLeft, Search } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router";

import { useRestaurant } from "../../hooks/useRestaurant";
import { formatHeure, formatPrix, normaliser } from "../../lib/format";
import type { Commande } from "../../types/commande";
import BadgeStatut from "../BadgeStatut";
import DetailCommande from "../DetailCommande";
import { ilYA, STATUTS_EN_COURS } from "../outils";
import { useCommandesAdmin } from "../useCommandesAdmin";

interface Filtre {
  cle: string;
  libelle: string;
  garde: (commande: Commande) => boolean;
}

const FILTRES: Filtre[] = [
  { cle: "en_cours", libelle: "En cours", garde: (c) => STATUTS_EN_COURS.includes(c.statut) },
  { cle: "nouvelles", libelle: "Nouvelles", garde: (c) => c.statut === "en_attente" },
  { cle: "terminees", libelle: "Terminées", garde: (c) => !STATUTS_EN_COURS.includes(c.statut) },
  { cle: "toutes", libelle: "Toutes", garde: () => true },
];

/** Les nouvelles d'abord, puis les plus anciennes : on sert dans l'ordre d'arrivée. */
function trier(a: Commande, b: Commande): number {
  const priorite = Number(b.statut === "en_attente") - Number(a.statut === "en_attente");
  if (priorite !== 0) return priorite;
  const enCoursA = STATUTS_EN_COURS.includes(a.statut);
  const ecart = new Date(a.date_creation).getTime() - new Date(b.date_creation).getTime();
  return enCoursA ? ecart : -ecart;
}

export default function Commandes() {
  const [params, setParams] = useSearchParams();
  const cleFiltre = params.get("filtre") ?? "en_cours";
  const numero = params.get("numero");
  const [recherche, setRecherche] = useState("");

  const { data: restaurant } = useRestaurant();
  const devise = restaurant?.devise;
  const commandes = useCommandesAdmin();
  const toutes = commandes.data ?? [];

  const filtre = FILTRES.find((f) => f.cle === cleFiltre) ?? FILTRES[0];
  const texte = normaliser(recherche.trim());
  const visibles = toutes
    .filter(filtre.garde)
    .filter((c) => !texte || normaliser(`${c.numero} ${c.nom_client} ${c.telephone_client} ${c.quartier}`).includes(texte))
    .sort(trier);
  const selection = numero ? toutes.find((c) => c.numero === numero) : undefined;

  function changerParam(cle: string, valeur: string | null) {
    const suivants = new URLSearchParams(params);
    if (valeur) suivants.set(cle, valeur);
    else suivants.delete(cle);
    setParams(suivants);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className={selection ? "hidden xl:block" : ""}>
        <h1 className="font-titre text-4xl text-palmier-950">Commandes</h1>
        <p className="mt-1 text-sable-600">
          La liste se met à jour toute seule toutes les 20 secondes
          {commandes.dataUpdatedAt > 0 && ` · dernière mise à jour à ${formatHeure(new Date(commandes.dataUpdatedAt).toISOString())}`}.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_30rem] xl:items-start">
        {/* ----- La liste ----- */}
        <section aria-label="Liste des commandes" className={`flex flex-col gap-4 ${selection ? "hidden xl:flex" : ""}`}>
          <div className="flex flex-wrap items-center gap-3">
            <div role="tablist" aria-label="Filtrer les commandes" className="flex flex-wrap gap-2">
              {FILTRES.map((f) => {
                const nombre = toutes.filter(f.garde).length;
                const actif = f.cle === filtre.cle;
                return (
                  <button
                    key={f.cle}
                    type="button"
                    role="tab"
                    aria-selected={actif}
                    onClick={() => changerParam("filtre", f.cle)}
                    className={`inline-flex h-11 items-center gap-2 rounded-full px-4 font-semibold ${actif ? "bg-palmier-950 text-creme-50" : "border border-sable-300 bg-creme-0 hover:border-palmier-950"}`}
                  >
                    {f.libelle}
                    <span className={`rounded-full px-2 text-xs font-bold ${actif ? "bg-or-500 text-palmier-950" : "bg-or-100"}`}>{nombre}</span>
                  </button>
                );
              })}
            </div>
            <div className="relative min-w-52 flex-1">
              <label htmlFor="recherche-commande" className="sr-only">Rechercher une commande</label>
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sable-600" />
              <input
                id="recherche-commande"
                type="search"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="N°, nom, téléphone, quartier…"
                className="h-11 w-full rounded-full border-[1.5px] border-sable-300 bg-white pl-9 pr-4"
              />
            </div>
          </div>

          {commandes.isPending && <p className="text-sable-600">Chargement des commandes…</p>}
          {commandes.isError && (
            <p role="alert" className="rounded-2xl bg-or-100 p-4 font-semibold text-argile-800">
              Impossible de charger les commandes. Vérifiez que le serveur est allumé.
            </p>
          )}
          {commandes.isSuccess && visibles.length === 0 && (
            <p className="rounded-3xl border border-dashed border-sable-300 p-10 text-center text-sable-600">
              Aucune commande ici pour le moment.
            </p>
          )}

          <ul className="flex flex-col gap-2">
            {visibles.map((c) => {
              const choisie = c.numero === numero;
              const nouvelle = c.statut === "en_attente";
              return (
                <li key={c.numero}>
                  <button
                    type="button"
                    onClick={() => changerParam("numero", c.numero)}
                    aria-current={choisie ? "true" : undefined}
                    className={`flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border bg-creme-0 p-4 text-left transition-colors hover:border-palmier-950 ${
                      choisie ? "border-palmier-950 ring-2 ring-or-500" : "border-[#E6DAC3]"
                    } ${nouvelle ? "border-l-8 border-l-or-500" : ""}`}
                  >
                    <span className="w-20 font-bold">{c.numero}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{c.nom_client}</span>
                      <span className="block truncate text-sm text-sable-600">
                        {c.mode === "livraison" ? c.quartier : "À emporter"} · {ilYA(c.date_creation)}
                        {c.heure_souhaitee && ` · pour ${formatHeure(c.heure_souhaitee)}`}
                      </span>
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <BadgeStatut statut={c.statut} libelle={c.statut_libelle} />
                      <span className="text-xs text-sable-600">
                        {c.est_payee ? "Payée" : "Non payée"}
                        {c.livreur_nom && ` · ${c.livreur_nom}`}
                      </span>
                    </span>
                    <span className="w-24 text-right font-bold">{formatPrix(c.total, devise)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ----- Le détail ----- */}
        <div className="xl:sticky xl:top-8">
          {selection ? (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => changerParam("numero", null)}
                className="inline-flex h-11 items-center gap-2 self-start font-bold text-palmier-800 xl:hidden"
              >
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                Retour à la liste
              </button>
              <DetailCommande
                key={`${selection.numero}-${selection.statut}-${selection.est_payee}-${selection.mode_paiement}`}
                commande={selection}
                devise={devise}
                onFermer={() => changerParam("numero", null)}
              />
            </div>
          ) : (
            <p className="hidden rounded-3xl border border-dashed border-sable-300 p-10 text-center text-sable-600 xl:block">
              Choisissez une commande pour voir le détail et la faire avancer.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}