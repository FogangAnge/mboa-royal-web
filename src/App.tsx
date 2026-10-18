import { BrowserRouter, Route, Routes } from "react-router";

import AdminLayout from "./admin/AdminLayout";
import Bientot from "./admin/pages/Bientot";
import Commandes from "./admin/pages/Commandes";
import Connexion from "./admin/pages/Connexion";
import Livreurs from "./admin/pages/Livreurs";
import MenuAdmin from "./admin/pages/MenuAdmin";
import Reservations from "./admin/pages/Reservations";
import TableauDeBord from "./admin/pages/TableauDeBord";
import Layout from "./components/Layout";
import Accueil from "./pages/Accueil";
import CommandeConfirmee from "./pages/CommandeConfirmee";
import Menu from "./pages/Menu";
import PageIntrouvable from "./pages/PageIntrouvable";
import Panier from "./pages/Panier";
import Reservation from "./pages/Reservation";
import Suivi from "./pages/Suivi";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Le site public */}
        <Route element={<Layout />}>
          <Route index element={<Accueil />} />
          <Route path="menu" element={<Menu />} />
          <Route path="panier" element={<Panier />} />
          <Route path="commande/:numero" element={<CommandeConfirmee />} />
          <Route path="suivi" element={<Suivi />} />
          <Route path="reservation" element={<Reservation />} />
          <Route path="*" element={<PageIntrouvable />} />
        </Route>

        {/* L'espace du restaurant */}
        <Route path="admin/connexion" element={<Connexion />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<TableauDeBord />} />
          <Route path="commandes" element={<Commandes />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="menu" element={<MenuAdmin />} />
          <Route path="livreurs" element={<Livreurs />} />
          <Route path="*" element={<Bientot />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}