import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileCheck } from 'lucide-react';
import { idDocumentTypes } from '@/utils/nigerianData';

interface Props {
  selected: string;
  onSelect: (type: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const KYCDocumentSelect = ({ selected, onSelect, onNext, onBack }: Props) => {
  return (
    <div className="space-y-6">
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-accent-purple" />
            Select ID Document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground mb-4">Choose the type of government-issued ID you want to verify with:</p>
          {idDocumentTypes.map(doc => (
            <button
              key={doc.value}
              onClick={() => onSelect(doc.value)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selected === doc.value
                  ? 'border-accent-purple bg-accent-purple/5'
                  : 'border-border hover:border-accent-purple/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                  selected === doc.value ? 'border-accent-purple' : 'border-muted-foreground'
                }`}>
                  {selected === doc.value && <div className="h-2.5 w-2.5 rounded-full bg-accent-purple" />}
                </div>
                <div>
                  <p className="font-medium text-foreground">{doc.label}</p>
                  <p className="text-xs text-muted-foreground">Format: {doc.format} • Issuer: {doc.issuer}</p>
                </div>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button variant="hero" onClick={onNext} disabled={!selected}>Continue</Button>
      </div>
    </div>
  );
};
