import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import myPakLabsLogo from "@/assets/mypaklabs-logo.jpeg";

const PartnerTerms = () => {
  const terms = [
    "MyPakLabs is a digital platform that connects patients with independent diagnostic laboratories and provides lab-approved discounted test pricing.",
    "Partner laboratories remain fully responsible for sample collection, test execution, reporting accuracy, and medical compliance.",
    "Test prices and discount rates are finalized by MyPakLabs admin and must be honored by the lab upon valid Unique Discount ID verification.",
    "Each Unique Discount ID is single-use, time-bound, and applicable only to the selected laboratory branch.",
    "Laboratories must verify the authenticity and validity of the Unique Discount ID before providing services.",
    "Laboratories are not permitted to modify prices, apply additional charges, or deny approved discounts without prior MyPakLabs approval.",
    "MyPakLabs does not interfere in laboratory operations, staffing, equipment, or reporting procedures.",
    "Any service disputes, misuse of IDs, or technical issues must be reported to MyPakLabs support promptly.",
    "MyPakLabs is not liable for laboratory negligence, reporting delays, or medical outcomes.",
    "Continued participation as a partner lab implies acceptance of these terms."
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <img 
                src={myPakLabsLogo} 
                alt="MyPakLabs Logo" 
                className="w-24 h-24 mx-auto mb-6 rounded-2xl shadow-xl object-contain"
              />
              <Badge variant="secondary" className="mb-4">For Partners</Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Partner Lab Terms
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Terms and conditions for diagnostic laboratories partnering with MyPakLabs.
              </p>
            </div>

            {/* Terms List */}
            <Card variant="elevated">
              <CardContent className="p-8">
                <div className="space-y-6">
                  {terms.map((term, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 gradient-hero rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-primary-foreground" />
                        </div>
                      </div>
                      <p className="text-muted-foreground leading-relaxed pt-1">
                        {term}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact for Partnership */}
            <Card variant="elevated" className="mt-8">
              <CardContent className="p-8 text-center">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Interested in Partnering with MyPakLabs?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Contact our partnership team to discuss how your laboratory can join our network.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
                  <a href="tel:+923167523434" className="text-primary hover:underline">
                    +92 316 7523434
                  </a>
                  <span className="hidden sm:inline text-muted-foreground">|</span>
                  <a href="mailto:support@mypaklabs.com" className="text-primary hover:underline">
                    support@mypaklabs.com
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Last Updated */}
            <p className="text-center text-sm text-muted-foreground mt-12">
              Last updated: January 2026
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PartnerTerms;
