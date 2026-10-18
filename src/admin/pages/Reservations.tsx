import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Phone, StickyNote, Users } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";

import { changerStatutReservation, getReservations, getReservationsAConfirmer } from "../../api/admin";
import { useRestaurant } from "../../hooks/useRestaurant";
import { messagesErreur } from "../../lib/erreurs";
import { formatDateHeure, formatHeure } from "../../lib/format";
import { lienWhatsApp } from "../../lib/whatsapp";
import type { Reservation } from "../../types/reservation";
import BadgeStatut from "../BadgeStatut";
import { jourRestaurant } from "../outils";

const CHAMP = "h-11 w-full rounded-xl border-[1.5px] border-sable-300 bg-white px-3";

interface ActionResa {
  vers: string;
  libelle: string;
  danger?: boolean;
}

/** Les boutons selon le statut (mêmes règles que TRANSITIONS dans reservations/models.py). */
function actionsResa(reservation: Reservation): ActionResa[] {
  const passee = new Date(reservation.date_heure).getTime() <= Date.now();
  switch (reservation.statut) {
    case "en_attente":
      return [
        { vers: "confirmee", libelle: "Confirmer" },
        { vers: "refusee", libelle: "Refuser", danger: true },
      ];
    case "confirmee":
      return passee
        ? [
            { vers: "honoree", libelle: "Client venu" },
            { vers: "absent", libelle: "Client absent", danger: true },
          ]
        : [{ vers: "annulee", libelle: "Annuler", danger: true }];
    default:
      return [];
  }
}

/** Le message WhatsApp à envoyer au client, selon la réponse du restaurant. */
function messagePour(reservation: Reservation, restaurant: string): string {
  const quand = formatDateHeure(reservation.date_heure);
  const pour = `${reservation.nb_personnes} personne(s)`;
  switch (reservation.statut) {
    case "confirmee":
      return `Bonjour ${reservation.nom}, votre réservation ${reservation.numero} du ${quand} pour ${pour} est confirmée. À bientôt chez ${restaurant} !`;
    case "refusee":
      return `Bonjour ${reservation.nom}, nous sommes désolés : nous ne pouvons pas accepter votre réservation ${reservation.numero} du ${quand}.${reservation.commentaire_restaurant ? ` ${reservation.commentaire_restaurant}` : ""} N'hésitez pas à choisir un autre créneau.`;
    case "annulee":
      return `Bonjour ${reservation.nom}, votre réservation ${reservation.numero} du ${quand} a été annulée.${reservation.commentaire_restaurant ? ` ${reservation.commentaire_restaurant}` : ""}`;
    default:
      return `Bonjour ${reservation.nom}, ici ${restaurant} au sujet de votre réservation ${reservation.numero} du ${quand}.`;
  }
}

