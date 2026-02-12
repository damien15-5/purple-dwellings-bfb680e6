import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, FileCheck, User, Camera } from 'lucide-react';
import { idDocumentTypes } from '@/utils/nigerianData';
import type { PersonalInfoData } from './KYCPersonalInfo';

interface Props {
  personalInfo: PersonalInfoData;
  docType: string;
  verifiedData: any;
  documentPreview: string;
  selfiePreview: string;
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
}

export const KYCReview = ({ personalInfo, docType, verifiedData, documentPreview, selfiePreview, onSubmit, onBack, submitting }: Props) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [dataConsent, setDataConsent] = useState(false);

  const docLabel = idDocumentTypes.find(d => d.value === docType)?.label || docType;

  return (
    <div className="space-y-6">
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-accent-purple" />
            Personal Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Name:</span> <span className="font-medium text-foreground">{personalInfo.full_name}</span></div>
            <div><span className="text-muted-foreground">DOB:</span> <span className="font-medium text-foreground">{personalInfo.date_of_birth}</span></div>
            <div><span className="text-muted-foreground">Gender:</span> <span className="font-medium text-foreground">{personalInfo.gender}</span></div>
            <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium text-foreground">{personalInfo.phone}</span></div>
            <div className="col-span-2"><span className="text-muted-foreground">Address:</span> <span className="font-medium text-foreground">{personalInfo.address}, {personalInfo.lga}, {personalInfo.state}</span></div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-accent-purple" />
            Document Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Type:</span> <span className="font-medium text-foreground">{docLabel}</span></div>
            <div><span className="text-muted-foreground">Number:</span> <span className="font-medium text-foreground">{verifiedData.documentNumber}</span></div>
          </div>
          <div className="flex gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">ID Document</p>
              <img src={documentPreview} alt="ID" className="h-20 w-auto rounded border border-border" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Selfie</p>
              <img src={selfiePreview} alt="Selfie" className="h-20 w-auto rounded border border-border" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-glow">
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-foreground">Declarations</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Checkbox id="terms" checked={termsAccepted} onCheckedChange={c => setTermsAccepted(!!c)} />
              <label htmlFor="terms" className="text-sm text-foreground cursor-pointer">
                I confirm all information provided is accurate and I agree to the Terms & Conditions
              </label>
            </div>
            <div className="flex items-start space-x-2">
              <Checkbox id="consent" checked={dataConsent} onCheckedChange={c => setDataConsent(!!c)} />
              <label htmlFor="consent" className="text-sm text-foreground cursor-pointer">
                I consent to data processing in accordance with the Nigeria Data Protection Regulation (NDPR)
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={submitting}>Back</Button>
        <Button variant="hero" onClick={onSubmit} disabled={!termsAccepted || !dataConsent || submitting}>
          {submitting ? 'Submitting...' : 'Submit KYC'}
        </Button>
      </div>
    </div>
  );
};
