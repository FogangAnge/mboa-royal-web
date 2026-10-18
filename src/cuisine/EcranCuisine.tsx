import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bike, ChefHat, Flame, LogOut, Maximize, ShoppingBag, StickyNote, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router";

import { changerStatut, getCommandes } from "../api/admin";
import { useAuth } from "../auth/useAuth";
import Embleme from "../components/Embleme";
import { useRestaurant } from "../hooks/useRestaurant";
import { messagesErreur } from "../lib/erreurs";
import { formatHeure } from "../lib/format";
import { sonnerette } from "../lib/son";
import type { Commande } from "../types/commande";
import { estPersonnel, peutVoirCuisine } from "../types/compte";

const CLE = ["cuisine", "commandes"];
const RETARD_LANCEMENT_MIN = 10;

interface Colonne {
  statut: string;
  titre: string;
  aide: string;
  pastille: string;
}

const COLONNES: Colonne[] = [
  { statut: "confirmee", titre: "À lancer", aide: "Confirmées par la salle", pastille: "bg-or-500" },
  { statut: "en_preparation", titre: "Sur le feu", aide: "En préparation", pastille: "bg-argile-600" },
  { statut: "prete", titre: "Prêtes", aide: "En attente du livreur ou du client", pastille: "bg-whatsapp" },
];

const deux = (n: number) => String(n).padStart(2, "0");