function CarteReservation({ reservation, avecDate }: { reservation: Reservation; avecDate: boolean }) {
  const queryClient = useQueryClient();
  const { data: restaurant } = useRestaurant();
  const [actionOuverte, setActionOuverte] = useState<ActionResa | null>(null);
  const [motif, setMotif] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  const changement = useMutation({
    mutationFn: (donnees: { statut: string; commentaire?: string }) => changerStatutReservation(reservation.numero, donnees),
    onSuccess: () => {
      setActionOuverte(null);
      setMotif("");
      setErreur(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "reservations"] });
    },
    onError: (probleme) => setErreur(messagesErreur(probleme)[0]),
  });

  function lancer(action: ActionResa) {
    setErreur(null);
    if (action.danger && action.vers !== "absent") {
      setActionOuverte(action);
      return;
    }
    changement.mutate({ statut: action.vers });
  }

  function confirmer(evenement: FormEvent) {
    evenement.preventDefault();
    if (actionOuverte) changement.mutate({ statut: actionOuverte.vers, commentaire: motif.trim() });
  }

  const actions = actionsResa(reservation);
  const nomRestaurant = restaurant?.nom ?? "notre restaurant";

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-[#E6DAC3] bg-creme-0 p-4">
      <div className="flex flex-wrap items-start gap-4">
        <div className="w-24 shrink-0">
          <p className="font-titre text-2xl font-bold text-palmier-950">{formatHeure(reservation.date_heure)}</p>
          <p className="flex items-center gap-1 text-sm font-semibold text-sable-600">
            <Users aria-hidden="true" className="h-4 w-4" />
            {reservation.nb_personnes} pers.
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold">{reservation.nom}</p>
          <p className="text-sm text-sable-600">
            {reservation.numero} · {reservation.telephone}
            {avecDate && ` · ${formatDateHeure(reservation.date_heure)}`}
          </p>
          {reservation.note && (
            <p className="mt-2 flex gap-2 rounded-xl bg-or-100 p-2 text-sm">
              <StickyNote aria-hidden="true" className="h-4 w-4 shrink-0 text-argile-800" />
              {reservation.note}
            </p>
          )}
          {reservation.commentaire_restaurant && (
            <p className="mt-2 text-sm text-sable-600">Réponse : {reservation.commentaire_restaurant}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <BadgeStatut statut={reservation.statut} libelle={reservation.statut_libelle} />
          <a href={`tel:+237${reservation.telephone}`} aria-label={`Appeler ${reservation.nom}`} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-palmier-950 text-creme-50">
            <Phone aria-hidden="true" className="h-5 w-5" />
          </a>
          <a
            href={lienWhatsApp(reservation.telephone, messagePour(reservation, nomRestaurant))}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Écrire à ${reservation.nom} sur WhatsApp`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-whatsapp text-white"
          >
            <MessageCircle aria-hidden="true" className="h-5 w-5" />
          </a>
        </div>
      </div>

      {actions.length > 0 && !actionOuverte && (
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              key={action.vers}
              type="button"
              disabled={changement.isPending}
              onClick={() => lancer(action)}
              className={
                action.danger
                  ? "h-11 rounded-full border-[1.5px] border-argile-600 px-5 font-bold text-argile-800 hover:bg-argile-600 hover:text-creme-50 disabled:opacity-50"
                  : "h-11 rounded-full bg-or-500 px-5 font-bold text-palmier-950 hover:bg-or-300 disabled:opacity-50"
              }
            >
              {changement.isPending && changement.variables?.statut === action.vers ? "Enregistrement…" : action.libelle}
            </button>
          ))}
        </div>
      )}

      {actionOuverte && (
        <form onSubmit={confirmer} className="flex flex-wrap items-end gap-2 rounded-2xl border-2 border-or-500 bg-or-100/50 p-3">
          <div className="flex min-w-60 flex-1 flex-col gap-1.5">
            <label htmlFor={`motif-${reservation.numero}`} className="text-sm font-semibold">
              {actionOuverte.libelle} : un mot pour le client (facultatif)
            </label>
            <input
              id={`motif-${reservation.numero}`}
              className={CHAMP}
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              maxLength={255}
              placeholder="Ex. : complet ce soir, proposez-nous un autre horaire"
              autoFocus
            />
          </div>
          <button type="submit" disabled={changement.isPending} className="h-11 rounded-full bg-argile-600 px-5 font-bold text-creme-50 hover:bg-argile-800 disabled:opacity-50">
            Confirmer
          </button>
          <button type="button" onClick={() => setActionOuverte(null)} className="h-11 px-3 font-bold text-palmier-800 underline underline-offset-4">
            Retour
          </button>
        </form>
      )}

      {reservation.statut === "confirmee" && !actionOuverte && (
        <p className="text-sm text-sable-600">Pensez à prévenir le client : le bouton WhatsApp prépare le message de confirmation.</p>
      )}

      {erreur && (
        <p role="alert" className="rounded-xl bg-or-100 p-2 text-sm font-semibold text-argile-800">{erreur}</p>
      )}
    </li>
  );
}

export default function Reservations() {
  const [params, setParams] = useSearchParams();
  const vue = params.get("vue") === "jour" ? "jour" : "a_confirmer";
  const date = params.get("date") ?? jourRestaurant();
  const { data: restaurant } = useRestaurant();

  const aConfirmer = useQuery({
    queryKey: ["admin", "reservations", "a-confirmer"],
    queryFn: getReservationsAConfirmer,
    refetchInterval: 60_000,
  });
  const duJour = useQuery({
    queryKey: ["admin", "reservations", date],
    queryFn: () => getReservations(date),
    enabled: vue === "jour",
    refetchInterval: 60_000,
  });

  const requete = vue === "jour" ? duJour : aConfirmer;
  const liste = [...(requete.data ?? [])].sort(
    (a, b) => new Date(a.date_heure).getTime() - new Date(b.date_heure).getTime(),
  );
  const enAttente = (aConfirmer.data ?? []).length;
  const couverts = liste
    .filter((r) => ["confirmee", "honoree"].includes(r.statut))
    .reduce((somme, r) => somme + r.nb_personnes, 0);

  function changer(suivants: Record<string, string>) {
    setParams({ vue, date, ...suivants });
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-titre text-4xl text-palmier-950">Réservations</h1>
        <p className="mt-1 text-sable-600">Confirmez les demandes, puis notez qui est venu.</p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Vue des réservations" className="flex gap-2">
          <button
            type="button"
            role="tab"
            aria-selected={vue === "a_confirmer"}
            onClick={() => changer({ vue: "a_confirmer" })}
            className={`inline-flex h-11 items-center gap-2 rounded-full px-4 font-semibold ${vue === "a_confirmer" ? "bg-palmier-950 text-creme-50" : "border border-sable-300 bg-creme-0"}`}
          >
            À confirmer
            <span className={`rounded-full px-2 text-xs font-bold ${vue === "a_confirmer" ? "bg-or-500 text-palmier-950" : "bg-or-100"}`}>{enAttente}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={vue === "jour"}
            onClick={() => changer({ vue: "jour" })}
            className={`inline-flex h-11 items-center rounded-full px-4 font-semibold ${vue === "jour" ? "bg-palmier-950 text-creme-50" : "border border-sable-300 bg-creme-0"}`}
          >
            Planning d'un jour
          </button>
        </div>

        {vue === "jour" && (
          <div className="flex items-center gap-2">
            <label htmlFor="date-planning" className="text-sm font-semibold">Jour</label>
            <input
              id="date-planning"
              type="date"
              value={date}
              onChange={(e) => e.target.value && changer({ date: e.target.value })}
              className="h-11 rounded-xl border-[1.5px] border-sable-300 bg-white px-3"
            />
          </div>
        )}
      </div>

      {vue === "jour" && restaurant && (
        <p className="rounded-2xl bg-palmier-950 p-4 font-semibold text-creme-50">
          {couverts} couvert(s) confirmé(s) ce jour-là · salle de {restaurant.capacite_salle} places
        </p>
      )}

      {requete.isPending && <p className="text-sable-600">Chargement des réservations…</p>}
      {requete.isError && (
        <p role="alert" className="rounded-2xl bg-or-100 p-4 font-semibold text-argile-800">Impossible de charger les réservations.</p>
      )}
      {requete.isSuccess && liste.length === 0 && (
        <p className="rounded-3xl border border-dashed border-sable-300 p-10 text-center text-sable-600">
          {vue === "jour" ? "Aucune réservation ce jour-là." : "Aucune demande en attente. Tout est à jour."}
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {liste.map((r) => (
          <CarteReservation key={`${r.numero}-${r.statut}`} reservation={r} avecDate={vue === "a_confirmer"} />
        ))}
      </ul>
    </div>
  );
}