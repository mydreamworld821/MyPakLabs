import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  HelpCircle, 
  Phone, 
  Mail, 
  MessageSquare, 
  FileText, 
  Settings, 
  AlertTriangle, 
  Star,
  Clock,
  ShieldCheck
} from "lucide-react";

const HelpCenter = () => {
  const supportCategories = [
    {
      icon: MessageSquare,
      title: "Customer Support",
      description: "MyPakLabs support team is available to assist patients and attendants with app usage, test bookings, discount IDs, and general inquiries."
    },
    {
      icon: FileText,
      title: "Prescription & Order Help",
      description: "For issues related to prescription uploads, test confirmation, pricing, or Unique Discount ID verification, please contact our support team."
    },
    {
      icon: Settings,
      title: "Technical Assistance",
      description: "If you experience login problems, app errors, PDF download issues, or any technical difficulties, report them immediately for resolution."
    },
    {
      icon: AlertTriangle,
      title: "Lab-Related Complaints",
      description: "For concerns regarding lab behavior, discount application, or service refusal, contact support with your Unique Discount ID for review."
    },
    {
      icon: Star,
      title: "Feedback & Suggestions",
      description: "We value your feedback and suggestions to improve MyPakLabs services."
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
                <HelpCircle className="w-8 h-8 text-primary-foreground" />
              </div>
              <Badge variant="secondary" className="mb-4">Support</Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Help Center & Contact
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We're here to help you with any questions or concerns about MyPakLabs services.
              </p>
            </div>

            {/* Support Categories */}
            <div className="grid gap-6 mb-12">
              {supportCategories.map((category, index) => (
                <Card key={index} variant="elevated">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 gradient-hero rounded-xl flex items-center justify-center flex-shrink-0">
                        <category.icon className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {category.title}
                        </h3>
                        <p className="text-muted-foreground">
                          {category.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Contact Information */}
            <Card variant="elevated" className="mb-8">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
                  Contact Information
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium text-foreground">+92 347 8763821</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Alternate Phone</p>
                        <p className="font-medium text-foreground">+92 316 7523434</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium text-foreground">mhmmdaqib@gmail.com</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Response Time & Official Communication */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card variant="elevated">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">Response Time</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Support requests are handled during working hours. Response time may vary depending on the nature of the issue.
                  </p>
                </CardContent>
              </Card>
              
              <Card variant="elevated">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">Official Communication</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    MyPakLabs communicates only through the above official contact details. Please do not share personal or medical information with unauthorized sources.
                  </p>
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

export default HelpCenter;
