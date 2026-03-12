
-- Enable pg_net extension for HTTP calls from database triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create a trigger function that sends email notifications via edge function
CREATE OR REPLACE FUNCTION public.send_notification_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  edge_url TEXT;
  service_key TEXT;
BEGIN
  -- Construct edge function URL
  edge_url := 'https://bmzjeamkuxeksbfjusui.supabase.co/functions/v1/send-notification-email';
  
  -- Get the service role key from vault or use anon key
  service_key := current_setting('app.settings.service_role_key', true);
  
  -- Make async HTTP call to edge function
  PERFORM extensions.http_post(
    edge_url,
    jsonb_build_object(
      'user_id', NEW.user_id,
      'title', NEW.title,
      'description', NEW.description,
      'type', NEW.type
    )::text,
    'application/json'
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't fail the notification insert if email fails
  RAISE WARNING 'Email notification failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- Create trigger on notifications table
DROP TRIGGER IF EXISTS trigger_send_notification_email ON public.notifications;
CREATE TRIGGER trigger_send_notification_email
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.send_notification_email();
