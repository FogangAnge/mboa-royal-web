export interface Utilisateur {
  id: number;
  telephone: string;
  nom: string;
  email: string;
  role: string;
  langue: string;
  date_inscription: string;
}

export interface JetonsConnexion {
  access: string;
  refresh: string;
}

/** Les rôles qui ont accès à l'espace du restaurant (comme est_personnel côté Django). */
const ROLES_PERSONNEL = ["proprietaire", "gerant"];

export function estPersonnel(utilisateur: Utilisateur): boolean {
  return ROLES_PERSONNEL.includes(utilisateur.role);
}

export function estCuisinier(utilisateur: Utilisateur): boolean {
  return utilisateur.role === "cuisinier";
}

/** L'écran cuisine : le cuisinier, mais aussi le propriétaire et le gérant. */
export function peutVoirCuisine(utilisateur: Utilisateur): boolean {
  return estPersonnel(utilisateur) || estCuisinier(utilisateur);
}
