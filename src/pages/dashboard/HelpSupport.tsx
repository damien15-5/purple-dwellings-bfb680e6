import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  HelpCircle, 
  MessageSquare, 
  FileText, 
  Lock,
  Shield,
  Book,
  ExternalLink,
  Send,
  Search
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  {
    question: 'How does the escrow system work?',
    answer: 'Our escrow system securely holds payment until both buyer and seller fulfill their obligations. Funds are only released when both parties confirm the transaction is complete.',
  },
  {
    question: 'How long does document verification take?',
    answer: 'Document verification typically takes 1-2 business days. You\'ll receive a notification once your documents have been reviewed.',
  },
  {
    question: 'What documents do I need to upload?',
    answer: 'You need to upload property documents including receipt, title deeds, and any relevant permits or certificates. At least 3 documents are required.',
  },
  {
    question: 'How do I raise a dispute?',
    answer: 'You can raise a dispute through the escrow transaction page. Our team will review the case and help mediate a resolution.',
  },
  {
    question: 'When are funds released from escrow?',
    answer: 'Funds are released after the inspection period ends and both parties confirm the transaction is satisfactory.',
  },
];

export const HelpSupport = () => {
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
  });

  const handleSubmit = () => {
    console.log('Contact form submitted:', contactForm);
    setContactForm({ subject: '', message: '' });
  };

  return (
    <div className="max-w-6xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Help & Support</h1>
        <p className="text-muted-foreground">Get help with your questions and issues</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-glow hover-lift cursor-pointer">
          <CardContent className="p-6">
            <div className="h-12 w-12 rounded-lg bg-red-50 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="font-semibold mb-2">Raise a Dispute</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Having an issue with a transaction?
            </p>
            <Button variant="outline" className="w-full gap-2">
              Raise Dispute
              <ExternalLink className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="card-glow hover-lift cursor-pointer">
          <CardContent className="p-6">
            <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
              <MessageSquare className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="font-semibold mb-2">Contact Support</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get help from our support team
            </p>
            <Button variant="outline" className="w-full gap-2">
              Contact Us
              <ExternalLink className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="card-glow hover-lift cursor-pointer">
          <CardContent className="p-6">
            <div className="h-12 w-12 rounded-lg bg-purple-50 flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="font-semibold mb-2">Escrow Guide</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Learn how our escrow system works
            </p>
            <Button variant="outline" className="w-full gap-2">
              Read Guide
              <ExternalLink className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Contact Form */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-accent-purple" />
            Send us a Message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="What do you need help with?"
              value={contactForm.subject}
              onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Describe your issue or question in detail..."
              rows={6}
              value={contactForm.message}
              onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
            />
          </div>

          <Button onClick={handleSubmit} variant="hero" className="w-full md:w-auto gap-2">
            <Send className="h-4 w-4" />
            Send Message
          </Button>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-accent-purple" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search FAQs..."
                className="pl-10"
              />
            </div>
          </div>

          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4">
                <AccordionTrigger className="text-left hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Resources */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5 text-accent-purple" />
            Resources & Documentation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-between">
            How Document Verification Works
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="w-full justify-between">
            Terms & Conditions
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="w-full justify-between">
            Privacy Policy
            <ExternalLink className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
