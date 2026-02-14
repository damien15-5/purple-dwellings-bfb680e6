import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LifeBuoy, CheckCircle, Clock, AlertCircle, Bot, User, Mail, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Ticket {
  id: string;
  user_id: string;
  user_email: string;
  subject: string;
  title?: string;
  issue?: string;
  ticket_number?: string;
  description: string;
  status: string | null;
  priority: string | null;
  created_at: string | null;
  resolved_at: string | null;
  userName?: string;
  telegramUsername?: string;
  source: 'dashboard' | 'ai';
}

const AdminTickets = () => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTickets(); }, []);

  const loadTickets = async () => {
    try {
      const [{ data: csTickets }, { data: aiTickets }] = await Promise.all([
        supabase.from('customer_service_tickets').select('*').order('created_at', { ascending: false }),
        supabase.from('ai_support_tickets').select('*').order('created_at', { ascending: false }),
      ]);

      const normalizedCsTickets: Ticket[] = (csTickets || []).map(ticket => ({ ...ticket, source: 'dashboard' as const }));
      const normalizedAiTickets: Ticket[] = (aiTickets || []).map(ticket => ({ ...ticket, subject: ticket.title, source: 'ai' as const }));
      const allTickets = [...normalizedCsTickets, ...normalizedAiTickets];

      const ticketsWithNames = await Promise.all(
        allTickets.map(async (ticket) => {
          const { data: profile } = await supabase.from('profiles').select('full_name, telegram_username').eq('id', ticket.user_id).single();
          return { ...ticket, userName: profile?.full_name || 'Unknown', telegramUsername: profile?.telegram_username || '' };
        })
      );
      ticketsWithNames.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setTickets(ticketsWithNames);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (ticket: Ticket) => {
    try {
      const table = ticket.source === 'ai' ? 'ai_support_tickets' : 'customer_service_tickets';
      const { error } = await supabase.from(table).update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', ticket.id);
      if (error) throw error;
      toast({ title: 'Ticket Resolved', description: 'Ticket has been marked as resolved' });
      loadTickets();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to resolve ticket', variant: 'destructive' });
    }
  };

  const handleDelete = async (ticket: Ticket) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    try {
      const table = ticket.source === 'ai' ? 'ai_support_tickets' : 'customer_service_tickets';
      const { error } = await supabase.from(table).delete().eq('id', ticket.id);
      if (error) throw error;
      toast({ title: 'Ticket Deleted', description: 'Ticket has been deleted' });
      loadTickets();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete ticket', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string | null) => {
    const variants: any = { open: 'destructive', in_progress: 'secondary', resolved: 'default' };
    return <Badge variant={variants[status || 'open'] || 'outline'}>{status || 'open'}</Badge>;
  };

  const getPriorityBadge = (priority: string | null) => {
    const colors: any = { high: 'text-red-600', medium: 'text-yellow-600', low: 'text-green-600' };
    return <span className={`text-sm font-medium ${colors[priority || 'medium'] || 'text-muted-foreground'}`}>{priority || 'medium'}</span>;
  };

  const getSourceBadge = (source: 'dashboard' | 'ai') => {
    if (source === 'ai') return <Badge variant="secondary" className="bg-purple-100 text-purple-700 gap-1"><Bot className="h-3 w-3" />AI Created</Badge>;
    return <Badge variant="outline" className="gap-1"><User className="h-3 w-3" />Dashboard</Badge>;
  };

  const openTickets = tickets.filter((t) => t.status === 'open');
  const inProgressTickets = tickets.filter((t) => t.status === 'in_progress');
  const resolvedTickets = tickets.filter((t) => t.status === 'resolved');
  const aiTickets = tickets.filter((t) => t.source === 'ai');
  const dashboardTickets = tickets.filter((t) => t.source === 'dashboard');

  const renderTicketCard = (ticket: Ticket) => (
    <Card key={ticket.id}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{ticket.subject || ticket.title}</CardTitle>
              {ticket.ticket_number && <Badge variant="outline" className="text-xs font-mono">{ticket.ticket_number}</Badge>}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">{ticket.userName}</span>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">{ticket.user_email}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getSourceBadge(ticket.source)}
            {getPriorityBadge(ticket.priority)}
            {getStatusBadge(ticket.status)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {ticket.issue && <p className="text-sm font-medium text-muted-foreground">Issue: {ticket.issue}</p>}
        <p className="text-sm">{ticket.description}</p>
        <p className="text-xs text-muted-foreground">Created: {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'N/A'}</p>
        <div className="flex gap-2 flex-wrap">
          {/* Contact buttons */}
          <Button size="sm" variant="outline" asChild>
            <a href={`mailto:${ticket.user_email}`}><Mail className="h-4 w-4 mr-1" /> Email User</a>
          </Button>
          {ticket.telegramUsername && (
            <Button size="sm" variant="outline" asChild>
              <a href={`https://t.me/${ticket.telegramUsername}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 mr-1" /> Telegram
              </a>
            </Button>
          )}
          {ticket.status !== 'resolved' && (
            <Button size="sm" onClick={() => handleResolve(ticket)}>
              <CheckCircle className="h-4 w-4 mr-1" /> Resolve
            </Button>
          )}
          <Button size="sm" variant="destructive" onClick={() => handleDelete(ticket)}>Delete</Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Support Tickets</h1>
        <p className="text-muted-foreground mt-1">Manage customer support tickets</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Open Tickets</CardTitle><AlertCircle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{openTickets.length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{inProgressTickets.length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle><CheckCircle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{resolvedTickets.length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">AI Created</CardTitle><Bot className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-purple-600">{aiTickets.length}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({tickets.length})</TabsTrigger>
          <TabsTrigger value="open">Open ({openTickets.length})</TabsTrigger>
          <TabsTrigger value="ai">AI Created ({aiTickets.length})</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard ({dashboardTickets.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({resolvedTickets.length})</TabsTrigger>
        </TabsList>

        {['all', 'open', 'ai', 'dashboard', 'resolved'].map(tab => {
          const filtered = tab === 'all' ? tickets : tab === 'open' ? openTickets : tab === 'ai' ? aiTickets : tab === 'dashboard' ? dashboardTickets : resolvedTickets;
          return (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {loading ? <div className="text-center py-8">Loading tickets...</div>
                : filtered.length === 0 ? <div className="text-center py-8 text-muted-foreground">No tickets</div>
                : filtered.map(renderTicketCard)}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default AdminTickets;
