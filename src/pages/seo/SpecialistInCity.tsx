import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import DoctorListCard from "@/components/directory/DoctorListCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Stethoscope, MapPin, Search, ChevronRight, Building2, FlaskConical, Heart, Pill } from "lucide-react";

interface Doctor {
  id: string;
  full_name: string;
  photo_url: string | null;
  qualification: string | null;
  experience_years: number | null;
  city: string | null;
  hospital_name: string | null;
  clinic_name: string | null;
  rating: number | null;
  review_count: number | null;
  consultation_fee: number | null;
  video_consultation: boolean | null;
  specialization_id: string | null;
  availability: string | null;
  doctor_specializations?: {
    name: string;
    slug: string;
  } | null;
}

// Map of specialist slugs to specialization names and descriptions
const specialistInfo: Record<string, { name: string; description: string; keywords: string[] }> = {
  "psychologist": { 
    name: "Psychologist", 
    description: "mental health counseling, therapy, behavioral issues, anxiety, depression, stress management",
    keywords: ["mental health", "therapy", "counseling", "anxiety treatment", "depression help"]
  },
  "psychiatrist": { 
    name: "Psychiatrist", 
    description: "mental health disorders, psychiatric medications, schizophrenia, bipolar disorder, ADHD",
    keywords: ["psychiatric treatment", "mental illness", "medication management", "bipolar treatment"]
  },
  "dermatologist": { 
    name: "Dermatologist", 
    description: "skin conditions, acne treatment, eczema, psoriasis, skin allergies, hair loss, cosmetic dermatology",
    keywords: ["skin doctor", "acne specialist", "skin treatment", "hair loss treatment"]
  },
  "gynecologist": { 
    name: "Gynecologist", 
    description: "women's health, pregnancy care, fertility issues, menstrual disorders, PCOS, menopause",
    keywords: ["women's doctor", "pregnancy specialist", "fertility doctor", "PCOS treatment"]
  },
  "urologist": { 
    name: "Urologist", 
    description: "urinary tract issues, kidney stones, prostate problems, male infertility, bladder disorders",
    keywords: ["kidney doctor", "prostate specialist", "urinary problems", "kidney stones treatment"]
  },
  "gastroenterologist": { 
    name: "Gastroenterologist", 
    description: "digestive system disorders, liver diseases, IBS, acid reflux, ulcers, colonoscopy",
    keywords: ["stomach doctor", "liver specialist", "digestive problems", "IBS treatment"]
  },
  "neuro-surgeon": { 
    name: "Neuro Surgeon", 
    description: "brain surgery, spinal surgery, brain tumors, spine disorders, head injuries",
    keywords: ["brain surgeon", "spine surgeon", "neurosurgery", "brain tumor treatment"]
  },
  "neurologist": { 
    name: "Neurologist", 
    description: "nervous system disorders, epilepsy, migraine, stroke, Parkinson's, multiple sclerosis",
    keywords: ["brain doctor", "nerve specialist", "epilepsy treatment", "migraine specialist"]
  },
  "general-surgeon": { 
    name: "General Surgeon", 
    description: "surgical procedures, hernia repair, appendectomy, gallbladder surgery, laparoscopic surgery",
    keywords: ["surgeon", "hernia surgery", "laparoscopic surgery", "appendix surgery"]
  },
  "orthopedic-surgeon": { 
    name: "Orthopedic Surgeon", 
    description: "bone and joint problems, fractures, joint replacement, sports injuries, arthritis",
    keywords: ["bone doctor", "joint specialist", "knee replacement", "sports injury doctor"]
  },
  "cardiologist": { 
    name: "Cardiologist", 
    description: "heart diseases, blood pressure, heart attack prevention, ECG, echocardiography",
    keywords: ["heart doctor", "cardiac specialist", "blood pressure treatment", "heart checkup"]
  },
  "ent-specialist": { 
    name: "ENT Specialist", 
    description: "ear, nose, throat problems, sinus issues, hearing loss, tonsillitis, sleep apnea",
    keywords: ["ear doctor", "throat specialist", "sinus treatment", "hearing problems"]
  },
  "pediatrician": { 
    name: "Pediatrician", 
    description: "child healthcare, vaccinations, growth monitoring, childhood illnesses, newborn care",
    keywords: ["child doctor", "baby specialist", "vaccination", "child health"]
  },
  "ophthalmologist": { 
    name: "Ophthalmologist", 
    description: "eye diseases, vision problems, cataract surgery, LASIK, glaucoma, retina disorders",
    keywords: ["eye doctor", "eye specialist", "cataract surgery", "vision treatment"]
  },
  "dentist": { 
    name: "Dentist", 
    description: "dental care, teeth cleaning, root canal, dental implants, braces, cosmetic dentistry",
    keywords: ["dental doctor", "teeth specialist", "root canal", "dental implants"]
  },
  "physiotherapist": { 
    name: "Physiotherapist", 
    description: "physical therapy, rehabilitation, sports injuries, back pain, mobility issues",
    keywords: ["physical therapy", "rehabilitation", "back pain treatment", "sports rehabilitation"]
  },
  "internal-medicine": { 
    name: "Internal Medicine Specialist", 
    description: "general medicine, chronic diseases, diabetes management, hypertension, fever",
    keywords: ["general physician", "diabetes doctor", "internal medicine", "chronic disease management"]
  },
  "pulmonologist": { 
    name: "Pulmonologist", 
    description: "lung diseases, asthma, COPD, tuberculosis, breathing problems, chest infections",
    keywords: ["lung doctor", "chest specialist", "asthma treatment", "breathing problems"]
  },
  "endocrinologist": { 
    name: "Endocrinologist", 
    description: "hormonal disorders, diabetes, thyroid problems, obesity, PCOS, metabolic disorders",
    keywords: ["hormone doctor", "diabetes specialist", "thyroid treatment", "endocrine disorders"]
  },
  "rheumatologist": { 
    name: "Rheumatologist", 
    description: "arthritis, joint pain, autoimmune diseases, lupus, gout, fibromyalgia",
    keywords: ["arthritis doctor", "joint pain specialist", "autoimmune treatment", "rheumatoid arthritis"]
  },
};

