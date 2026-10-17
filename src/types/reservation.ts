export interface Disponibilite {
  date_heure: string;
  ouvert: boolean;
  places_restantes: number;
  disponible: boolean;
}

export interface ReservationEntree {
  nom: string;
  telephone: string;
  date_heure: string;
  nb_personnes: number;
  note: string;
}

export interface Reservation {
  numero: string;
  statut: string;
  statut_libelle: string;
  nom: string;
  telephone: string;
  date_heure: string;
  nb_personnes: number;
  note: string;
  commentaire_restaurant: string;
  date_creation: string;
}

export interface ReservationCreee extends Reservation {
  lien_whatsapp: string;
}