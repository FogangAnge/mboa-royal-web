export interface Ville {
  id: number;
  nom: string;
  region: string;
}

export interface ZoneLivraison {
  id: number;
  quartier: number;
  quartier_nom: string;
  ville_id: number;
  ville_nom: string;
  frais: number;
  delai_min: number;
  est_active: boolean;
}