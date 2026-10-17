/** Les commandes passées depuis cet appareil, pour retrouver leur code et les suivre. */
export interface CommandeLocale {
  numero: string;
  telephone: string;
  code: string;
  total: number;
  lienWhatsapp: string;
  date: string;
}

const CLE = "mboa.mes-commandes";

export function lireCommandes(): CommandeLocale[] {
  try {
    const brut = localStorage.getItem(CLE);
    const valeur: unknown = brut ? JSON.parse(brut) : [];
    return Array.isArray(valeur) ? (valeur as CommandeLocale[]) : [];
  } catch {
    return [];
  }
}

export function enregistrerCommande(commande: CommandeLocale): void {
  try {
    const autres = lireCommandes().filter((c) => c.numero !== commande.numero);
    localStorage.setItem(CLE, JSON.stringify([commande, ...autres].slice(0, 10)));
  } catch {
    // Stockage indisponible (navigation privée) : la page de confirmation affiche quand même le code.
  }
}

export function trouverCommande(numero: string): CommandeLocale | null {
  return lireCommandes().find((c) => c.numero === numero) ?? null;
}