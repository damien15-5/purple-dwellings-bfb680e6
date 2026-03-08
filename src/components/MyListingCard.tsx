import { Property } from '@/types/property';
import { MapPin, Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MyListingCardProps {
  property: Property;
  onDelete: () => void;
}

export const MyListingCard = ({ property, onDelete }: MyListingCardProps) => {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const imageUrl = Array.isArray(property.images) && property.images.length > 0 
    ? property.images[0] 
    : '/placeholder.svg';

  const handleEdit = () => {
    navigate(`/edit-listing/${String(property.id)}`);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', String(property.id));

      if (error) throw error;

      toast.success('Property deleted successfully');
      onDelete();
      setShowDeleteDialog(false);
    } catch (error: any) {
      console.error('Error deleting property:', error);
      const msg = error?.message || error?.details || 'Something went wrong';
      toast.error(`Failed to delete property: ${msg}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="group">
        <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
          <img
            src={imageUrl}
            alt={property.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <h3 className="font-semibold text-base line-clamp-1">{property.title}</h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="line-clamp-1">{property.location}</span>
            </div>
            <div className="flex items-baseline gap-1 pt-1">
              <span className="font-semibold text-base">{formatPrice(property.price)}</span>
              <span className="text-sm text-muted-foreground">total</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleEdit}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={() => setShowDeleteDialog(true)}
              variant="outline"
              size="sm"
              className="flex-1 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{property.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
