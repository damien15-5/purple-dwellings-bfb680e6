import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const AuthRedirectHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    const hash = window.location.hash;

    // Only act when there are OAuth tokens in the URL hash
    if (!hash.includes('access_token')) return;

    // Don't intercept recovery tokens — let /reset-password handle them
    const hashParams = new URLSearchParams(hash.substring(1));
    if (hashParams.get('type') === 'recovery') {
      // If we're not already on /reset-password, redirect there with the hash
      if (location.pathname !== '/reset-password') {
        handled.current = true;
        window.location.href = '/reset-password' + hash;
      }
      return;
    }

    handled.current = true;

    // Extract tokens from hash
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!accessToken || !refreshToken) {
      handled.current = false;
      return;
    }

    // Clear the hash from URL immediately to prevent re-processing
    window.history.replaceState(null, '', location.pathname);

    const processOAuth = async () => {
      try {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('OAuth session error:', error);
          navigate('/login', { replace: true });
          return;
        }

        if (data.session) {
          // Mark as logged in for notification tracking
          sessionStorage.setItem('xavorian_just_logged_in', 'true');
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error('Error processing OAuth callback:', err);
        navigate('/login', { replace: true });
      }
    };

    processOAuth();
  }, [navigate, location.pathname]);

  return null;
};
