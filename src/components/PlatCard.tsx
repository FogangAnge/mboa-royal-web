import type { ReactNode } from "react";

import { formatPrix } from "../lib/format";
import type { Plat } from "../types/menu";

interface PlatCardProps {
  plat: Plat;
  devise?: string;
  action?: ReactNode;
}

export default function PlatCard({ plat, devise, action }: PlatCardProps) {
  let alerte: string | null = null;
  if (!plat.est_disponible) alerte = "Épuisé aujourd'hui";
  else if (!plat.propose_aujourdhui) alerte = "Pas proposé aujourd'hui";

  return (
    <article
      id={`plat-${plat.id}`}
      className="group flex w-full scroll-mt-24 flex-col overflow-hidden rounded-2xl bg-creme-0 shadow-[0_1px_0_#e6dac3,0_12px_28px_-18px_rgba(15,42,29,0.35)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-or-100">
        {plat.photo && (
          <img
            src={plat.photo}
            alt={plat.nom}
            loading="lazy"
            width={400}
            height={300}
            className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] ${alerte ? "opacity-60" : ""}`}
          />
        )}
        {plat.region_origine && (
          <span className="absolute left-3 top-3 rounded-full bg-palmier-950/90 px-3 py-1 text-xs font-semibold text-creme-50">
            {plat.region_origine}
          </span>
        )}
        {alerte && (
          <span className="absolute right-3 top-3 rounded-full bg-creme-0 px-3 py-1 text-xs font-bold text-argile-800">
            {alerte}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-titre text-2xl text-palmier-950">{plat.nom}</h3>
        <p className="flex-1 text-[15px] leading-relaxed text-sable-600">{plat.description}</p>
        <div className="flex items-center justify-between gap-3 pt-2">
          <span className="text-lg font-bold">{formatPrix(plat.prix, devise)}</span>
          {action}
        </div>
      </div>
    </article>
  );
}