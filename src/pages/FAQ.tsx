import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SEOHead } from '@/components/SEOHead';

export const FAQ = () => {
  const faqs = [
    {
      question: 'What is Xavorian?',
      answer: 'Xavorian is a secure real estate marketplace platform that connects property buyers, sellers, and agents. We use AI-powered document verification and secure escrow services to ensure safe, transparent transactions.',
    },
    {
      question: 'How does the AI verification system work?',
      answer: 'Our AI system analyzes uploaded documents (C of O, deeds, surveys, IDs) for authenticity, comparing them against known fraud patterns and databases. It generates confidence scores and flags discrepancies for human review. However, AI verification is not infallible, and users should still conduct independent due diligence.',
    },
    {
      question: 'Is my personal information secure?',
      answer: 'Yes. We use bank-level encryption (TLS 1.2+ for transit, AES-256 for storage), role-based access controls, and regular security audits. We never sell your data to third parties. See our Privacy Policy for detailed information.',
    },
    {
      question: 'Do I need to complete KYC verification?',
      answer: 'KYC (Know Your Customer) verification is optional during signup but may be required for certain transactions, especially high-value properties or escrow services. Verified users gain additional trust badges and may have access to premium features.',
    },
    {
      question: 'How does the escrow process work?',
      answer: 'When you initiate a transaction, funds are held securely by our third-party escrow agent. The seller cannot access funds until all agreed conditions are met (document verification, property inspection, etc.). If the deal falls through, funds are returned to the buyer minus escrow fees.',
    },
    {
      question: 'What documents do I need to list a property?',
      answer: 'To list a property, you typically need: Certificate of Occupancy (C of O), property deed, survey documents, and valid government-issued ID. Our AI system will verify these documents before your listing is published.',
    },
    {
      question: 'How much do Xavorian services cost?',
      answer: 'Creating an account and browsing listings is free. We charge a small transaction fee (typically 1-2%) on completed escrow transactions. Sellers may pay a listing fee for premium placement. Exact fees are displayed before you commit to any transaction.',
    },
    {
      question: 'Can I trust the property listings?',
      answer: 'While we implement AI verification and fraud detection, we cannot guarantee 100% authenticity. We recommend conducting independent inspections, title searches, and legal reviews before making purchase decisions. Look for verified badges and check seller ratings.',
    },
    {
      question: 'What happens if I discover fraud?',
      answer: 'Report suspected fraud immediately through our platform or by contacting support@xavorian.com. We take fraud seriously and will investigate all reports. If fraud is confirmed, we will take action including account suspension, legal action, and working with law enforcement.',
    },
    {
      question: 'How do I contact customer support?',
      answer: 'You can reach our support team via the Contact page, email at support@xavorian.com, or through our AI-powered chat system. For urgent issues, use the "Human Escalation" option to connect with a live agent.',
    },
    {
      question: 'Can I sell or buy properties in other countries?',
      answer: 'Currently, Xavorian primarily serves the Nigerian market. We are working to expand to other African countries and eventually global markets. Cross-border transactions require additional compliance checks and may have longer processing times.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept bank transfers, credit/debit cards, mobile money (where available), and cryptocurrency for certain transactions. Payment options vary by property and seller. All payments are processed through secure, PCI DSS compliant systems.',
    },
    {
      question: 'How long does verification take?',
      answer: 'AI verification is typically instant to a few minutes. If documents are flagged for human review, it may take 24-48 hours. Complex cases or missing information may take longer. You\'ll receive email notifications at each stage.',
    },
    {
      question: 'Can I edit or delete my listing?',
      answer: 'Yes, you can edit your listings at any time from your Dashboard > My Listings. Deleting a listing is permanent and cannot be undone. If there are active negotiations or escrow transactions, you may need to resolve those before deletion.',
    },
    {
      question: 'What if the property I purchased has issues?',
      answer: 'Property condition disputes should be raised during the inspection period before funds are released from escrow. Xavorian is not responsible for property defects, but we can facilitate communication and dispute resolution. Consider purchasing title insurance and professional inspections.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="relative bg-gradient-to-br from-primary/10 via-background to-accent-purple/10 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Frequently Asked <span className="text-gradient-primary">Questions</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Find answers to common questions about Xavorian
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-white rounded-xl border-2 border-light-purple-border px-6 hover-lift"
              >
                <AccordionTrigger className="text-left text-lg font-semibold text-foreground hover:text-light-purple-accent">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 bg-gradient-to-r from-primary/10 to-accent-purple/10 rounded-xl p-8 border-2 border-light-purple-border text-center">
            <h3 className="text-2xl font-bold mb-4 text-foreground">Still have questions?</h3>
            <p className="text-muted-foreground mb-6">
              Our support team is here to help. Contact us anytime.
            </p>
            <a
              href="/contact"
              className="inline-block bg-gradient-to-r from-primary to-accent-purple text-white font-semibold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
