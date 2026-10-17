import type { CategorieMenu } from "../types/menu";
import { api } from "./client";

export async function getMenu(): Promise<CategorieMenu[]> {
  const { data } = await api.get<CategorieMenu[]>("/menu/");
  return data;
}