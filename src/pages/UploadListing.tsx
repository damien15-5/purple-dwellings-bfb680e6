import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, CheckCircle2, Loader2, FileText, Info } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const DOCUMENT_TYPES = [
  { id: 'deed', name: 'Deed of Assignment', description: 'A document that officially transfers ownership of property from the seller to the buyer and is often used to apply for Governor\'s Consent.' },
  { id: 'coo', name: 'Certificate of Occupancy (C of O)', description: 'A document that provides proof of a property\'s legal title and is considered very important in some regions.' },
  { id: 'survey', name: 'Survey Plan', description: 'A document that defines the exact boundaries, location, and size of a piece of land.' },
  { id: 'purchase', name: 'Purchase Agreement or Sale Agreement', description: 'A legal contract outlining the terms and conditions of the sale, including the price, payment structure, and timeline.' },
  { id: 'title', name: 'Sale Deed or Title Deed', description: 'The primary legal document that transfers ownership of a property, details the property\'s information, and serves as proof of sale.' },
  { id: 'consent', name: 'Governor\'s Consent', description: 'A government document that signifies the state government\'s approval of the land transfer.' },
  { id: 'mortgage', name: 'Mortgage Documents', description: 'Legal documents related to a loan taken out to purchase the property.' },
  { id: 'tax', name: 'Property Tax Receipts', description: 'Records of all property tax payments, such as Land Use Charge Payments.' },
  { id: 'occupancy', name: 'Occupancy Certificate', description: 'A certificate indicating a building is safe to be occupied and is compliant with all necessary regulations.' },
  { id: 'poa', name: 'Power of Attorney', description: 'A document that gives a person the legal right to act on behalf of a property owner.' },
  { id: 'receipt', name: 'Receipt of Purchase', description: 'The first document issued after payment is made, acknowledging that the seller has received funds from the buyer.' },
];