const SpecialistInCity = () => {
  const { city, specialist } = useParams();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isValidCity, setIsValidCity] = useState(true);

  const formattedCity = city ? city.charAt(0).toUpperCase() + city.slice(1).toLowerCase() : "";
  const specialistKey = specialist?.replace("best-", "") || "";
  const info = specialistInfo[specialistKey] || { name: specialistKey.replace(/-/g, " "), description: "", keywords: [] };
  const specialistName = info.name;

  useEffect(() => {
    const fetchDoctors = async () => {
      if (!city || !specialist) return;

      // First, try to find the specialization
      const { data: specializationData } = await supabase
        .from("doctor_specializations")
        .select("id, name")
        .ilike("name", `%${specialistName}%`)
        .limit(1);

      let query = supabase
        .from("doctors")
        .select(`
          id, full_name, photo_url, qualification, experience_years, 
          city, hospital_name, clinic_name, rating, review_count, consultation_fee, 
          video_consultation, specialization_id, availability,
          doctor_specializations (name, slug)
        `)
        .eq("status", "approved")
        .ilike("city", formattedCity)
        .order("is_featured", { ascending: false })
        .order("rating", { ascending: false });

      if (specializationData && specializationData.length > 0) {
        query = query.eq("specialization_id", specializationData[0].id);
      }

      const { data, error } = await query.limit(20);

      if (data && data.length > 0) {
        setDoctors(data);
      } else {
        // Validate city exists
        const { data: cityData } = await supabase
          .from("cities")
          .select("id")
          .ilike("name", formattedCity)
          .limit(1);

        if (!cityData || cityData.length === 0) {
          setIsValidCity(false);
        }
      }

      setLoading(false);
    };

    fetchDoctors();
  }, [city, specialist, formattedCity, specialistName]);

  if (!isValidCity) {
    navigate("/find-doctors");
    return null;
  }

  const pageTitle = `Best ${specialistName} in ${formattedCity} - Book Appointment | MyPakLabs`;
  const pageDescription = `Find the best ${specialistName.toLowerCase()} in ${formattedCity}. ${info.description}. Compare fees, read reviews & book appointments with verified ${specialistName.toLowerCase()}s near you. Up to 30% discount on consultations.`;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={`best ${specialistName.toLowerCase()} in ${formattedCity}, ${specialistName.toLowerCase()} ${formattedCity}, ${info.keywords.join(", ")}, ${formattedCity} doctors, MyPakLabs`} />
        <link rel="canonical" href={`https://mypaklab.lovable.app/${city}/best-${specialistKey}`} />
        
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-background py-10 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Link to="/" className="hover:text-primary">Home</Link>
                <ChevronRight className="w-4 h-4" />
                <Link to="/find-doctors" className="hover:text-primary">Doctors</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-foreground">{formattedCity}</span>
              </div>
              
              <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
                Best {specialistName} in {formattedCity}
              </h1>
              <p className="text-muted-foreground mb-6 text-sm md:text-base">
                Find and book appointments with the top {specialistName.toLowerCase()}s in {formattedCity}. 
                Compare consultation fees, read patient reviews, and get expert medical care for {info.description.split(",").slice(0, 3).join(", ")}.
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link to={`/find-doctors?city=${formattedCity}`}>
                    <Search className="w-4 h-4 mr-2" />
                    Find More Doctors
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/video-consultation">
                    Video Consultation
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Doctors List */}
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-xl md:text-2xl font-semibold mb-6">
              {doctors.length > 0 ? `Top ${specialistName}s in ${formattedCity}` : `${specialistName}s in ${formattedCity}`}
            </h2>

            {loading ? (
              <div className="grid gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-40 w-full rounded-lg" />
                ))}
              </div>
            ) : doctors.length > 0 ? (
              <div className="grid gap-4">
                {doctors.map((doctor) => (
                  <DoctorListCard key={doctor.id} doctor={doctor} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <Stethoscope className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No {specialistName}s found in {formattedCity}</h3>
                <p className="text-muted-foreground mb-4">
                  We're expanding our network. Check back soon or browse all doctors.
                </p>
                <Button asChild>
                  <Link to="/find-doctors">Browse All Doctors</Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* SEO Content Section */}
        <section className="py-8 md:py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl">
              <h2 className="text-xl font-semibold mb-4">
                About {specialistName}s in {formattedCity}
              </h2>
              <p className="text-muted-foreground mb-6">
                Looking for the best {specialistName.toLowerCase()} in {formattedCity}? MyPakLabs helps you find verified and experienced 
                {specialistName.toLowerCase()}s who specialize in {info.description}. Our platform connects you with 
                licensed medical professionals who offer both in-clinic visits and online video consultations.
              </p>
              
              <h3 className="text-lg font-medium mb-3">Why Choose MyPakLabs?</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
                <li>Verified and licensed {specialistName.toLowerCase()}s in {formattedCity}</li>
                <li>Compare consultation fees and save up to 30%</li>
                <li>Read genuine patient reviews and ratings</li>
                <li>Book appointments online or via phone</li>
                <li>Video consultations available for convenience</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">Related Medical Services in {formattedCity}</h3>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { label: `All Doctors in ${formattedCity}`, to: `/find-doctors?city=${encodeURIComponent(formattedCity)}` },
                    { label: `Labs in ${formattedCity}`, to: `/labs?city=${encodeURIComponent(formattedCity)}` },
                    { label: `Hospitals in ${formattedCity}`, to: `/hospitals?city=${encodeURIComponent(formattedCity)}` },
                    { label: `Pharmacies in ${formattedCity}`, to: `/pharmacies?city=${encodeURIComponent(formattedCity)}` },
                    { label: `Home Nursing in ${formattedCity}`, to: `/find-nurses?city=${encodeURIComponent(formattedCity)}` },
                  ] as const
                ).map((item, idx) => (
                  <span key={item.to} className="flex items-center gap-2">
                    <button
                      type="button"
                      className="text-primary hover:underline text-sm"
                      onClick={() => navigate(item.to)}
                    >
                      {item.label}
                    </button>
                    {idx < 4 && <span className="text-muted-foreground">•</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default SpecialistInCity;
