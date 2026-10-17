export type ModeCommande = "livraison" | "emporter";

/** Ce que le site envoie à POST /api/commandes/. */
export interface CommandeEntree {
  mode: ModeCommande;
  zone_livraison: number | null;
  repere: string;
  nom_client: string;
  telephone_client: string;
  heure_souhaitee: string | null;
  note: string;
  lignes: { plat: number; quantite: number; options: number[] }[];
}

export interface LigneCommande {
  plat: number;
  nom_plat: string;
  quantite: number;
  prix_unitaire: number;
  options: { groupe: string; option: string; supplement: number }[];
  sous_total: number;
}

export interface HistoriqueStatut {
  statut: string;
  statut_libelle: string;
  commentaire: string;
  date: string;
}

/** Une commande, telle que renvoyée par l'API. */
export interface Commande {
  numero: string;
  statut: string;
  statut_libelle: string;
  mode: ModeCommande;
  nom_client: string;
  telephone_client: string;
  quartier: string;
  ville: string;
  repere: string;
  heure_souhaitee: string | null;
  note: string;
  lignes: LigneCommande[];
  sous_total: number;
  frais_livraison: number;
  total: number;
  mode_paiement: string;
  est_payee: boolean;
  montant_encaisse: number | null;
  livreur_nom: string | null;
  code_livraison: string | null;
  historique: HistoriqueStatut[];
  date_creation: string;
}

/** La réponse de création : la seule fois où le code est toujours renvoyé. */
export interface CommandeCreee extends Commande {
  code_livraison: string;
  lien_whatsapp: string;
}

/** Ce que renvoie le suivi public : jamais le code. */
export interface SuiviCommande {
  numero: string;
  statut: string;
  statut_libelle: string;
  mode: ModeCommande;
  quartier: string;
  ville: string;
  heure_souhaitee: string | null;
  lignes: LigneCommande[];
  total: number;
  livreur: { nom: string; telephone: string } | null;
  historique: HistoriqueStatut[];
  date_creation: string;
}