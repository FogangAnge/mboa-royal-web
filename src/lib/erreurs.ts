import { isAxiosError } from "axios";

/** Transforme une erreur de l'API en messages lisibles pour le client. */
export function messagesErreur(erreur: unknown): string[] {
  if (!isAxiosError(erreur)) return ["Une erreur inattendue est survenue."];
  if (!erreur.response) {
    return ["Impossible de joindre le restaurant. Vérifiez votre connexion internet, puis réessayez."];
  }
  if (erreur.response.status === 429) {
    return ["Trop de tentatives en peu de temps. Réessayez dans quelques minutes."];
  }

  const messages: string[] = [];
  const parcourir = (valeur: unknown) => {
    if (typeof valeur === "string") messages.push(valeur);
    else if (Array.isArray(valeur)) valeur.forEach(parcourir);
    else if (valeur && typeof valeur === "object") Object.values(valeur).forEach(parcourir);
  };
  parcourir(erreur.response.data);

  return messages.length > 0 ? messages : ["La demande n'a pas pu aboutir. Réessayez."];
}