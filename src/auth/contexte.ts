import { createContext } from "react";

import type { Utilisateur } from "../types/compte";

export interface ValeurAuth {
  utilisateur: Utilisateur | null;
  chargement: boolean;
  connexion: (telephone: string, motDePasse: string) => Promise<Utilisateur>;
  deconnexion: () => void;
}

export const AuthContexte = createContext<ValeurAuth | null>(null);