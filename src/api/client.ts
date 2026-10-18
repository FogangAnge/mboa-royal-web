import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

/** Envoyé quand la session ne peut plus être prolongée : l'espace admin se déconnecte. */
export const EVENEMENT_SESSION_EXPIREE = "mboa:session-expiree";

const CLE_ACCESS = "mboa.access";
const CLE_REFRESH = "mboa.refresh";

function lire(cle: string): string | null {
  try {
    return localStorage.getItem(cle);
  } catch {
    return null;
  }
}

/** Les jetons JWT, rangés dans le navigateur. */
export const jetons = {
  lireAccess: () => lire(CLE_ACCESS),
  lireRefresh: () => lire(CLE_REFRESH),
  enregistrer(access: string, refresh?: string) {
    try {
      localStorage.setItem(CLE_ACCESS, access);
      if (refresh) localStorage.setItem(CLE_REFRESH, refresh);
    } catch {
      /* stockage indisponible (navigation privée) : on reste sans session */
    }
  },
  effacer() {
    try {
      localStorage.removeItem(CLE_ACCESS);
      localStorage.removeItem(CLE_REFRESH);
    } catch {
      /* rien à effacer */
    }
  },
};

/** Une requête, avec deux repères à nous : déjà réessayée ? à envoyer sans jeton ? */
type ConfigMboa = InternalAxiosRequestConfig & { _reessai?: boolean; _sansJeton?: boolean };

export const api = axios.create({ baseURL: API_URL, timeout: 15_000 });

api.interceptors.request.use((config: ConfigMboa) => {
  const access = jetons.lireAccess();
  if (access && !config._sansJeton) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

/** Un seul rafraîchissement à la fois, même si dix requêtes échouent ensemble. */
let rafraichissement: Promise<string | null> | null = null;

function rafraichirJeton(): Promise<string | null> {
  if (!rafraichissement) {
    const refresh = jetons.lireRefresh();
    const demande = refresh
      ? axios
          .post<{ access: string; refresh?: string }>(`${API_URL}/auth/token/rafraichir/`, { refresh }, { timeout: 15_000 })
          .then(({ data }) => {
            jetons.enregistrer(data.access, data.refresh);
            return data.access;
          })
          .catch(() => null)
      : Promise.resolve(null);
    rafraichissement = demande.finally(() => {
      rafraichissement = null;
    });
  }
  return rafraichissement;
}

api.interceptors.response.use(
  (reponse) => reponse,
  async (erreur: AxiosError) => {
    const config = erreur.config as ConfigMboa | undefined;
    const avaitUnJeton = Boolean(config?.headers?.Authorization);
    if (!config || erreur.response?.status !== 401 || config._reessai || !avaitUnJeton) {
      throw erreur;
    }
    config._reessai = true;

    const nouveau = await rafraichirJeton();
    if (nouveau) {
      return api(config);
    }

    // La session est finie : on l'efface, on prévient l'espace admin,
    // et on retente sans jeton (utile pour les pages publiques).
    jetons.effacer();
    window.dispatchEvent(new Event(EVENEMENT_SESSION_EXPIREE));
    delete config.headers.Authorization;
    config._sansJeton = true;
    return api(config);
  },
);