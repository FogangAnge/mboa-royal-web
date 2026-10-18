import { useEffect, useRef, useState } from "react";

/**
 * Devient vrai la première fois que l'élément entre dans l'écran (et le reste).
 * Sert à déclencher une animation au bon moment, pas au chargement de la page.
 */
export function useVisible<T extends Element>(seuil = 0.25) {
  const ref = useRef<T>(null);
  // Vieux navigateur sans IntersectionObserver : on affiche tout de suite, sans animation.
  const [visible, setVisible] = useState(() => !("IntersectionObserver" in window));

  useEffect(() => {
    const element = ref.current;
    if (!element || visible) return;
    const observateur = new IntersectionObserver(
      ([entree]) => {
        if (entree.isIntersecting) {
          setVisible(true);
          observateur.disconnect();
        }
      },
      { threshold: seuil },
    );
    observateur.observe(element);
    return () => observateur.disconnect();
  }, [seuil, visible]);

  return { ref, visible };
}