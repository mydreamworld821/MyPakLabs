import { Link } from "react-router-dom";
import { Building2, Stethoscope, FlaskConical, Heart, Pill, Search } from "lucide-react";

const specialists = [
  { name: "Psychologist", slug: "psychologist" },
  { name: "Psychiatrist", slug: "psychiatrist" },
  { name: "Dermatologist", slug: "dermatologist" },
  { name: "Gynecologist", slug: "gynecologist" },
  { name: "Urologist", slug: "urologist" },
  { name: "Gastroenterologist", slug: "gastroenterologist" },
  { name: "Neuro Surgeon", slug: "neuro-surgeon" },
  { name: "Neurologist", slug: "neurologist" },
  { name: "General Surgeon", slug: "general-surgeon" },
  { name: "Orthopedic Surgeon", slug: "orthopedic-surgeon" },
  { name: "Cardiologist", slug: "cardiologist" },
  { name: "ENT Specialist", slug: "ent-specialist" },
  { name: "Pediatrician", slug: "pediatrician" },
  { name: "Ophthalmologist", slug: "ophthalmologist" },
  { name: "Dentist", slug: "dentist" },
  { name: "Physiotherapist", slug: "physiotherapist" },
  { name: "Internal Medicine", slug: "internal-medicine" },
  { name: "Pulmonologist", slug: "pulmonologist" },
  { name: "Endocrinologist", slug: "endocrinologist" },
  { name: "Rheumatologist", slug: "rheumatologist" },
];

const labServices = [
  { name: "Best Diagnostic Labs", link: "/labs-in-islamabad" },
  { name: "ISO Certified Medical Labs", link: "/labs-in-islamabad" },
  { name: "Discounted Lab Tests (Up to 35% Off)", link: "/labs" },
  { name: "Home Sample Collection", link: "/labs" },
  { name: "Ultrasound & X-Ray Centers", link: "/labs" },
  { name: "MRI & CT Scan Centers", link: "/labs" },
];

const nursingServices = [
  { name: "Emergency Nursing Services", link: "/emergency-nursing-request" },
  { name: "Home Nursing Care", link: "/home-nursing-islamabad" },
  { name: "Elderly Care Services", link: "/find-nurses" },
  { name: "Physiotherapy at Home", link: "/find-nurses" },
];

const pharmacyServices = [
  { name: "Trusted Pharmacies", link: "/pharmacies-in-islamabad" },
  { name: "Online Medicine Delivery", link: "/pharmacies" },
  { name: "Discounted Medicines Near You", link: "/pharmacies" },
];


const popularSearches = [
  "Best doctors near me in Islamabad",
  "diagnostic labs near me",
  "hospitals in Islamabad",
  "online doctor consultation Islamabad",
  "home nursing services Islamabad",
  "pharmacy near me",
];

export const SeoFooterSection = () => {
  const city = "Islamabad/Rawalpindi";

  return (
    <section className="bg-gradient-to-b from-muted/30 to-muted/60 py-12 md:py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-3">
            🏥 Find the Best Doctors & Medical Specialists in {city}
          </h2>
          <p className="text-black max-w-3xl mx-auto text-sm md:text-base">
            Looking for trusted and experienced medical professionals in {city}? MyPakLabs helps you connect with the best doctors, hospitals, diagnostic labs, nurses, and pharmacies. Compare consultation fees, read patient reviews, and book appointments with verified specialists near you.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Specialists Column */}
          <div className="space-y-4">
            <Link to="/find-doctors" className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
              <Stethoscope className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg text-black hover:text-primary transition-colors">
                👨‍⚕️ Top Medical Specialists
              </h3>
            </Link>
            <ul className="space-y-2">
              {specialists.slice(0, 10).map((specialist) => (
                <li key={specialist.slug}>
                  <Link
                    to={`/islamabad/best-${specialist.slug}`}
                    className="text-sm text-black hover:text-primary hover:underline transition-colors"
                  >
                    Best {specialist.name} in {city}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* More Specialists Column */}
          <div className="space-y-4">
            <Link to="/find-doctors" className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
              <Building2 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg text-black hover:text-primary transition-colors">
                👨‍⚕️ More Specialists
              </h3>
            </Link>
            <ul className="space-y-2">
              {specialists.slice(10).map((specialist) => (
                <li key={specialist.slug}>
                  <Link
                    to={`/islamabad/best-${specialist.slug}`}
                    className="text-sm text-black hover:text-primary hover:underline transition-colors"
                  >
                    Best {specialist.name} in {city}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Labs & Diagnostics Column */}
          <div className="space-y-4">
            <Link to="/labs" className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
              <FlaskConical className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg text-black hover:text-primary transition-colors">
                🧪 Diagnostic Labs & Services
              </h3>
            </Link>
            <ul className="space-y-2">
              {labServices.map((service, index) => (
                <li key={index}>
                  <Link
                    to={service.link}
                    className="text-sm text-black hover:text-primary hover:underline transition-colors"
                  >
                    {service.name} in {city}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Pharmacy & Nursing Column */}
          <div className="space-y-6">
            <div>
              <Link to="/pharmacies" className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
                <Pill className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg text-black hover:text-primary transition-colors">
                  💊 Pharmacies & Medicines
                </h3>
              </Link>
              <ul className="space-y-2">
                {pharmacyServices.map((service, index) => (
                  <li key={index}>
                    <Link
                      to={service.link}
                      className="text-sm text-black hover:text-primary hover:underline transition-colors"
                    >
                      {service.name} in {city}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <Link to="/find-nurses" className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
                <Heart className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg text-black hover:text-primary transition-colors">
                  👩‍⚕️ Home & Emergency Care
                </h3>
              </Link>
              <ul className="space-y-2">
                {nursingServices.map((service, index) => (
                  <li key={index}>
                    <Link
                      to={service.link}
                      className="text-sm text-black hover:text-primary hover:underline transition-colors"
                    >
                      {service.name} in {city}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Popular Searches */}
        <div className="mt-10 pt-8 border-t border-border">
          <div className="flex items-center gap-2 mb-4 justify-center">
            <Search className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg text-black">
              🔍 Popular Medical Searches in {city}
            </h3>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {popularSearches.map((search, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-background rounded-full text-xs text-black border border-border hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                {search}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SeoFooterSection;
