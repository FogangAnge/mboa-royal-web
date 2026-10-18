import { Eye, EyeOff, LogIn } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";

import { useAuth } from "../../auth/useAuth";
import { messagesErreur } from "../../lib/erreurs";
import { estCuisinier, peutVoirCuisine, type Utilisateur } from "../../types/compte";

const CHAMP = "h-12 w-full rounded-xl border-[1.5px] border-sable-300 bg-white px-3 text-base";

/** Le cuisinier va toujours à l'écran cuisine ; le personnel revient là où il voulait aller. */
function destination(compte: Utilisateur, depuis: string | undefined): string {
  return estCuisinier(compte) ? "/cuisine" : (depuis ?? "/admin");
}

export default function Connexion() {
  const { utilisateur, connexion, deconnexion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const depuis = (location.state as { depuis?: string } | null)?.depuis;

  const [telephone, setTelephone] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [voir, setVoir] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  // Déjà connecté : pas besoin de formulaire.
  if (utilisateur && peutVoirCuisine(utilisateur)) {
    return <Navigate to={destination(utilisateur, depuis)} replace />;
  }

  async function envoyer(evenement: FormEvent) {
    evenement.preventDefault();
    setErreur(null);
    setEnvoi(true);
    try {
      const compte = await connexion(telephone, motDePasse);
      if (!peutVoirCuisine(compte)) {
        deconnexion();
        setErreur("Ce compte n'a pas accès à l'espace du restaurant.");
        return;
      }
      navigate(destination(compte, depuis), { replace: true });
    } catch (probleme) {
      setErreur(messagesErreur(probleme)[0]);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-palmier-950">
      <div className="bande-toghu h-3" aria-hidden="true" />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl bg-creme-0 p-8 shadow-xl">
          <div className="flex flex-col items-center text-center">
            <img src="/favicon.png" alt="" className="h-20 w-20" />
            <h1 className="mt-4 font-titre text-3xl text-palmier-950">Espace restaurant</h1>
            <p className="mt-1 text-sable-600">Réservé à l'équipe de Mboa Royal</p>
          </div>

          <form onSubmit={envoyer} className="mt-8 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="telephone-admin" className="text-sm font-semibold">Téléphone</label>
              <input
                id="telephone-admin"
                type="tel"
                inputMode="tel"
                autoComplete="username"
                className={CHAMP}
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="6XX XX XX XX"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="mot-de-passe" className="text-sm font-semibold">Mot de passe</label>
              <div className="relative">
                <input
                  id="mot-de-passe"
                  type={voir ? "text" : "password"}
                  autoComplete="current-password"
                  className={`${CHAMP} pr-12`}
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setVoir(!voir)}
                  aria-label={voir ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  aria-pressed={voir}
                  className="absolute right-1 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-sable-600 hover:text-palmier-950"
                >
                  {voir ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {erreur && (
              <p role="alert" className="rounded-2xl bg-or-100 p-3 font-semibold text-argile-800">
                {erreur}
              </p>
            )}

            <button
              type="submit"
              disabled={envoi}
              className="mt-2 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-palmier-950 text-lg font-bold text-creme-50 hover:bg-palmier-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogIn aria-hidden="true" className="h-5 w-5" />
              {envoi ? "Connexion…" : "Se connecter"}
            </button>
          </form>

          <p className="mt-6 text-center">
            <Link to="/" className="font-semibold text-palmier-800 underline underline-offset-4">
              Retour au site
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
