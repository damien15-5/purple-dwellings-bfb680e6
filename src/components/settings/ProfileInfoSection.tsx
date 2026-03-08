import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Camera, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import imageCompression from 'browser-image-compression';

interface ProfileInfoProps {
  profile: {
    full_name: string;
    email: string;
    phone: string;
    whatsapp: string;
    company_name: string;
    avatar_url: string;
    telegram_username: string;
  };
  setProfile: (p: any) => void;
  userId: string | null;
  nameSaved: boolean;
}

export const ProfileInfoSection = ({ profile, setProfile, userId, nameSaved }: ProfileInfoProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploading(true);
    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 400,
        useWebWorker: true,
        fileType: 'image/webp' as const,
        initialQuality: 0.8,
      };
      const compressedImage = await imageCompression(file, options);
      const fileName = `${userId}/avatar_${Date.now()}.webp`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, compressedImage, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);
      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      toast({ title: 'Success', description: 'Profile photo updated successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to upload photo', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };


  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          whatsapp: profile.whatsapp,
          company_name: profile.company_name,
        })
        .eq('id', userId);
      if (error) throw error;
      toast({ title: 'Success', description: 'Profile updated successfully' });
    } catch {
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-accent-purple" />
          Profile Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 mb-6">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className="h-24 w-24 rounded-full object-cover" />
          ) : (
            <div className="h-24 w-24 rounded-full bg-gradient-to-r from-accent-purple to-accent-purple-light flex items-center justify-center text-white text-3xl font-bold">
              {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <input type="file" id="avatar-upload" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            <Button variant="outline" className="gap-2" onClick={() => document.getElementById('avatar-upload')?.click()} disabled={uploading}>
              <Camera className="h-4 w-4" />
              {uploading ? 'Uploading...' : 'Change Photo'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} placeholder="Enter your full name" disabled={nameSaved} className={nameSaved ? 'bg-muted' : ''} />
            {nameSaved && <p className="text-xs text-muted-foreground">Name cannot be edited once saved</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input id="company_name" value={profile.company_name} onChange={(e) => setProfile({ ...profile, company_name: e.target.value })} placeholder="Enter company name (optional)" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+234 xxx xxx xxxx" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp Number</Label>
            <Input id="whatsapp" type="tel" value={profile.whatsapp} onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })} placeholder="+234 xxx xxx xxxx" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={profile.email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="telegram">Telegram</Label>
            {profile.telegram_username && !showTelegramInput ? (
              <div className="flex items-center gap-2">
                <Input value={`@${profile.telegram_username}`} disabled className="bg-muted" />
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">✓ Connected</span>
              </div>
            ) : showTelegramInput ? (
              <div className="flex items-center gap-2">
                <Input id="telegram" value={telegramInput} onChange={(e) => setTelegramInput(e.target.value)} placeholder="@username" />
                <Button size="sm" onClick={handleConnectTelegram} disabled={telegramConnecting}>
                  {telegramConnecting ? 'Saving...' : 'Save'}
                </Button>
              </div>
            ) : (
              <Button variant="outline" className="w-full" onClick={handleConnectTelegram}>
                Connect Telegram
              </Button>
            )}
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  );
};
