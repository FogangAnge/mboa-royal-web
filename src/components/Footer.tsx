import { Clock, MapPin, MessageCircle } from "lucide-react";

import { useRestaurant } from "../hooks/useRestaurant";
import { heureCourte } from "../lib/format";
import { lienWhatsApp } from "../lib/whatsapp";

export default function Footer() {
  const { data: restaurant } = useRestaurant();
  if (!restaurant) return null;

  const carte =
    restaurant.latitude && restaurant.longitude
      ? `https://www.google.com/maps?q=${restaurant.latitude},${restaurant.longitude}`
      : null;

  return (
    <footer className="bg-palmier-950 text-creme-50/85">
      <div className="bande-toghu" aria-hidden="true" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <span className="font-titre text-2xl font-bold text-creme-50">{restaurant.nom}</span>
          <p>{restaurant.slogan}</p>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="flex items-center gap-2 font-bold text-or-300">
            <MapPin aria-hidden="true" className="h-4 w-4" /> Adresse
          </h2>
          <p>
            {restaurant.adresse}
            {restaurant.quartier && `, ${restaurant.quartier}`}
            <br />
            {restaurant.ville}, {restaurant.pays}
          </p>
          {carte && (
            <a href={carte} target="_blank" rel="noopener noreferrer" className="text-creme-50 underline underline-offset-4">
              Voir sur la carte
            </a>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="flex items-center gap-2 font-bold text-or-300">
            <Clock aria-hidden="true" className="h-4 w-4" /> Horaires
          </h2>
          <ul className="flex flex-col gap-1 text-sm">
            {restaurant.horaires.map((h) => (
              <li key={h.jour} className="flex justify-between gap-4">
                <span>{h.jour_libelle}</span>
                <span>{h.ferme ? "Fermé" : `${heureCourte(h.ouverture)} – ${heureCourte(h.fermeture)}`}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-bold text-or-300">Nous joindre</h2>
          <a
            href={lienWhatsApp(restaurant.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 w-fit items-center gap-2 rounded-full bg-whatsapp px-5 font-bold text-white"
          >
            <MessageCircle aria-hidden="true" className="h-5 w-5" />
            WhatsApp
          </a>
          <p className="text-sm">Application Android : bientôt disponible.</p>
        </div>
      </div>
      <p className="border-t border-palmier-800 px-4 py-5 text-center text-sm text-creme-50/70">
        © {new Date().getFullYear()} {restaurant.nom}
      </p>
    </footer>
  );
}