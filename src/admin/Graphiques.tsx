import { useEffect, useRef, useState, type ReactNode } from "react";

import type { Point } from "./statistiques";

const BARRE = "#3F6B50"; // palmier-600 : 6:1 sur la carte
const EN_AVANT = "#B4472B"; // argile-600 : la colonne qu'on veut faire remarquer
const GRILLE = "#EFE6D4";
const TEXTE_DISCRET = "#5A5245";

const compact = new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 });

/** Un maximum « rond » pour l'axe : 272 000 → 300 000, 3,2 → 4. */
function maximumRond(valeur: number): number {
  if (valeur <= 0) return 1;
  const puissance = 10 ** Math.floor(Math.log10(valeur));
  for (const pas of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
    if (valeur <= pas * puissance) return pas * puissance;
  }
  return 10 * puissance;
}

/** La largeur réelle du conteneur, mise à jour quand la fenêtre change de taille. */
function useLargeur<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [largeur, setLargeur] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observateur = new ResizeObserver(([entree]) => setLargeur(Math.floor(entree.contentRect.width)));
    observateur.observe(element);
    return () => observateur.disconnect();
  }, []);
  return { ref, largeur };
}

/** Une colonne au sommet arrondi (4 px), carrée sur la ligne de base. */
function cheminColonne(x: number, y: number, largeur: number, base: number): string {
  const hauteur = base - y;
  if (hauteur <= 0) return "";
  const r = Math.min(4, hauteur, largeur / 2);
  return `M${x},${base} V${y + r} Q${x},${y} ${x + r},${y} H${x + largeur - r} Q${x + largeur},${y} ${x + largeur},${y + r} V${base} Z`;
}

/** L'infobulle : la valeur d'abord, en gras ; ce qu'elle désigne ensuite. */
function Infobulle({ point, valeur, gauche, haut }: { point: Point; valeur: string; gauche: number; haut: number }) {
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 w-max max-w-56 -translate-x-1/2 -translate-y-full rounded-xl bg-palmier-950 px-3 py-2 text-sm text-creme-50 shadow-lg"
      style={{ left: gauche, top: haut - 8 }}
    >
      <p className="font-bold">{valeur}</p>
      <p className="text-creme-50/80">{point.detail}</p>
      {point.complement && <p className="text-creme-50/60">{point.complement}</p>}
    </div>
  );
}

/** Le même contenu en tableau : lisible sans souris, par un lecteur d'écran, ou pour recopier un chiffre. */
function TableauDonnees({ points, colonneValeur, formatValeur }: { points: Point[]; colonneValeur: string; formatValeur: (v: number) => string }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-palmier-800 underline underline-offset-4">
        Voir les chiffres
      </summary>
      <table className="mt-2 w-full border-collapse">
        <thead>
          <tr className="text-left text-sable-600">
            <th className="py-1.5 pr-4 font-semibold">Période</th>
            <th className="py-1.5 pr-4 text-right font-semibold">{colonneValeur}</th>
            <th className="py-1.5 font-semibold">Détail</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.detail} className="border-t border-[#EFE6D4]">
              <td className="py-1.5 pr-4">{point.detail}</td>
              <td className="py-1.5 pr-4 text-right font-semibold tabular-nums">{formatValeur(point.valeur)}</td>
              <td className="py-1.5 text-sable-600">{point.complement}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

interface PropsColonnes {
  points: Point[];
  /** Le nom de la mesure, pour le tableau (« Chiffre d'affaires »…). */
  mesure: string;
  formatValeur: (valeur: number) => string;
  hauteur?: number;
}

