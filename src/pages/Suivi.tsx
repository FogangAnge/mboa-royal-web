import { useQuery } from "@tanstack/react-query";
import { Check, Lock, MessageCircle, Phone, Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";

import { suivreCommande } from "../api/commandes";
import { useRestaurant } from "../hooks/useRestaurant";
import { messagesErreur } from "../lib/erreurs";
import { formatDateHeure, formatHeure, formatPrix } from "../lib/format";
import { lireCommandes, trouverCommande } from "../lib/mesCommandes";
import { lienWhatsApp } from "../lib/whatsapp";
import type { SuiviCommande } from "../types/commande";

const CHAMP = "h-12 w-full rounded-xl border-[1.5px] border-sable-300 bg-white px-3 text-base";
const STATUTS_FINAUX = ["livree", "annulee"];

function etapesDe(commande: SuiviCommande) {
  const emporter = commande.mode === "emporter";
  const etapes = [
    { statut: "en_attente", libelle: "Commande reçue" },
    { statut: "confirmee", libelle: "Confirmée par le restaurant" },
    { statut: "en_preparation", libelle: "En préparation" },
    { statut: "prete", libelle: emporter ? "Prête à récupérer" : "Prête" },
  ];
  if (!emporter) etapes.push({ statut: "en_livraison", libelle: "En route" });
  etapes.push({ statut: "livree", libelle: emporter ? "Récupérée" : "Livrée" });
  return etapes;
}

function Chronologie({ commande }: { commande: SuiviCommande }) {
  const etapes = etapesDe(commande);
  const position = etapes.findIndex((e) => e.statut === commande.statut);

  return (
    <ol aria-label="Étapes de la commande" className="flex flex-col">
      {etapes.map((etape, index) => {
        const passage = commande.historique.find((h) => h.statut === etape.statut);
        const faite = index < position || (index === position && commande.statut === "livree");
        const enCours = index === position && !faite;
        const derniere = index === etapes.length - 1;

        let pastille = "border-2 border-sable-300 bg-creme-0";
        if (faite) pastille = "bg-palmier-800";
        if (enCours) pastille = "border-[6px] border-or-100 bg-or-500";

        return (
          <li key={etape.statut} className="flex gap-4" aria-current={enCours ? "step" : undefined}>
            <div className="flex flex-col items-center">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full ${pastille}`}>
                {faite && <Check aria-hidden="true" className="h-4 w-4 text-creme-50" />}
              </span>
              {!derniere && <span className={`min-h-6 w-0.5 flex-1 ${faite ? "bg-palmier-800" : "bg-sable-300"}`} />}
            </div>
            <div className="pb-5">
              <p className={faite || enCours ? "font-bold text-palmier-950" : "font-semibold text-sable-600"}>
                {etape.libelle}
              </p>
              {passage && <p className="text-sm text-sable-600">{formatHeure(passage.date)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function Suivi() {
  const [params, setParams] = useSearchParams();
  const numero = params.get("numero") ?? "";
  const telephone = params.get("telephone") ?? "";
  const { data: restaurant } = useRestaurant();

  const [saisieNumero, setSaisieNumero] = useState(numero);
  const [saisieTelephone, setSaisieTelephone] = useState(telephone);
  const recentes = lireCommandes().slice(0, 5);

  const suivi = useQuery({
    queryKey: ["suivi", numero, telephone],
    queryFn: () => suivreCommande(numero, telephone),
    enabled: Boolean(numero && telephone),
    retry: false,
    staleTime: 0,
    refetchInterval: (query) => {
      const statut = query.state.data?.statut;
      return statut && STATUTS_FINAUX.includes(statut) ? false : 60_000;
    },
  });

  function rechercher(evenement: FormEvent) {
    evenement.preventDefault();
    setParams({ numero: saisieNumero.trim().toUpperCase(), telephone: saisieTelephone.trim() });
  }

  function ouvrir(n: string, t: string) {
    setSaisieNumero(n);
    setSaisieTelephone(t);
    setParams({ numero: n, telephone: t });
  }

  const commande = suivi.data;
  const code = commande ? trouverCommande(commande.numero)?.code : undefined;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-titre text-5xl text-palmier-950">Suivre ma commande</h1>

      <form onSubmit={rechercher} className="mt-6 grid gap-3 rounded-3xl border border-sable-300 bg-creme-0 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="numero" className="text-sm font-semibold">Numéro de commande</label>
          <input id="numero" className={CHAMP} value={saisieNumero} onChange={(e) => setSaisieNumero(e.target.value)} placeholder="MR-0012" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="telephone-suivi" className="text-sm font-semibold">Téléphone utilisé</label>
          <input id="telephone-suivi" type="tel" inputMode="tel" className={CHAMP} value={saisieTelephone} onChange={(e) => setSaisieTelephone(e.target.value)} placeholder="6XX XX XX XX" required />
        </div>
        <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-palmier-950 px-6 font-bold text-creme-50">
          <Search aria-hidden="true" className="h-4 w-4" />
          Suivre
        </button>
      </form>

      {recentes.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-sable-600">Mes commandes récentes :</span>
          {recentes.map((c) => (
            <button
              key={c.numero}
              type="button"
              onClick={() => ouvrir(c.numero, c.telephone)}
              className="inline-flex h-10 items-center rounded-full border border-sable-300 bg-creme-0 px-4 text-sm font-semibold hover:border-palmier-950"
            >
              {c.numero}
            </button>
          ))}
        </div>
      )}

      {suivi.isFetching && !commande && <p className="mt-8 text-sable-600">Recherche de la commande…</p>}

      {suivi.isError && (
        <p role="alert" className="mt-8 rounded-2xl bg-or-100 p-4 font-semibold text-argile-800">
          {messagesErreur(suivi.error)[0]}
        </p>
      )}

      {commande && (
        <section aria-label={`Commande ${commande.numero}`} className="mt-8 overflow-hidden rounded-3xl border border-sable-300 bg-creme-0">
          <div className="bg-palmier-950 p-6 text-creme-50">
            <p className="text-sm text-creme-50/70">Commande {commande.numero}</p>
            <p className="font-titre text-3xl font-bold text-or-300">{commande.statut_libelle}</p>
            {commande.heure_souhaitee && (
              <p className="mt-1 text-creme-50/80">Prévue pour {formatDateHeure(commande.heure_souhaitee)}</p>
            )}
          </div>

          <div className="flex flex-col gap-6 p-6">
            {commande.statut === "annulee" ? (
              <p className="rounded-2xl bg-or-100 p-4 font-semibold text-argile-800">
                Cette commande a été annulée. Contactez-nous sur WhatsApp pour toute question.
              </p>
            ) : (
              <Chronologie commande={commande} />
            )}

            {commande.livreur && (
              <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-sable-300 p-4">
                <div className="flex-1">
                  <p className="font-bold">{commande.livreur.nom || "Votre livreur"}</p>
                  <p className="text-sm text-sable-600">est en route vers vous</p>
                </div>
                <a href={`tel:+237${commande.livreur.telephone}`} aria-label="Appeler le livreur" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-palmier-950 text-creme-50">
                  <Phone aria-hidden="true" className="h-5 w-5" />
                </a>
                <a href={lienWhatsApp(commande.livreur.telephone)} target="_blank" rel="noopener noreferrer" aria-label="Écrire au livreur sur WhatsApp" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-whatsapp text-white">
                  <MessageCircle aria-hidden="true" className="h-5 w-5" />
                </a>
              </div>
            )}

            {code && !STATUTS_FINAUX.includes(commande.statut) && (
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-or-100 p-4">
                <p className="flex items-center gap-2 font-bold">
                  <Lock aria-hidden="true" className="h-5 w-5 text-palmier-800" />
                  Code de livraison
                </p>
                <span className="font-titre text-3xl font-bold tracking-[0.3em] text-palmier-950">{code}</span>
              </div>
            )}

            <div className="border-t border-dashed border-sable-300 pt-4">
              <ul className="flex flex-col gap-1">
                {commande.lignes.map((ligne, index) => (
                  <li key={index} className="flex justify-between gap-4">
                    <span>
                      {ligne.quantite} × {ligne.nom_plat}
                      {ligne.options.length > 0 && (
                        <span className="text-sable-600"> ({ligne.options.map((o) => o.option).join(", ")})</span>
                      )}
                    </span>
                    <span>{formatPrix(ligne.sous_total, restaurant?.devise)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatPrix(commande.total, restaurant?.devise)}</span>
              </p>
            </div>

            {!STATUTS_FINAUX.includes(commande.statut) && (
              <p className="text-sm text-sable-600">
                Cette page se met à jour toute seule chaque minute
                {suivi.dataUpdatedAt > 0 && ` · dernière mise à jour à ${formatHeure(new Date(suivi.dataUpdatedAt).toISOString())}`}.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}