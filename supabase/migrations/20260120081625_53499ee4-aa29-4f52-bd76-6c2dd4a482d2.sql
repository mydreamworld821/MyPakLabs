-- Create legal_pages table for dynamic Terms, Privacy, and Partner Terms
CREATE TABLE public.legal_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_type TEXT NOT NULL, -- 'terms', 'privacy', 'partner_lab', 'partner_nurse', 'partner_pharmacy', 'partner_doctor'
  title TEXT NOT NULL,
  subtitle TEXT,
  badge_text TEXT DEFAULT 'Legal',
  icon_name TEXT DEFAULT 'FileText',
  sections JSONB NOT NULL DEFAULT '[]', -- Array of {title, content}
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  show_in_footer BOOLEAN DEFAULT true,
  footer_section TEXT DEFAULT 'legal', -- 'legal' or 'partners'
  footer_label TEXT,
  route_path TEXT NOT NULL UNIQUE, -- e.g. '/terms', '/partner-nurse-terms'
  last_updated TEXT DEFAULT 'January 2026',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;

-- Public can read active pages
CREATE POLICY "Anyone can view active legal pages"
ON public.legal_pages
FOR SELECT
USING (is_active = true);

-- Only admins can manage
CREATE POLICY "Admins can manage legal pages"
ON public.legal_pages
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_legal_pages_updated_at
  BEFORE UPDATE ON public.legal_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert existing pages as seed data
INSERT INTO public.legal_pages (page_type, title, subtitle, badge_text, icon_name, route_path, footer_section, footer_label, sections) VALUES
('terms', 'Terms & Conditions', '(Patients & Patient Attendants)', 'Legal', 'FileText', '/terms', 'legal', 'Terms & Conditions', '[
  {"title": "Acceptance of Terms", "content": "By using the MyPakLabs app, website, or services, you agree to these Terms & Conditions. Users must be 18+ or using the app as a patient attendant with patient consent."},
  {"title": "Service Nature", "content": "MyPakLabs is a digital platform that connects patients with independent diagnostic laboratories. MyPakLabs does not perform medical tests, provide diagnoses, or operate any laboratory."},
  {"title": "User Responsibility", "content": "Users are responsible for providing accurate personal details, correct test selections, and clear prescription uploads. MyPakLabs is not liable for errors caused by incorrect or incomplete information."},
  {"title": "Prescription Upload", "content": "Uploaded prescriptions are reviewed only to identify test names for pricing and discounts. MyPakLabs does not alter, interpret, or provide medical advice related to prescriptions."},
  {"title": "Pricing & Discounts", "content": "All test prices and discounts are controlled by MyPakLabs admin and may vary by laboratory. Discounts are time-limited and subject to availability. Final prices are locked after confirmation."},
  {"title": "Unique Discount ID", "content": "Each generated Unique Discount ID is single-use, time-bound, and valid only at the selected laboratory. Reuse, sharing, or duplication of IDs is strictly prohibited."},
  {"title": "Lab Visit & Service Execution", "content": "Patients must present the Unique ID at the selected lab branch. Laboratories may verify identity and refuse service if the ID is invalid or expired. MyPakLabs is not responsible for lab operations or delays."},
  {"title": "Medical Disclaimer", "content": "MyPakLabs does not provide medical advice, diagnosis, or treatment. All medical decisions and test interpretations must be made by qualified healthcare professionals."},
  {"title": "Refund & Cancellation", "content": "Once a Unique Discount ID is generated, prices cannot be changed and refunds are not guaranteed. Any service issues are subject to review without obligation of compensation."},
  {"title": "Data Privacy", "content": "User data and prescription images are stored securely and shared only with relevant labs for service fulfillment. MyPakLabs does not sell personal data to third parties."},
  {"title": "Account Misuse", "content": "MyPakLabs may suspend or terminate accounts for fraudulent activity, fake prescriptions, misuse of discount IDs, or violation of these terms without prior notice."},
  {"title": "Limitation of Liability", "content": "MyPakLabs is not liable for medical outcomes, lab errors, test report accuracy, or third-party service failures. Liability is limited to digital facilitation only."},
  {"title": "Changes to Terms", "content": "MyPakLabs may update these Terms & Conditions at any time. Continued use of the platform implies acceptance of updated terms."},
  {"title": "Governing Law", "content": "These terms are governed by the laws of Pakistan. Any disputes shall be subject to Pakistani jurisdiction."},
  {"title": "Contact & Support", "content": "For assistance or complaints, users may contact MyPakLabs through official support channels provided within the app or website."}
]'::jsonb),

