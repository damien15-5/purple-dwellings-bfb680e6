import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { FileCheck, CheckCircle, Clock, XCircle, Upload, Eye } from 'lucide-react';

export const DocumentVerification = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setProperties(data || []);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-green-500 text-white gap-2">
            <CheckCircle className="h-3 w-3" />
            Passed
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500 text-white gap-2">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-500 text-white gap-2">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500 text-white gap-2">
            <Clock className="h-3 w-3" />
            Not Verified
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-purple" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Document Verification</h1>
        <p className="text-muted-foreground">Track verification status of your property documents</p>
      </div>

      {properties.length === 0 ? (
        <Card className="card-glow">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileCheck className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Properties Listed</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              You don't have any properties to verify documents for
            </p>
            <Button variant="hero" onClick={() => window.location.href = '/upload'}>
              Upload Property
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {properties.map((property) => (
            <Card key={property.id} className="card-glow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    {property.images?.[0] && (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <CardTitle className="text-lg mb-2">{property.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{property.address}</p>
                    </div>
                  </div>
                  {getStatusBadge(property.is_verified ? 'verified' : 'pending')}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {property.documents && Array.isArray(property.documents) && property.documents.length > 0 ? (
                    property.documents.map((doc: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-accent-purple/10 flex items-center justify-center">
                            <FileCheck className="h-5 w-5 text-accent-purple" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{doc.type || 'Document'}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.name || 'Unnamed document'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge('verified')}
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No documents uploaded</p>
                    </div>
                  )}
                </div>

                {!property.is_verified && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-yellow-900 mb-1">
                          Verification Pending
                        </p>
                        <p className="text-sm text-yellow-700">
                          Your documents are being reviewed. This usually takes 1-2 business days.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 gap-2">
                    <Upload className="h-4 w-4" />
                    Re-upload Documents
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2">
                    <Eye className="h-4 w-4" />
                    View All Documents
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
