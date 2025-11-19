import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  HelpCircle, 
  MessageSquare, 
  FileText, 
  Lock,
  Shield,
  Book,
  ExternalLink,
  Send,
  Search,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

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
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
  });

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('customer_service_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setTickets(data || []);
  };

  const handleSubmit = async () => {
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      const { error } = await supabase
        .from('customer_service_tickets')
        .insert({
          user_id: user.id,
          user_email: profile?.email || user.email || '',
          subject: contactForm.subject,
          description: contactForm.message,
          status: 'open',
          priority: 'medium',
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Your support ticket has been submitted',
      });

      setContactForm({ subject: '', message: '' });
      loadTickets();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit ticket',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-500 gap-2"><Clock className="h-3 w-3" />Open</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500 gap-2"><CheckCircle className="h-3 w-3" />Resolved</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
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
            Contact Support
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
              placeholder="Describe your issue in detail..."
              rows={6}
              value={contactForm.message}
              onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full gap-2"
          >
            <Send className="h-4 w-4" />
            {loading ? 'Sending...' : 'Send Message'}
          </Button>
        </CardContent>
      </Card>

      {/* My Support Tickets */}
      {tickets.length > 0 && (
        <Card className="card-glow">
          <CardHeader>
            <CardTitle>My Support Tickets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="p-4 border border-border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{ticket.subject}</h4>
                  {getStatusBadge(ticket.status)}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{ticket.description}</p>
                <p className="text-xs text-muted-foreground">
                  Created: {new Date(ticket.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Accordion type="single" collapsible className="space-y-2">
            {filteredFaqs.map((faq, index) => (
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
