import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle2, XCircle, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type DocumentStatus = 'not-uploaded' | 'uploading' | 'pending' | 'verified' | 'rejected';

interface Document {
  id: string;
  name: string;
  type: string;
  status: DocumentStatus;
  file?: File;
  progress?: number;
  feedback?: string;
}

export const UploadDocuments = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([
    { id: 'coo', name: 'Certificate of Occupancy (C of O)', type: 'required', status: 'not-uploaded' },
    { id: 'deed', name: 'Property Deed', type: 'required', status: 'not-uploaded' },
    { id: 'survey', name: 'Survey Plan', type: 'required', status: 'not-uploaded' },
    { id: 'seller-id', name: 'Seller ID', type: 'required', status: 'not-uploaded' },
    { id: 'additional', name: 'Additional Documents', type: 'optional', status: 'not-uploaded' },
  ]);

  const handleFileSelect = (docId: string, file: File) => {
    // Update document status to uploading
    setDocuments(docs => docs.map(doc => 
      doc.id === docId ? { ...doc, status: 'uploading' as DocumentStatus, file, progress: 0 } : doc
    ));

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setDocuments(docs => docs.map(doc =>
        doc.id === docId ? { ...doc, progress } : doc
      ));

      if (progress >= 100) {
        clearInterval(interval);
        // Simulate AI verification
        setTimeout(() => {
          const verified = Math.random() > 0.3; // 70% chance of verification
          setDocuments(docs => docs.map(doc =>
            doc.id === docId ? {
              ...doc,
              status: verified ? 'verified' : 'pending',
              feedback: verified
                ? 'Document verified automatically using AI verification'
                : 'Document pending human review'
            } : doc
          ));
          toast.success(verified ? 'Document verified!' : 'Document uploaded - pending review');
        }, 1000);
      }
    }, 200);
  };

  const handleDelete = (docId: string) => {
    setDocuments(docs => docs.map(doc =>
      doc.id === docId ? { ...doc, status: 'not-uploaded' as DocumentStatus, file: undefined, progress: 0 } : doc
    ));
    toast.info('Document removed');
  };

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case 'verified': return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'pending': return <AlertCircle className="h-5 w-5 text-warning" />;
      case 'rejected': return <XCircle className="h-5 w-5 text-destructive" />;
      default: return <Upload className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case 'verified': return 'bg-success/10 border-success text-success';
      case 'pending': return 'bg-warning/10 border-warning text-warning';
      case 'rejected': return 'bg-destructive/10 border-destructive text-destructive';
      default: return 'bg-accent border-border';
    }
  };

  const requiredDocs = documents.filter(d => d.type === 'required');
  const allRequiredUploaded = requiredDocs.every(d => d.status !== 'not-uploaded');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8 text-center animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">Upload Property Documents</h1>
          <p className="text-muted-foreground">
            Upload verified documents to increase buyer confidence and speed up verification
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Documents Upload Section */}
          <div className="lg:col-span-2 space-y-6">
            {documents.map((doc, index) => (
              <Card
                key={doc.id}
                className="hover-lift card-glow"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(doc.status)}
                      <div>
                        <CardTitle className="text-lg">
                          {doc.name}
                          {doc.type === 'required' && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {doc.type === 'required' ? 'Required document' : 'Optional'}
                        </CardDescription>
                      </div>
                    </div>
                    {doc.file && doc.status !== 'uploading' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {doc.status === 'not-uploaded' ? (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:bg-accent/50 transition-colors">
                      <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-sm font-medium mb-1">Drop file here or click to browse</p>
                      <p className="text-xs text-muted-foreground">PDF, JPG, PNG (Max 10MB)</p>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(doc.id, file);
                        }}
                      />
                    </label>
                  ) : (
                    <div className="space-y-4">
                      {doc.file && (
                        <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                          <FileText className="h-8 w-8 text-primary" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{doc.file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {doc.status === 'uploading' && (
                        <div>
                          <Progress value={doc.progress || 0} className="mb-2" />
                          <p className="text-xs text-muted-foreground">Uploading... {doc.progress}%</p>
                        </div>
                      )}

                      {doc.feedback && (
                        <div className={`p-3 rounded-lg border ${getStatusColor(doc.status)}`}>
                          <p className="text-sm font-medium">{doc.feedback}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Status Panel */}
          <div className="space-y-6">
            <Card className="card-glow">
              <CardHeader>
                <CardTitle>Verification Status</CardTitle>
                <CardDescription>Track your document verification progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {requiredDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3">
                    {doc.status === 'verified' ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : doc.status === 'pending' ? (
                      <AlertCircle className="h-5 w-5 text-warning" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted" />
                    )}
                    <span className="text-sm flex-1">{doc.name}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-2">AI Verification</h4>
                    <p className="text-sm text-muted-foreground">
                      Our AI analyzes documents in seconds to verify authenticity and accuracy.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button
                className="w-full hover-lift animate-glow"
                disabled={!allRequiredUploaded}
                onClick={() => {
                  toast.success('Documents submitted for final verification');
                  setTimeout(() => navigate('/dashboard'), 2000);
                }}
              >
                Submit for Final Verification
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard')}>
                Save Draft & Continue Later
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
