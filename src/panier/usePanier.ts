import { useContext } from "react";

import { PanierContexte } from "./contexte";

export function usePanier() {
  const valeur = useContext(PanierContexte);
  if (!valeur) {
    throw new Error("usePanier doit être utilisé à l'intérieur de <PanierProvider>.");
  }
  return valeur;
}