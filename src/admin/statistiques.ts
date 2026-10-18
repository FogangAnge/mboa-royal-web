import { FUSEAU_RESTAURANT } from "../lib/format";
import type { Commande } from "../types/commande";
import type { HoraireOuverture } from "../types/restaurant";
import { jourRestaurant } from "./outils";

export interface Point {
  /** Ce qu'on lit sous la colonne (« sam. 18 », « 13 h »…). */
  etiquette: string;
  /** La phrase complète, pour l'infobulle et le tableau. */
  detail: string;
  valeur: number;
  /** Une précision affichée sous la valeur dans l'infobulle. */
  complement?: string;
  /** Vrai pour la colonne à mettre en avant (aujourd'hui, l'heure de pointe…). */
  enAvant?: boolean;
}

const UN_JOUR = 24 * 60 * 60_000;

/** Les commandes qui comptent : passées pendant la période, et pas annulées. */
export function commandesDeLaPeriode(commandes: Commande[], nbJours: number): Commande[] {
  const debut = jourRestaurant(new Date(Date.now() - (nbJours - 1) * UN_JOUR));
  return commandes.filter((c) => c.statut !== "annulee" && jourRestaurant(c.date_creation) >= debut);
}

const formatJourCourt = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", timeZone: FUSEAU_RESTAURANT });
const formatJourLong = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: FUSEAU_RESTAURANT });
const heureDouala = new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: FUSEAU_RESTAURANT });

/** L'heure (0 à 23) à Douala, quel que soit le fuseau de l'ordinateur. */
function heureRestaurant(iso: string): number {
  const partie = heureDouala.formatToParts(new Date(iso)).find((p) => p.type === "hour");
  return Number(partie?.value ?? 0);
}

/** Le chiffre d'affaires de chaque jour de la période, même les jours sans commande (à 0). */
export function chiffreParJour(commandes: Commande[], nbJours: number): Point[] {
  const aujourdhui = jourRestaurant();
  const jours: Point[] = [];
  for (let i = nbJours - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * UN_JOUR);
    const cle = jourRestaurant(date);
    const duJour = commandes.filter((c) => jourRestaurant(c.date_creation) === cle);
    jours.push({
      etiquette: formatJourCourt.format(date).replace(".", ""),
      detail: formatJourLong.format(date),
      valeur: duJour.reduce((somme, c) => somme + Number(c.total), 0),
      complement: `${duJour.length} commande(s)`,
      enAvant: cle === aujourdhui,
    });
  }
  return jours;
}

/** Les heures d'ouverture les plus larges de la semaine, pour l'axe des heures. */
function plageHoraire(horaires: HoraireOuverture[] | undefined): [number, number] {
  const ouverts = (horaires ?? []).filter((h) => !h.ferme && h.ouverture && h.fermeture);
  if (ouverts.length === 0) return [8, 23];
  const debut = Math.min(...ouverts.map((h) => Number(h.ouverture!.slice(0, 2))));
  const fins = ouverts.map((h) => {
    const fin = Number(h.fermeture!.slice(0, 2));
    return fin <= Number(h.ouverture!.slice(0, 2)) ? 23 : Math.max(fin - 1, 0);
  });
  return [debut, Math.max(...fins)];
}

/** En moyenne, combien de commandes arrivent à chaque heure : les heures de pointe. */
export function commandesParHeure(commandes: Commande[], nbJours: number, horaires?: HoraireOuverture[]): Point[] {
  const [debut, fin] = plageHoraire(horaires);
  const compte = new Map<number, number>();
  for (const c of commandes) {
    const heure = heureRestaurant(c.date_creation);
    compte.set(heure, (compte.get(heure) ?? 0) + 1);
  }
  const points: Point[] = [];
  for (let heure = debut; heure <= fin; heure++) {
    const total = compte.get(heure) ?? 0;
    points.push({
      etiquette: `${heure} h`,
      detail: `De ${heure} h à ${heure + 1} h`,
      valeur: Math.round((total / nbJours) * 10) / 10,
      complement: `${total} commande(s) sur la période`,
    });
  }
  const max = Math.max(0, ...points.map((p) => p.valeur));
  if (max > 0) points.forEach((p) => (p.enAvant = p.valeur === max));
  return points;
}

/** Les plats les plus commandés, en nombre de portions. */
export function platsLesPlusVendus(commandes: Commande[], combien = 6): Point[] {
  const parPlat = new Map<string, { portions: number; recette: number }>();
  for (const c of commandes) {
    for (const ligne of c.lignes) {
      const actuel = parPlat.get(ligne.nom_plat) ?? { portions: 0, recette: 0 };
      actuel.portions += ligne.quantite;
      actuel.recette += Number(ligne.sous_total);
      parPlat.set(ligne.nom_plat, actuel);
    }
  }
  return [...parPlat.entries()]
    .sort((a, b) => b[1].portions - a[1].portions)
    .slice(0, combien)
    .map(([nom, { portions, recette }], index) => ({
      etiquette: nom,
      detail: nom,
      valeur: portions,
      complement: `${new Intl.NumberFormat("fr-FR").format(recette)} FCFA de ventes`,
      enAvant: index === 0,
    }));
}
