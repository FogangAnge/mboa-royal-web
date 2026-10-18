/** Le bilan d'un livreur pour une journée, tel que renvoyé par /api/livraisons/caisse/. */
export interface BilanLivreur {
  livreur: number;
  nom: string;
  telephone: string;
  disponible: boolean;
  nb_courses: number;
  encaisse: number;
  verse: number;
  reste_a_verser: number;
}

export interface Caisse {
  date: string;
  livreurs: BilanLivreur[];
  total_encaisse: number;
  total_reste_a_verser: number;
}

/** Un versement d'argent du livreur au restaurant. */
export interface Versement {
  id: number;
  livreur: number;
  livreur_nom: string;
  montant: number;
  jour: string;
  note: string;
  recu_par_nom: string | null;
  date_creation: string;
}