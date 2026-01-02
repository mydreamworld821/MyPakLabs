import { Link } from "react-router-dom";
import { FlaskConical, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 gradient-hero rounded-xl flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Medilabs</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Pakistan's trusted platform for discounted lab tests. Compare prices, get exclusive discounts, and save on healthcare.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 bg-background/10 rounded-lg flex items-center justify-center hover:bg-background/20 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-background/10 rounded-lg flex items-center justify-center hover:bg-background/20 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-background/10 rounded-lg flex items-center justify-center hover:bg-background/20 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-background/10 rounded-lg flex items-center justify-center hover:bg-background/20 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/labs" className="text-muted-foreground hover:text-background text-sm transition-colors">Browse Labs</Link></li>
              <li><Link to="/compare" className="text-muted-foreground hover:text-background text-sm transition-colors">Compare Prices</Link></li>
              <li><Link to="/auth" className="text-muted-foreground hover:text-background text-sm transition-colors">Login / Sign Up</Link></li>
              <li><a href="#" className="text-muted-foreground hover:text-background text-sm transition-colors">How It Works</a></li>
            </ul>
          </div>

          {/* Popular Tests */}
          <div>
            <h4 className="font-semibold mb-4">Popular Tests</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-muted-foreground hover:text-background text-sm transition-colors">Complete Blood Count</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-background text-sm transition-colors">Thyroid Profile</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-background text-sm transition-colors">Vitamin D Test</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-background text-sm transition-colors">Lipid Profile</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-background text-sm transition-colors">HbA1c</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <Phone className="w-4 h-4" />
                03167523434
              </li>
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <Mail className="w-4 h-4" />
                mhmmdaqib@gmail.com
              </li>
              <li className="flex items-start gap-2 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 mt-0.5" />
                G13-1 Islamabad
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 mt-8 pt-8 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} Medilabs. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