/** 754 secondes → « 12:34 » ; 3 754 → « 1:02:34 ». */
function chrono(secondes: number): string {
  const s = Math.max(0, Math.floor(secondes));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}:${deux(m)}:${deux(s % 60)}` : `${deux(m)}:${deux(s % 60)}`;
}

/** Depuis quand la commande est dans son étape actuelle (lu dans l'historique). */
function debutEtape(commande: Commande): number {
  const passages = commande.historique.filter((h) => h.statut === commande.statut);
  const dernier = passages[passages.length - 1];
  return new Date(dernier?.date ?? commande.date_creation).getTime();
}

/** L'heure à laquelle la commande doit partir : l'heure programmée, sinon dès que possible. */
function echeance(commande: Commande): number {
  return commande.heure_souhaitee ? new Date(commande.heure_souhaitee).getTime() : debutEtape(commande);
}

interface PropsTicket {
  commande: Commande;
  maintenant: number;
  delai: number;
  occupe: boolean;
  onAvancer: (commande: Commande, vers: string) => void;
}

function Ticket({ commande, maintenant, delai, occupe, onAvancer }: PropsTicket) {
  const secondes = (maintenant - debutEtape(commande)) / 1000;
  const minutes = secondes / 60;
  const programmee = commande.heure_souhaitee ? new Date(commande.heure_souhaitee).getTime() : null;
  const enAvance = programmee !== null && programmee - maintenant > delai * 60_000;

  let niveau: "ok" | "attention" | "retard" = "ok";
  if (!enAvance) {
    const limite = commande.statut === "confirmee" ? RETARD_LANCEMENT_MIN : delai;
    if (commande.statut !== "prete" && minutes > limite) niveau = "retard";
    else if (commande.statut !== "prete" && minutes > limite * 0.75) niveau = "attention";
  }
  const couleurChrono = {
    ok: "bg-palmier-800 text-creme-50",
    attention: "bg-or-500 text-palmier-950",
    retard: "bg-argile-600 text-creme-50",
  }[niveau];

  return (
    <article
      aria-label={`Commande ${commande.numero}`}
      className={`ticket-arrive shrink-0 overflow-hidden rounded-2xl bg-creme-0 text-encre-900 ${niveau === "retard" ? "ticket-retard ring-4 ring-argile-600" : ""}`}
    >
      <header className="flex items-start justify-between gap-3 border-b-2 border-dashed border-sable-300 px-4 pb-3 pt-4">
        <div>
          <p className="font-titre text-3xl font-bold leading-none text-palmier-950">{commande.numero}</p>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-bold">
            {commande.mode === "livraison" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-or-100 px-2.5 py-1 text-argile-800">
                <Bike aria-hidden="true" className="h-4 w-4" /> Livraison · {commande.quartier}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#DCEFE2] px-2.5 py-1 text-[#17462B]">
                <ShoppingBag aria-hidden="true" className="h-4 w-4" /> À emporter
              </span>
            )}
            {programmee !== null && (
              <span className="rounded-full bg-palmier-950 px-2.5 py-1 text-or-300">Pour {formatHeure(commande.heure_souhaitee!)}</span>
            )}
          </p>
        </div>
        <div className="text-right">
          <span className={`inline-block rounded-xl px-3 py-1.5 font-mono text-2xl font-bold tabular-nums ${couleurChrono}`}>
            {chrono(secondes)}
          </span>
          <p className="mt-1 text-xs font-semibold text-sable-600">
            {enAvance ? "programmée" : niveau === "retard" ? "en retard" : "dans cette étape"}
          </p>
        </div>
      </header>

      <ul className="flex flex-col gap-3 px-4 py-4">
        {commande.lignes.map((ligne, index) => (
          <li key={index} className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-palmier-950 font-titre text-xl font-bold text-or-300">
              {ligne.quantite}
            </span>
            <div className="min-w-0 pt-1">
              <p className="text-lg font-bold leading-tight">{ligne.nom_plat}</p>
              {ligne.options.length > 0 && (
                <p className="mt-1 flex flex-wrap gap-1.5">
                  {ligne.options.map((option) => (
                    <span key={option.option} className="rounded-md bg-or-100 px-2 py-0.5 text-sm font-semibold text-encre-900">
                      {option.option}
                    </span>
                  ))}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {commande.note && (
        <p className="mx-4 mb-4 flex gap-2 rounded-xl bg-argile-600 p-3 font-bold text-creme-50">
          <StickyNote aria-hidden="true" className="h-5 w-5 shrink-0" />
          {commande.note}
        </p>
      )}

      <div className="px-4 pb-4">
        {commande.statut === "confirmee" && (
          <button
            type="button"
            disabled={occupe}
            onClick={() => onAvancer(commande, "en_preparation")}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-or-500 text-lg font-bold text-palmier-950 transition-transform hover:bg-or-300 active:scale-[0.98] disabled:opacity-50"
          >
            <Flame aria-hidden="true" className="h-5 w-5" />
            Lancer la préparation
          </button>
        )}
        {commande.statut === "en_preparation" && (
          <button
            type="button"
            disabled={occupe}
            onClick={() => onAvancer(commande, "prete")}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-whatsapp text-lg font-bold text-white transition-transform hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            <ChefHat aria-hidden="true" className="h-5 w-5" />
            C'est prêt !
          </button>
        )}
        {commande.statut === "prete" && (
          <p className="rounded-xl bg-[#DCEFE2] p-3 text-center font-bold text-[#17462B]">
            {commande.mode === "emporter"
              ? "À remettre au client au comptoir"
              : commande.livreur_nom
                ? `En attente de ${commande.livreur_nom}`
                : "En attente d'un livreur"}
          </p>
        )}
      </div>
    </article>
  );
}

function Cuisine() {
  const queryClient = useQueryClient();
  const { utilisateur, deconnexion } = useAuth();
  const { data: restaurant } = useRestaurant();
  const delai = restaurant?.delai_preparation_min ?? 30;
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const [son, setSon] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const dejaVues = useRef<Set<string> | null>(null);

  const commandes = useQuery({ queryKey: CLE, queryFn: getCommandes, refetchInterval: 10_000 });

  // L'horloge et les chronos avancent chaque seconde.
  useEffect(() => {
    const minuteur = window.setInterval(() => setMaintenant(Date.now()), 1000);
    return () => window.clearInterval(minuteur);
  }, []);

  // Une nouvelle commande à lancer : deux notes, pour qu'on l'entende par-dessus les casseroles.
  useEffect(() => {
    if (!commandes.data) return;
    const aLancer = commandes.data.filter((c) => c.statut === "confirmee").map((c) => c.numero);
    const nouvelles = dejaVues.current ? aLancer.filter((n) => !dejaVues.current!.has(n)) : [];
    if (nouvelles.length > 0 && son) sonnerette([880, 1320]);
    dejaVues.current = new Set(aLancer);
  }, [commandes.data, son]);

  // Sur une tablette, l'écran ne s'éteint pas tant que la page est ouverte.
  useEffect(() => {
    let verrou: WakeLockSentinel | null = null;
    const demander = async () => {
      try {
        if (document.visibilityState === "visible" && "wakeLock" in navigator) {
          verrou = await navigator.wakeLock.request("screen");
        }
      } catch {
        /* refusé (batterie faible, navigateur) : tant pis */
      }
    };
    demander();
    document.addEventListener("visibilitychange", demander);
    return () => {
      document.removeEventListener("visibilitychange", demander);
      void verrou?.release();
    };
  }, []);

  const avancer = useMutation({
    mutationFn: ({ numero, vers }: { numero: string; vers: string }) => changerStatut(numero, { statut: vers }),
    onSuccess: (maj) => {
      queryClient.setQueryData<Commande[]>(CLE, (liste) => liste?.map((c) => (c.numero === maj.numero ? maj : c)));
      queryClient.invalidateQueries({ queryKey: ["admin", "commandes"] });
      setErreur(null);
    },
    onError: (probleme) => setErreur(messagesErreur(probleme)[0]),
  });

  function activerSon() {
    const suivant = !son;
    setSon(suivant);
    if (suivant) sonnerette([660]); // un clic autorise le navigateur à jouer les sons suivants
  }

  function pleinEcran() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen().catch(() => undefined);
  }

  const toutes = commandes.data ?? [];
  const parColonne = (statut: string) =>
    toutes.filter((c) => c.statut === statut).sort((a, b) => echeance(a) - echeance(b));
  const heure = new Date(maintenant);

  return (
    <div className="flex min-h-screen flex-col bg-[#10221A] text-creme-50">
      <header className="flex flex-wrap items-center gap-4 border-b border-palmier-800 px-4 py-3 md:px-6">
        <Embleme taille={44} />
        <div className="mr-auto">
          <h1 className="font-titre text-2xl font-bold leading-none">Cuisine</h1>
          <p className="text-sm text-creme-50/60">
            {restaurant?.nom ?? "Mboa Royal"} · actualisé toutes les 10 s
          </p>
        </div>
        <p className="font-mono text-4xl font-bold tabular-nums text-or-300" aria-label="Heure actuelle">
          {deux(heure.getHours())}:{deux(heure.getMinutes())}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={activerSon}
            aria-pressed={son}
            className={`inline-flex h-11 items-center gap-2 rounded-full px-4 font-bold ${son ? "bg-or-500 text-palmier-950" : "bg-palmier-800 text-creme-50"}`}
          >
            {son ? <Volume2 aria-hidden="true" className="h-5 w-5" /> : <VolumeX aria-hidden="true" className="h-5 w-5" />}
            {son ? "Son activé" : "Activer le son"}
          </button>
          <button type="button" onClick={pleinEcran} aria-label="Plein écran" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-palmier-800">
            <Maximize aria-hidden="true" className="h-5 w-5" />
          </button>
          {utilisateur && estPersonnel(utilisateur) ? (
            <Link to="/admin/commandes" className="inline-flex h-11 items-center rounded-full bg-palmier-800 px-4 font-bold">
              Admin
            </Link>
          ) : (
            <button type="button" onClick={deconnexion} aria-label="Se déconnecter" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-palmier-800">
              <LogOut aria-hidden="true" className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      {(erreur || commandes.isError) && (
        <p role="alert" className="mx-4 mt-4 rounded-xl bg-argile-600 p-3 font-bold md:mx-6">
          {erreur ?? "Impossible de charger les commandes. Vérifiez la connexion."}
        </p>
      )}

      <main className="grid flex-1 gap-4 p-4 md:p-6 lg:grid-cols-3">
        {COLONNES.map((colonne) => {
          const liste = parColonne(colonne.statut);
          return (
            <section key={colonne.statut} aria-labelledby={`colonne-${colonne.statut}`} className="flex min-h-0 flex-col rounded-3xl bg-palmier-950/70 p-3">
              <div className="flex items-center gap-3 px-2 pb-3 pt-1">
                <span className={`h-3 w-3 rounded-full ${colonne.pastille}`} aria-hidden="true" />
                <h2 id={`colonne-${colonne.statut}`} className="text-xl font-bold">
                  {colonne.titre}
                </h2>
                <span className="ml-auto rounded-full bg-palmier-800 px-3 py-0.5 font-mono text-lg font-bold">{liste.length}</span>
              </div>
              <p className="px-2 pb-3 text-sm text-creme-50/50">{colonne.aide}</p>
              <div className="flex flex-col gap-3 lg:max-h-[calc(100vh-190px)] lg:overflow-y-auto">
                {commandes.isPending && <div className="squelette h-48 rounded-2xl opacity-20" />}
                {commandes.isSuccess && liste.length === 0 && (
                  <p className="rounded-2xl border-2 border-dashed border-palmier-800 p-8 text-center text-creme-50/40">Rien pour l'instant</p>
                )}
                {liste.map((commande) => (
                  <Ticket
                    key={commande.numero}
                    commande={commande}
                    maintenant={maintenant}
                    delai={delai}
                    occupe={avancer.isPending}
                    onAvancer={(c, vers) => avancer.mutate({ numero: c.numero, vers })}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}

/** Le garde de l'écran cuisine : cuisinier, propriétaire ou gérant. */
export default function EcranCuisine() {
  const { utilisateur, chargement, deconnexion } = useAuth();

  if (chargement) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#10221A] text-creme-50/80" role="status">
        Ouverture de la cuisine…
      </div>
    );
  }
  if (!utilisateur) {
    return <Navigate to="/admin/connexion" replace state={{ depuis: "/cuisine" }} />;
  }
  if (!peutVoirCuisine(utilisateur)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-creme-50 px-4 text-center">
        <h1 className="font-titre text-3xl text-palmier-950">Accès réservé à l'équipe</h1>
        <button type="button" onClick={deconnexion} className="h-12 rounded-full bg-palmier-950 px-6 font-bold text-creme-50">
          Se déconnecter
        </button>
      </div>
    );
  }
  return <Cuisine />;
}
