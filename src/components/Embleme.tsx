/**
 * L'emblème de Mboa Royal, dessiné en SVG par le code (le même que le logo).
 * Avec anime=true, il se dessine : l'anneau se trace, la couronne toghu tourne,
 * les feuilles poussent, la calebasse monte et les perles d'argile éclosent.
 */

const OR = "#D4A24C";
const OR_CLAIR = "#E9C77F";
const VERT = "#0F2A1D";
const ARGILE = "#B4472B";

/** La couronne de petits triangles, inspirée des broderies du toghu. */
function cheminToghu(rayonInterieur: number, rayonExterieur: number, nombre: number): string {
  const morceaux: string[] = [];
  for (let i = 0; i < nombre; i++) {
    const a0 = (2 * Math.PI * i) / nombre - Math.PI / 2;
    const a1 = (2 * Math.PI * (i + 0.5)) / nombre - Math.PI / 2;
    const a2 = (2 * Math.PI * (i + 1)) / nombre - Math.PI / 2;
    const point = (r: number, a: number) => `${(256 + r * Math.cos(a)).toFixed(2)} ${(256 + r * Math.sin(a)).toFixed(2)}`;
    morceaux.push(`M${point(rayonInterieur, a0)} L${point(rayonExterieur, a1)} L${point(rayonInterieur, a2)} Z`);
  }
  return morceaux.join(" ");
}

const TOGHU = cheminToghu(214, 226, 48);
const FEUILLE = "M0 0 C-30 -40 -30 -108 0 -148 C30 -108 30 -40 0 0 Z";
const ZIGZAG = Array.from({ length: 12 }, (_, i) => `${168 + i * 16},${i % 2 === 0 ? 326 : 344}`).join(" ");

const FEUILLES = [
  { angle: -36, echelle: 0.82, couleur: OR_CLAIR, delai: 0.75 },
  { angle: 36, echelle: 0.82, couleur: OR_CLAIR, delai: 0.85 },
  { angle: 0, echelle: 1, couleur: OR, delai: 0.6 },
];

export default function Embleme({ taille = 160, anime = false }: { taille?: number; anime?: boolean }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 512 512"
      aria-hidden="true"
      className={anime ? "embleme-anime" : undefined}
    >
      <circle className="embleme-fond" cx="256" cy="256" r="248" fill={VERT} />
      <circle className="embleme-anneau" cx="256" cy="256" r="232" fill="none" stroke={OR} strokeWidth="5" pathLength={1} />
      <path className="embleme-toghu" d={TOGHU} fill={OR} />

      {FEUILLES.map((feuille) => (
        <g key={feuille.angle} transform={`translate(256 286) rotate(${feuille.angle}) scale(${feuille.echelle})`}>
          <g className="embleme-feuille" style={{ animationDelay: `${feuille.delai}s` }}>
            <path d={FEUILLE} fill={feuille.couleur} />
            <path d="M0 -8 L0 -132" stroke={VERT} strokeWidth="4" strokeLinecap="round" fill="none" />
          </g>
          <circle
            className="embleme-perle"
            style={{ animationDelay: `${feuille.delai + 0.35}s` }}
            cx="0"
            cy="-157"
            r="11"
            fill={ARGILE}
          />
        </g>
      ))}

      <g className="embleme-bol">
        <path d="M150 302 H362 C362 366 314 406 256 406 C198 406 150 366 150 302 Z" fill={OR} />
        <rect x="134" y="290" width="244" height="20" rx="10" fill={OR_CLAIR} />
        <polyline points={ZIGZAG} fill="none" stroke={VERT} strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />
      </g>
    </svg>
  );
}
