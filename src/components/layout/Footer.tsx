import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="/images/mypaklabs-logo.png" 
                alt="My Pak Labs" 
                className="w-10 h-10 object-contain bg-white rounded-lg p-1"
              />
              <span className="text-xl font-bold">My Pak Labs</span>
            </Link>
            <p className="text-primary-foreground/80 text-sm">
              Pakistan's trusted platform for discounted lab tests. Compare prices, get exclusive discounts, and save on healthcare.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center hover:bg-primary-foreground/20 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center hover:bg-primary-foreground/20 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center hover:bg-primary-foreground/20 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center hover:bg-primary-foreground/20 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/labs" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">Browse Labs</Link></li>
              <li><Link to="/compare" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">Compare Prices</Link></li>
              <li><Link to="/auth" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">Login / Sign Up</Link></li>
              <li><Link to="/help" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">Help Center</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/terms" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">Privacy Policy</Link></li>
              <li><Link to="/partner-terms" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">Partner Lab Terms</Link></li>
              <li><Link to="/help" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">Contact Support</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-primary-foreground/70 text-sm">
                <Phone className="w-4 h-4" />
                <a href="tel:+923167523434" className="hover:text-primary-foreground transition-colors">0316-7523434</a>
              </li>
              <li className="flex items-center gap-2 text-primary-foreground/70 text-sm">
                <Mail className="w-4 h-4" />
                <a href="mailto:mhmmdaqib@gmail.com" className="hover:text-primary-foreground transition-colors">mhmmdaqib@gmail.com</a>
              </li>
              <li className="flex items-start gap-2 text-primary-foreground/70 text-sm">
                <MapPin className="w-4 h-4 mt-0.5" />
                Islamabad, Pakistan
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-8 pt-8 text-center text-primary-foreground/70 text-sm">
          <p>&copy; {new Date().getFullYear()} My Pak Labs. All rights reserved. | www.mypaklabs.com</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
