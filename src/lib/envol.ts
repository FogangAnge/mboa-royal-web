/**
 * Quand on ajoute un plat, sa photo s'envole du bouton jusqu'au panier, en arc.
 * Utilise l'API Web Animations du navigateur : aucune bibliothèque.
 */
export function envolerVersPanier(depart: Element | null, photo?: string | null) {
  if (!depart || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Il y a deux boutons panier (ordinateur et téléphone) : on vise celui qui est affiché.
  const cible = Array.from(document.querySelectorAll("[data-cible-panier]")).find(
    (element) => element.getClientRects().length > 0,
  );
  if (!cible) return;

  const a = depart.getBoundingClientRect();
  const b = cible.getBoundingClientRect();
  const taille = 64;
  const x = a.left + a.width / 2 - taille / 2;
  const y = a.top + a.height / 2 - taille / 2;
  const dx = b.left + b.width / 2 - (x + taille / 2);
  const dy = b.top + b.height / 2 - (y + taille / 2);

  const pastille = document.createElement(photo ? "img" : "div");
  if (photo && pastille instanceof HTMLImageElement) {
    pastille.src = photo;
    pastille.alt = "";
  }
  pastille.className = "envol";
  Object.assign(pastille.style, { left: `${x}px`, top: `${y}px`, width: `${taille}px`, height: `${taille}px` });
  document.body.appendChild(pastille);

  const vol = pastille.animate(
    [
      { transform: "translate(0, 0) scale(0.6) rotate(0deg)", opacity: 0 },
      { transform: "translate(0, -18px) scale(1.15) rotate(-8deg)", opacity: 1, offset: 0.18 },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 140}px) scale(0.85) rotate(10deg)`, opacity: 1, offset: 0.6 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.2) rotate(30deg)`, opacity: 0.4 },
    ],
    { duration: 850, easing: "cubic-bezier(0.45, 0, 0.55, 1)" },
  );
  vol.onfinish = () => {
    pastille.remove();
    cible.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.25) rotate(-8deg)" }, { transform: "scale(1)" }],
      { duration: 420, easing: "cubic-bezier(0.3, 1.6, 0.5, 1)" },
    );
  };
}
