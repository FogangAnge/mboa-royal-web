import { CheckCircle2, Lock, MessageCircle } from "lucide-react";
import { Link, useLocation, useParams } from "react-router";

import { useRestaurant } from "../hooks/useRestaurant";
import { formatPrix } from "../lib/format";
import { trouverCommande } from "../lib/mesCommandes";
import type { CommandeCreee } from "../types/commande";

export default function CommandeConfirmee() {
  const { numero = "" } = useParams();
  const location = useLocation();
  const { data: restaurant } = useRestaurant();

  const etat = location.state as { commande?: CommandeCreee } | null;
  const locale = trouverCommande(numero);
  const code = etat?.commande?.code_livraison ?? locale?.code;
  const lien = etat?.commande?.lien_whatsapp ?? locale?.lienWhatsapp;
  const total = etat?.commande?.total ?? locale?.total;
  const telephone = etat?.commande?.telephone_client ?? locale?.telephone ?? "";

  if (!code || !lien) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="font-titre text-3xl text-palmier-950">Commande introuvable sur cet appareil</h1>
        <p className="text-sable-600">Vous pouvez la suivre avec son numéro et votre téléphone.</p>
        <Link to="/suivi" className="inline-flex h-12 items-center rounded-full bg-palmier-950 px-6 font-bold text-creme-50">
          Suivre une commande
        </Link>
      </div>
    );
  }

  const suivi = `/suivi?numero=${encodeURIComponent(numero)}&telephone=${encodeURIComponent(telephone)}`;

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-16 text-center">
      <CheckCircle2 aria-hidden="true" className="h-16 w-16 text-palmier-600" />
      <div>
        <h1 className="font-titre text-4xl text-palmier-950">Commande enregistrée</h1>
        <p className="mt-2 text-lg">
          N° <strong>{numero}</strong>
          {total !== undefined && <> · {formatPrix(total, restaurant?.devise)}</>}
        </p>
      </div>

      <div className="w-full rounded-3xl bg-palmier-950 p-6 text-creme-50">
        <p className="font-bold text-or-300">Dernière étape</p>
        <p className="mt-1">Envoyez votre commande sur WhatsApp : nous la confirmons et réglons le paiement avec vous.</p>
        <a
          href={lien}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex h-14 items-center justify-center gap-3 rounded-full bg-whatsapp text-lg font-bold text-white"
        >
          <MessageCircle aria-hidden="true" className="h-6 w-6" />
          Envoyer sur WhatsApp
        </a>
      </div>

      <div className="flex w-full items-center justify-between gap-4 rounded-3xl bg-or-100 p-6 text-left">
        <div className="flex items-start gap-3">
          <Lock aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-palmier-800" />
          <div>
            <p className="font-bold">Votre code de livraison</p>
            <p className="text-sm text-sable-600">Ne le donnez qu'au livreur, à la réception de votre commande.</p>
          </div>
        </div>
        <span className="font-titre text-4xl font-bold tracking-[0.3em] text-palmier-950">{code}</span>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <Link to={suivi} className="font-bold text-palmier-800 underline underline-offset-4">
          Suivre ma commande
        </Link>
        <Link to="/menu" className="font-bold text-palmier-800 underline underline-offset-4">
          Retour au menu
        </Link>
      </div>
    </div>
  );
}