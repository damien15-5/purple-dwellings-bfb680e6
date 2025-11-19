import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Upload, X, AlertCircle, Check } from 'lucide-react';
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
  'Tax clearance',
  'Building plan',
  'Other',
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
  const minDocuments = 3;
  const hasMinimum = documents.length >= minDocuments;
  const hasReceiptDoc = documents.some(doc => doc.type === 'Receipt') || hasReceipt;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent-purple bg-clip-text text-transparent mb-2">
          Upload Property Documents
        </h2>
        <p className="text-muted-foreground text-lg">Upload at least 3 documents to verify your property</p>
      </div>

      {/* Info Message */}
      <div className="bg-gradient-to-br from-primary/5 to-accent-purple/5 border-2 border-primary/20 rounded-xl p-5 flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground mb-1">Document Requirements</p>
          <p className="text-sm text-muted-foreground mb-2">
            Please upload at least 3 documents including:
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            {!isLand && <li>Receipt of payment (required for non-land properties)</li>}
            <li>Property ownership documents (deed, C of O, etc.)</li>
            <li>Survey plan or building documents</li>
            <li>Any other relevant documents</li>
          </ul>
        </div>
      </div>

      {/* Upload Section */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Select onValueChange={(value) => (selectedTypeRef.current = value)}>
              <SelectTrigger className="h-12 border-2 border-border hover:border-primary transition-colors">
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
            className="gap-2 h-12 px-8 bg-gradient-to-r from-primary to-primary-light hover:shadow-lg"
          >
            <Upload className="w-5 h-5" />
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

        {/* Progress Indicator */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-accent-purple/5 rounded-lg border border-primary/20">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              hasMinimum ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {hasMinimum ? <Check className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {documents.length}/{minDocuments} documents uploaded
              </p>
              <p className="text-xs text-muted-foreground">
                {hasMinimum ? 'Minimum requirement met!' : `Upload ${minDocuments - documents.length} more`}
              </p>
            </div>
          </div>
          {!isLand && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="hasReceiptDoc"
                checked={hasReceiptDoc}
                onCheckedChange={(checked) => setHasReceipt(checked as boolean)}
              />
              <Label htmlFor="hasReceiptDoc" className="cursor-pointer font-normal text-sm">
                Receipt included
              </Label>
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Documents List */}
      {documents.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground text-lg">Uploaded Documents ({documents.length})</h3>
          <div className="space-y-3">
            {documents.map((doc, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-accent/30 to-accent/10 rounded-xl border-2 border-border/50 hover:border-primary/50 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{doc.type}</p>
                    <p className="text-xs text-muted-foreground">{doc.file.name}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeDocument(index)}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Messages */}
      {documents.length === 0 && (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No documents uploaded yet. Upload at least 3 documents to continue.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
