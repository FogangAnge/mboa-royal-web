import { Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router";

import ChoixOptions from "../components/ChoixOptions";
import PlatCard from "../components/PlatCard";
import { useMenu } from "../hooks/useMenu";
import { useRestaurant } from "../hooks/useRestaurant";
import { normaliser } from "../lib/format";
import { usePanier } from "../panier/usePanier";
import type { Plat } from "../types/menu";

export default function Menu() {
  const { data: categories, isPending, isError, refetch } = useMenu();
  const { data: restaurant } = useRestaurant();
  const { ajouter } = usePanier();
  const location = useLocation();

  const [recherche, setRecherche] = useState("");
  const [platChoisi, setPlatChoisi] = useState<Plat | null>(null);
  const [annonce, setAnnonce] = useState<string | null>(null);

  // Arrivée depuis l'accueil avec /menu#plat-3 : on descend jusqu'au plat.
  useEffect(() => {
    if (!categories || !location.hash) return;
    document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: "start" });
  }, [categories, location.hash]);

  // La notification disparaît toute seule après quelques secondes.
  useEffect(() => {
    if (!annonce) return;
    const minuteur = setTimeout(() => setAnnonce(null), 3500);
    return () => clearTimeout(minuteur);
  }, [annonce]);

  const categoriesFiltrees = useMemo(() => {
    if (!categories) return [];
    const texte = normaliser(recherche.trim());
    if (!texte) return categories;
    return categories
      .map((categorie) => ({
        ...categorie,
        plats: categorie.plats.filter(
          (plat) => normaliser(plat.nom).includes(texte) || normaliser(plat.description).includes(texte),
        ),
      }))
      .filter((categorie) => categorie.plats.length > 0);
  }, [categories, recherche]);

  function choisir(plat: Plat) {
    if (plat.groupes_options.length > 0) {
      setPlatChoisi(plat);
      return;
    }
    ajouter({ platId: plat.id, nom: plat.nom, photo: plat.photo, prixUnitaire: plat.prix, options: [] });
    setAnnonce(`${plat.nom} ajouté au panier.`);
  }

  function boutonAjouter(plat: Plat) {
    if (!plat.commandable) {
      return <span className="text-sm font-semibold text-sable-600">Indisponible</span>;
    }
    return (
      <button
        type="button"
        onClick={() => choisir(plat)}
        aria-label={`Ajouter ${plat.nom} au panier`}
        className="inline-flex h-11 items-center gap-2 rounded-full bg-palmier-950 px-5 font-bold text-creme-50 transition-colors hover:bg-palmier-800"
      >
        <Plus aria-hidden="true" className="h-4 w-4" />
        Ajouter
      </button>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-titre text-5xl text-palmier-950">Le menu</h1>
          <p className="mt-2 text-sable-600">Les plats grisés ne sont pas disponibles aujourd'hui.</p>
        </div>
        <label className="flex h-12 w-full items-center gap-3 rounded-full border border-sable-300 bg-creme-0 px-4 md:w-96">
          <Search aria-hidden="true" className="h-5 w-5 text-sable-600" />
          <span className="sr-only">Rechercher un plat</span>
          <input
            type="search"
            value={recherche}
            onChange={(evenement) => setRecherche(evenement.target.value)}
            placeholder="Ndolé, eru, koki…"
            className="h-full flex-1 bg-transparent outline-none"
          />
        </label>
      </div>

      {categories && categories.length > 0 && !recherche && (
        <nav aria-label="Catégories" className="mb-10 flex flex-wrap gap-2">
          {categories.map((categorie) => (
            <a
              key={categorie.id}
              href={`#categorie-${categorie.id}`}
              className="inline-flex h-11 items-center rounded-full border border-sable-300 bg-creme-0 px-5 font-semibold transition-colors hover:border-palmier-950"
            >
              {categorie.nom}
            </a>
          ))}
        </nav>
      )}

      {isPending && (
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="squelette h-96 rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-sable-300 bg-creme-0 p-6">
          <p className="font-semibold">Le menu n'a pas pu être chargé.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 inline-flex h-11 items-center rounded-full bg-palmier-950 px-5 font-bold text-creme-50"
          >
            Réessayer
          </button>
        </div>
      )}

      {!isPending && !isError && categoriesFiltrees.length === 0 && (
        <p className="text-sable-600">
          {recherche ? `Aucun plat ne correspond à « ${recherche} ».` : "Le menu sera bientôt disponible."}
        </p>
      )}

      <div className="flex flex-col gap-14">
        {categoriesFiltrees.map((categorie) => (
          <section key={categorie.id} id={`categorie-${categorie.id}`} className="scroll-mt-24">
            <h2 className="mb-6 font-titre text-3xl text-palmier-950">{categorie.nom}</h2>
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {categorie.plats.map((plat) => (
                <PlatCard key={plat.id} plat={plat} devise={restaurant?.devise} action={boutonAjouter(plat)} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {platChoisi && (
        <ChoixOptions
          plat={platChoisi}
          devise={restaurant?.devise}
          onFermer={() => setPlatChoisi(null)}
          onAjoute={setAnnonce}
        />
      )}

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
        {annonce && (
          <div className="pointer-events-auto flex items-center gap-4 rounded-full bg-palmier-950 px-5 py-3 text-creme-50 shadow-lg">
            <span>{annonce}</span>
            <Link to="/panier" className="font-bold text-or-300 underline underline-offset-4">
              Voir le panier
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}