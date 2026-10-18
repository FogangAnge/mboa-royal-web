import { COULEURS_STATUT } from "./outils";

export default function BadgeStatut({ statut, libelle }: { statut: string; libelle: string }) {
  const couleurs = COULEURS_STATUT[statut] ?? "bg-sable-300 text-encre-900";
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-bold ${couleurs}`}>
      {libelle}
    </span>
  );
}