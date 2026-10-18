import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import AuthProvider from "./auth/AuthProvider";
import "./index.css";
import PanierProvider from "./panier/PanierProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PanierProvider>
          <App />
        </PanierProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);