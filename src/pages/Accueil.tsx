import { ArrowRight, Bike } from "lucide-react";
import { Link } from "react-router";

import PlatCard from "../components/PlatCard";
import { useMenu } from "../hooks/useMenu";
import { useRestaurant } from "../hooks/useRestaurant";
import { heureCourte, jourAujourdhui } from "../lib/format";

const ETAPES = [
  {
    titre: "Composez votre panier",
    texte: "Choisissez vos plats du jour et leur accompagnement, puis la livraison ou la vente à emporter. Vous pouvez aussi programmer l'heure.",
  },
  {
    titre: "Confirmez sur WhatsApp",
    texte: "Votre récapitulatif s'ouvre dans WhatsApp avec votre numéro de commande. Nous confirmons et réglons le paiement avec vous.",
  },
  {
    titre: "Recevez avec votre code",
    texte: "Suivez la préparation en direct. À l'arrivée, donnez votre code à 4 chiffres au livreur : c'est la preuve de livraison.",
  },
];

export default function Accueil() {
  const { data: restaurant } = useRestaurant();
  const { data: categories, isPending: menuEnChargement } = useMenu();

  const plats = categories?.flatMap((categorie) => categorie.plats) ?? [];
  const vedettes = plats.filter((plat) => plat.est_vedette).slice(0, 6);
  const photos = (vedettes.length > 0 ? vedettes : plats).filter((plat) => plat.photo).slice(0, 3);
  const horaireDuJour = restaurant?.horaires.find((h) => h.jour === jourAujourdhui());

  const [debutSlogan, ...finSlogan] = (restaurant?.slogan ?? "").split(",");

  return (
    <>
      {/* ---------- Bandeau principal ---------- */}
      <section className="bg-palmier-950 text-creme-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-20 pt-10 md:flex-row md:items-center">
          <div className="flex flex-1 flex-col gap-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-or-500">
              Cuisine camerounaise · {restaurant?.ville}
            </p>
            <h1 className="font-titre text-5xl font-bold leading-[1.05] md:text-6xl">
              {debutSlogan}
              {finSlogan.length > 0 && (
                <>
                  ,<br />
                  <span className="font-medium italic text-or-300">{finSlogan.join(",").trim()}</span>
                </>
              )}
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-creme-50/80">{restaurant?.description}</p>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/menu"
                className="inline-flex h-14 items-center gap-2 rounded-full bg-or-500 px-7 text-lg font-bold text-palmier-950 transition-colors hover:bg-or-300"
              >
                Commander maintenant <ArrowRight aria-hidden="true" className="h-5 w-5" />
              </Link>
              <Link
                to="/reservation"
                className="inline-flex h-14 items-center rounded-full border-2 border-or-500 px-7 text-lg font-bold transition-colors hover:bg-palmier-800"
              >
                Réserver une table
              </Link>
            </div>

            {restaurant && (
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-creme-50/80">
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={`h-2.5 w-2.5 rounded-full ${restaurant.est_ouvert ? "bg-green-400" : "bg-or-300"}`}
                  />
                  {restaurant.est_ouvert ? "Ouvert" : "Fermé"} en ce moment
                  {horaireDuJour && !horaireDuJour.ferme &&
                    ` · aujourd'hui ${heureCourte(horaireDuJour.ouverture)} – ${heureCourte(horaireDuJour.fermeture)}`}
                </span>
                <span className="flex items-center gap-2">
                  <Bike aria-hidden="true" className="h-5 w-5 text-or-500" />
                  Livraison à {restaurant.ville}
                </span>
              </div>
            )}
          </div>

          <div className="grid flex-1 grid-cols-2 gap-4">
            {photos.length === 0 && (
              <>
                <div className="squelette row-span-2 h-80 rounded-t-full rounded-b-2xl md:h-[420px]" />
                <div className="squelette h-38 rounded-2xl md:h-[202px]" />
                <div className="squelette h-38 rounded-2xl md:h-[202px]" />
              </>
            )}
            {photos.map((plat, index) => (
              <img
                key={plat.id}
                src={plat.photo ?? ""}
                alt={plat.nom}
                width={400}
                height={index === 0 ? 420 : 202}
                className={
                  index === 0
                    ? "row-span-2 h-80 w-full rounded-t-full rounded-b-2xl object-cover md:h-[420px]"
                    : "h-38 w-full rounded-2xl object-cover md:h-[202px]"
                }
              />
            ))}
          </div>
        </div>
      </section>
      <div className="bande-toghu" aria-hidden="true" />

      {/* ---------- Plats signature ---------- */}
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-20">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-argile-600">Nos plats signature</p>
            <h2 className="font-titre text-4xl text-palmier-950 md:text-5xl">Tout le Cameroun dans une assiette</h2>
          </div>
          <Link to="/menu" className="font-bold text-palmier-800 underline underline-offset-4">
            Voir tout le menu
          </Link>
        </div>

        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {menuEnChargement &&
            [1, 2, 3].map((n) => <div key={n} className="squelette h-96 rounded-2xl" />)}
          {vedettes.map((plat) => (
            <PlatCard
              key={plat.id}
              plat={plat}
              devise={restaurant?.devise}
              action={
                <Link
                  to={`/menu#plat-${plat.id}`}
                  className="inline-flex h-11 items-center rounded-full bg-palmier-950 px-5 font-bold text-creme-50"
                >
                  Commander
                </Link>
              }
            />
          ))}
        </div>
        {!menuEnChargement && vedettes.length === 0 && (
          <p className="text-sable-600">Les plats signature seront bientôt affichés ici.</p>
        )}
      </section>

      {/* ---------- Comment commander ---------- */}
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-10">
        <h2 className="mb-8 text-center font-titre text-4xl text-palmier-950">Commander, c'est simple</h2>
        <ol className="grid gap-6 md:grid-cols-3">
          {ETAPES.map((etape, index) => (
            <li key={etape.titre} className="flex flex-col gap-3 rounded-2xl border border-sable-300 bg-creme-0 p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-palmier-950 font-titre text-2xl font-bold text-or-500">
                {index + 1}
              </span>
              <h3 className="text-xl font-bold text-palmier-950">{etape.titre}</h3>
              <p className="leading-relaxed text-sable-600">{etape.texte}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- Réservation ---------- */}
      <section className="bg-palmier-800 text-creme-50">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-20 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-or-300">Réservation</p>
            <h2 className="font-titre text-4xl">Une table vous attend</h2>
            <p className="mt-3 text-lg text-creme-50/80">
              Déjeuner d'affaires, repas en famille ou anniversaire : réservez en une minute, nous confirmons par
              WhatsApp.
            </p>
          </div>
          <Link
            to="/reservation"
            className="inline-flex h-14 items-center rounded-full bg-or-500 px-7 text-lg font-bold text-palmier-950 transition-colors hover:bg-or-300"
          >
            Réserver une table
          </Link>
        </div>
      </section>
    </>
  );
}