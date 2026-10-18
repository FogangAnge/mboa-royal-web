interface Props {
  actif: boolean;
  onChange: (valeur: boolean) => void;
  libelle: string;
  desactive?: boolean;
}

/** Un bouton marche/arrêt, annoncé comme tel aux lecteurs d'écran (role="switch"). */
export default function Interrupteur({ actif, onChange, libelle, desactive }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      aria-label={libelle}
      disabled={desactive}
      onClick={() => onChange(!actif)}
      className="inline-flex h-11 items-center disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${actif ? "bg-palmier-600" : "bg-sable-300"}`}>
        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${actif ? "translate-x-6" : "translate-x-1"}`} />
      </span>
    </button>
  );
}