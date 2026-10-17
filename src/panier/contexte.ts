import { createContext } from "react";

export interface OptionChoisie {
  id: number;
  nom: string;
  supplement: number;
}

export interface LignePanier {
  cle: string;
  platId: number;
  nom: string;
  photo: string | null;
  prixUnitaire: number;
  quantite: number;
  options: OptionChoisie[];
}

export type NouvelleLigne = Omit<LignePanier, "cle" | "quantite">;

export interface ValeurPanier {
  lignes: LignePanier[];
  nombreArticles: number;
  sousTotal: number;
  ajouter: (ligne: NouvelleLigne, quantite?: number) => void;
  changerQuantite: (cle: string, quantite: number) => void;
  retirer: (cle: string) => void;
  vider: () => void;
}

export const PanierContexte = createContext<ValeurPanier | null>(null);