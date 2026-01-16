import { Shield, UserCheck, Award, Eye, Lock, Headphones } from 'lucide-react';

const trustItems = [
  {
    icon: UserCheck,
    text: "PMC & PMDC Verified Doctors"
  },
  {
    icon: Award,
    text: "Partner Labs with ISO & International Certifications"
  },
  {
    icon: Eye,
    text: "Transparent Pricing & No Hidden Charges"
  },
  {
    icon: Lock,
    text: "Secure Patient Data & Privacy Protection"
  },
  {
    icon: Headphones,
    text: "Local Customer Support in Pakistan"
  }
];

const TrustSection = () => {
  return (
    <section className="py-12 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Why Patients Trust MyPakLabs
            </h2>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          {trustItems.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-4 rounded-xl bg-card border border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground leading-snug">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