('privacy', 'Privacy Policy', 'How we collect, use, and protect your information', 'Privacy', 'Shield', '/privacy', 'legal', 'Privacy Policy', '[
  {"title": "Information We Collect", "content": "We collect information you provide directly to us, including: Personal information (name, email, phone number), Account credentials, Prescription images and medical test selections, Payment and transaction information, Communications with our support team."},
  {"title": "How We Use Your Information", "content": "We use the information we collect to: Provide, maintain, and improve our services, Process transactions and send related information, Connect you with partner laboratories, Send you technical notices and support messages, Respond to your comments, questions, and requests, Communicate promotional offers (with your consent)."},
  {"title": "Data Sharing", "content": "We share your information only in the following circumstances: With partner laboratories to fulfill your test bookings, With service providers who assist in our operations, When required by law or legal process, To protect the rights and safety of MyPakLabs and users. We do NOT sell your personal data to third parties."},
  {"title": "Data Security", "content": "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. Prescription images are stored securely and accessed only by authorized personnel. All data transmissions are encrypted using industry-standard protocols."},
  {"title": "Data Retention", "content": "We retain your personal information for as long as necessary to provide our services and fulfill the purposes described in this policy. Prescription images are retained for a limited period after processing and may be deleted upon your request."},
  {"title": "Your Rights", "content": "You have the right to: Access your personal information, Correct inaccurate data, Request deletion of your account and data, Opt-out of marketing communications, Request a copy of your data."},
  {"title": "Cookies and Tracking", "content": "We use cookies and similar technologies to enhance your experience, analyze usage patterns, and deliver personalized content. You can manage cookie preferences through your browser settings."},
  {"title": "Children''s Privacy", "content": "Our services are not intended for children under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately."},
  {"title": "Changes to This Policy", "content": "We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the effective date. Continued use of our services after changes constitutes acceptance of the updated policy."},
  {"title": "Contact Us", "content": "If you have any questions about this Privacy Policy, please contact us: Email: support@mypaklabs.com, Phone: 03167523434, Address: G13-1 Islamabad"}
]'::jsonb),

('partner_lab', 'Partner Lab Terms', 'Terms and conditions for diagnostic laboratories partnering with MyPakLabs', 'For Partners', 'Building', '/partner-terms', 'partners', 'Partner Lab Terms', '[
  {"title": "Platform Overview", "content": "MyPakLabs is a digital platform that connects patients with independent diagnostic laboratories and provides lab-approved discounted test pricing."},
  {"title": "Lab Responsibility", "content": "Partner laboratories remain fully responsible for sample collection, test execution, reporting accuracy, and medical compliance."},
  {"title": "Pricing Agreement", "content": "Test prices and discount rates are finalized by MyPakLabs admin and must be honored by the lab upon valid Unique Discount ID verification."},
  {"title": "Unique ID Validation", "content": "Each Unique Discount ID is single-use, time-bound, and applicable only to the selected laboratory branch."},
  {"title": "Verification Requirement", "content": "Laboratories must verify the authenticity and validity of the Unique Discount ID before providing services."},
  {"title": "No Price Modification", "content": "Laboratories are not permitted to modify prices, apply additional charges, or deny approved discounts without prior MyPakLabs approval."},
  {"title": "Non-Interference", "content": "MyPakLabs does not interfere in laboratory operations, staffing, equipment, or reporting procedures."},
  {"title": "Issue Reporting", "content": "Any service disputes, misuse of IDs, or technical issues must be reported to MyPakLabs support promptly."},
  {"title": "Liability Limitation", "content": "MyPakLabs is not liable for laboratory negligence, reporting delays, or medical outcomes."},
  {"title": "Terms Acceptance", "content": "Continued participation as a partner lab implies acceptance of these terms."}
]'::jsonb);