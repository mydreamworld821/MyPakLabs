import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

const Terms = () => {
  const sections = [
    {
      title: "Acceptance of Terms",
      content: "By using the MyPakLabs app, website, or services, you agree to these Terms & Conditions. Users must be 18+ or using the app as a patient attendant with patient consent."
    },
    {
      title: "Service Nature",
      content: "MyPakLabs is a digital platform that connects patients with independent diagnostic laboratories. MyPakLabs does not perform medical tests, provide diagnoses, or operate any laboratory."
    },
    {
      title: "User Responsibility",
      content: "Users are responsible for providing accurate personal details, correct test selections, and clear prescription uploads. MyPakLabs is not liable for errors caused by incorrect or incomplete information."
    },
    {
      title: "Prescription Upload",
      content: "Uploaded prescriptions are reviewed only to identify test names for pricing and discounts. MyPakLabs does not alter, interpret, or provide medical advice related to prescriptions."
    },
    {
      title: "Pricing & Discounts",
      content: "All test prices and discounts are controlled by MyPakLabs admin and may vary by laboratory. Discounts are time-limited and subject to availability. Final prices are locked after confirmation."
    },
    {
      title: "Unique Discount ID",
      content: "Each generated Unique Discount ID is single-use, time-bound, and valid only at the selected laboratory. Reuse, sharing, or duplication of IDs is strictly prohibited."
    },
    {
      title: "Lab Visit & Service Execution",
      content: "Patients must present the Unique ID at the selected lab branch. Laboratories may verify identity and refuse service if the ID is invalid or expired. MyPakLabs is not responsible for lab operations or delays."
    },
    {
      title: "Medical Disclaimer",
      content: "MyPakLabs does not provide medical advice, diagnosis, or treatment. All medical decisions and test interpretations must be made by qualified healthcare professionals."
    },
    {
      title: "Refund & Cancellation",
      content: "Once a Unique Discount ID is generated, prices cannot be changed and refunds are not guaranteed. Any service issues are subject to review without obligation of compensation."
    },
    {
      title: "Data Privacy",
      content: "User data and prescription images are stored securely and shared only with relevant labs for service fulfillment. MyPakLabs does not sell personal data to third parties."
    },
    {
      title: "Account Misuse",
      content: "MyPakLabs may suspend or terminate accounts for fraudulent activity, fake prescriptions, misuse of discount IDs, or violation of these terms without prior notice."
    },
    {
      title: "Limitation of Liability",
      content: "MyPakLabs is not liable for medical outcomes, lab errors, test report accuracy, or third-party service failures. Liability is limited to digital facilitation only."
    },
    {
      title: "Changes to Terms",
      content: "MyPakLabs may update these Terms & Conditions at any time. Continued use of the platform implies acceptance of updated terms."
    },
    {
      title: "Governing Law",
      content: "These terms are governed by the laws of Pakistan. Any disputes shall be subject to Pakistani jurisdiction."
    },
    {
      title: "Contact & Support",
      content: "For assistance or complaints, users may contact MyPakLabs through official support channels provided within the app or website."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="w-16 h-16 gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow">
                <FileText className="w-8 h-8 text-primary-foreground" />
              </div>
              <Badge variant="secondary" className="mb-4">Legal</Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Terms & Conditions
              </h1>
              <p className="text-muted-foreground">
                (Patients & Patient Attendants)
              </p>
            </div>

            {/* Content */}
            <div className="space-y-6">
              {sections.map((section, index) => (
                <Card key={index} variant="elevated">
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                      <span className="w-8 h-8 gradient-hero rounded-lg flex items-center justify-center text-primary-foreground text-sm font-bold">
                        {index + 1}
                      </span>
                      {section.title}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {section.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

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

export default Terms;
