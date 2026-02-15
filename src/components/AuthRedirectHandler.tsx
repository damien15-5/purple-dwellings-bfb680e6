import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const AuthRedirectHandler = () => {
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    const hash = window.location.hash;

    // Only act when there are OAuth tokens in the URL hash
    if (!hash.includes('access_token')) return;

    handled.current = true;

    // Extract tokens from hash
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!accessToken || !refreshToken) return;

    const processOAuth = async () => {
      try {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        // Clear the hash from URL immediately
        window.history.replaceState(null, '', window.location.pathname);

        if (error) {
          console.error('OAuth session error:', error);
          navigate('/login');
          return;
        }

        navigate('/dashboard');
      } catch (err) {
        console.error('Error processing OAuth callback:', err);
        navigate('/login');
      }
    };

    processOAuth();
  }, [navigate]);

  return null;
};
