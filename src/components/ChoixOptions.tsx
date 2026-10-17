import { X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { formatPrix } from "../lib/format";
import { usePanier } from "../panier/usePanier";
import type { GroupeOptions, Plat } from "../types/menu";
import Quantite from "./Quantite";

interface ChoixOptionsProps {
  plat: Plat;
  devise?: string;
  onFermer: () => void;
  onAjoute: (message: string) => void;
}

export default function ChoixOptions({ plat, devise, onFermer, onAjoute }: ChoixOptionsProps) {
  const dialogue = useRef<HTMLDialogElement>(null);
  const { ajouter } = usePanier();
  const [choix, setChoix] = useState<Record<number, number[]>>({});
  const [quantite, setQuantite] = useState(1);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    const element = dialogue.current;
    if (element && !element.open) element.showModal();
  }, []);

  const optionsChoisies = plat.groupes_options.flatMap((groupe) =>
    groupe.options.filter((option) => (choix[groupe.id] ?? []).includes(option.id)),
  );
  const prixUnitaire = plat.prix + optionsChoisies.reduce((total, o) => total + o.supplement, 0);

  function basculer(groupe: GroupeOptions, optionId: number) {
    setErreur(null);
    setChoix((actuel) => {
      if (!groupe.choix_multiple) return { ...actuel, [groupe.id]: [optionId] };
      const deja = actuel[groupe.id] ?? [];
      const suivant = deja.includes(optionId) ? deja.filter((id) => id !== optionId) : [...deja, optionId];
      return { ...actuel, [groupe.id]: suivant };
    });
  }

  function valider(evenement: FormEvent) {
    evenement.preventDefault();
    const manquant = plat.groupes_options.find((g) => g.obligatoire && !(choix[g.id]?.length));
    if (manquant) {
      setErreur(`Choisissez : ${manquant.nom.toLowerCase()}.`);
      return;
    }
    ajouter(
      {
        platId: plat.id,
        nom: plat.nom,
        photo: plat.photo,
        prixUnitaire,
        options: optionsChoisies.map((o) => ({ id: o.id, nom: o.nom, supplement: o.supplement })),
      },
      quantite,
    );
    onAjoute(`${quantite} × ${plat.nom} ajouté au panier.`);
    onFermer();
  }

  return (
    <dialog
      ref={dialogue}
      onClose={onFermer}
      aria-labelledby="titre-choix"
      className="m-auto max-h-[90vh] w-[min(100%-2rem,32rem)] overflow-y-auto rounded-3xl bg-creme-0 p-0 text-encre-900 backdrop:bg-palmier-950/60"
    >
      <form onSubmit={valider} className="flex flex-col">
        {plat.photo && (
          <img src={plat.photo} alt="" width={512} height={176} className="h-44 w-full object-cover" />
        )}
        <div className="flex flex-col gap-5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="titre-choix" className="font-titre text-3xl text-palmier-950">
                {plat.nom}
              </h2>
              <p className="mt-1 text-sable-600">{formatPrix(plat.prix, devise)}</p>
            </div>
            <button
              type="button"
              onClick={onFermer}
              aria-label="Fermer"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-or-100"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>

          {plat.groupes_options.map((groupe) => (
            <fieldset key={groupe.id} className="flex flex-col gap-2">
              <legend className="mb-2 flex w-full items-center justify-between font-bold">
                {groupe.nom}
                <span className="rounded-full bg-or-100 px-3 py-1 text-xs font-semibold text-sable-600">
                  {groupe.obligatoire ? "Obligatoire" : "Facultatif"}
                </span>
              </legend>
              {groupe.options.map((option) => {
                const coche = (choix[groupe.id] ?? []).includes(option.id);
                const bordure = coche ? "border-palmier-950 bg-or-100" : "border-sable-300 bg-white";
                const etat = option.est_disponible ? "cursor-pointer" : "cursor-not-allowed opacity-50";
                return (
                  <label key={option.id} className={`flex min-h-12 items-center gap-3 rounded-xl border-[1.5px] px-4 ${bordure} ${etat}`}>
                    <input
                      type={groupe.choix_multiple ? "checkbox" : "radio"}
                      name={`groupe-${groupe.id}`}
                      checked={coche}
                      disabled={!option.est_disponible}
                      onChange={() => basculer(groupe, option.id)}
                      className="h-5 w-5 accent-palmier-950"
                    />
                    <span className="flex-1">{option.nom}</span>
                    {option.supplement > 0 && (
                      <span className="text-sm font-semibold">+ {formatPrix(option.supplement, devise)}</span>
                    )}
                  </label>
                );
              })}
            </fieldset>
          ))}

          <div className="flex items-center justify-between">
            <span className="font-bold">Quantité</span>
            <Quantite valeur={quantite} onChange={setQuantite} libelle="Quantité" />
          </div>

          {erreur && (
            <p role="alert" className="font-semibold text-argile-800">
              {erreur}
            </p>
          )}

          <button
            type="submit"
            className="h-14 rounded-full bg-or-500 text-lg font-bold text-palmier-950 transition-colors hover:bg-or-300"
          >
            Ajouter · {formatPrix(prixUnitaire * quantite, devise)}
          </button>
        </div>
      </form>
    </dialog>
  );
}