import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KYCWelcome } from '@/components/kyc/KYCWelcome';
import { KYCPersonalInfo, type PersonalInfoData } from '@/components/kyc/KYCPersonalInfo';
import { KYCDocumentSelect } from '@/components/kyc/KYCDocumentSelect';
import { KYCDocumentUpload } from '@/components/kyc/KYCDocumentUpload';
import { KYCDataVerification } from '@/components/kyc/KYCDataVerification';
import { KYCSelfieUpload } from '@/components/kyc/KYCSelfieUpload';
import { KYCReview } from '@/components/kyc/KYCReview';
import { KYCSuccess } from '@/components/kyc/KYCSuccess';

const STEPS = ['Welcome', 'Personal Info', 'Document Type', 'Upload Document', 'Verify Data', 'Selfie', 'Review', 'Success'];

export const Verification = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [kycReference, setKycReference] = useState('');

  // Form state
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoData>({
    full_name: '', date_of_birth: '', gender: '', nationality: 'Nigerian',
    phone: '', address: '', state: '', lga: '',
  });
  const [docType, setDocType] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState('');
  const [ocrData, setOcrData] = useState<any>(null);
  const [ocrRawText, setOcrRawText] = useState('');
  const [verifiedData, setVerifiedData] = useState<any>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState('');

  useEffect(() => {
    checkExistingKYC();
  }, []);

  const checkExistingKYC = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Pre-fill personal info from profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profile) {
      setPersonalInfo(prev => ({
        ...prev,
        full_name: profile.full_name || '',
        phone: profile.phone || '',
      }));
    }

    const { data: kyc } = await supabase.from('kyc_documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single();
    if (kyc) {
      setKycStatus(kyc.status);
      if (kyc.status === 'verified') setStep(-1); // show verified state
      if (kyc.status === 'pending') setStep(-2); // show pending state
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload document image
      const docFileName = `${user.id}/doc_${Date.now()}.webp`;
      const { error: docUpErr } = await supabase.storage.from('kyc-documents').upload(docFileName, documentFile!, { upsert: true });
      if (docUpErr) throw docUpErr;

      // Upload selfie
      const selfieFileName = `${user.id}/selfie_${Date.now()}.webp`;
      const { error: selfieUpErr } = await supabase.storage.from('kyc-documents').upload(selfieFileName, selfieFile!, { upsert: true });
      if (selfieUpErr) throw selfieUpErr;

      const reference = `KYC-NG-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;

      const { error } = await supabase.from('kyc_documents').insert({
        user_id: user.id,
        identity_type: docType,
        identity_number: verifiedData.documentNumber,
        status: 'pending',
        full_name: personalInfo.full_name,
        date_of_birth: personalInfo.date_of_birth || null,
        gender: personalInfo.gender,
        nationality: personalInfo.nationality,
        phone: personalInfo.phone,
        address: personalInfo.address,
        state: personalInfo.state,
        lga: personalInfo.lga,
        document_image_url: docFileName,
        selfie_url: selfieFileName,
        extracted_data: { ...ocrData, raw_text: ocrRawText },
        kyc_reference: reference,
      } as any);

      if (error) throw error;

      setKycReference(reference);
      setStep(7); // success
    } catch (error: any) {
      toast({ title: 'Submission Failed', description: error.message || 'Please try again', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-purple" />
      </div>
    );
  }

  // Already verified
  if (step === -1) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground">KYC Verification</h1>
        <Card className="card-glow border-green-500/30">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Verification Complete!</h3>
              <p className="text-muted-foreground">Your identity has been successfully verified.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pending review
  if (step === -2) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground">KYC Verification</h1>
        <Card className="card-glow border-yellow-500/30">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Under Review</h3>
              <p className="text-muted-foreground">Your KYC submission is being reviewed. This usually takes 24–48 hours.</p>
            </div>
          </CardContent>
        </Card>
        <Button variant="outline" onClick={() => { setStep(0); setKycStatus(null); }}>
          Submit New Verification
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">KYC Verification</h1>
          <p className="text-muted-foreground">Complete your identity verification</p>
        </div>
        {step > 0 && step < 7 && (
          <Badge variant="outline" className="text-accent-purple border-accent-purple">
            Step {step} of 6
          </Badge>
        )}
      </div>

      {/* Progress bar */}
      {step >= 1 && step <= 6 && (
        <div className="flex gap-1">
          {[1,2,3,4,5,6].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${step >= s ? 'bg-accent-purple' : 'bg-muted'}`} />
          ))}
        </div>
      )}

      {step === 0 && <KYCWelcome onNext={() => setStep(1)} />}
      {step === 1 && <KYCPersonalInfo data={personalInfo} onChange={setPersonalInfo} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
      {step === 2 && <KYCDocumentSelect selected={docType} onSelect={setDocType} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
      {step === 3 && (
        <KYCDocumentUpload
          docType={docType}
          onComplete={(file, preview, data, rawText) => {
            setDocumentFile(file);
            setDocumentPreview(preview);
            setOcrData(data);
            setOcrRawText(rawText);
            setStep(4);
          }}
          onBack={() => setStep(2)}
        />
      )}
      {step === 4 && (
        <KYCDataVerification
          extractedData={ocrData}
          docType={docType}
          onConfirm={(data) => { setVerifiedData(data); setStep(5); }}
          onBack={() => setStep(3)}
        />
      )}
      {step === 5 && (
        <KYCSelfieUpload
          onComplete={(file, preview) => {
            setSelfieFile(file);
            setSelfiePreview(preview);
            setStep(6);
          }}
          onBack={() => setStep(4)}
        />
      )}
      {step === 6 && (
        <KYCReview
          personalInfo={personalInfo}
          docType={docType}
          verifiedData={verifiedData}
          documentPreview={documentPreview}
          selfiePreview={selfiePreview}
          onSubmit={handleSubmit}
          onBack={() => setStep(5)}
          submitting={submitting}
        />
      )}
      {step === 7 && <KYCSuccess reference={kycReference} onDashboard={() => navigate('/dashboard')} />}
    </div>
  );
};
