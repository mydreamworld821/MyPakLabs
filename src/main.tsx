import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// Support deep links on static hosts that serve /404.html for unknown routes.
// public/404.html stores the original path in sessionStorage and redirects to '/'.
// We restore that path here before React Router initializes.
try {
  const redirectPath = sessionStorage.getItem("redirectPath");
  if (redirectPath && redirectPath !== "/") {
    sessionStorage.removeItem("redirectPath");
    window.history.replaceState(null, "", redirectPath);
  }
} catch {
  // ignore
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

