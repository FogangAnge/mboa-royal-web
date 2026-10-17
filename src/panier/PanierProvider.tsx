import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { PanierContexte, type LignePanier, type NouvelleLigne, type ValeurPanier } from "./contexte";

const CLE = "mboa.panier";
const QUANTITE_MAX = 50;

function lirePanier(): LignePanier[] {
  try {
    const brut = localStorage.getItem(CLE);
    const valeur: unknown = brut ? JSON.parse(brut) : [];
    return Array.isArray(valeur) ? (valeur as LignePanier[]) : [];
  } catch {
    return [];
  }
}

/** Le même plat avec les mêmes options forme une seule ligne. */
function cleLigne(platId: number, options: { id: number }[]): string {
  const ids = options.map((o) => o.id).sort((a, b) => a - b);
  return `${platId}:${ids.join("-")}`;
}

export default function PanierProvider({ children }: { children: ReactNode }) {
  const [lignes, setLignes] = useState<LignePanier[]>(lirePanier);

  useEffect(() => {
    try {
      localStorage.setItem(CLE, JSON.stringify(lignes));
    } catch {
      // Stockage indisponible : le panier reste en mémoire jusqu'au rechargement.
    }
  }, [lignes]);

  const ajouter = useCallback((ligne: NouvelleLigne, quantite = 1) => {
    const cle = cleLigne(ligne.platId, ligne.options);
    setLignes((actuelles) => {
      const existante = actuelles.find((l) => l.cle === cle);
      if (existante) {
        return actuelles.map((l) =>
          l.cle === cle ? { ...l, quantite: Math.min(l.quantite + quantite, QUANTITE_MAX) } : l,
        );
      }
      return [...actuelles, { ...ligne, cle, quantite }];
    });
  }, []);

  const changerQuantite = useCallback((cle: string, quantite: number) => {
    const bornee = Math.max(1, Math.min(quantite, QUANTITE_MAX));
    setLignes((actuelles) => actuelles.map((l) => (l.cle === cle ? { ...l, quantite: bornee } : l)));
  }, []);

  const retirer = useCallback((cle: string) => {
    setLignes((actuelles) => actuelles.filter((l) => l.cle !== cle));
  }, []);

  const vider = useCallback(() => setLignes([]), []);

  const valeur = useMemo<ValeurPanier>(
    () => ({
      lignes,
      nombreArticles: lignes.reduce((total, l) => total + l.quantite, 0),
      sousTotal: lignes.reduce((total, l) => total + l.prixUnitaire * l.quantite, 0),
      ajouter,
      changerQuantite,
      retirer,
      vider,
    }),
    [lignes, ajouter, changerQuantite, retirer, vider],
  );

  return <PanierContexte.Provider value={valeur}>{children}</PanierContexte.Provider>;
}