import { useQuery } from "@tanstack/react-query";
import { Clock, MapPin, Phone } from "lucide-react";

import { getRestaurant } from "./api/restaurant";

function heure(valeur: string | null) {
  return valeur ? valeur.slice(0, 5) : "";
}

export default function App() {
  const { data: restaurant, isPending, isError } = useQuery({
    queryKey: ["restaurant"],
    queryFn: getRestaurant,
  });

  if (isPending) {
    return (
      <main className="grid min-h-screen place-items-center">
        <p className="text-sable-600">Chargement…</p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <div className="max-w-md rounded-2xl border border-sable-300 bg-creme-0 p-6 text-center">
          <h1 className="font-titre text-2xl text-palmier-950">Impossible de joindre l'API</h1>
          <p className="mt-2 text-sable-600">
            Vérifiez que le back-end tourne (<code>docker compose up -d</code> dans
            mboa-royal-api), puis rechargez la page.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-palmier-950 px-4 py-12 text-creme-50">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        {restaurant.logo && (
          <img
            src={restaurant.logo}
            alt={`Logo de ${restaurant.nom}`}
            className="h-32 w-32 rounded-full"
            width={128}
            height={128}
          />
        )}

        <h1 className="font-titre text-5xl font-bold">{restaurant.nom}</h1>
        <p className="font-titre text-xl italic text-or-300">{restaurant.slogan}</p>

        <span
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${
            restaurant.est_ouvert ? "bg-palmier-800 text-creme-50" : "bg-argile-800 text-creme-50"
          }`}
        >
          <span
            aria-hidden="true"
            className={`h-2.5 w-2.5 rounded-full ${restaurant.est_ouvert ? "bg-green-400" : "bg-or-300"}`}
          />
          {restaurant.est_ouvert ? "Ouvert en ce moment" : "Fermé en ce moment"}
        </span>

        <ul className="flex flex-col gap-2 text-creme-50/90">
          <li className="flex items-center justify-center gap-2">
            <MapPin aria-hidden="true" className="h-5 w-5 text-or-500" />
            {restaurant.adresse}, {restaurant.quartier} — {restaurant.ville}
          </li>
          <li className="flex items-center justify-center gap-2">
            <Phone aria-hidden="true" className="h-5 w-5 text-or-500" />
            {restaurant.telephone}
          </li>
        </ul>

        <section className="w-full rounded-2xl bg-creme-0 p-6 text-left text-encre-900">
          <h2 className="mb-4 flex items-center gap-2 font-titre text-2xl text-palmier-950">
            <Clock aria-hidden="true" className="h-6 w-6 text-or-500" />
            Horaires
          </h2>
          <ul className="divide-y divide-sable-300">
            {restaurant.horaires.map((h) => (
              <li key={h.jour} className="flex justify-between py-2">
                <span className="font-semibold">{h.jour_libelle}</span>
                <span className="text-sable-600">
                  {h.ferme ? "Fermé" : `${heure(h.ouverture)} – ${heure(h.fermeture)}`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}