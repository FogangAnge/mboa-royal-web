import { Link } from "react-router";

export default function PageIntrouvable() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="font-titre text-7xl font-bold text-or-500">404</p>
      <h1 className="font-titre text-3xl text-palmier-950">Cette page n'existe pas</h1>
      <p className="text-sable-600">Le lien est peut-être incorrect, ou la page a été déplacée.</p>
      <Link
        to="/"
        className="inline-flex h-12 items-center rounded-full bg-palmier-950 px-6 font-bold text-creme-50"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}