export const UploadListing = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [images, setImages] = useState<File[]>([]);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [documents, setDocuments] = useState<{ type: string; file: File }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [skipDocuments, setSkipDocuments] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    propertyType: '',
    bedrooms: '',
    bathrooms: '',
    kitchen: '',
    sqft: '',
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please login to upload listings');
        navigate('/login');
      } else {
        setUserId(session.user.id);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleNext = () => {
    if (step === 1) {
      if (!formData.title || !formData.price || !formData.description || !formData.propertyType) {
        toast.error('Please fill in all required fields');
        return;
      }
      if (images.length === 0) {
        toast.error('Please upload at least one image');
        return;
      }
      if (!thumbnail) {
        toast.error('Please select a thumbnail image');
        return;
      }
    }
    if (step === 2 && !skipDocuments && documents.length < 2) {
      toast.error('Please upload at least 2 documents or skip this step');
      return;
    }
    setStep(step + 1);
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;
    const newImages = Array.from(files).slice(0, 20 - images.length);
    setImages([...images, ...newImages]);
    toast.success(`${newImages.length} image(s) uploaded`);
  };

  const handleThumbnailUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setThumbnail(files[0]);
    toast.success('Thumbnail selected');
  };

  const handleVideoUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setVideo(files[0]);
    toast.success('Video uploaded');
  };

  const handleDocumentUpload = (type: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const existingDoc = documents.find(d => d.type === type);
    if (existingDoc) {
      toast.error('Document already uploaded');
      return;
    }
    setDocuments([...documents, { type, file: files[0] }]);
    toast.success('Document uploaded');
  };

  const uploadFiles = async (): Promise<{ images: string[]; thumbnail: string; video?: string; documents: any[] }> => {
    const uploadedImages: string[] = [];
    let uploadedThumbnail = '';
    let uploadedVideo = '';
    const uploadedDocs: any[] = [];
    
    // Upload images
    for (const image of images) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, image);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      uploadedImages.push(publicUrl);
    }

    // Upload thumbnail
    if (thumbnail) {
      const fileExt = thumbnail.name.split('.').pop();
      const fileName = `thumb_${Math.random()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, thumbnail);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      uploadedThumbnail = publicUrl;
    }

    // Upload video if exists
    if (video) {
      const fileExt = video.name.split('.').pop();
      const fileName = `video_${Math.random()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, video);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      uploadedVideo = publicUrl;
    }

    // Upload documents
    for (const doc of documents) {
      const fileExt = doc.file.name.split('.').pop();
      const fileName = `doc_${doc.type}_${Math.random()}.${fileExt}`;
      const filePath = `${userId}/documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, doc.file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      uploadedDocs.push({ type: doc.type, url: publicUrl });
    }

    return { images: uploadedImages, thumbnail: uploadedThumbnail, video: uploadedVideo, documents: uploadedDocs };
  };

  const handleSubmit = async () => {
    if (!userId) {
      toast.error('User not authenticated');
      return;
    }

    setUploading(true);
    
    try {
      const { images: imageUrls, thumbnail: thumbnailUrl, video: videoUrl, documents: docUrls } = await uploadFiles();

      const { data, error } = await supabase
        .from('properties')
        .insert([
          {
            user_id: userId,
            title: formData.title,
            description: formData.description,
            property_type: formData.propertyType,
            address: 'To be updated',
            price: parseFloat(formData.price),
            bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
            bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
            area: formData.sqft ? parseFloat(formData.sqft) : null,
            status: 'published',
            images: [thumbnailUrl, ...imageUrls],
            video_url: videoUrl || null,
            documents: docUrls,
            is_verified: docUrls.length >= 2,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success('Listing published successfully!');
      setStep(3);
    } catch (error: any) {
      console.error('Error uploading listing:', error);
      toast.error(error.message || 'Failed to upload listing');
    } finally {
      setUploading(false);
    }
  };

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full animate-scale-in">
          <CardContent className="text-center py-12">
            <CheckCircle2 className="h-24 w-24 text-success mx-auto mb-6 animate-float" />
            <h1 className="text-3xl font-bold mb-4">Listing Published Successfully!</h1>
            <p className="text-muted-foreground mb-8">
              Your listing is now visible on the marketplace
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/my-listings')} className="w-full hover-lift">
                View My Listings
              </Button>
              <Button onClick={() => navigate('/dashboard')} variant="outline" className="w-full">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    s <= step ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground'
                  }`}
                >
                  {s}
                </div>
                {s < 2 && (
                  <div className={`flex-1 h-1 mx-2 transition-all ${s < step ? 'bg-primary' : 'bg-accent'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="card-glow">
          <CardHeader>
            <CardTitle>Upload New Listing</CardTitle>
            <CardDescription>
              Step {step} of 2: {['Property Details & Media', 'Documents (Optional)'][step - 1]}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                {/* Images Upload */}
                <div>
                  <Label>Property Images (Up to 20) *</Label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:bg-accent/50 transition-colors mt-2">
                    <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm font-medium mb-1">Drop images here or click to browse</p>
                    <p className="text-xs text-muted-foreground">{images.length} of 20 uploaded</p>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageUpload(e.target.files)}
                    />
                  </label>
                  {images.length > 0 && (
                    <div className="grid grid-cols-4 gap-4 mt-4">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={URL.createObjectURL(img)}
                            alt={`Upload ${idx + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setImages(images.filter((_, i) => i !== idx))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Video Upload */}
                <div>
                  <Label>Property Video (Optional)</Label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:bg-accent/50 transition-colors mt-2">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">{video ? video.name : 'Upload video'}</p>
                    <input
                      type="file"
                      className="hidden"
                      accept="video/*"
                      onChange={(e) => handleVideoUpload(e.target.files)}
                    />
                  </label>
                </div>

                {/* Thumbnail Upload */}
                <div>
                  <Label>Thumbnail Image *</Label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:bg-accent/50 transition-colors mt-2">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">{thumbnail ? thumbnail.name : 'Upload thumbnail'}</p>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleThumbnailUpload(e.target.files)}
                    />
                  </label>
                  {thumbnail && (
                    <img src={URL.createObjectURL(thumbnail)} alt="Thumbnail" className="mt-4 w-32 h-32 object-cover rounded-lg" />
                  )}
                </div>

                <div>
                  <Label htmlFor="title">Property Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Modern 3-Bedroom House"
                  />
                </div>

                <div>
                  <Label htmlFor="propertyType">Property Type *</Label>
                  <Select value={formData.propertyType} onValueChange={(value) => setFormData({ ...formData, propertyType: value })}>
                    <SelectTrigger id="propertyType">
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="House">House</SelectItem>
                      <SelectItem value="Apartment">Apartment</SelectItem>
                      <SelectItem value="Land">Land</SelectItem>
                      <SelectItem value="Shop">Shop</SelectItem>
                      <SelectItem value="Rental">Rental</SelectItem>
                      <SelectItem value="Villa">Villa</SelectItem>
                      <SelectItem value="Office">Office Space</SelectItem>
                      <SelectItem value="Warehouse">Warehouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                      placeholder="3"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                      placeholder="2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="kitchen">Kitchen</Label>
                    <Input
                      id="kitchen"
                      type="number"
                      value={formData.kitchen}
                      onChange={(e) => setFormData({ ...formData, kitchen: e.target.value })}
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sqft">Square Feet</Label>
                    <Input
                      id="sqft"
                      type="number"
                      value={formData.sqft}
                      onChange={(e) => setFormData({ ...formData, sqft: e.target.value })}
                      placeholder="2500"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="price">Price (₦) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="45000000"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your property..."
                    rows={4}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Upload Property Documents</h3>
                    <p className="text-sm text-muted-foreground">Upload at least 2 documents to verify your listing</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Info className="w-4 h-4 mr-2" />
                        Document Info
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Document Types Explained</DialogTitle>
                        <DialogDescription>Learn about each document type</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {DOCUMENT_TYPES.map((doc) => (
                          <div key={doc.id} className="border-b pb-4">
                            <h4 className="font-semibold mb-2">{doc.name}</h4>
                            <p className="text-sm text-muted-foreground">{doc.description}</p>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-4">
                  {DOCUMENT_TYPES.map((docType) => {
                    const uploaded = documents.find(d => d.type === docType.id);
                    return (
                      <div key={docType.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium mb-1">{docType.name}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">{docType.description}</p>
                          </div>
                          {uploaded ? (
                            <div className="flex items-center gap-2 ml-4">
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                              <span className="text-sm text-green-500">Uploaded</span>
                            </div>
                          ) : (
                            <label className="ml-4">
                              <Button variant="outline" size="sm" asChild>
                                <span>
                                  <FileText className="w-4 h-4 mr-2" />
                                  Upload
                                </span>
                              </Button>
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                onChange={(e) => handleDocumentUpload(docType.id, e.target.files)}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center space-x-2 pt-4">
                  <Checkbox
                    id="skip"
                    checked={skipDocuments}
                    onCheckedChange={(checked) => setSkipDocuments(checked as boolean)}
                  />
                  <Label htmlFor="skip" className="cursor-pointer">
                    Skip document upload (listing will show as "Not Verified")
                  </Label>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => step === 1 ? navigate('/dashboard') : setStep(step - 1)}
                disabled={uploading}
              >
                {step === 1 ? 'Cancel' : 'Back'}
              </Button>
              {step < 2 ? (
                <Button onClick={handleNext} disabled={uploading}>
                  Next Step
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    'Publish Listing'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};