/** Un graphique en colonnes, dessiné en SVG : une colonne par jour ou par heure. */
export function Colonnes({ points, mesure, formatValeur, hauteur = 230 }: PropsColonnes) {
  const { ref, largeur } = useLargeur<HTMLDivElement>();
  const [survol, setSurvol] = useState<number | null>(null);

  const marge = { haut: 24, droite: 6, bas: 28, gauche: 44 };
  const largeurUtile = Math.max(0, largeur - marge.gauche - marge.droite);
  const base = hauteur - marge.bas;
  const hauteurUtile = base - marge.haut;
  // Un peu de marge au-dessus de la plus haute colonne, pour que sa valeur ne touche pas la grille.
  const maximum = maximumRond(Math.max(0, ...points.map((p) => p.valeur)) * 1.12);
  const graduations = [0, maximum / 2, maximum];
  const bande = points.length > 0 ? largeurUtile / points.length : 0;
  const epaisseur = Math.min(24, bande * 0.7);
  const tous = Math.max(1, Math.ceil(points.length / Math.max(1, Math.floor(largeurUtile / 48))));
  const indiceEnAvant = points.findIndex((p) => p.enAvant);
  const plusHaut = points.reduce((indice, p, i) => (p.valeur > (points[indice]?.valeur ?? -1) ? i : indice), 0);
  const y = (valeur: number) => base - (valeur / maximum) * hauteurUtile;
  const centre = (i: number) => marge.gauche + bande * i + bande / 2;

  return (
    <div>
      <div ref={ref} className="relative">
        {largeur > 0 && (
          <svg width={largeur} height={hauteur} role="img" aria-label={`${mesure}, ${points.length} colonnes`}>
            {graduations.map((g) => (
              <g key={g}>
                <line x1={marge.gauche} x2={largeur - marge.droite} y1={y(g)} y2={y(g)} stroke={GRILLE} strokeWidth={1} />
                <text x={marge.gauche - 8} y={y(g)} dy="0.32em" textAnchor="end" fontSize={12} fill={TEXTE_DISCRET} className="tabular-nums">
                  {compact.format(g)}
                </text>
              </g>
            ))}

            {points.map((point, i) => {
              const x = centre(i) - epaisseur / 2;
              const couleur = point.enAvant ? EN_AVANT : BARRE;
              // Une étiquette sur « tous », sans jamais en coller une contre celle mise en avant.
              const etiquetteVisible =
                point.enAvant || (i % tous === 0 && (indiceEnAvant < 0 || Math.abs(i - indiceEnAvant) >= tous));
              const valeurVisible = point.valeur > 0 && (point.enAvant || i === plusHaut);
              return (
                <g
                  key={point.detail}
                  tabIndex={0}
                  role="img"
                  aria-label={`${point.detail} : ${formatValeur(point.valeur)}${point.complement ? `, ${point.complement}` : ""}`}
                  onPointerEnter={() => setSurvol(i)}
                  onPointerLeave={() => setSurvol(null)}
                  onFocus={() => setSurvol(i)}
                  onBlur={() => setSurvol(null)}
                  className="outline-none"
                >
                  {/* La zone sensible couvre toute la bande : on n'a pas besoin de viser la colonne. */}
                  <rect x={marge.gauche + bande * i} y={marge.haut} width={bande} height={hauteurUtile} fill="transparent" />
                  {survol === i && (
                    <rect x={marge.gauche + bande * i + 1} y={marge.haut} width={bande - 2} height={hauteurUtile} rx={6} fill="#F6EFE2" />
                  )}
                  <path d={cheminColonne(x, y(point.valeur), epaisseur, base)} fill={couleur} opacity={survol === null || survol === i ? 1 : 0.55} />
                  {valeurVisible && (
                    <text x={centre(i)} y={y(point.valeur) - 7} textAnchor="middle" fontSize={12} fontWeight={700} fill="#1D1A14">
                      {compact.format(point.valeur)}
                    </text>
                  )}
                  {etiquetteVisible && (
                    <text
                      // Aux deux bouts, l'étiquette s'aligne sur le bord pour ne pas être coupée.
                      x={i === points.length - 1 ? centre(i) + bande / 2 : i === 0 ? centre(i) - bande / 2 : centre(i)}
                      y={base + 18}
                      textAnchor={i === points.length - 1 ? "end" : i === 0 ? "start" : "middle"}
                      fontSize={12}
                      fontWeight={point.enAvant ? 700 : 400}
                      fill={point.enAvant ? "#1D1A14" : TEXTE_DISCRET}
                    >
                      {point.etiquette}
                    </text>
                  )}
                </g>
              );
            })}
            <line x1={marge.gauche} x2={largeur - marge.droite} y1={base} y2={base} stroke="#CFC2A8" strokeWidth={1} />
          </svg>
        )}
        {survol !== null && points[survol] && (
          <Infobulle
            point={points[survol]}
            valeur={formatValeur(points[survol].valeur)}
            gauche={Math.min(Math.max(centre(survol), 90), largeur - 90)}
            haut={y(points[survol].valeur)}
          />
        )}
      </div>
      <TableauDonnees points={points} colonneValeur={mesure} formatValeur={formatValeur} />
    </div>
  );
}

/** Un classement en barres horizontales : le nom à gauche, la valeur au bout de la barre. */
export function Barres({ points, mesure, formatValeur }: { points: Point[]; mesure: string; formatValeur: (v: number) => string }) {
  const [survol, setSurvol] = useState<number | null>(null);
  const maximum = Math.max(1, ...points.map((p) => p.valeur));

  return (
    <div>
      <ul className="flex flex-col gap-3" aria-label={mesure}>
        {points.map((point, i) => (
          <li
            key={point.detail}
            tabIndex={0}
            aria-label={`${point.detail} : ${formatValeur(point.valeur)}, ${point.complement ?? ""}`}
            onPointerEnter={() => setSurvol(i)}
            onPointerLeave={() => setSurvol(null)}
            onFocus={() => setSurvol(i)}
            onBlur={() => setSurvol(null)}
            className={`relative rounded-xl px-2 py-1.5 outline-none transition-colors ${survol === i ? "bg-creme-50" : ""}`}
          >
            <p className="mb-1 flex justify-between gap-3 text-sm">
              <span className={point.enAvant ? "font-bold" : "font-semibold"}>{point.etiquette}</span>
              <span className="text-sable-600">{point.complement}</span>
            </p>
            <div className="flex items-center gap-2">
              <div
                className="h-5 rounded-r-[4px] transition-opacity"
                style={{
                  width: `${Math.max(2, (point.valeur / maximum) * 72)}%`,
                  backgroundColor: point.enAvant ? EN_AVANT : BARRE,
                  opacity: survol === null || survol === i ? 1 : 0.55,
                }}
              />
              <span className="whitespace-nowrap text-sm font-bold tabular-nums">{formatValeur(point.valeur)}</span>
            </div>
          </li>
        ))}
      </ul>
      <TableauDonnees points={points} colonneValeur={mesure} formatValeur={formatValeur} />
    </div>
  );
}

/** Le cadre commun : un titre qui dit ce qu'on voit, une phrase qui dit quoi en retenir. */
export function CarteGraphique({ titre, resume, children }: { titre: string; resume?: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={titre} className="rounded-3xl border border-[#E6DAC3] bg-creme-0 p-5">
      <h2 className="text-xl font-bold text-palmier-950">{titre}</h2>
      {resume && <p className="mt-1 text-sm text-sable-600">{resume}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
