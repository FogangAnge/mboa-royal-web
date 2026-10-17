import { Minus, Plus } from "lucide-react";

interface QuantiteProps {
  valeur: number;
  onChange: (valeur: number) => void;
  libelle: string;
  min?: number;
  max?: number;
}

const BOUTON =
  "inline-flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-sable-300 bg-white transition-colors hover:border-palmier-950 disabled:cursor-not-allowed disabled:opacity-40";

export default function Quantite({ valeur, onChange, libelle, min = 1, max = 50 }: QuantiteProps) {
  return (
    <div role="group" aria-label={libelle} className="inline-flex items-center gap-2">
      <button type="button" onClick={() => onChange(valeur - 1)} disabled={valeur <= min} aria-label="Retirer un" className={BOUTON}>
        <Minus aria-hidden="true" className="h-4 w-4" />
      </button>
      <span className="min-w-7 text-center text-lg font-bold" aria-live="polite">
        {valeur}
      </span>
      <button type="button" onClick={() => onChange(valeur + 1)} disabled={valeur >= max} aria-label="Ajouter un" className={BOUTON}>
        <Plus aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}