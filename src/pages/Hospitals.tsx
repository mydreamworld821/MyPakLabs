import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Hospital } from "lucide-react";

const Hospitals = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Hospital className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Hospitals
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Find hospitals near you with their specialties and contact information.
            </p>
            <Card className="max-w-md mx-auto">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  🚀 Coming Soon! Hospital directory is under development.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Hospitals;
