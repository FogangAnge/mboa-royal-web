import { BrowserRouter, Route, Routes } from "react-router";

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
        <Route element={<Layout />}>
          <Route index element={<Accueil />} />
          <Route path="menu" element={<Menu />} />
          <Route path="panier" element={<Panier />} />
          <Route path="commande/:numero" element={<CommandeConfirmee />} />
          <Route path="suivi" element={<Suivi />} />
          <Route path="reservation" element={<Reservation />} />
          <Route path="*" element={<PageIntrouvable />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}