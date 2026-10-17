import type { CommandeCreee, CommandeEntree, SuiviCommande } from "../types/commande";
import { api } from "./client";

export async function passerCommande(commande: CommandeEntree): Promise<CommandeCreee> {
  const { data } = await api.post<CommandeCreee>("/commandes/", commande);
  return data;
}

export async function suivreCommande(numero: string, telephone: string): Promise<SuiviCommande> {
  const { data } = await api.get<SuiviCommande>("/commandes/suivi/", { params: { numero, telephone } });
  return data;
}