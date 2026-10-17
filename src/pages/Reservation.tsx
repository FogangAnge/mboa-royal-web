import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarCheck, Check, MessageCircle } from "lucide-react";
import { useState, type FormEvent } from "react";

import { demanderReservation, verifierDisponibilite } from "../api/reservations";
import Quantite from "../components/Quantite";
import { useRestaurant } from "../hooks/useRestaurant";
import { messagesErreur } from "../lib/erreurs";
import { DECALAGE_RESTAURANT, formatDateHeure } from "../lib/format";
import { lienWhatsApp } from "../lib/whatsapp";
import type { ReservationCreee } from "../types/reservation";
import type { HoraireOuverture } from "../types/restaurant";

const CHAMP = "h-12 w-full rounded-xl border-[1.5px] border-sable-300 bg-white px-3 text-base";
const ETIQUETTE = "text-sm font-semibold";
const MAX_PERSONNES = 20;
const JOURS_MAX = 60;

const deux = (n: number) => String(n).padStart(2, "0");

/** Date → « 2026-10-18 », le format de <input type="date">. */
function versChampDate(date: Date): string {
  return `${date.getFullYear()}-${deux(date.getMonth() + 1)}-${deux(date.getDate())}`;
}

/** « 2026-10-18 » → le jour au format de l'API (0 = lundi). */
function jourDe(date: string): number {
  const [annee, mois, jour] = date.split("-").map(Number);
  return (new Date(Date.UTC(annee, mois - 1, jour)).getUTCDay() + 6) % 7;
}

function enMinutes(heure: string): number {
  const [h, m] = heure.split(":").map(Number);
  return h * 60 + m;
}

/** Les créneaux de 30 minutes d'un jour, jusqu'à une heure avant la fermeture. */
function creneauxDu(date: string, horaire: HoraireOuverture | undefined): string[] {
  if (!date || !horaire || horaire.ferme || !horaire.ouverture || !horaire.fermeture) return [];
  const debut = enMinutes(horaire.ouverture);
  let fin = enMinutes(horaire.fermeture);
  if (fin <= debut) fin = 24 * 60;

  const auPlusTot = Date.now() + 60 * 60_000;
  const creneaux: string[] = [];
  for (let minutes = debut; minutes <= fin - 60; minutes += 30) {
    const valeur = `${deux(Math.floor(minutes / 60))}:${deux(minutes % 60)}`;
    const moment = new Date(`${date}T${valeur}:00${DECALAGE_RESTAURANT}`).getTime();
    if (moment >= auPlusTot) creneaux.push(valeur);
  }
  return creneaux;
}

