
-- Fix the trigger function to use pg_net correctly
CREATE OR REPLACE FUNCTION public.send_notification_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Make async HTTP call to edge function using pg_net
  PERFORM net.http_post(
    url := 'https://bmzjeamkuxeksbfjusui.supabase.co/functions/v1/send-notification-email',
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'title', NEW.title,
      'description', NEW.description,
      'type', NEW.type
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Email notification failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;
