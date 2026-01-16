import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const faqs = [
  {
    question: "How do I book a lab test on MyPakLabs?",
    answer: "Simply search for your required test, compare prices from verified labs, select your preferred lab, and book online. You'll receive a booking confirmation with all details including the lab address and discount voucher."
  },
  {
    question: "Are the doctors on MyPakLabs verified?",
    answer: "Yes, all doctors listed on MyPakLabs are PMC (Pakistan Medical Commission) and PMDC verified. We verify their credentials, qualifications, and registration before listing them on our platform."
  },
  {
    question: "How much can I save on lab tests?",
    answer: "Patients typically save 15-35% on lab tests through MyPakLabs. Our partner labs offer exclusive discounts that are only available through our platform."
  },
  {
    question: "Is home sample collection available?",
    answer: "Yes, many of our partner labs offer home sample collection services. You can check availability for your location when booking a test."
  },
  {
    question: "How do I book a doctor appointment?",
    answer: "Browse our verified doctors by specialty or location, view their profiles, fees, and available slots. Book online for video consultation or in-clinic visits with instant confirmation."
  },
  {
    question: "What cities does MyPakLabs serve?",
    answer: "MyPakLabs currently serves major cities in Pakistan including Islamabad, Rawalpindi, Lahore, Karachi, and other major cities. We're continuously expanding our network."
  },
  {
    question: "Is my medical data secure on MyPakLabs?",
    answer: "Absolutely. We use industry-standard encryption and security protocols to protect your personal and medical information. Your data is never shared with third parties without your consent."
  },
  {
    question: "Can I get home nursing services through MyPakLabs?",
    answer: "Yes, we offer verified home nursing services including elderly care, post-operative care, injections, wound dressing, and emergency nursing assistance in your city."
  }
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // Generate FAQ Schema for SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <section className="py-12 bg-muted/30">
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>
      
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground">
            Find answers to common questions about MyPakLabs
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <span className="font-medium text-foreground pr-4">
                  {faq.question}
                </span>
                <ChevronDown 
                  className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-4 pb-4">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
