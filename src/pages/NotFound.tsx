import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const toTitleCaseCity = (slug: string) =>
  slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const path = location.pathname;

    // Log for debugging
    console.error("404 Error: User attempted to access non-existent route:", path);

    // Redirect legacy SEO URLs like /labs-in-islamabad to the working directory pages.
    // Reason: React Router does not support params embedded in a segment like "/labs-in-:city".
    const legacyMatch = path.match(
      /^\/(doctors-in|labs-in|hospitals-in|pharmacies-in|medical-tests-in)-(.+)$/i
    );

    const nursingMatch = path.match(/^\/home-nursing-(.+)$/i);

    const citySlug = legacyMatch?.[2] ?? nursingMatch?.[1];
    if (!citySlug) return;

    const formattedCity = toTitleCaseCity(citySlug);

    let target = "";
    if (nursingMatch) {
      target = `/find-nurses?city=${encodeURIComponent(formattedCity)}`;
    } else {
      const kind = legacyMatch?.[1]?.toLowerCase();
      switch (kind) {
        case "doctors-in":
          target = `/find-doctors?city=${encodeURIComponent(formattedCity)}`;
          break;
        case "labs-in":
        case "medical-tests-in":
          target = `/labs?city=${encodeURIComponent(formattedCity)}`;
          break;
        case "hospitals-in":
          target = `/hospitals?city=${encodeURIComponent(formattedCity)}`;
          break;
        case "pharmacies-in":
          target = `/pharmacies?city=${encodeURIComponent(formattedCity)}`;
          break;
      }
    }

    if (target && target !== path) {
      navigate(target, { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
