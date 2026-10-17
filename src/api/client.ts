import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

const CLE_ACCESS = "mboa.access";
const CLE_REFRESH = "mboa.refresh";

/** Lecture et écriture des jetons JWT dans le navigateur. */
export const jetons = {
  lireAccess: () => localStorage.getItem(CLE_ACCESS),
  lireRefresh: () => localStorage.getItem(CLE_REFRESH),
  enregistrer(access: string, refresh?: string) {
    localStorage.setItem(CLE_ACCESS, access);
    if (refresh) localStorage.setItem(CLE_REFRESH, refresh);
  },
  effacer() {
    localStorage.removeItem(CLE_ACCESS);
    localStorage.removeItem(CLE_REFRESH);
  },
};

/** Le client HTTP de tout le site. */
export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// 1. Avant chaque requête : ajouter le jeton s'il existe.
api.interceptors.request.use((config) => {
  const access = jetons.lireAccess();
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// 2. Après chaque réponse 401 : rafraîchir le jeton une seule fois, puis réessayer.
let rafraichissementEnCours: Promise<string | null> | null = null;

async function rafraichirJeton(): Promise<string | null> {
  const refresh = jetons.lireRefresh();
  if (!refresh) return null;
  try {
    const { data } = await axios.post<{ access: string }>(
      `${API_URL}/auth/token/rafraichir/`,
      { refresh },
    );
    jetons.enregistrer(data.access);
    return data.access;
  } catch {
    jetons.effacer();
    return null;
  }
}

type ConfigAvecReessai = InternalAxiosRequestConfig & { _reessai?: boolean };

api.interceptors.response.use(
  (reponse) => reponse,
  async (erreur: AxiosError) => {
    const config = erreur.config as ConfigAvecReessai | undefined;
    const avaitUnJeton = Boolean(config?.headers?.Authorization);

    if (erreur.response?.status === 401 && config && !config._reessai && avaitUnJeton) {
      config._reessai = true;
      rafraichissementEnCours ??= rafraichirJeton().finally(() => {
        rafraichissementEnCours = null;
      });
      const nouveauJeton = await rafraichissementEnCours;

      if (nouveauJeton) {
        config.headers.Authorization = `Bearer ${nouveauJeton}`;
      } else {
        // Plus de session valide : on réessaie sans jeton (utile pour les pages publiques).
        delete config.headers.Authorization;
      }
      return api(config);
    }
    return Promise.reject(erreur);
  },
);