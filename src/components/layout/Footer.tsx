import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Clock, HeadphonesIcon } from "lucide-react";
import myPakLabsLogo from "@/assets/mypaklabs-logo.jpeg";
import { useNativePlatform } from "@/hooks/useNativePlatform";
import { cn } from "@/lib/utils";

const Footer = () => {
  const { isNative } = useNativePlatform();
  
  return (
    <footer className={cn(
      "bg-foreground text-background",
      isNative && "pb-20" // Extra padding for native bottom nav
    )}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src={myPakLabsLogo} 
                alt="MyPakLabs Logo" 
                className="h-12 w-auto object-contain bg-white rounded-lg p-1"
              />
              <span className="text-xl font-bold">MyPakLabs</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Verified Providers with Special Offers & Smart Savings on Medical Care. Access trusted doctors, labs, hospitals, and pharmacies with exclusive discounts.
            </p>
            <div className="flex gap-3">
              <a href="https://www.facebook.com/mypaklabs" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-background/10 rounded-lg flex items-center justify-center hover:bg-background/20 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://twitter.com/mypaklabs" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-background/10 rounded-lg flex items-center justify-center hover:bg-background/20 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/mypaklabs" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-background/10 rounded-lg flex items-center justify-center hover:bg-background/20 transition-colors">
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
              <li><Link to="/" className="text-muted-foreground hover:text-background text-sm transition-colors">Home</Link></li>
              <li><Link to="/labs" className="text-muted-foreground hover:text-background text-sm transition-colors">Browse Labs</Link></li>
              <li><Link to="/find-doctors" className="text-muted-foreground hover:text-background text-sm transition-colors">Find Doctors</Link></li>
              <li><Link to="/hospitals" className="text-muted-foreground hover:text-background text-sm transition-colors">Hospitals</Link></li>
              <li><Link to="/find-nurses" className="text-muted-foreground hover:text-background text-sm transition-colors">Nursing Services</Link></li>
              <li><Link to="/pharmacies" className="text-muted-foreground hover:text-background text-sm transition-colors">Find Pharmacies</Link></li>
              <li><Link to="/compare" className="text-muted-foreground hover:text-background text-sm transition-colors">Compare Prices</Link></li>
              <li><Link to="/reviews" className="text-muted-foreground hover:text-background text-sm transition-colors">Patient Reviews</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal & Partners</h4>
            <ul className="space-y-2">
              <li><Link to="/terms" className="text-muted-foreground hover:text-background text-sm transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="text-muted-foreground hover:text-background text-sm transition-colors">Privacy Policy</Link></li>
              <li><Link to="/partner-terms" className="text-muted-foreground hover:text-background text-sm transition-colors">Partner Lab Terms</Link></li>
              <li><Link to="/join-as-doctor" className="text-muted-foreground hover:text-background text-sm transition-colors">Join as Doctor</Link></li>
              <li><Link to="/join-as-nurse" className="text-muted-foreground hover:text-background text-sm transition-colors">Join as Nurse</Link></li>
              <li><Link to="/join-as-pharmacy" className="text-muted-foreground hover:text-background text-sm transition-colors">Join as Pharmacy</Link></li>
              <li><Link to="/help" className="text-muted-foreground hover:text-background text-sm transition-colors">Help Center</Link></li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="font-semibold mb-4">Need Help? Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <Phone className="w-4 h-4" />
                <a href="tel:+923167523434" className="hover:text-background transition-colors">03167523434</a>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <Mail className="w-4 h-4" />
                <a href="mailto:support@mypaklabs.com" className="hover:text-background transition-colors">support@mypaklabs.com</a>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="w-4 h-4" />
                <span>24/7 Online Assistance</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>Coverage: Islamabad & Rawalpindi</span>
              </li>
            </ul>
            
            {/* Trust Badge */}
            <div className="mt-4 p-3 bg-background/10 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <HeadphonesIcon className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-background">MyPakLabs Support</p>
                  <p className="text-xs text-muted-foreground">Fast & Reliable Assistance</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-background/10 mt-8 pt-8 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} MyPakLabs. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;