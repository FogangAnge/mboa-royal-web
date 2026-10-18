import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

import { getReservations } from "../../api/admin";
import { useRestaurant } from "../../hooks/useRestaurant";
import { FUSEAU_RESTAURANT, formatHeure, formatPrix } from "../../lib/format";
import BadgeStatut from "../BadgeStatut";
import SectionGraphiques from "../SectionGraphiques";
import { estDuJour, ilYA, jourRestaurant, STATUTS_EN_COURS } from "../outils";
import { useCommandesAdmin } from "../useCommandesAdmin";

const CARTE = "rounded-3xl border border-[#E6DAC3] bg-creme-0 p-5";

function dateDuJour(): string {
  const texte = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: FUSEAU_RESTAURANT,
  }).format(new Date());
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

export default function TableauDeBord() {
  const { data: restaurant } = useRestaurant();
  const devise = restaurant?.devise;
  const commandes = useCommandesAdmin();
  const aujourdhui = jourRestaurant();
  const reservations = useQuery({
    queryKey: ["admin", "reservations", aujourdhui],
    queryFn: () => getReservations(aujourdhui),
    refetchInterval: 60_000,
  });

  const toutes = commandes.data ?? [];
  const duJour = toutes.filter((c) => estDuJour(c.date_creation) && c.statut !== "annulee");
  const enCours = toutes
    .filter((c) => STATUTS_EN_COURS.includes(c.statut))
    .sort((a, b) => new Date(a.date_creation).getTime() - new Date(b.date_creation).getTime());
  const nouvelles = enCours.filter((c) => c.statut === "en_attente").length;
  const chiffre = duJour.reduce((somme, c) => somme + Number(c.total), 0);
  const dejaPaye = duJour.filter((c) => c.est_payee).reduce((somme, c) => somme + Number(c.total), 0);

  const resas = [...(reservations.data ?? [])].sort(
    (a, b) => new Date(a.date_heure).getTime() - new Date(b.date_heure).getTime(),
  );
  const actives = resas.filter((r) => !["annulee", "refusee"].includes(r.statut));
  const aConfirmer = resas.filter((r) => r.statut === "en_attente").length;
  const couverts = actives.reduce((somme, r) => somme + r.nb_personnes, 0);

  const indicateurs = [
    { libelle: "Commandes du jour", valeur: String(duJour.length), detail: `${enCours.length} en cours` },
    { libelle: "Chiffre d'affaires du jour", valeur: formatPrix(chiffre, devise), detail: `${formatPrix(dejaPaye, devise)} déjà payés` },
    { libelle: "Nouvelles commandes", valeur: String(nouvelles), detail: nouvelles > 0 ? "à confirmer vite" : "rien en attente" },
    { libelle: "Réservations du jour", valeur: String(actives.length), detail: `${couverts} couvert(s) · ${aConfirmer} à confirmer` },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-titre text-4xl text-palmier-950">Aujourd'hui</h1>
          <p className="mt-1 text-sable-600">
            {dateDuJour()}
            {restaurant && (restaurant.est_ouvert ? " · restaurant ouvert" : " · restaurant fermé")}
          </p>
        </div>
        <Link to="/admin/commandes" className="inline-flex h-11 items-center gap-2 rounded-full bg-palmier-950 px-5 font-bold text-creme-50 hover:bg-palmier-800">
          Gérer les commandes
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </header>

      {commandes.isError && (
        <p role="alert" className="rounded-2xl bg-or-100 p-4 font-semibold text-argile-800">
          Impossible de charger les commandes. Vérifiez que le serveur est allumé.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {indicateurs.map((indicateur) => (
          <div key={indicateur.libelle} className={CARTE}>
            <p className="text-sm text-sable-600">{indicateur.libelle}</p>
            <p className="mt-1 text-3xl font-bold text-palmier-950">{commandes.isPending ? "…" : indicateur.valeur}</p>
            <p className="text-sm font-semibold text-argile-800">{indicateur.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] xl:items-start">
        <section aria-labelledby="titre-en-cours" className={CARTE}>
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 id="titre-en-cours" className="text-xl font-bold text-palmier-950">Commandes en cours</h2>
            <Link to="/admin/commandes" className="text-sm font-bold text-palmier-800 underline underline-offset-4">Tout voir</Link>
          </div>
          {enCours.length === 0 ? (
            <p className="py-6 text-center text-sable-600">Aucune commande en cours.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-[#EFE6D4]">
              {enCours.slice(0, 8).map((c) => (
                <li key={c.numero}>
                  <Link
                    to={`/admin/commandes?numero=${c.numero}`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl px-2 py-3 hover:bg-creme-50"
                  >
                    <span className="w-20 font-bold">{c.numero}</span>
                    <span className="min-w-0 flex-1">
                      {c.nom_client}
                      <span className="block text-sm text-sable-600">
                        {c.mode === "livraison" ? c.quartier : "À emporter"} · {ilYA(c.date_creation)}
                      </span>
                    </span>
                    <BadgeStatut statut={c.statut} libelle={c.statut_libelle} />
                    <span className="w-28 text-right font-semibold">{formatPrix(Number(c.total), devise)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="titre-resas" className={CARTE}>
          <h2 id="titre-resas" className="mb-3 text-xl font-bold text-palmier-950">Réservations du jour</h2>
          {reservations.isError && <p className="text-argile-800">Impossible de charger les réservations.</p>}
          {!reservations.isError && resas.length === 0 && (
            <p className="py-6 text-center text-sable-600">Aucune réservation aujourd'hui.</p>
          )}
          <ul className="flex flex-col gap-3">
            {resas.map((r) => (
              <li key={r.numero} className="flex items-center justify-between gap-3">
                <span>
                  <strong>{formatHeure(r.date_heure)}</strong> · {r.nom} · {r.nb_personnes} pers.
                </span>
                <BadgeStatut statut={r.statut} libelle={r.statut_libelle} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Les tendances viennent après l'urgent : ce qu'il faut faire maintenant reste en haut. */}
      <SectionGraphiques commandes={toutes} restaurant={restaurant} enActualisation={commandes.isFetching && !commandes.isPending} />
    </div>
  );
}
