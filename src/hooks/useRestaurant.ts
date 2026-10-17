import { useQuery } from "@tanstack/react-query";

import { getRestaurant } from "../api/restaurant";

export function useRestaurant() {
  return useQuery({
    queryKey: ["restaurant"],
    queryFn: getRestaurant,
    staleTime: 5 * 60_000,
  });
}