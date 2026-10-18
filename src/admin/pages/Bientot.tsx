import { Hammer } from "lucide-react";

import { API_URL } from "../../api/client";

const ADMIN_DJANGO = API_URL.replace(/\/api\/?$/, "/admin/");

export default function Bientot() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-3xl border border-sable-300 bg-creme-0 p-10 text-center">
      <Hammer aria-hidden="true" className="h-12 w-12 text-or-500" />
      <h1 className="font-titre text-3xl text-palmier-950">Bientôt ici</h1>
      <p className="text-sable-600">
        Cette section sera construite à la prochaine étape. En attendant, elle reste disponible dans l'admin Django.
      </p>
      <a href={ADMIN_DJANGO} target="_blank" rel="noopener noreferrer" className="font-bold text-palmier-800 underline underline-offset-4">
        Ouvrir l'admin Django
      </a>
    </div>
  );
}