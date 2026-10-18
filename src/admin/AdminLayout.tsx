import {
  Bike,
  CalendarDays,
  ChefHat,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Link, Navigate, NavLink, Outlet, useLocation } from "react-router";

import { getReservationsAConfirmer } from "../api/admin";
import { useAuth } from "../auth/useAuth";
import { sonnerette } from "../lib/son";
import { estCuisinier, estPersonnel } from "../types/compte";
import { libelleRole } from "./outils";
import { useCommandesAdmin } from "./useCommandesAdmin";

interface LienAdmin {
  vers: string;
  libelle: string;
  icone: LucideIcon;
  exact?: boolean;
  compteur?: "commandes" | "reservations";
}

const LIENS: LienAdmin[] = [
  { vers: "/admin", libelle: "Tableau de bord", icone: LayoutDashboard, exact: true },
  { vers: "/admin/commandes", libelle: "Commandes", icone: ClipboardList, compteur: "commandes" },
  { vers: "/admin/reservations", libelle: "Réservations", icone: CalendarDays, compteur: "reservations" },
  { vers: "/admin/menu", libelle: "Menu & plats", icone: UtensilsCrossed },
  { vers: "/admin/livreurs", libelle: "Livreurs & caisse", icone: Bike },
];

const TITRE = "Mboa Royal — Espace restaurant";

function classeLien({ isActive }: { isActive: boolean }) {
  const base = "relative flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 font-semibold transition-colors";
  return isActive ? `${base} bg-palmier-800 text-creme-50` : `${base} text-creme-50/75 hover:bg-palmier-800/60 hover:text-creme-50`;
}

/** Le cadre de l'espace admin, affiché seulement pour le personnel connecté. */
function Coquille() {
  const { utilisateur, deconnexion } = useAuth();
  const { data: commandes } = useCommandesAdmin();
  const nouvelles = commandes?.filter((c) => c.statut === "en_attente").length ?? 0;
  const precedentes = useRef<number | null>(null);
  const reservations = useQuery({
    queryKey: ["admin", "reservations", "a-confirmer"],
    queryFn: getReservationsAConfirmer,
    refetchInterval: 60_000,
  });
  const compteurs = { commandes: nouvelles, reservations: reservations.data?.length ?? 0 };

  // Une nouvelle commande vient d'arriver : on sonne.
  useEffect(() => {
    if (!commandes) return;
    if (precedentes.current !== null && nouvelles > precedentes.current) sonnerette();
    precedentes.current = nouvelles;
  }, [commandes, nouvelles]);

  // Le nombre de nouvelles commandes s'affiche aussi dans l'onglet du navigateur.
  useEffect(() => {
    const precedent = document.title;
    document.title = nouvelles > 0 ? `(${nouvelles}) ${TITRE}` : TITRE;
    return () => {
      document.title = precedent;
    };
  }, [nouvelles]);

  return (
    <div className="flex min-h-screen flex-col bg-[#F3EEE4] text-encre-900 md:flex-row">
      <a href="#contenu-admin" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-or-500 focus:px-4 focus:py-2 focus:font-bold">
        Aller au contenu
      </a>

      <aside className="flex flex-col gap-4 bg-palmier-950 p-4 text-creme-50 md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:gap-6 md:p-6">
        <Link to="/admin" className="flex items-center gap-3">
          <img src="/favicon.png" alt="" className="h-10 w-10" />
          <span>
            <span className="block font-titre text-xl font-bold">Mboa Royal</span>
            <span className="block text-xs text-creme-50/60">Espace restaurant</span>
          </span>
        </Link>

        <nav aria-label="Administration" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-col md:overflow-visible md:px-0">
          {LIENS.map(({ vers, libelle, icone: Icone, exact, compteur }) => {
            const nombre = compteur ? compteurs[compteur] : 0;
            return (
              <NavLink key={vers} to={vers} end={exact} className={classeLien}>
                <Icone aria-hidden="true" className="h-5 w-5 shrink-0" />
                <span className="whitespace-nowrap">{libelle}</span>
                {nombre > 0 && (
                  <span className="ml-auto inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-or-500 px-1.5 text-xs font-bold text-palmier-950">
                    {nombre}
                    <span className="sr-only"> à traiter</span>
                  </span>
                )}
              </NavLink>
            );
          })}
          <Link to="/cuisine" className="flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 font-semibold text-or-300 transition-colors hover:bg-palmier-800/60">
            <ChefHat aria-hidden="true" className="h-5 w-5 shrink-0" />
            <span className="whitespace-nowrap">Écran cuisine</span>
          </Link>
        </nav>

        <div className="flex flex-wrap items-center gap-3 border-t border-palmier-800 pt-4 text-sm md:mt-auto md:flex-col md:items-stretch">
          <p className="flex-1 text-creme-50/70">
            Connecté : <strong className="text-creme-50">{utilisateur?.nom || utilisateur?.telephone}</strong>
            {utilisateur && <span className="block text-xs">{libelleRole(utilisateur.role)}</span>}
          </p>
          <Link to="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-creme-50/75 hover:bg-palmier-800/60">
            <ExternalLink aria-hidden="true" className="h-4 w-4" />
            Voir le site
          </Link>
          <button type="button" onClick={deconnexion} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-semibold text-or-300 hover:bg-palmier-800/60">
            <LogOut aria-hidden="true" className="h-4 w-4" />
            Se déconnecter
          </button>
        </div>
      </aside>

      <main id="contenu-admin" className="min-w-0 flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}

/** Le garde : chargement, pas connecté, pas autorisé, ou bien l'espace admin. */
export default function AdminLayout() {
  const { utilisateur, chargement, deconnexion } = useAuth();
  const location = useLocation();

  if (chargement) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-palmier-950 text-creme-50/80" role="status">
        Ouverture de votre espace…
      </div>
    );
  }

  if (!utilisateur) {
    return <Navigate to="/admin/connexion" replace state={{ depuis: location.pathname + location.search }} />;
  }

  // Le cuisinier n'a pas accès à l'admin : il a son propre écran.
  if (estCuisinier(utilisateur)) {
    return <Navigate to="/cuisine" replace />;
  }

  if (!estPersonnel(utilisateur)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-creme-50 px-4 text-center">
        <h1 className="font-titre text-3xl text-palmier-950">Accès réservé au personnel</h1>
        <p className="text-sable-600">Ce compte n'a pas accès à l'espace du restaurant.</p>
        <button type="button" onClick={deconnexion} className="h-12 rounded-full bg-palmier-950 px-6 font-bold text-creme-50">
          Se déconnecter
        </button>
      </div>
    );
  }

  return <Coquille />;
}
