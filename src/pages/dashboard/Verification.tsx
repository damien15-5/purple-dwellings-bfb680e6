import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, CheckCircle, Clock, XCircle, Upload, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const Verification = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState<'verified' | 'pending' | 'failed' | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    dob: '',
    sex: '',
    nationality: '',
    id_type: '',
    id_number: '',
  });

  useEffect(() => {
    loadKYCStatus();
  }, []);

  const loadKYCStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('kyc_documents')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setKycStatus(data.status as any);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase.from('kyc_documents').insert({
        user_id: user.id,
        identity_type: formData.id_type,
        identity_number: formData.id_number,
        status: 'pending',
      });

      if (error) throw error;

      setKycStatus('pending');
      toast({
        title: 'Success',
        description: 'KYC verification submitted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit verification',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (kycStatus) {
      case 'verified':
        return (
          <Badge className="bg-green-500 text-white gap-2">
            <CheckCircle className="h-4 w-4" />
            Verified
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500 text-white gap-2">
            <Clock className="h-4 w-4" />
            Pending Review
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-500 text-white gap-2">
            <XCircle className="h-4 w-4" />
            Verification Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">KYC Verification</h1>
          <p className="text-muted-foreground">Complete your identity verification</p>
        </div>
        {getStatusBadge()}
      </div>

      {kycStatus === 'verified' ? (
        <Card className="card-glow border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-900">Verification Complete!</h3>
                <p className="text-green-700">Your identity has been successfully verified.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent-purple" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sex">Sex</Label>
                  <Select
                    value={formData.sex}
                    onValueChange={(value) => setFormData({ ...formData, sex: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sex" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    placeholder="Enter your nationality"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent-purple" />
                Identity Document
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="id_type">ID Type</Label>
                  <Select
                    value={formData.id_type}
                    onValueChange={(value) => setFormData({ ...formData, id_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="national_id">National ID</SelectItem>
                      <SelectItem value="passport">International Passport</SelectItem>
                      <SelectItem value="drivers_license">Driver's License</SelectItem>
                      <SelectItem value="voters_card">Voter's Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id_number">ID Number</Label>
                  <Input
                    id="id_number"
                    value={formData.id_number}
                    onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                    placeholder="Enter ID number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Upload ID Image</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-accent-purple transition-colors cursor-pointer">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG or PDF (max. 10MB)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Upload Selfie</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-accent-purple transition-colors cursor-pointer">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG or JPG (max. 5MB)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Video Verification (Optional)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-accent-purple transition-colors cursor-pointer">
                  <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Record or upload verification video
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    MP4 or MOV (max. 50MB)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full md:w-auto"
            variant="hero"
          >
            {loading ? 'Submitting...' : kycStatus === 'failed' ? 'Re-verify' : 'Start Verification'}
          </Button>
        </>
      )}
    </div>
  );
};
