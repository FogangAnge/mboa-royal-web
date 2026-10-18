import { useState } from "react";

import { formatPrix } from "../lib/format";
import type { Commande } from "../types/commande";
import type { Restaurant } from "../types/restaurant";
import { Barres, CarteGraphique, Colonnes } from "./Graphiques";
import { chiffreParJour, commandesDeLaPeriode, commandesParHeure, platsLesPlusVendus } from "./statistiques";

const PERIODES = [7, 14, 30] as const;

interface Props {
  commandes: Commande[];
  restaurant?: Restaurant;
  /** Pendant une actualisation, on garde les graphiques mais on les estompe : pas de saut. */
  enActualisation: boolean;
}

export default function SectionGraphiques({ commandes, restaurant, enActualisation }: Props) {
  const [nbJours, setNbJours] = useState<(typeof PERIODES)[number]>(14);
  const devise = restaurant?.devise;

  const periode = commandesDeLaPeriode(commandes, nbJours);
  const jours = chiffreParJour(periode, nbJours);
  const heures = commandesParHeure(periode, nbJours, restaurant?.horaires);
  const plats = platsLesPlusVendus(periode);

  const total = jours.reduce((somme, j) => somme + j.valeur, 0);
  const meilleurJour = jours.reduce((meilleur, j) => (j.valeur > meilleur.valeur ? j : meilleur), jours[0]);
  const pointes = heures.filter((h) => h.enAvant).map((h) => h.detail.toLowerCase());

  return (
    <div className="flex flex-col gap-4">
      {/* Un seul filtre, au-dessus de tous les graphiques : les chiffres concordent toujours. */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="mr-2 font-titre text-2xl text-palmier-950">Tendances</h2>
        <div role="radiogroup" aria-label="Période" className="flex gap-2">
          {PERIODES.map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={nbJours === n}
              onClick={() => setNbJours(n)}
              className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold ${
                nbJours === n ? "bg-palmier-950 text-creme-50" : "border border-sable-300 bg-creme-0 hover:border-palmier-950"
              }`}
            >
              {n} jours
            </button>
          ))}
        </div>
      </div>

      <div className={`flex flex-col gap-4 transition-opacity ${enActualisation ? "opacity-70" : ""}`}>
        <CarteGraphique
          titre={`Chiffre d'affaires par jour (${nbJours} derniers jours)`}
          resume={
            total > 0 ? (
              <>
                {formatPrix(total, devise)} au total
                {meilleurJour && meilleurJour.valeur > 0 && <> · meilleur jour : {meilleurJour.detail}</>}. Aujourd'hui est en rouge.
              </>
            ) : (
              "Aucune vente sur la période pour l'instant."
            )
          }
        >
          <Colonnes points={jours} mesure="Chiffre d'affaires" formatValeur={(v) => formatPrix(v, devise)} />
        </CarteGraphique>

        <div className="grid gap-4 xl:grid-cols-2">
          <CarteGraphique
            titre="Heures de pointe"
            resume={
              pointes.length > 0
                ? `Commandes reçues en moyenne par jour, selon l'heure. Le plus fort : ${pointes.join(" et ")}.`
                : "Les heures de pointe apparaîtront avec les premières commandes."
            }
          >
            <Colonnes
              points={heures}
              mesure="Commandes par jour"
              formatValeur={(v) => `${new Intl.NumberFormat("fr-FR").format(v)} commande(s) / jour`}
              hauteur={210}
            />
          </CarteGraphique>

          <CarteGraphique
            titre="Plats les plus vendus"
            resume={plats.length > 0 ? "En nombre de portions sur la période." : "Le classement apparaîtra avec les premières commandes."}
          >
            {plats.length > 0 && <Barres points={plats} mesure="Portions" formatValeur={(v) => `${v} portion${v > 1 ? "s" : ""}`} />}
          </CarteGraphique>
        </div>
      </div>
    </div>
  );
}
