import axios from "axios";

import type { JetonsConnexion, Utilisateur } from "../types/compte";
import { API_URL, api } from "./client";

/** « +237 6 77 12 34 56 » → « 677123456 », le format enregistré par l'API. */
export function normaliserTelephone(valeur: string): string {
  return valeur.replace(/\D/g, "").replace(/^237(?=\d{9}$)/, "");
}

/** Envoyée sans aucun jeton : un ancien jeton expiré ne doit pas bloquer la connexion. */
export async function seConnecter(telephone: string, motDePasse: string): Promise<JetonsConnexion> {
  const { data } = await axios.post<JetonsConnexion>(
    `${API_URL}/auth/connexion/`,
    { telephone: normaliserTelephone(telephone), password: motDePasse },
    { timeout: 15_000 },
  );
  return data;
}

export async function getMoi(): Promise<Utilisateur> {
  const { data } = await api.get<Utilisateur>("/auth/moi/");
  return data;
}