export default function Reservation() {
  const { data: restaurant } = useRestaurant();
  const [date, setDate] = useState("");
  const [heure, setHeure] = useState("");
  const [personnes, setPersonnes] = useState(2);
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [note, setNote] = useState("");
  const [erreurs, setErreurs] = useState<string[]>([]);
  const [confirmee, setConfirmee] = useState<ReservationCreee | null>(null);

  const aujourdhui = new Date();
  const dateMin = versChampDate(aujourdhui);
  const dateMax = versChampDate(new Date(aujourdhui.getTime() + JOURS_MAX * 24 * 60 * 60_000));
  const horaire = date ? restaurant?.horaires.find((h) => h.jour === jourDe(date)) : undefined;
  const creneaux = creneauxDu(date, horaire);
  const maxPersonnes = Math.min(restaurant?.capacite_salle ?? MAX_PERSONNES, MAX_PERSONNES);

  const dateHeure = date && heure ? `${date}T${heure}:00${DECALAGE_RESTAURANT}` : null;
  const disponibilite = useQuery({
    queryKey: ["disponibilite", dateHeure, personnes],
    queryFn: () => verifierDisponibilite(dateHeure as string, personnes),
    enabled: dateHeure !== null,
    staleTime: 0,
  });
  const complet = disponibilite.data !== undefined && !disponibilite.data.disponible;

  const reservation = useMutation({
    mutationFn: demanderReservation,
    onSuccess: (creee) => setConfirmee(creee),
    onError: (erreur) => setErreurs(messagesErreur(erreur)),
  });

  function envoyer(evenement: FormEvent) {
    evenement.preventDefault();
    const problemes: string[] = [];
    if (!dateHeure) problemes.push("Choisissez une date et une heure.");
    if (!nom.trim()) problemes.push("Indiquez votre nom.");
    if (!telephone.trim()) problemes.push("Indiquez votre numéro de téléphone.");
    if (problemes.length > 0 || !dateHeure) {
      setErreurs(problemes);
      return;
    }
    setErreurs([]);
    reservation.mutate({
      nom: nom.trim(),
      telephone: telephone.trim(),
      date_heure: dateHeure,
      nb_personnes: personnes,
      note: note.trim(),
    });
  }

  function recommencer() {
    setConfirmee(null);
    setHeure("");
    setNote("");
    reservation.reset();
  }

  if (confirmee) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-16 text-center">
        <CalendarCheck aria-hidden="true" className="h-16 w-16 text-palmier-600" />
        <div>
          <h1 className="font-titre text-4xl text-palmier-950">Demande enregistrée</h1>
          <p className="mt-2 text-lg">
            N° <strong>{confirmee.numero}</strong> · {formatDateHeure(confirmee.date_heure)} ·{" "}
            {confirmee.nb_personnes} personne(s)
          </p>
        </div>
        <div className="w-full rounded-3xl bg-palmier-950 p-6 text-creme-50">
          <p className="font-bold text-or-300">Dernière étape</p>
          <p className="mt-1">Envoyez votre demande sur WhatsApp : nous vous confirmons la table très vite.</p>
          <a
            href={confirmee.lien_whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex h-14 items-center justify-center gap-3 rounded-full bg-whatsapp text-lg font-bold text-white"
          >
            <MessageCircle aria-hidden="true" className="h-6 w-6" />
            Envoyer sur WhatsApp
          </a>
        </div>
        <button type="button" onClick={recommencer} className="font-bold text-palmier-800 underline underline-offset-4">
          Faire une autre réservation
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-argile-600">Réservation</p>
      <h1 className="font-titre text-5xl text-palmier-950">Une table vous attend</h1>
      <p className="mt-3 text-lg text-sable-600">
        Choisissez votre créneau : nous confirmons votre table par WhatsApp selon les places disponibles.
      </p>

      <form onSubmit={envoyer} noValidate className="mt-8 grid gap-5 rounded-3xl border border-sable-300 bg-creme-0 p-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="date" className={ETIQUETTE}>Date</label>
          <input
            id="date"
            type="date"
            className={CHAMP}
            value={date}
            min={dateMin}
            max={dateMax}
            onChange={(e) => {
              setDate(e.target.value);
              setHeure("");
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="heure" className={ETIQUETTE}>Heure</label>
          <select id="heure" className={CHAMP} value={heure} disabled={creneaux.length === 0} onChange={(e) => setHeure(e.target.value)}>
            <option value="">{date ? (creneaux.length ? "Choisir…" : "Aucun créneau ce jour-là") : "Choisissez d'abord la date"}</option>
            {creneaux.map((c) => (
              <option key={c} value={c}>{c.replace(":", " h ")}</option>
            ))}
          </select>
          {date && horaire?.ferme && <p className="text-sm font-semibold text-argile-800">Le restaurant est fermé ce jour-là.</p>}
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <span className={ETIQUETTE}>Nombre de personnes</span>
          <Quantite valeur={personnes} onChange={setPersonnes} libelle="Nombre de personnes" max={maxPersonnes} />
          {restaurant && (
            <p className="text-sm text-sable-600">
              Plus de {maxPersonnes} personnes ?{" "}
              <a href={lienWhatsApp(restaurant.whatsapp, "Bonjour, je souhaite réserver pour un groupe.")} target="_blank" rel="noopener noreferrer" className="font-semibold text-palmier-800 underline">
                Écrivez-nous sur WhatsApp
              </a>
              .
            </p>
          )}
        </div>

        <div className="sm:col-span-2" aria-live="polite">
          {dateHeure && disponibilite.isFetching && <p className="text-sable-600">Vérification des places…</p>}
          {dateHeure && !disponibilite.isFetching && disponibilite.data && (
            disponibilite.data.disponible ? (
              <p className="flex items-center gap-2 font-semibold text-palmier-600">
                <Check aria-hidden="true" className="h-5 w-5" />
                Places disponibles à cette heure.
              </p>
            ) : (
              <p className="font-semibold text-argile-800">
                {disponibilite.data.ouvert
                  ? `Plus assez de places à cette heure (${disponibilite.data.places_restantes} restante(s)). Essayez un autre créneau.`
                  : "Le restaurant est fermé à cette heure-là."}
              </p>
            )
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="nom-resa" className={ETIQUETTE}>Nom</label>
          <input id="nom-resa" className={CHAMP} value={nom} onChange={(e) => setNom(e.target.value)} autoComplete="name" maxLength={150} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="tel-resa" className={ETIQUETTE}>Téléphone (WhatsApp)</label>
          <input id="tel-resa" type="tel" inputMode="tel" className={CHAMP} value={telephone} onChange={(e) => setTelephone(e.target.value)} autoComplete="tel" placeholder="6XX XX XX XX" />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="note-resa" className={ETIQUETTE}>Une occasion particulière ? (facultatif)</label>
          <textarea id="note-resa" rows={2} className="w-full rounded-xl border-[1.5px] border-sable-300 bg-white p-3" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Anniversaire, chaise bébé, table au calme…" />
        </div>

        {erreurs.length > 0 && (
          <div role="alert" className="rounded-2xl bg-or-100 p-4 text-argile-800 sm:col-span-2">
            <ul className="flex flex-col gap-1 font-semibold">
              {erreurs.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="submit"
          disabled={reservation.isPending || complet}
          className="h-14 rounded-full bg-or-500 text-lg font-bold text-palmier-950 transition-colors hover:bg-or-300 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
        >
          {reservation.isPending ? "Envoi en cours…" : "Demander la réservation"}
        </button>
      </form>
    </div>
  );
}