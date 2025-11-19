import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { LifeBuoy, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Ticket {
  id: string;
  user_id: string;
  user_email: string;
  subject: string;
  description: string;
  status: string | null;
  priority: string | null;
  created_at: string | null;
  resolved_at: string | null;
  userName?: string;
}

const AdminTickets = () => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [response, setResponse] = useState('');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const { data: ticketData } = await supabase
        .from('customer_service_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (ticketData) {
        const ticketsWithNames = await Promise.all(
          ticketData.map(async (ticket) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', ticket.user_id)
              .single();

            return {
              ...ticket,
              userName: profile?.full_name || 'Unknown',
            };
          })
        );

        setTickets(ticketsWithNames);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      const { error } = await supabase
        .from('customer_service_tickets')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Ticket Resolved',
        description: 'Ticket has been marked as resolved',
      });
      loadTickets();
      setSelectedTicket(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resolve ticket',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;

    try {
      const { error } = await supabase.from('customer_service_tickets').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: 'Ticket Deleted',
        description: 'Ticket has been deleted',
      });
      loadTickets();
      setSelectedTicket(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete ticket',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string | null) => {
    const variants: any = {
      open: 'destructive',
      in_progress: 'secondary',
      resolved: 'default',
    };
    return <Badge variant={variants[status || 'open'] || 'outline'}>{status || 'open'}</Badge>;
  };

  const getPriorityBadge = (priority: string | null) => {
    const colors: any = {
      high: 'text-red-600',
      medium: 'text-yellow-600',
      low: 'text-green-600',
    };
    return (
      <span className={`text-sm font-medium ${colors[priority || 'medium'] || 'text-muted-foreground'}`}>
        {priority || 'medium'}
      </span>
    );
  };

  const openTickets = tickets.filter((t) => t.status === 'open');
  const inProgressTickets = tickets.filter((t) => t.status === 'in_progress');
  const resolvedTickets = tickets.filter((t) => t.status === 'resolved');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Support Tickets</h1>
        <p className="text-muted-foreground mt-1">Manage customer support tickets</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Tickets
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{openTickets.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{inProgressTickets.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolved
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{resolvedTickets.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="open" className="space-y-4">
        <TabsList>
          <TabsTrigger value="open">Open ({openTickets.length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({inProgressTickets.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({resolvedTickets.length})</TabsTrigger>
        </TabsList>

        {['open', 'in_progress', 'resolved'].map((status) => {
          const statusTickets =
            status === 'open' ? openTickets : status === 'in_progress' ? inProgressTickets : resolvedTickets;

          return (
            <TabsContent key={status} value={status} className="space-y-4">
              {loading ? (
                <div className="text-center py-8">Loading tickets...</div>
              ) : statusTickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No {status} tickets</div>
              ) : (
                statusTickets.map((ticket) => (
                  <Card key={ticket.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm text-muted-foreground">{ticket.userName}</span>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">{ticket.user_email}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(ticket.priority)}
                          {getStatusBadge(ticket.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm">{ticket.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Created: {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'N/A'}
                      </p>
                      <div className="flex gap-2">
                        {ticket.status !== 'resolved' && (
                          <Button size="sm" onClick={() => handleResolve(ticket.id)}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(ticket.id)}>
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default AdminTickets;