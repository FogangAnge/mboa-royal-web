/** Le fuseau horaire du restaurant : toutes les heures affichées et envoyées sont celles de Douala. */
export const FUSEAU_RESTAURANT = "Africa/Douala";
export const DECALAGE_RESTAURANT = "+01:00";

/** 7500 → « 7 500 FCFA » */
export function formatPrix(montant: number, devise = "FCFA"): string {
  return `${new Intl.NumberFormat("fr-FR").format(montant)} ${devise}`;
}

/** « 10:00:00 » → « 10 h 00 » */
export function heureCourte(valeur: string | null): string {
  if (!valeur) return "";
  const [heures, minutes] = valeur.split(":");
  return `${heures} h ${minutes}`;
}

/** Une date ISO de l'API → « samedi 18 octobre à 13:00 », à l'heure du restaurant. */
export function formatDateHeure(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: FUSEAU_RESTAURANT,
  }).format(new Date(iso));
}

/** Une date ISO de l'API → « 13:05 », à l'heure du restaurant. */
export function formatHeure(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: FUSEAU_RESTAURANT,
  }).format(new Date(iso));
}

/** Le jour de la semaine au format de l'API : 0 = lundi … 6 = dimanche. */
export function jourAujourdhui(): number {
  return (new Date().getDay() + 6) % 7;
}

/** Enlève les accents et les majuscules, pour que « ndole » trouve « Ndolé ». */
export function normaliser(texte: string): string {
  return texte.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}