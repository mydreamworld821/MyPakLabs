import { Helmet } from "react-helmet-async";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Stethoscope, 
  FlaskConical, 
  Heart, 
  Pill, 
  Star 
} from "lucide-react";

const Reviews = () => {
  return (
    <>
      <Helmet>
        <title>Patient Reviews | MyPakLabs</title>
        <meta
          name="description"
          content="Read patient reviews and testimonials about doctors, labs, hospitals, nurses, and pharmacies on MyPakLabs."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-primary/10 to-background py-12">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
              <h1 className="text-3xl md:text-4xl font-bold">Patient Reviews</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Real experiences from real patients. Read verified reviews and share 
              your own experience to help others make informed healthcare decisions.
            </p>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="platform" className="space-y-6">
            <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent justify-center">
              <TabsTrigger 
                value="platform" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Star className="h-4 w-4" />
                MyPakLabs
              </TabsTrigger>
              <TabsTrigger 
                value="doctor" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Stethoscope className="h-4 w-4" />
                Doctors
              </TabsTrigger>
              <TabsTrigger 
                value="lab" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <FlaskConical className="h-4 w-4" />
                Labs
              </TabsTrigger>
              <TabsTrigger 
                value="hospital" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Building2 className="h-4 w-4" />
                Hospitals
              </TabsTrigger>
              <TabsTrigger 
                value="nurse" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Heart className="h-4 w-4" />
                Nurses
              </TabsTrigger>
              <TabsTrigger 
                value="pharmacy" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Pill className="h-4 w-4" />
                Pharmacies
              </TabsTrigger>
            </TabsList>

            <TabsContent value="platform" className="mt-6">
              <ReviewsSection
                entityType="platform"
                entityName="MyPakLabs"
                showForm={true}
              />
            </TabsContent>

            <TabsContent value="doctor" className="mt-6">
              <div className="text-center py-8 text-muted-foreground">
                <Stethoscope className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Doctor reviews are shown on individual doctor profiles.</p>
                <p className="text-sm mt-2">
                  Visit a doctor's profile to read or submit a review.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="lab" className="mt-6">
              <div className="text-center py-8 text-muted-foreground">
                <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Lab reviews are shown on individual lab profiles.</p>
                <p className="text-sm mt-2">
                  Visit a lab's profile to read or submit a review.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="hospital" className="mt-6">
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Hospital reviews are shown on individual hospital profiles.</p>
                <p className="text-sm mt-2">
                  Visit a hospital's profile to read or submit a review.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="nurse" className="mt-6">
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nurse reviews are shown on individual nurse profiles.</p>
                <p className="text-sm mt-2">
                  Visit a nurse's profile to read or submit a review.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="pharmacy" className="mt-6">
              <div className="text-center py-8 text-muted-foreground">
                <Pill className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Pharmacy reviews are shown on individual pharmacy profiles.</p>
                <p className="text-sm mt-2">
                  Visit a pharmacy's profile to read or submit a review.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Reviews;
