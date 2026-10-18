import { Menu as IconeMenu, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router";

import { useRestaurant } from "../hooks/useRestaurant";
import { usePanier } from "../panier/usePanier";

const LIENS = [
  { to: "/menu", label: "Menu" },
  { to: "/reservation", label: "Réserver" },
  { to: "/suivi", label: "Suivre ma commande" },
];

const BOUTON_COMMANDER =
  "inline-flex h-11 items-center justify-center rounded-full bg-or-500 px-5 font-bold text-palmier-950 transition-colors hover:bg-or-300";

function classeLienBureau({ isActive }: { isActive: boolean }) {
  const base = "font-semibold transition-colors hover:text-or-300";
  return isActive ? base + " text-or-300" : base;
}

function classeLienMobile({ isActive }: { isActive: boolean }) {
  const base = "flex h-12 items-center rounded-xl px-3 font-semibold";
  return isActive ? base + " bg-palmier-800 text-or-300" : base;
}

function BoutonPanier({ onClick }: { onClick?: () => void }) {
  const { nombreArticles } = usePanier();
  const libelle = nombreArticles > 0 ? `Panier, ${nombreArticles} article(s)` : "Panier vide";
  return (
    <Link
      to="/panier"
      onClick={onClick}
      aria-label={libelle}
      data-cible-panier
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-palmier-800 text-creme-50"
    >
      <ShoppingBag aria-hidden="true" className="h-5 w-5" />
      {nombreArticles > 0 && (
        // La clé change à chaque ajout : React recrée la pastille et l'animation « bond » rejoue.
        <span
          key={nombreArticles}
          className="bond absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-or-500 px-1 text-xs font-bold text-palmier-950"
        >
          {nombreArticles}
        </span>
      )}
    </Link>
  );
}

export default function Header() {
  const { data: restaurant } = useRestaurant();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const fermer = () => setMenuOuvert(false);
  const basculer = () => setMenuOuvert((ouvert) => !ouvert);

  return (
    <header className="sticky top-0 z-40 bg-palmier-950 text-creme-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" onClick={fermer} className="flex items-center gap-3 text-creme-50">
          {restaurant?.logo && (
            <img src={restaurant.logo} alt="" width={40} height={40} className="h-10 w-10 rounded-full" />
          )}
          <span className="font-titre text-2xl font-bold">{restaurant?.nom ?? "Mboa Royal"}</span>
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-7 md:flex">
          {LIENS.map((lien) => (
            <NavLink key={lien.to} to={lien.to} className={classeLienBureau}>
              {lien.label}
            </NavLink>
          ))}
          <BoutonPanier />
          <Link to="/menu" className={BOUTON_COMMANDER}>
            Commander
          </Link>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <BoutonPanier onClick={fermer} />
          <button
            type="button"
            onClick={basculer}
            aria-expanded={menuOuvert}
            aria-controls="menu-mobile"
            aria-label={menuOuvert ? "Fermer le menu" : "Ouvrir le menu"}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-palmier-800"
          >
            {menuOuvert ? <X aria-hidden="true" className="h-5 w-5" /> : <IconeMenu aria-hidden="true" className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOuvert && (
        <nav id="menu-mobile" aria-label="Navigation mobile" className="deroule border-t border-palmier-800 px-4 pb-4 md:hidden">
          <ul className="flex flex-col gap-1 pt-2">
            {LIENS.map((lien) => (
              <li key={lien.to}>
                <NavLink to={lien.to} onClick={fermer} className={classeLienMobile}>
                  {lien.label}
                </NavLink>
              </li>
            ))}
            <li className="pt-2">
              <Link to="/menu" onClick={fermer} className={BOUTON_COMMANDER + " h-12 w-full"}>
                Commander
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}