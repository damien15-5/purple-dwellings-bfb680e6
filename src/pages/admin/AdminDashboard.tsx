import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Home, Shield, DollarSign, MessageSquare, TrendingUp, CheckCircle, Clock } from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  verifiedUsers: number;
  activeListings: number;
  pendingVerification: number;
  escrowFunds: number;
  completedTransactions: number;
  offersSent: number;
  offersAccepted: number;
  offersRejected: number;
  activeNegotiations: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    verifiedUsers: 0,
    activeListings: 0,
    pendingVerification: 0,
    escrowFunds: 0,
    completedTransactions: 0,
    offersSent: 0,
    offersAccepted: 0,
    offersRejected: 0,
    activeNegotiations: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Total Users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Verified Users (with KYC verified)
      const { count: verifiedUsers } = await supabase
        .from('kyc_documents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'verified');

      // Active Listings
      const { count: activeListings } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      // Pending Verification
      const { count: pendingVerification } = await supabase
        .from('kyc_documents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Escrow Funds
      const { data: escrowData } = await supabase
        .from('escrow_transactions')
        .select('total_amount')
        .in('status', ['funded', 'inspection_period']);

      const escrowFunds = escrowData?.reduce((sum, t) => sum + Number(t.total_amount), 0) || 0;

      // Completed Transactions
      const { count: completedTransactions } = await supabase
        .from('escrow_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      // Offers
      const { data: offersData } = await supabase
        .from('escrow_transactions')
        .select('offer_status');

      const offersSent = offersData?.length || 0;
      const offersAccepted = offersData?.filter(o => o.offer_status === 'accepted').length || 0;
      const offersRejected = offersData?.filter(o => o.offer_status === 'rejected').length || 0;

      // Active Negotiations
      const { count: activeNegotiations } = await supabase
        .from('escrow_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('offer_status', 'pending');

      // Tickets
      const { count: openTickets } = await supabase
        .from('customer_service_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      const { count: inProgressTickets } = await supabase
        .from('customer_service_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress');

      const { count: resolvedTickets } = await supabase
        .from('customer_service_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved');

      setStats({
        totalUsers: totalUsers || 0,
        verifiedUsers: verifiedUsers || 0,
        activeListings: activeListings || 0,
        pendingVerification: pendingVerification || 0,
        escrowFunds,
        completedTransactions: completedTransactions || 0,
        offersSent,
        offersAccepted,
        offersRejected,
        activeNegotiations: activeNegotiations || 0,
        openTickets: openTickets || 0,
        inProgressTickets: inProgressTickets || 0,
        resolvedTickets: resolvedTickets || 0,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{loading ? '...' : value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">
            <TrendingUp className="inline h-3 w-3 mr-1" />
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Real-time platform statistics</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} />
        <StatCard title="Verified Users" value={stats.verifiedUsers} icon={Shield} />
        <StatCard title="Active Listings" value={stats.activeListings} icon={Home} />
        <StatCard title="Pending Verification" value={stats.pendingVerification} icon={Clock} />
      </div>

      {/* Escrow & Transactions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Escrow Funds"
          value={`₦${stats.escrowFunds.toLocaleString()}`}
          icon={DollarSign}
        />
        <StatCard
          title="Completed Transactions"
          value={stats.completedTransactions}
          icon={CheckCircle}
        />
        <StatCard
          title="Active Negotiations"
          value={stats.activeNegotiations}
          icon={MessageSquare}
        />
      </div>

      {/* Offers Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Offers Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Offers</p>
              <p className="text-2xl font-bold">{stats.offersSent}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Accepted</p>
              <p className="text-2xl font-bold text-green-600">{stats.offersAccepted}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.offersRejected}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.activeNegotiations}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Open</p>
              <p className="text-2xl font-bold text-red-600">{stats.openTickets}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.inProgressTickets}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolvedTickets}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
