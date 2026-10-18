import { FUSEAU_RESTAURANT, formatDateHeure, formatHeure } from "../lib/format";
import type { Commande } from "../types/commande";

/** Les commandes qui demandent encore une action de l'équipe. */
export const STATUTS_EN_COURS = ["en_attente", "confirmee", "en_preparation", "prete", "en_livraison"];

/** Les étapes où l'on peut encore choisir ou changer le livreur (règle de l'API). */
export const STATUTS_ASSIGNABLES = ["confirmee", "en_preparation", "prete"];

/** Le jour, à Douala, au format « 2026-10-17 ». */
export function jourRestaurant(date: Date | string = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSEAU_RESTAURANT,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}

export function estDuJour(iso: string): boolean {
  return jourRestaurant(iso) === jourRestaurant();
}

/** « à l'instant », « il y a 12 min », « à 09:40 »… */
export function ilYA(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  if (estDuJour(iso)) return `à ${formatHeure(iso)}`;
  return formatDateHeure(iso);
}

/** Les couleurs des badges, pour les commandes comme pour les réservations. */
export const COULEURS_STATUT: Record<string, string> = {
  en_attente: "bg-or-100 text-argile-800",
  confirmee: "bg-[#DCEFE2] text-[#17462B]",
  en_preparation: "bg-[#E3E8F6] text-[#23356B]",
  prete: "bg-or-300 text-palmier-950",
  en_livraison: "bg-palmier-600 text-creme-50",
  livree: "bg-palmier-800 text-creme-50",
  honoree: "bg-palmier-800 text-creme-50",
  annulee: "bg-sable-300 text-encre-900",
  refusee: "bg-sable-300 text-encre-900",
  absent: "bg-sable-300 text-encre-900",
};

export const LIBELLES_PAIEMENT: Record<string, string> = {
  a_definir: "À définir (WhatsApp)",
  especes: "Espèces",
  mobile_money: "Mobile Money",
};

export interface ActionStatut {
  vers: string;
  libelle: string;
  /** Bouton rouge, avec un motif à écrire avant de confirmer. */
  danger?: boolean;
  /** Le code à 4 chiffres du client est obligatoire. */
  demandeCode?: boolean;
}

/** Les boutons proposés à l'équipe selon l'étape de la commande (mêmes règles que TRANSITIONS côté Django). */
export function actionsPour(commande: Commande): ActionStatut[] {
  const annuler: ActionStatut = { vers: "annulee", libelle: "Annuler la commande", danger: true };
  const emporter = commande.mode === "emporter";
  switch (commande.statut) {
    case "en_attente":
      return [{ vers: "confirmee", libelle: "Confirmer la commande" }, annuler];
    case "confirmee":
      return [{ vers: "en_preparation", libelle: "Lancer la préparation" }, annuler];
    case "en_preparation":
      return [{ vers: "prete", libelle: "Marquer prête" }, annuler];
    case "prete":
      return emporter
        ? [{ vers: "livree", libelle: "Remettre au client", demandeCode: true }, annuler]
        : [{ vers: "en_livraison", libelle: "Remettre au livreur" }, annuler];
    case "en_livraison":
      return [{ vers: "livree", libelle: "Confirmer la livraison", demandeCode: true }];
    default:
      return [];
  }
}

const ROLES: Record<string, string> = { proprietaire: "Propriétaire", gerant: "Gérant" };

export function libelleRole(role: string): string {
  return ROLES[role] ?? role.charAt(0).toUpperCase() + role.slice(1);
}