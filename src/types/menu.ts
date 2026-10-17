/** Une réponse possible à une question sur un plat (ex. « Miondo »). */
export interface OptionPlat {
  id: number;
  nom: string;
  nom_en: string;
  supplement: number;
  est_disponible: boolean;
}

/** Une question posée pour un plat (ex. « Accompagnement »). */
export interface GroupeOptions {
  id: number;
  nom: string;
  nom_en: string;
  obligatoire: boolean;
  choix_multiple: boolean;
  options: OptionPlat[];
}

/** Un plat, tel que renvoyé par l'API. */
export interface Plat {
  id: number;
  categorie: number;
  categorie_nom: string;
  nom: string;
  nom_en: string;
  description: string;
  description_en: string;
  region_origine: string;
  prix: number;
  photo: string | null;
  est_actif: boolean;
  est_disponible: boolean;
  est_vedette: boolean;
  ordre: number;
  lundi: boolean;
  mardi: boolean;
  mercredi: boolean;
  jeudi: boolean;
  vendredi: boolean;
  samedi: boolean;
  dimanche: boolean;
  jours_proposes: number[];
  propose_aujourdhui: boolean;
  commandable: boolean;
  groupes_options: GroupeOptions[];
}

/** Une catégorie du menu public, avec ses plats visibles. */
export interface CategorieMenu {
  id: number;
  nom: string;
  nom_en: string;
  plats: Plat[];
}