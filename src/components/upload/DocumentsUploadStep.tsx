import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Upload, X, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const DOCUMENT_TYPES = [
  'Property ownership document',
  'Survey plan',
  'Allocation letter',
  'Deed of assignment',
  'C of O',
  "Governor's consent",
  'Receipt',
  'Utility bills',
];

type Props = {
  documents: { type: string; file: File }[];
  setDocuments: (docs: { type: string; file: File }[]) => void;
  hasReceipt: boolean;
  setHasReceipt: (value: boolean) => void;
  propertyType: string;
};

export const DocumentsUploadStep = ({ documents, setDocuments, hasReceipt, setHasReceipt, propertyType }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedTypeRef = useRef<string>('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (!selectedTypeRef.current) {
      toast.error('Please select a document type first');
      return;
    }

    const newDocs = files.map(file => ({
      type: selectedTypeRef.current,
      file,
    }));

    // Check if uploading receipt
    if (selectedTypeRef.current === 'Receipt') {
      setHasReceipt(true);
    }

    setDocuments([...documents, ...newDocs]);
    selectedTypeRef.current = '';
  };

  const removeDocument = (index: number) => {
    const doc = documents[index];
    if (doc.type === 'Receipt') {
      setHasReceipt(false);
    }
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const isLand = propertyType === 'Land';
  const requiredDocs = isLand ? [] : ['Receipt'];
  const hasAllRequired = requiredDocs.every(type => 
    documents.some(doc => doc.type === type) || (type === 'Receipt' && hasReceipt)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Upload Property Documents</h2>
        <p className="text-muted-foreground">Upload supporting documents for your property</p>
      </div>

      {/* Info Message */}
      <div className="bg-accent/50 border border-border rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground mb-1">Document Verification</p>
          <p className="text-sm text-muted-foreground">
            Documents will be verified after submission. You can skip this step for now if you don't have documents ready.
          </p>
        </div>
      </div>

      {/* Receipt Warning for non-land */}
      {!isLand && !hasReceipt && (
        <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive mb-2">Receipt Required</p>
            <p className="text-sm text-muted-foreground mb-3">
              You must upload a House Rent/Sale Receipt before proceeding
            </p>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasReceiptDoc"
                checked={hasReceipt}
                onCheckedChange={(checked) => setHasReceipt(checked as boolean)}
              />
              <Label htmlFor="hasReceiptDoc" className="cursor-pointer font-normal text-sm">
                Receipt was uploaded in images step
              </Label>
            </div>
          </div>
        </div>
      )}

      {/* Upload Section */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Select onValueChange={(value) => (selectedTypeRef.current = value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                {DOCUMENT_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Uploaded Documents List */}
      {documents.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Uploaded Documents ({documents.length})</h3>
          <div className="space-y-2">
            {documents.map((doc, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-accent/50 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{doc.type}</p>
                    <p className="text-xs text-muted-foreground">{doc.file.name}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeDocument(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Messages */}
      {!hasAllRequired && documents.length === 0 && (
        <div className="text-center text-sm text-muted-foreground">
          No documents uploaded yet. {!isLand && 'Receipt is required before proceeding.'}
        </div>
      )}
    </div>
  );
};
