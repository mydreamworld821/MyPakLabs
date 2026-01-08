import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="pt-24 pb-8 gradient-hero relative overflow-hidden">
        <div className="container mx-auto px-4 relative text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Privacy Policy
          </h1>
          <p className="text-white/80">
            How we collect, use, and protect your information
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardContent className="p-8 space-y-8">
              <div>
                <h2 className="text-xl font-semibold mb-3">Information We Collect</h2>
                <p className="text-muted-foreground mb-4">
                  We collect information you provide directly to us, including:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Personal information (name, email, phone number)</li>
                  <li>Account credentials</li>
                  <li>Prescription images and medical test selections</li>
                  <li>Payment and transaction information</li>
                  <li>Communications with our support team</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">How We Use Your Information</h2>
                <p className="text-muted-foreground mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Connect you with partner laboratories</li>
                  <li>Send you technical notices and support messages</li>
                  <li>Respond to your comments, questions, and requests</li>
                  <li>Communicate promotional offers (with your consent)</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">Data Sharing</h2>
                <p className="text-muted-foreground mb-4">
                  We share your information only in the following circumstances:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>With partner laboratories to fulfill your test bookings</li>
                  <li>With service providers who assist in our operations</li>
                  <li>When required by law or legal process</li>
                  <li>To protect the rights and safety of MyPakLabs and users</li>
                </ul>
                <p className="text-muted-foreground mt-4 font-medium">
                  We do NOT sell your personal data to third parties.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">Data Security</h2>
                <p className="text-muted-foreground">
                  We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. Prescription images are stored securely and accessed only by authorized personnel. All data transmissions are encrypted using industry-standard protocols.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">Data Retention</h2>
                <p className="text-muted-foreground">
                  We retain your personal information for as long as necessary to provide our services and fulfill the purposes described in this policy. Prescription images are retained for a limited period after processing and may be deleted upon your request.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">Your Rights</h2>
                <p className="text-muted-foreground mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your account and data</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Request a copy of your data</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">Cookies and Tracking</h2>
                <p className="text-muted-foreground">
                  We use cookies and similar technologies to enhance your experience, analyze usage patterns, and deliver personalized content. You can manage cookie preferences through your browser settings.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">Children's Privacy</h2>
                <p className="text-muted-foreground">
                  Our services are not intended for children under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">Changes to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the effective date. Continued use of our services after changes constitutes acceptance of the updated policy.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have any questions about this Privacy Policy, please contact us:
                </p>
                <div className="mt-4 space-y-2 text-muted-foreground">
                  <p>📧 Email: <a href="mailto:mhmmdaqib@gmail.com" className="text-primary hover:underline">mhmmdaqib@gmail.com</a></p>
                  <p>📞 Phone: <a href="tel:03167523434" className="text-primary hover:underline">03167523434</a></p>
                  <p>📍 Address: G13-1 Islamabad</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  <strong>Effective Date:</strong> January 2025
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Privacy;
