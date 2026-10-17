import type { Disponibilite, ReservationCreee, ReservationEntree } from "../types/reservation";
import { api } from "./client";

export async function verifierDisponibilite(dateHeure: string, nbPersonnes: number): Promise<Disponibilite> {
  const { data } = await api.get<Disponibilite>("/reservations/disponibilite/", {
    params: { date_heure: dateHeure, nb_personnes: nbPersonnes },
  });
  return data;
}

export async function demanderReservation(reservation: ReservationEntree): Promise<ReservationCreee> {
  const { data } = await api.post<ReservationCreee>("/reservations/", reservation);
  return data;
}