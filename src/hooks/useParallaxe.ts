import { useEffect, useRef } from "react";

/**
 * Donne à l'élément une variable CSS --defile qui suit le défilement de la page.
 * Le CSS s'en sert pour faire glisser les photos à des vitesses différentes (effet de profondeur).
 */
export function useParallaxe<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let image = 0;
    const mettreAJour = () => {
      image = 0;
      const haut = element.getBoundingClientRect().top;
      element.style.setProperty("--defile", String(Math.max(-400, Math.min(400, -haut))));
    };
    const surDefilement = () => {
      if (!image) image = requestAnimationFrame(mettreAJour);
    };
    window.addEventListener("scroll", surDefilement, { passive: true });
    mettreAJour();
    return () => {
      window.removeEventListener("scroll", surDefilement);
      cancelAnimationFrame(image);
    };
  }, []);

  return ref;
}
