import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { BreadcrumbNav } from '@/components/BreadcrumbNav';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type Agent = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  is_verified_badge: boolean;
  company_name: string | null;
  listing_count: number;
};

export const AgentsIndex = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      // Get profiles that have listings (they're agents/sellers)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, is_verified_badge, company_name')
        .order('created_at', { ascending: false });

      if (profiles) {
        // Get listing counts
        const agentsWithCounts: Agent[] = [];
        for (const p of profiles) {
          const { count } = await supabase
            .from('properties')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', p.id)
            .eq('status', 'published');
          if ((count || 0) > 0) {
            agentsWithCounts.push({
              ...p,
              is_verified_badge: p.is_verified_badge || false,
              listing_count: count || 0,
            });
          }
        }
        setAgents(agentsWithCounts);
      }
      setLoading(false);
    };
    fetchAgents();
  }, []);

  const slugify = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Verified Real Estate Agents in Nigeria"
        description="Find KYC-verified property agents across Nigeria. Browse listings from trusted agents in Benin City, Lagos, Abuja and more on Xavorian."
        path="/agents"
      />

      <div className="bg-gradient-to-br from-primary/10 via-background to-accent-purple/10 py-16">
        <div className="container mx-auto px-4">
          <BreadcrumbNav items={[
            { label: 'Home', href: '/' },
            { label: 'Agents' },
          ]} />
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Verified <span className="text-primary">Agents</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Find trusted, KYC-verified property agents across Nigeria
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : agents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {agents.map((agent) => (
              <Link
                key={agent.id}
                to={`/seller/${agent.id}`}
                className="bg-card rounded-xl p-6 border border-border hover:shadow-lg hover:border-primary/30 transition-all text-center"
              >
                <Avatar className="w-16 h-16 mx-auto mb-3">
                  <AvatarImage src={agent.avatar_url || undefined} alt={agent.full_name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-xl">
                    {agent.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-foreground">{agent.full_name}</h3>
                {agent.company_name && (
                  <p className="text-sm text-muted-foreground">{agent.company_name}</p>
                )}
                <div className="flex items-center justify-center gap-2 mt-2">
                  {agent.is_verified_badge && (
                    <Badge className="bg-emerald-600/90 text-white border-0 text-xs gap-1">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{agent.listing_count} listings</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No agents with active listings yet.</p>
          </div>
        )}

        {/* Internal links */}
        <div className="mt-16 text-center space-y-4">
          <h2 className="text-2xl font-bold">Find Properties by Location</h2>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/location/benin-city" className="px-4 py-2 bg-card border border-border rounded-lg text-sm hover:border-primary/50 transition-colors">Benin City</Link>
            <Link to="/location/lagos" className="px-4 py-2 bg-card border border-border rounded-lg text-sm hover:border-primary/50 transition-colors">Lagos</Link>
            <Link to="/location/abuja" className="px-4 py-2 bg-card border border-border rounded-lg text-sm hover:border-primary/50 transition-colors">Abuja</Link>
            <Link to="/location/port-harcourt" className="px-4 py-2 bg-card border border-border rounded-lg text-sm hover:border-primary/50 transition-colors">Port Harcourt</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
