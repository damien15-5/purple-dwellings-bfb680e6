import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const PRODUCTION_DOMAIN = 'https://xavorian.xyz';

export const AuthRedirectHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we're on a non-production domain with OAuth tokens
    const currentUrl = window.location.href;
    const hash = window.location.hash;
    
    // If we have OAuth tokens in the URL and we're not on the production domain
    if (hash.includes('access_token') && !currentUrl.startsWith(PRODUCTION_DOMAIN)) {
      // Redirect to production domain with the same hash
      window.location.href = `${PRODUCTION_DOMAIN}/dashboard${hash}`;
      return;
    }

    // Handle the OAuth callback on production domain
    if (hash.includes('access_token')) {
      const handleOAuthCallback = async () => {
        try {
          // Supabase will automatically detect and process the tokens from the URL
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('OAuth callback error:', error);
            navigate('/login');
            return;
          }

          if (session) {
            // Clear the hash from URL
            window.history.replaceState(null, '', window.location.pathname);
            navigate('/dashboard');
          }
        } catch (err) {
          console.error('Error processing OAuth callback:', err);
          navigate('/login');
        }
      };

      handleOAuthCallback();
    }
  }, [navigate]);

  return null;
};
