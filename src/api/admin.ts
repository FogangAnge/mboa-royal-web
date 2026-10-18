import type { Commande } from "../types/commande";
import type { Caisse, Versement } from "../types/livraison";
import type { Plat } from "../types/menu";
import type { Reservation } from "../types/reservation";
import { api } from "./client";

/** L'API renvoie un tableau, ou { results: [...] } si on active la pagination plus tard. */
type Liste<T> = T[] | { results: T[] };

function enTableau<T>(donnees: Liste<T>): T[] {
  return Array.isArray(donnees) ? donnees : donnees.results;
}

export type ModePaiement = "a_definir" | "especes" | "mobile_money";

export interface ChangementStatut {
  statut: string;
  commentaire?: string;
  code?: string;
  montant_encaisse?: number;
  mode_paiement?: "especes" | "mobile_money";
}

// ---------- Commandes ----------

export async function getCommandes(): Promise<Commande[]> {
  const { data } = await api.get<Liste<Commande>>("/commandes/");
  return enTableau(data);
}

export async function changerStatut(numero: string, changement: ChangementStatut): Promise<Commande> {
  const { data } = await api.post<Commande>(`/commandes/${numero}/statut/`, changement);
  return data;
}

export async function assignerLivreur(numero: string, livreur: number): Promise<Commande> {
  const { data } = await api.post<Commande>(`/commandes/${numero}/assigner/`, { livreur });
  return data;
}

export async function enregistrerPaiement(
  numero: string,
  paiement: { mode_paiement: ModePaiement; est_payee: boolean },
): Promise<Commande> {
  const { data } = await api.post<Commande>(`/commandes/${numero}/paiement/`, paiement);
  return data;
}

// ---------- Réservations ----------

/** date au format « 2026-10-17 ». */
export async function getReservations(date: string): Promise<Reservation[]> {
  const { data } = await api.get<Liste<Reservation>>("/reservations/", { params: { date } });
  return enTableau(data);
}

/** Toutes les demandes encore sans réponse, quel que soit le jour. */
export async function getReservationsAConfirmer(): Promise<Reservation[]> {
  const { data } = await api.get<Liste<Reservation>>("/reservations/", { params: { statut: "en_attente" } });
  return enTableau(data);
}

export async function changerStatutReservation(
  numero: string,
  changement: { statut: string; commentaire?: string },
): Promise<Reservation> {
  const { data } = await api.post<Reservation>(`/reservations/${numero}/statut/`, changement);
  return data;
}

// ---------- Menu ----------

/** Pour le personnel, l'API renvoie aussi les plats masqués. */
export async function getPlatsAdmin(): Promise<Plat[]> {
  const { data } = await api.get<Liste<Plat>>("/menu/plats/");
  return enTableau(data);
}

export async function basculerDisponibilite(id: number): Promise<Plat> {
  const { data } = await api.post<Plat>(`/menu/plats/${id}/basculer-disponibilite/`);
  return data;
}

/** FormData pour pouvoir envoyer une photo ; un objet simple sinon. */
export async function modifierPlat(id: number, donnees: FormData | Partial<Plat>): Promise<Plat> {
  const { data } = await api.patch<Plat>(`/menu/plats/${id}/`, donnees);
  return data;
}

export async function creerPlat(donnees: FormData): Promise<Plat> {
  const { data } = await api.post<Plat>("/menu/plats/", donnees);
  return data;
}

// ---------- Livreurs et caisse ----------

/** date au format « 2026-10-17 » ; sans date, l'API prend aujourd'hui. */
export async function getCaisse(date?: string): Promise<Caisse> {
  const { data } = await api.get<Caisse>("/livraisons/caisse/", { params: date ? { date } : {} });
  return data;
}

export async function getVersements(date: string): Promise<Versement[]> {
  const { data } = await api.get<Liste<Versement>>("/livraisons/versements/", { params: { date } });
  return enTableau(data);
}

export async function enregistrerVersement(versement: {
  livreur: number;
  montant: number;
  jour: string;
  note: string;
}): Promise<Versement> {
  const { data } = await api.post<Versement>("/livraisons/versements/", versement);
  return data;
}