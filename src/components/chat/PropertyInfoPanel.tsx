import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Lock, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

type Property = {
  id: string;
  title: string;
  price: number;
  images: string[];
};

type PropertyInfoPanelProps = {
  property: Property;
  offerStatus?: string;
  escrowStatus?: string;
  onStartEscrow?: () => void;
};

export const PropertyInfoPanel = ({ 
  property, 
  offerStatus, 
  escrowStatus,
  onStartEscrow 
}: PropertyInfoPanelProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-semibold text-foreground">Property Details</h3>
      
      {/* Property Image */}
      {property.images?.[0] && (
        <img 
          src={property.images[0]} 
          alt={property.title}
          className="w-full h-32 object-cover rounded-lg"
        />
      )}

      {/* Property Info */}
      <div>
        <h4 className="font-medium text-foreground mb-1">{property.title}</h4>
        <p className="text-2xl font-bold text-primary">{formatPrice(property.price)}</p>
      </div>

      {/* Status Badges */}
      <div className="space-y-2">
        {offerStatus && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Offer Status:</span>
            <Badge variant={
              offerStatus === 'accepted' ? 'default' : 
              offerStatus === 'rejected' ? 'destructive' : 
              'secondary'
            }>
              {offerStatus}
            </Badge>
          </div>
        )}
        {escrowStatus && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Escrow Status:</span>
            <Badge variant="outline">
              {escrowStatus}
            </Badge>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2 border-t border-border">
        <Link to={`/start-payment/${property.id}`} className="block">
          <Button variant="default" className="w-full bg-gradient-to-r from-primary to-primary/80">
            <CreditCard className="w-4 h-4 mr-2" />
            Make Payment
          </Button>
        </Link>

        <Link to={`/property/${property.id}`} className="block">
          <Button variant="outline" className="w-full">
            <ExternalLink className="w-4 h-4 mr-2" />
            View Property
          </Button>
        </Link>
        
        {offerStatus === 'accepted' && !escrowStatus && (
          <Button 
            variant="default" 
            className="w-full"
            onClick={onStartEscrow}
          >
            <Lock className="w-4 h-4 mr-2" />
            Proceed to Escrow
          </Button>
        )}

        {escrowStatus && (
          <Link to="/dashboard/escrow" className="block">
            <Button variant="secondary" className="w-full">
              <FileText className="w-4 h-4 mr-2" />
              View Escrow Details
            </Button>
          </Link>
        )}
      </div>

      {/* Info Notice */}
      <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
        💡 Contact information will be shared after escrow is completed successfully.
      </div>
    </Card>
  );
};
