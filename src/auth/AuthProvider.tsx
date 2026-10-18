import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { EVENEMENT_SESSION_EXPIREE, jetons } from "../api/client";
import { getMoi, seConnecter } from "../api/comptes";
import { AuthContexte, type ValeurAuth } from "./contexte";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [aDesJetons, setADesJetons] = useState(() => Boolean(jetons.lireAccess() || jetons.lireRefresh()));

  const moi = useQuery({
    queryKey: ["moi"],
    queryFn: getMoi,
    enabled: aDesJetons,
    retry: false,
    staleTime: 5 * 60_000,
  });

  const deconnexion = useCallback(() => {
    jetons.effacer();
    setADesJetons(false);
    queryClient.removeQueries({ queryKey: ["moi"] });
    queryClient.removeQueries({ queryKey: ["admin"] });
  }, [queryClient]);

  useEffect(() => {
    window.addEventListener(EVENEMENT_SESSION_EXPIREE, deconnexion);
    return () => window.removeEventListener(EVENEMENT_SESSION_EXPIREE, deconnexion);
  }, [deconnexion]);

  const connexion = useCallback(
    async (telephone: string, motDePasse: string) => {
      jetons.effacer();
      const recus = await seConnecter(telephone, motDePasse);
      jetons.enregistrer(recus.access, recus.refresh);
      const utilisateur = await queryClient.fetchQuery({ queryKey: ["moi"], queryFn: getMoi, staleTime: 0 });
      setADesJetons(true);
      return utilisateur;
    },
    [queryClient],
  );

  const valeur = useMemo<ValeurAuth>(
    () => ({
      utilisateur: aDesJetons && moi.data ? moi.data : null,
      chargement: aDesJetons && moi.isPending,
      connexion,
      deconnexion,
    }),
    [aDesJetons, moi.data, moi.isPending, connexion, deconnexion],
  );

  return <AuthContexte.Provider value={valeur}>{children}</AuthContexte.Provider>;
}