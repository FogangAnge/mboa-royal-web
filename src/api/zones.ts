import type { Ville, ZoneLivraison } from "../types/zones";
import { api } from "./client";

export async function getVilles(): Promise<Ville[]> {
  const { data } = await api.get<Ville[]>("/zones/villes/");
  return data;
}

export async function getZones(villeId: number): Promise<ZoneLivraison[]> {
  const { data } = await api.get<ZoneLivraison[]>("/zones/livraison/", { params: { ville: villeId } });
  return data;
}