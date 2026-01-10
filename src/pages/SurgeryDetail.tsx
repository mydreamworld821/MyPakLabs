import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { Phone, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import defaultSurgeryImage from "@/assets/default-surgery.jpg";

interface Surgery {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  image_position_x: number;
  image_position_y: number;
  discount_percentage: number;
  hospital_discount_percentage: number;
  doctor_discount_percentage: number;
  price_range: string | null;
}

const SurgeryDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [surgery, setSurgery] = useState<Surgery | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    question: "",
    phone: "",
    name: "",
    city: "",
  });

  useEffect(() => {
    fetchSurgery();
  }, [slug]);

  const fetchSurgery = async () => {
    if (!slug) return;
    
    try {
      const { data, error } = await supabase
        .from("surgeries")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      setSurgery(data);
    } catch (error) {
      console.error("Failed to fetch surgery:", error);
      toast.error("Surgery not found");
      navigate("/surgeries");
    } finally {
      setLoading(false);
    }
  };

  const getTotalDiscount = () => {
    if (!surgery) return 0;
    return (
      surgery.discount_percentage +
      surgery.hospital_discount_percentage +
      surgery.doctor_discount_percentage
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phone || !formData.name) {
      toast.error("Please fill in required fields");
      return;
    }

    setSubmitting(true);
    
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast.success("We will contact you soon!");
    setFormData({ question: "", phone: "", name: "", city: "" });
    setSubmitting(false);
  };

  const faqs = [
    {
      question: `How to book ${surgery?.name || "this surgery"} through MyPakLabs?`,
      answer: "You can book a free consultation call by filling out the form on this page. Our medical experts will contact you and guide you through the entire process, including finding the best doctors and hospitals.",
    },
    {
      question: `What is the cost of ${surgery?.name || "this surgery"} in Pakistan?`,
      answer: surgery?.price_range 
        ? `The typical cost range is ${surgery.price_range}. However, costs may vary depending on the hospital, doctor, and specific case requirements. Contact us for accurate pricing.`
        : "Costs vary depending on the hospital, doctor, and specific case requirements. Fill out the form to get accurate pricing information.",
    },
    {
      question: `Is ${surgery?.name || "this surgery"} available in all cities?`,
      answer: "Yes, we have partnered with top hospitals and surgeons across major cities in Pakistan including Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad, and more.",
    },
    {
      question: "What are the benefits of booking through MyPakLabs?",
      answer: `You get exclusive discounts of up to ${getTotalDiscount()}% off, verified surgeons, quality assurance, and dedicated support throughout your treatment journey.`,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-8">
          <Skeleton className="h-64 w-full" />
          <div className="container mx-auto px-4 py-8">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!surgery) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-8">
        {/* Hero Banner */}
        <div className="relative h-64 md:h-80 bg-gradient-to-r from-primary/10 to-primary/5 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={surgery.image_url || defaultSurgeryImage}
              alt={surgery.name}
              className="w-full h-full object-cover opacity-30"
              style={{
                objectPosition: `${surgery.image_position_x}% ${surgery.image_position_y}%`,
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultSurgeryImage;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          </div>
          
          <div className="container mx-auto px-4 h-full flex items-center relative z-10">
            <div className="max-w-2xl">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/surgeries")}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Surgeries
              </Button>
              
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/images/mypaklabs-logo.png"
                  alt="MyPakLabs"
                  className="h-8 w-auto"
                />
              </div>
              
              <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-3">
                {surgery.name}
              </h1>
              
              <div className="flex flex-wrap gap-2">
                {getTotalDiscount() > 0 && (
                  <Badge className="bg-primary text-primary-foreground text-sm px-3 py-1">
                    {getTotalDiscount()}% Discount Available
                  </Badge>
                )}
                {surgery.price_range && (
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    {surgery.price_range}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Description & FAQs */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              {surgery.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>About {surgery.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {surgery.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Benefits */}
              <Card>
                <CardHeader>
                  <CardTitle>Why Choose MyPakLabs?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    "Verified and experienced surgeons",
                    "Exclusive discounts on surgery costs",
                    "Quality assured partner hospitals",
                    "Dedicated patient support team",
                    "Free consultation and guidance",
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* FAQs */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {faqs.map((faq, index) => (
                    <AccordionItem 
                      key={index} 
                      value={`faq-${index}`}
                      className="bg-muted/30 border rounded-lg px-4"
                    >
                      <AccordionTrigger className="text-left hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 border-primary/20">
                <CardHeader className="bg-primary/5 border-b">
                  <CardTitle className="text-primary flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Get a Call from Our Medical Expert
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Our qualified team will get back with authentic answers!
                  </p>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="question">Write your Question</Label>
                      <Textarea
                        id="question"
                        placeholder="Ask any question about doctor, costs, services..."
                        value={formData.question}
                        onChange={(e) =>
                          setFormData({ ...formData, question: e.target.value })
                        }
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Your contact # *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="03XX-XXXXXXX"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="Your city"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={submitting}
                    >
                      {submitting ? "Submitting..." : "Book a Free Call"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SurgeryDetail;
