import { useEffect, useLayoutEffect, useState } from "react";

import Embleme from "./Embleme";

const CLE = "mboa.rideau-vu";
const DUREE_EMBLEME = 2100;
const DUREE_LEVER = 1000;

/** On ne montre le rideau qu'à la première visite de la session, et jamais si le client a réduit les animations. */
function doitAfficher(): boolean {
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    return sessionStorage.getItem(CLE) === null;
  } catch {
    return false;
  }
}

/**
 * L'ouverture de Mboa Royal : un rideau vert, l'emblème qui se dessine, le nom qui apparaît,
 * puis le rideau se lève sur l'accueil. Un clic (ou une touche) le passe.
 */
export default function Rideau({ nom }: { nom: string }) {
  const [phase, setPhase] = useState<"embleme" | "lever" | "fini">(() => (doitAfficher() ? "embleme" : "fini"));

  // Pendant le rideau, l'accueil attend : ses animations sont en pause et la page ne défile pas.
  // useLayoutEffect agit avant le premier affichage : l'accueil ne commence jamais sous le rideau.
  useLayoutEffect(() => {
    const racine = document.documentElement;
    if (phase === "embleme") racine.classList.add("rideau-actif");
    else racine.classList.remove("rideau-actif");
    return () => racine.classList.remove("rideau-actif");
  }, [phase]);

  useEffect(() => {
    if (phase === "fini") return;
    const minuteur = window.setTimeout(
      () => setPhase(phase === "embleme" ? "lever" : "fini"),
      phase === "embleme" ? DUREE_EMBLEME : DUREE_LEVER,
    );
    return () => window.clearTimeout(minuteur);
  }, [phase]);

  useEffect(() => {
    if (phase !== "fini") return;
    try {
      sessionStorage.setItem(CLE, "1");
    } catch {
      /* navigation privée : on le reverra, ce n'est pas grave */
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "embleme") return;
    const passer = () => setPhase("lever");
    window.addEventListener("keydown", passer);
    return () => window.removeEventListener("keydown", passer);
  }, [phase]);

  if (phase === "fini") return null;

  return (
    <div
      className={`rideau ${phase === "lever" ? "rideau-leve" : ""}`}
      onClick={() => phase === "embleme" && setPhase("lever")}
      aria-hidden="true"
    >
      <div className="rideau-contenu">
        <Embleme taille={180} anime />
        <p className="rideau-nom font-titre">{nom}</p>
      </div>
      <div className="rideau-frange bande-toghu" />
    </div>
  );
}
