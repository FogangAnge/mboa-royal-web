import type { Restaurant } from "../types/restaurant";
import { api } from "./client";

export async function getRestaurant(): Promise<Restaurant> {
  const { data } = await api.get<Restaurant>("/restaurant/");
  return data;
}