import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope } from "lucide-react";

const FindDoctors = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Stethoscope className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Find Doctors
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Search and book appointments with PMC verified doctors across Pakistan.
            </p>
            <Card className="max-w-md mx-auto">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  🚀 Coming Soon! We're working on bringing you the best doctors.
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

export default FindDoctors;
