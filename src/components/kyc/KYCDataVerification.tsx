import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FileCheck, AlertTriangle } from 'lucide-react';

interface Props {
  extractedData: any;
  docType: string;
  onConfirm: (verifiedData: any) => void;
  onBack: () => void;
}

export const KYCDataVerification = ({ extractedData, docType, onConfirm, onBack }: Props) => {
  const [data, setData] = useState({
    documentNumber: extractedData?.documentNumber || '',
    name: extractedData?.name || '',
    dob: extractedData?.dob || '',
    gender: extractedData?.gender || '',
  });
  const [confirmed, setConfirmed] = useState(false);

  const hasExtractedData = Object.values(extractedData || {}).some(v => v !== null);

  const update = (field: string, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {!hasExtractedData && (
        <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900 dark:text-yellow-200">Limited data extracted</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">We couldn't extract all data from your document. Please fill in the fields manually.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-accent-purple" />
            Verify Extracted Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Please review and correct the information extracted from your document:</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Document Number *</Label>
              <Input value={data.documentNumber} onChange={e => update('documentNumber', e.target.value)} placeholder="Enter document number" />
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={data.name} onChange={e => update('name', e.target.value)} placeholder="Name on document" />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input value={data.dob} onChange={e => update('dob', e.target.value)} placeholder="DD/MM/YYYY" />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Input value={data.gender} onChange={e => update('gender', e.target.value)} placeholder="Male/Female" />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-4">
            <Checkbox id="confirm" checked={confirmed} onCheckedChange={(c) => setConfirmed(!!c)} />
            <label htmlFor="confirm" className="text-sm text-foreground cursor-pointer">
              I confirm that the information above is correct
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button variant="hero" onClick={() => onConfirm(data)} disabled={!confirmed || !data.documentNumber}>Continue</Button>
      </div>
    </div>
  );
};
