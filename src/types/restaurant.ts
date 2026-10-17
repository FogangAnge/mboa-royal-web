/** Un jour d'ouverture, tel que renvoyé par GET /api/restaurant/. */
export interface HoraireOuverture {
  jour: number; // 0 = lundi … 6 = dimanche
  jour_libelle: string;
  ferme: boolean;
  ouverture: string | null; // "10:00:00"
  fermeture: string | null;
}

/** La configuration publique du restaurant. */
export interface Restaurant {
  id: number;
  nom: string;
  slogan: string;
  description: string;
  logo: string | null;
  pays: string;
  ville: string;
  quartier: string;
  adresse: string;
  latitude: string | null;
  longitude: string | null;
  telephone: string;
  whatsapp: string;
  email: string;
  couleur_principale: string;
  couleur_accent: string;
  capacite_salle: number;
  delai_preparation_min: number;
  devise: string;
  horaires: HoraireOuverture[];
  est_ouvert: boolean;
}