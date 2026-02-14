import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/contexts/AdminContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, FileText, Shield, MessageCircle, Mail, Send, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface KYCDocument {
  id: string;
  user_id: string;
  identity_type: string | null;
  identity_number: string | null;
  full_name: string | null;
  status: string | null;
  submitted_at: string | null;
  verified_at: string | null;
  document_image_url: string | null;
  selfie_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  address: string | null;
  state: string | null;
  lga: string | null;
  userName?: string;
  userEmail?: string;
  telegramUsername?: string;
}

const AdminVerification = () => {
  const { admin } = useAdmin();
  const { toast } = useToast();
  const [kycDocuments, setKycDocuments] = useState<KYCDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKYCDocuments();
  }, []);

  const loadKYCDocuments = async () => {
    try {
      const { data: kyc } = await supabase
        .from('kyc_documents')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (kyc) {
        const docsWithNames = await Promise.all(
          kyc.map(async (doc) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email, telegram_username')
              .eq('id', doc.user_id)
              .single();

            return {
              ...doc,
              userName: profile?.full_name || doc.full_name || 'Unknown',
              userEmail: profile?.email || '',
              telegramUsername: profile?.telegram_username || '',
            };
          })
        );
        setKycDocuments(docsWithNames);
      }
    } catch (error) {
      console.error('Error loading KYC documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (admin?.role !== 'super_admin') {
      toast({ title: 'Access Denied', description: 'Only super admin can approve verifications', variant: 'destructive' });
      return;
    }
    try {
      const { error } = await supabase.from('kyc_documents').update({ status: 'verified', verified_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      toast({ title: 'KYC Approved', description: 'User verification has been approved' });
      loadKYCDocuments();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to approve KYC', variant: 'destructive' });
    }
  };

  const handleReject = async (id: string) => {
    if (admin?.role !== 'super_admin') {
      toast({ title: 'Access Denied', description: 'Only super admin can reject verifications', variant: 'destructive' });
      return;
    }
    try {
      const { error } = await supabase.from('kyc_documents').update({ status: 'rejected' }).eq('id', id);
      if (error) throw error;
      toast({ title: 'KYC Rejected', description: 'User verification has been rejected' });
      loadKYCDocuments();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to reject KYC', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string | null) => {
    const variants: any = { verified: 'default', pending: 'secondary', rejected: 'destructive' };
    return <Badge variant={variants[status || 'pending'] || 'outline'}>{status || 'pending'}</Badge>;
  };

  const pendingDocs = kycDocuments.filter((doc) => doc.status === 'pending');
  const verifiedDocs = kycDocuments.filter((doc) => doc.status === 'verified');
  const rejectedDocs = kycDocuments.filter((doc) => doc.status === 'rejected');

  const renderDocCard = (doc: KYCDocument) => (
    <Card key={doc.id}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{doc.userName}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {doc.identity_type}: {doc.identity_number}
            </p>
            {doc.userEmail && <p className="text-xs text-muted-foreground">📧 {doc.userEmail}</p>}
          </div>
          {getStatusBadge(doc.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KYC Details */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {doc.full_name && <div><span className="text-muted-foreground">Name:</span> {doc.full_name}</div>}
          {doc.date_of_birth && <div><span className="text-muted-foreground">DOB:</span> {doc.date_of_birth}</div>}
          {doc.gender && <div><span className="text-muted-foreground">Gender:</span> {doc.gender}</div>}
          {doc.phone && <div><span className="text-muted-foreground">Phone:</span> {doc.phone}</div>}
          {doc.address && <div className="col-span-2"><span className="text-muted-foreground">Address:</span> {doc.address}, {doc.lga}, {doc.state}</div>}
        </div>

        {/* Document & Selfie Images */}
        <div className="flex gap-4">
          {doc.document_image_url && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Eye className="h-3 w-3" /> View ID Document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>ID Document - {doc.userName}</DialogTitle></DialogHeader>
                <img src={doc.document_image_url} alt="ID Document" className="w-full rounded-lg" />
              </DialogContent>
            </Dialog>
          )}
          {doc.selfie_url && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Eye className="h-3 w-3" /> View Selfie
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Selfie - {doc.userName}</DialogTitle></DialogHeader>
                <img src={doc.selfie_url} alt="Selfie" className="w-full rounded-lg" />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {doc.status === 'verified' ? 'Verified' : 'Submitted'}: {(doc.verified_at || doc.submitted_at) ? new Date(doc.verified_at || doc.submitted_at!).toLocaleDateString() : 'N/A'}
          </p>
          <div className="flex gap-2">
            {/* Contact buttons */}
            {doc.userEmail && (
              <Button size="sm" variant="outline" asChild>
                <a href={`mailto:${doc.userEmail}`}><Mail className="h-4 w-4 mr-1" /> Email</a>
              </Button>
            )}
            {doc.telegramUsername && (
              <Button size="sm" variant="outline" asChild>
                <a href={`https://t.me/${doc.telegramUsername}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4 mr-1" /> Telegram
                </a>
              </Button>
            )}
            {admin?.role === 'super_admin' && doc.status === 'pending' && (
              <>
                <Button size="sm" onClick={() => handleApprove(doc.id)}>
                  <CheckCircle className="h-4 w-4 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleReject(doc.id)}>
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Verification Center</h1>
        <p className="text-muted-foreground mt-1">Manage identity and document verification</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Verification</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{pendingDocs.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verified Users</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{verifiedDocs.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{rejectedDocs.length}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingDocs.length})</TabsTrigger>
          <TabsTrigger value="verified">Verified ({verifiedDocs.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedDocs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {loading ? <div className="text-center py-8">Loading...</div>
            : pendingDocs.length === 0 ? <div className="text-center py-8 text-muted-foreground">No pending verifications</div>
            : pendingDocs.map(renderDocCard)}
        </TabsContent>
        <TabsContent value="verified" className="space-y-4">
          {verifiedDocs.length === 0 ? <div className="text-center py-8 text-muted-foreground">No verified users yet</div>
            : verifiedDocs.map(renderDocCard)}
        </TabsContent>
        <TabsContent value="rejected" className="space-y-4">
          {rejectedDocs.length === 0 ? <div className="text-center py-8 text-muted-foreground">No rejected verifications</div>
            : rejectedDocs.map(renderDocCard)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminVerification;
