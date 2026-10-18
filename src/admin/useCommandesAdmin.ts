import { useQuery } from "@tanstack/react-query";

import { getCommandes } from "../api/admin";

/** Toutes les commandes, redemandées toutes les 20 secondes. Une seule requête pour tout l'espace admin. */
export function useCommandesAdmin() {
  return useQuery({
    queryKey: ["admin", "commandes"],
    queryFn: getCommandes,
    refetchInterval: 20_000,
    staleTime: 10_000,
  });
}