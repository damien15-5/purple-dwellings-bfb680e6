import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProfileInfoSection } from '@/components/settings/ProfileInfoSection';
import { ChangePasswordSection } from '@/components/settings/ChangePasswordSection';
import { NotificationPrefsSection } from '@/components/settings/NotificationPrefsSection';
import { BankAccountSection } from '@/components/settings/BankAccountSection';
import { TelegramConnectionSection } from '@/components/settings/TelegramConnectionSection';

export const Settings = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [nameSaved, setNameSaved] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    whatsapp: '',
    company_name: '',
    avatar_url: '',
  });
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    offers: true,
    messages: true,
    telegram: true,
  });
  const [bankDetails, setBankDetails] = useState({
    bank_name: '',
    account_number: '',
    account_name: '',
    bank_verified: false,
    paystack_subaccount_code: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setProfile({
        full_name: data.full_name || '',
        email: data.email || '',
        phone: data.phone || '',
        whatsapp: data.whatsapp || '',
        company_name: data.company_name || '',
        avatar_url: data.avatar_url || '',
        telegram_username: (data as any).telegram_username || '',
      });
      setNameSaved(!!data.full_name);
      setNotifications({
        email: (data as any).notification_email ?? true,
        push: (data as any).notification_push ?? true,
        offers: (data as any).notification_offers ?? true,
        messages: (data as any).notification_messages ?? true,
        telegram: (data as any).notification_telegram ?? true,
      });
      setBankDetails({
        bank_name: (data as any).bank_name || '',
        account_number: (data as any).account_number || '',
        account_name: (data as any).account_name || '',
        bank_verified: (data as any).bank_verified || false,
        paystack_subaccount_code: (data as any).paystack_subaccount_code || '',
      });
    }
  };

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings & Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <ProfileInfoSection profile={profile} setProfile={setProfile} userId={userId} nameSaved={nameSaved} />
      <ChangePasswordSection />
      <TelegramConnectionSection userId={userId} />
      <NotificationPrefsSection
        notifications={notifications}
        setNotifications={setNotifications}
        userId={userId}
        hasTelegram={!!profile.telegram_username}
      />
      <BankAccountSection bankDetails={bankDetails} setBankDetails={setBankDetails} userId={userId} />
    </div>
  );
};
