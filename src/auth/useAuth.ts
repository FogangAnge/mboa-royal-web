import { useContext } from "react";

import { AuthContexte } from "./contexte";

export function useAuth() {
  const valeur = useContext(AuthContexte);
  if (!valeur) {
    throw new Error("useAuth doit être utilisé à l'intérieur de <AuthProvider>.");
  }
  return valeur;
}