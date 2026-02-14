import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FileCheck, AlertTriangle, CheckCircle } from 'lucide-react';

interface Props {
  extractedData: any;
  docType: string;
  onConfirm: (verifiedData: any) => void;
  onBack: () => void;
}

export const KYCDataVerification = ({ extractedData, docType, onConfirm, onBack }: Props) => {
  const [confirmed, setConfirmed] = useState(false);

  const data = {
    documentNumber: extractedData?.documentNumber || '',
    name: extractedData?.name || '',
    dob: extractedData?.dob || '',
    gender: extractedData?.gender || '',
  };

  const hasExtractedData = Object.values(extractedData || {}).some(v => v !== null && v !== '');
  const fieldsFound = Object.entries(data).filter(([_, v]) => v).length;

  return (
    <div className="space-y-6">
      {!hasExtractedData && (
        <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900 dark:text-yellow-200">Limited data extracted</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">We couldn't extract data from your document. Please go back and retake the photo with better lighting.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasExtractedData && (
        <Card className="border-green-500/50 bg-green-50 dark:bg-green-900/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-200">Data extracted successfully</p>
                <p className="text-sm text-green-700 dark:text-green-300">{fieldsFound} field(s) extracted from your document. This data will be used for verification.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-accent-purple" />
            Extracted Document Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">The following information was extracted from your document and will be used for verification:</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Document Number</p>
              <p className="text-sm font-medium text-foreground">{data.documentNumber || '—'}</p>
            </div>
            <div className="space-y-1 p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Full Name</p>
              <p className="text-sm font-medium text-foreground">{data.name || '—'}</p>
            </div>
            <div className="space-y-1 p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Date of Birth</p>
              <p className="text-sm font-medium text-foreground">{data.dob || '—'}</p>
            </div>
            <div className="space-y-1 p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Gender</p>
              <p className="text-sm font-medium text-foreground">{data.gender || '—'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-4">
            <Checkbox id="confirm" checked={confirmed} onCheckedChange={(c) => setConfirmed(!!c)} />
            <label htmlFor="confirm" className="text-sm text-foreground cursor-pointer">
              I confirm that the extracted information matches my document
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button variant="hero" onClick={() => onConfirm(data)} disabled={!confirmed}>Continue</Button>
      </div>
    </div>
  );
};
