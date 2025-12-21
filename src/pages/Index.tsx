import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LabCard from "@/components/labs/LabCard";
import { labs } from "@/data/mockData";
import { FlaskConical, ArrowRight, Shield, Percent, Clock, CheckCircle, Building2, BarChart3, FileText, Sparkles, ChevronRight } from "lucide-react";
const Index = () => {
  const featuredLabs = labs.slice(0, 3);
  const steps = [{
    icon: Building2,
    title: "Choose a Lab",
    description: "Browse top-rated labs near you with exclusive discounts"
  }, {
    icon: FileText,
    title: "Select Tests",
    description: "Pick tests manually or upload your prescription"
  }, {
    icon: Sparkles,
    title: "Get Discount ID",
    description: "Receive a unique ID with locked discounted prices"
  }, {
    icon: CheckCircle,
    title: "Visit & Save",
    description: "Show your ID at the lab and pay the discounted rate"
  }];
  const benefits = [{
    icon: Percent,
    title: "Up to 35% Off",
    description: "Exclusive discounts on all lab tests across Pakistan"
  }, {
    icon: Shield,
    title: "Verified Labs",
    description: "All partner labs are ISO certified and trusted"
  }, {
    icon: Clock,
    title: "Quick Results",
    description: "Get your reports faster with priority processing"
  }, {
    icon: BarChart3,
    title: "Price Comparison",
    description: "Compare prices across labs to find the best deal"
  }];
  return <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="discount" className="mb-6 animate-fade-up">
              <Sparkles className="w-3 h-3 mr-1" />
              Save up to 35% on lab tests
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-up" style={{
            animationDelay: "0.1s"
          }}>
              Get Lab Tests at{" "}
              <span className="text-gradient">Discounted Prices</span>{" "}
              Across Pakistan
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-up" style={{
            animationDelay: "0.2s"
          }}>
              Compare prices from top diagnostic labs, get exclusive discounts, and download your unique discount ID for instant savings.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{
            animationDelay: "0.3s"
          }}>
              <Link to="/labs">
                <Button size="xl" variant="medical" className="w-full sm:w-auto">
                  Browse Labs
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/compare">
                <Button size="xl" variant="outline" className="w-full sm:w-auto">
                  Compare Prices
                  <BarChart3 className="w-5 h-5" />
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-6 mt-12 animate-fade-up" style={{
            animationDelay: "0.4s"
          }}>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="w-5 h-5 text-medical-green" />
                <span className="text-sm">50+ Partner Labs</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="w-5 h-5 text-medical-green" />
                <span className="text-sm">100K+ Tests Booked</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="w-5 h-5 text-medical-green" />
                <span className="text-sm">All Major Cities</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Get Discounts in 4 Simple Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => <Card key={index} variant="elevated" className="relative">
                <CardContent className="p-6 text-center">
                  <div className="absolute -top-3 -left-3 w-8 h-8 gradient-hero rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm shadow-glow">
                    {index + 1}
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </CardContent>
                {index < steps.length - 1 && <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ChevronRight className="w-6 h-6 text-muted-foreground/30" />
                  </div>}
              </Card>)}
          </div>
        </div>
      </section>

      {/* Featured Labs */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Badge variant="secondary" className="mb-2">Featured Labs</Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Top Diagnostic Labs
              </h2>
            </div>
            <Link to="/labs">
              <Button variant="ghost" className="hidden sm:flex">
                View All Labs
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredLabs.map(lab => <LabCard key={lab.id} lab={lab} />)}
          </div>

          <div className="text-center mt-8 sm:hidden">
            <Link to="/labs">
              <Button variant="outline">
                View All Labs
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-24 gradient-hero">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
              Why Choose Medilabs?
            </h2>
            <p className="text-primary-foreground/80 mt-3 max-w-xl mx-auto">
              We're committed to making healthcare affordable and accessible for everyone in Pakistan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => <Card key={index} variant="glass" className="border-primary-foreground/10">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary-foreground/10 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg text-primary-foreground mb-2 bg-card-foreground">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-primary-foreground/70 bg-medical-blue">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <Card variant="elevated" className="p-8 md:p-12 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="w-16 h-16 gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow">
                <FlaskConical className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Ready to Save on Your Lab Tests?
              </h2>
              <p className="text-muted-foreground mb-8">
                Join thousands of patients who are already saving money on their diagnostic tests. Sign up today and get exclusive discounts!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth?mode=signup">
                  <Button size="lg" variant="medical" className="w-full sm:w-auto">
                    Create Free Account
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/compare">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Compare Prices First
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>;
};
export default Index;