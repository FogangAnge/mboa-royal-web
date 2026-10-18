import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bike, Clock, MapPin, MessageCircle, Phone, StickyNote, X } from "lucide-react";
import { useState, type FormEvent } from "react";

import { assignerLivreur, changerStatut, enregistrerPaiement, getCaisse, type ChangementStatut, type ModePaiement } from "../api/admin";
import { messagesErreur } from "../lib/erreurs";
import { formatDateHeure, formatHeure, formatPrix } from "../lib/format";
import { lienWhatsApp } from "../lib/whatsapp";
import type { Commande } from "../types/commande";
import BadgeStatut from "./BadgeStatut";
import { actionsPour, LIBELLES_PAIEMENT, STATUTS_ASSIGNABLES, type ActionStatut } from "./outils";

const CHAMP = "h-11 w-full rounded-xl border-[1.5px] border-sable-300 bg-white px-3";
const TITRE_BLOC = "mb-2 text-sm font-bold uppercase tracking-wider text-sable-600";

interface Props {
  commande: Commande;
  devise?: string;
  onFermer: () => void;
}

export default function DetailCommande({ commande, devise, onFermer }: Props) {
  const queryClient = useQueryClient();
  const [erreur, setErreur] = useState<string | null>(null);

  // L'action qui attend une précision (code, motif) avant d'être envoyée.
  const [actionOuverte, setActionOuverte] = useState<ActionStatut | null>(null);
  const [code, setCode] = useState("");
  const [motif, setMotif] = useState("");
  const [montant, setMontant] = useState(commande.est_payee ? "" : String(commande.total));
  const [modeEncaissement, setModeEncaissement] = useState<"especes" | "mobile_money">("especes");

  const [livreurChoisi, setLivreurChoisi] = useState("");
  const [modePaiement, setModePaiement] = useState<ModePaiement>(commande.mode_paiement as ModePaiement);
  const [payee, setPayee] = useState(commande.est_payee);

  const peutAssigner = commande.mode === "livraison" && STATUTS_ASSIGNABLES.includes(commande.statut);
  const livreurs = useQuery({
    queryKey: ["admin", "caisse", "aujourdhui"],
    queryFn: () => getCaisse(),
    enabled: peutAssigner,
    staleTime: 30_000,
  });

  /** Remplace la commande dans la liste déjà chargée : l'écran se met à jour sans attendre. */
  function mettreAJour(maj: Commande) {
    queryClient.setQueryData<Commande[]>(["admin", "commandes"], (liste) =>
      liste?.map((c) => (c.numero === maj.numero ? maj : c)),
    );
    setErreur(null);
  }

  function siErreur(probleme: unknown) {
    setErreur(messagesErreur(probleme)[0]);
  }

  const statut = useMutation({
    mutationFn: (changement: ChangementStatut) => changerStatut(commande.numero, changement),
    onSuccess: (maj) => {
      mettreAJour(maj);
      setActionOuverte(null);
      setCode("");
      setMotif("");
      if (maj.statut === "livree") queryClient.invalidateQueries({ queryKey: ["admin", "caisse"] });
    },
    onError: siErreur,
  });

  const assignation = useMutation({
    mutationFn: (livreur: number) => assignerLivreur(commande.numero, livreur),
    onSuccess: (maj) => {
      mettreAJour(maj);
      setLivreurChoisi("");
    },
    onError: siErreur,
  });

  const paiement = useMutation({
    mutationFn: () => enregistrerPaiement(commande.numero, { mode_paiement: modePaiement, est_payee: payee }),
    onSuccess: mettreAJour,
    onError: siErreur,
  });

  const occupe = statut.isPending || assignation.isPending || paiement.isPending;
  const paiementModifie = modePaiement !== commande.mode_paiement || payee !== commande.est_payee;

  function lancer(action: ActionStatut) {
    setErreur(null);
    if (action.demandeCode || action.danger) {
      setActionOuverte(action);
      return;
    }
    statut.mutate({ statut: action.vers });
  }

  function confirmerAction(evenement: FormEvent) {
    evenement.preventDefault();
    if (!actionOuverte) return;
    if (actionOuverte.danger && !motif.trim()) {
      setErreur("Indiquez le motif de l'annulation : le client le verra dans l'historique.");
      return;
    }
    const changement: ChangementStatut = { statut: actionOuverte.vers, commentaire: motif.trim() };
    if (actionOuverte.demandeCode) {
      if (!/^\d{4}$/.test(code)) {
        setErreur("Le code de livraison contient 4 chiffres.");
        return;
      }
      changement.code = code;
      if (montant.trim() !== "") {
        changement.montant_encaisse = Number(montant);
        changement.mode_paiement = modeEncaissement;
      }
    }
    statut.mutate(changement);
  }

  const messageClient = `Bonjour ${commande.nom_client}, ici Mboa Royal au sujet de votre commande ${commande.numero}.`;
  const historique = [...commande.historique].reverse();

  return (
    <article aria-labelledby="titre-detail" className="overflow-hidden rounded-3xl border border-[#E6DAC3] bg-creme-0">
      <header className="flex items-start justify-between gap-4 bg-palmier-950 p-5 text-creme-50">
        <div className="flex flex-col gap-2">
          <h2 id="titre-detail" className="font-titre text-3xl font-bold text-or-300">{commande.numero}</h2>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <BadgeStatut statut={commande.statut} libelle={commande.statut_libelle} />
            <span className="text-creme-50/75">
              {commande.mode === "livraison" ? "Livraison" : "À emporter"} · passée {formatDateHeure(commande.date_creation)}
            </span>
          </div>
        </div>
        <button type="button" onClick={onFermer} aria-label="Fermer le détail" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-palmier-800 hover:bg-palmier-600">
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </header>

      <div className="flex flex-col gap-6 p-5">
        {/* ----- Les actions ----- */}
        {actionsPour(commande).length > 0 && !actionOuverte && (
          <div className="flex flex-wrap gap-2">
            {actionsPour(commande).map((action) => (
              <button
                key={action.vers}
                type="button"
                disabled={occupe}
                onClick={() => lancer(action)}
                className={
                  action.danger
                    ? "h-12 rounded-full border-[1.5px] border-argile-600 px-5 font-bold text-argile-800 hover:bg-argile-600 hover:text-creme-50 disabled:opacity-50"
                    : "h-12 flex-1 rounded-full bg-or-500 px-5 font-bold text-palmier-950 hover:bg-or-300 disabled:opacity-50"
                }
              >
                {statut.isPending && statut.variables?.statut === action.vers ? "Enregistrement…" : action.libelle}
              </button>
            ))}
          </div>
        )}

        {actionOuverte && (
          <form onSubmit={confirmerAction} className="flex flex-col gap-3 rounded-2xl border-2 border-or-500 bg-or-100/50 p-4">
            <p className="font-bold text-palmier-950">{actionOuverte.libelle}</p>

            {actionOuverte.demandeCode && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="code-client" className="text-sm font-semibold">Code de livraison donné par le client</label>
                  <input
                    id="code-client"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={4}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="h-14 w-40 rounded-xl border-2 border-or-500 bg-white text-center font-titre text-3xl font-bold tracking-[0.4em]"
                    autoFocus
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="montant" className="text-sm font-semibold">Montant encaissé ({devise ?? "FCFA"})</label>
                    <input id="montant" inputMode="numeric" className={CHAMP} value={montant} onChange={(e) => setMontant(e.target.value.replace(/\D/g, ""))} placeholder="Vide si déjà payée" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="mode-encaissement" className="text-sm font-semibold">Payé en</label>
                    <select id="mode-encaissement" className={CHAMP} value={modeEncaissement} onChange={(e) => setModeEncaissement(e.target.value as "especes" | "mobile_money")}>
                      <option value="especes">Espèces</option>
                      <option value="mobile_money">Mobile Money</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="motif" className="text-sm font-semibold">
                {actionOuverte.danger ? "Motif (visible par le client)" : "Commentaire (facultatif)"}
              </label>
              <input id="motif" className={CHAMP} value={motif} onChange={(e) => setMotif(e.target.value)} maxLength={255} placeholder={actionOuverte.danger ? "Ex. : plat épuisé, client injoignable…" : ""} />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={occupe}
                className={`h-12 flex-1 rounded-full px-5 font-bold disabled:opacity-50 ${actionOuverte.danger ? "bg-argile-600 text-creme-50 hover:bg-argile-800" : "bg-palmier-950 text-creme-50 hover:bg-palmier-800"}`}
              >
                {statut.isPending ? "Enregistrement…" : "Confirmer"}
              </button>
              <button type="button" onClick={() => { setActionOuverte(null); setErreur(null); }} className="h-12 rounded-full px-5 font-bold text-palmier-800 underline underline-offset-4">
                Retour
              </button>
            </div>
          </form>
        )}

        {erreur && (
          <p role="alert" className="rounded-2xl bg-or-100 p-3 font-semibold text-argile-800">{erreur}</p>
        )}

        {/* ----- Le client ----- */}
        <section>
          <h3 className={TITRE_BLOC}>Client</h3>
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-bold">{commande.nom_client}</p>
              <p className="text-sable-600">{commande.telephone_client}</p>
            </div>
            <a href={`tel:+237${commande.telephone_client}`} aria-label={`Appeler ${commande.nom_client}`} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-palmier-950 text-creme-50">
              <Phone aria-hidden="true" className="h-5 w-5" />
            </a>
            <a href={lienWhatsApp(commande.telephone_client, messageClient)} target="_blank" rel="noopener noreferrer" aria-label={`Écrire à ${commande.nom_client} sur WhatsApp`} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-whatsapp text-white">
              <MessageCircle aria-hidden="true" className="h-5 w-5" />
            </a>
          </div>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {commande.mode === "livraison" && (
              <li className="flex gap-2">
                <MapPin aria-hidden="true" className="h-4 w-4 shrink-0 text-argile-600" />
                <span>
                  <strong>{commande.quartier}, {commande.ville}</strong>
                  {commande.repere && <span className="block text-sable-600">{commande.repere}</span>}
                </span>
              </li>
            )}
            <li className="flex gap-2">
              <Clock aria-hidden="true" className="h-4 w-4 shrink-0 text-palmier-600" />
              {commande.heure_souhaitee ? <strong>Programmée pour {formatDateHeure(commande.heure_souhaitee)}</strong> : "Dès que possible"}
            </li>
            {commande.note && (
              <li className="flex gap-2 rounded-xl bg-or-100 p-2">
                <StickyNote aria-hidden="true" className="h-4 w-4 shrink-0 text-argile-800" />
                <span>{commande.note}</span>
              </li>
            )}
          </ul>
        </section>

        {/* ----- Les plats ----- */}
        <section>
          <h3 className={TITRE_BLOC}>Plats</h3>
          <ul className="flex flex-col gap-2">
            {commande.lignes.map((ligne, index) => (
              <li key={index} className="flex justify-between gap-4">
                <span>
                  <strong>{ligne.quantite} ×</strong> {ligne.nom_plat}
                  {ligne.options.length > 0 && (
                    <span className="block text-sm text-sable-600">{ligne.options.map((o) => o.option).join(", ")}</span>
                  )}
                </span>
                <span className="whitespace-nowrap">{formatPrix(ligne.sous_total, devise)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col gap-1 border-t border-dashed border-sable-300 pt-3 text-sm">
            <p className="flex justify-between"><span>Sous-total</span><span>{formatPrix(commande.sous_total, devise)}</span></p>
            {commande.mode === "livraison" && (
              <p className="flex justify-between"><span>Livraison</span><span>{formatPrix(commande.frais_livraison, devise)}</span></p>
            )}
            <p className="flex justify-between text-lg font-bold"><span>Total</span><span>{formatPrix(commande.total, devise)}</span></p>
          </div>
        </section>

        {/* ----- Le livreur ----- */}
        {commande.mode === "livraison" && (
          <section>
            <h3 className={TITRE_BLOC}>Livreur</h3>
            <p className="flex items-center gap-2">
              <Bike aria-hidden="true" className="h-5 w-5 text-palmier-600" />
              {commande.livreur_nom ? <strong>{commande.livreur_nom}</strong> : <span className="text-sable-600">Aucun livreur assigné</span>}
            </p>
            {peutAssigner && (
              <div className="mt-3 flex flex-wrap gap-2">
                <label htmlFor="livreur" className="sr-only">Choisir un livreur</label>
                <select id="livreur" className={`${CHAMP} min-w-0 flex-1`} value={livreurChoisi} onChange={(e) => setLivreurChoisi(e.target.value)}>
                  <option value="">{livreurs.isPending ? "Chargement des livreurs…" : "Choisir un livreur…"}</option>
                  {livreurs.data?.livreurs.map((l) => (
                    <option key={l.livreur} value={l.livreur}>
                      {l.nom} · {l.disponible ? "disponible" : "indisponible"} · {l.nb_courses} course(s) aujourd'hui
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!livreurChoisi || occupe}
                  onClick={() => assignation.mutate(Number(livreurChoisi))}
                  className="h-11 rounded-full bg-palmier-950 px-5 font-bold text-creme-50 hover:bg-palmier-800 disabled:opacity-50"
                >
                  {commande.livreur_nom ? "Changer" : "Assigner"}
                </button>
              </div>
            )}
            {livreurs.data && livreurs.data.livreurs.length === 0 && (
              <p className="mt-2 text-sm text-argile-800">Aucun compte livreur actif : créez-en un dans l'admin Django.</p>
            )}
          </section>
        )}

        {/* ----- Le paiement ----- */}
        <section>
          <h3 className={TITRE_BLOC}>Paiement</h3>
          {commande.montant_encaisse !== null && (
            <p className="mb-2 text-sm">Encaissé à la remise : <strong>{formatPrix(commande.montant_encaisse, devise)}</strong></p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="mode-paiement" className="sr-only">Mode de paiement</label>
            <select id="mode-paiement" className={`${CHAMP} min-w-0 flex-1`} value={modePaiement} onChange={(e) => setModePaiement(e.target.value as ModePaiement)}>
              {Object.entries(LIBELLES_PAIEMENT).map(([valeur, libelle]) => (
                <option key={valeur} value={valeur}>{libelle}</option>
              ))}
            </select>
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 font-semibold">
              <input type="checkbox" checked={payee} onChange={(e) => setPayee(e.target.checked)} className="h-5 w-5 accent-palmier-800" />
              Payée
            </label>
          </div>
          {paiementModifie && (
            <button
              type="button"
              disabled={occupe}
              onClick={() => paiement.mutate()}
              className="mt-3 h-11 w-full rounded-full bg-palmier-950 font-bold text-creme-50 hover:bg-palmier-800 disabled:opacity-50"
            >
              {paiement.isPending ? "Enregistrement…" : "Enregistrer le paiement"}
            </button>
          )}
        </section>

        {/* ----- L'historique ----- */}
        <section>
          <h3 className={TITRE_BLOC}>Historique</h3>
          <ol className="flex flex-col gap-3 border-l-2 border-sable-300 pl-4">
            {historique.map((etape, index) => (
              <li key={index}>
                <p className="text-sm">
                  <strong>{formatHeure(etape.date)}</strong> · {etape.statut_libelle}
                </p>
                {etape.commentaire && <p className="text-sm text-sable-600">{etape.commentaire}</p>}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </article>
  );
}