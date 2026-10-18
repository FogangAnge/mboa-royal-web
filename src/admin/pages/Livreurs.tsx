import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HandCoins, MessageCircle, Phone } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";

import { enregistrerVersement, getCaisse, getVersements } from "../../api/admin";
import { API_URL } from "../../api/client";
import { useRestaurant } from "../../hooks/useRestaurant";
import { messagesErreur } from "../../lib/erreurs";
import { formatHeure, formatPrix } from "../../lib/format";
import { lienWhatsApp } from "../../lib/whatsapp";
import type { BilanLivreur } from "../../types/livraison";
import { jourRestaurant } from "../outils";

const ADMIN_DJANGO = API_URL.replace(/\/api\/?$/, "/admin/");
const CARTE = "rounded-3xl border border-[#E6DAC3] bg-creme-0 p-5";

function LigneLivreur({ bilan, jour, devise }: { bilan: BilanLivreur; jour: string; devise?: string }) {
  const queryClient = useQueryClient();
  const [ouvert, setOuvert] = useState(false);
  const [montant, setMontant] = useState(String(bilan.reste_a_verser));
  const [note, setNote] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  const versement = useMutation({
    mutationFn: enregistrerVersement,
    onSuccess: () => {
      setOuvert(false);
      setNote("");
      setErreur(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "caisse"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "versements"] });
    },
    onError: (probleme) => setErreur(messagesErreur(probleme)[0]),
  });

  function envoyer(evenement: FormEvent) {
    evenement.preventDefault();
    const valeur = Number(montant);
    if (!valeur || valeur < 1) {
      setErreur("Indiquez le montant reçu.");
      return;
    }
    if (valeur > bilan.reste_a_verser) {
      setErreur(`Ce livreur ne doit que ${formatPrix(bilan.reste_a_verser, devise)} pour ce jour.`);
      return;
    }
    versement.mutate({ livreur: bilan.livreur, montant: valeur, jour, note: note.trim() });
  }

  const solde = bilan.reste_a_verser === 0;

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-[#E6DAC3] bg-creme-0 p-4">
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-palmier-800 font-titre text-lg font-bold text-or-300">
          {bilan.nom.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-36 flex-1">
          <p className="font-bold">{bilan.nom}</p>
          <p className="flex items-center gap-2 text-sm text-sable-600">
            <span className={`inline-block h-2 w-2 rounded-full ${bilan.disponible ? "bg-palmier-600" : "bg-sable-300"}`} aria-hidden="true" />
            {bilan.disponible ? "Disponible" : "Indisponible"} · {bilan.nb_courses} course(s)
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-sable-600">Encaissé</dt>
            <dd className="font-bold">{formatPrix(bilan.encaisse, devise)}</dd>
          </div>
          <div>
            <dt className="text-sable-600">Versé</dt>
            <dd className="font-bold">{formatPrix(bilan.verse, devise)}</dd>
          </div>
          <div>
            <dt className="text-sable-600">Reste</dt>
            <dd className={`font-bold ${solde ? "text-palmier-600" : "text-argile-800"}`}>{formatPrix(bilan.reste_a_verser, devise)}</dd>
          </div>
        </dl>

        <div className="flex items-center gap-2">
          <a href={`tel:+237${bilan.telephone}`} aria-label={`Appeler ${bilan.nom}`} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-palmier-950 text-creme-50">
            <Phone aria-hidden="true" className="h-5 w-5" />
          </a>
          <a href={lienWhatsApp(bilan.telephone)} target="_blank" rel="noopener noreferrer" aria-label={`Écrire à ${bilan.nom} sur WhatsApp`} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-whatsapp text-white">
            <MessageCircle aria-hidden="true" className="h-5 w-5" />
          </a>
          {!solde && !ouvert && (
            <button type="button" onClick={() => setOuvert(true)} className="inline-flex h-11 items-center gap-2 rounded-full bg-or-500 px-4 font-bold text-palmier-950 hover:bg-or-300">
              <HandCoins aria-hidden="true" className="h-4 w-4" />
              Recevoir
            </button>
          )}
          {solde && bilan.encaisse > 0 && <span className="rounded-lg bg-[#DCEFE2] px-3 py-1 text-sm font-bold text-[#17462B]">Caisse soldée</span>}
        </div>
      </div>

      {ouvert && (
        <form onSubmit={envoyer} className="flex flex-wrap items-end gap-2 rounded-2xl border-2 border-or-500 bg-or-100/50 p-3">
          <div className="flex w-40 flex-col gap-1.5">
            <label htmlFor={`montant-${bilan.livreur}`} className="text-sm font-semibold">Montant reçu</label>
            <input
              id={`montant-${bilan.livreur}`}
              inputMode="numeric"
              value={montant}
              onChange={(e) => setMontant(e.target.value.replace(/\D/g, ""))}
              className="h-11 w-full rounded-xl border-[1.5px] border-sable-300 bg-white px-3"
              autoFocus
            />
          </div>
          <div className="flex min-w-48 flex-1 flex-col gap-1.5">
            <label htmlFor={`note-${bilan.livreur}`} className="text-sm font-semibold">Note (facultatif)</label>
            <input
              id={`note-${bilan.livreur}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={255}
              placeholder="Ex. : reçu en Mobile Money"
              className="h-11 w-full rounded-xl border-[1.5px] border-sable-300 bg-white px-3"
            />
          </div>
          <button type="submit" disabled={versement.isPending} className="h-11 rounded-full bg-palmier-950 px-5 font-bold text-creme-50 hover:bg-palmier-800 disabled:opacity-50">
            {versement.isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
          <button type="button" onClick={() => { setOuvert(false); setErreur(null); }} className="h-11 px-3 font-bold text-palmier-800 underline underline-offset-4">
            Annuler
          </button>
        </form>
      )}

      {erreur && <p role="alert" className="rounded-xl bg-or-100 p-2 text-sm font-semibold text-argile-800">{erreur}</p>}
    </li>
  );
}

export default function Livreurs() {
  const [params, setParams] = useSearchParams();
  const jour = params.get("date") ?? jourRestaurant();
  const { data: restaurant } = useRestaurant();
  const devise = restaurant?.devise;

  const caisse = useQuery({
    queryKey: ["admin", "caisse", jour],
    queryFn: () => getCaisse(jour),
    refetchInterval: 60_000,
  });
  const versements = useQuery({
    queryKey: ["admin", "versements", jour],
    queryFn: () => getVersements(jour),
  });

  const bilans = caisse.data?.livreurs ?? [];
  const totalCourses = bilans.reduce((somme, b) => somme + b.nb_courses, 0);
  const disponibles = bilans.filter((b) => b.disponible).length;
  const indicateurs = [
    { libelle: "Livreurs disponibles", valeur: `${disponibles} / ${bilans.length}` },
    { libelle: "Courses livrées", valeur: String(totalCourses) },
    { libelle: "Encaissé par les livreurs", valeur: formatPrix(caisse.data?.total_encaisse ?? 0, devise) },
    { libelle: "Reste à récupérer", valeur: formatPrix(caisse.data?.total_reste_a_verser ?? 0, devise) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-titre text-4xl text-palmier-950">Livreurs & caisse</h1>
          <p className="mt-1 text-sable-600">L'argent encaissé à la livraison, et ce que chaque livreur a déjà reversé.</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="jour-caisse" className="text-sm font-semibold">Jour</label>
          <input
            id="jour-caisse"
            type="date"
            value={jour}
            max={jourRestaurant()}
            onChange={(e) => e.target.value && setParams({ date: e.target.value })}
            className="h-11 rounded-xl border-[1.5px] border-sable-300 bg-white px-3"
          />
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {indicateurs.map((indicateur) => (
          <div key={indicateur.libelle} className={CARTE}>
            <p className="text-sm text-sable-600">{indicateur.libelle}</p>
            <p className="mt-1 text-2xl font-bold text-palmier-950">{caisse.isPending ? "…" : indicateur.valeur}</p>
          </div>
        ))}
      </div>

      {caisse.isError && (
        <p role="alert" className="rounded-2xl bg-or-100 p-4 font-semibold text-argile-800">{messagesErreur(caisse.error)[0]}</p>
      )}
      {caisse.isSuccess && bilans.length === 0 && (
        <p className="rounded-3xl border border-dashed border-sable-300 p-8 text-center text-sable-600">
          Aucun livreur actif.{" "}
          <a href={ADMIN_DJANGO} target="_blank" rel="noopener noreferrer" className="font-bold text-palmier-800 underline">
            Créez un compte avec le rôle Livreur dans l'admin Django
          </a>
          .
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {bilans.map((bilan) => (
          <LigneLivreur key={`${bilan.livreur}-${jour}-${bilan.reste_a_verser}`} bilan={bilan} jour={jour} devise={devise} />
        ))}
      </ul>

      <section aria-labelledby="titre-versements" className={CARTE}>
        <h2 id="titre-versements" className="mb-3 text-xl font-bold text-palmier-950">Versements reçus ce jour-là</h2>
        {versements.data?.length === 0 && <p className="text-sable-600">Aucun versement enregistré.</p>}
        <ul className="flex flex-col divide-y divide-[#EFE6D4]">
          {versements.data?.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <span>
                <strong>{formatHeure(v.date_creation)}</strong> · {v.livreur_nom}
                {v.note && <span className="text-sable-600"> · {v.note}</span>}
                {v.recu_par_nom && <span className="block text-sm text-sable-600">Reçu par {v.recu_par_nom}</span>}
              </span>
              <span className="font-bold">{formatPrix(v.montant, devise)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}