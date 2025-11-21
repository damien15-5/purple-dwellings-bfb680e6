-- Function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_type TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, title, description, type)
  VALUES (p_user_id, p_title, p_description, p_type);
END;
$$;

-- Trigger for new saved property
CREATE OR REPLACE FUNCTION notify_property_saved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  property_title TEXT;
BEGIN
  SELECT title INTO property_title
  FROM properties
  WHERE id = NEW.property_id;
  
  PERFORM create_notification(
    NEW.user_id,
    'Property Saved',
    'You saved ' || property_title || ' to your favorites',
    'saved'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_property_saved
  AFTER INSERT ON saved_properties
  FOR EACH ROW
  EXECUTE FUNCTION notify_property_saved();

-- Trigger for new offer received (seller notification)
CREATE OR REPLACE FUNCTION notify_offer_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  property_title TEXT;
  buyer_name TEXT;
BEGIN
  IF NEW.offer_amount IS NOT NULL AND NEW.offer_status = 'pending' THEN
    SELECT title INTO property_title
    FROM properties
    WHERE id = NEW.property_id;
    
    SELECT full_name INTO buyer_name
    FROM profiles
    WHERE id = NEW.buyer_id;
    
    PERFORM create_notification(
      NEW.seller_id,
      'New Offer Received',
      buyer_name || ' made an offer of ₦' || NEW.offer_amount::TEXT || ' on ' || property_title,
      'offer'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_offer_received
  AFTER INSERT ON escrow_transactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_offer_received();

-- Trigger for offer response (buyer notification)
CREATE OR REPLACE FUNCTION notify_offer_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  property_title TEXT;
  notification_title TEXT;
  notification_desc TEXT;
BEGIN
  IF OLD.offer_status = 'pending' AND NEW.offer_status IN ('accepted', 'rejected') THEN
    SELECT title INTO property_title
    FROM properties
    WHERE id = NEW.property_id;
    
    IF NEW.offer_status = 'accepted' THEN
      notification_title := 'Offer Accepted!';
      notification_desc := 'Your offer on ' || property_title || ' has been accepted';
    ELSE
      notification_title := 'Offer Rejected';
      notification_desc := 'Your offer on ' || property_title || ' was rejected';
    END IF;
    
    PERFORM create_notification(
      NEW.buyer_id,
      notification_title,
      notification_desc,
      'offer_response'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_offer_response
  AFTER UPDATE ON escrow_transactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_offer_response();

-- Trigger for escrow status changes
CREATE OR REPLACE FUNCTION notify_escrow_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  property_title TEXT;
  status_text TEXT;
BEGIN
  IF OLD.status != NEW.status THEN
    SELECT title INTO property_title
    FROM properties
    WHERE id = NEW.property_id;
    
    CASE NEW.status
      WHEN 'funded' THEN
        status_text := 'Escrow funded for ' || property_title;
      WHEN 'inspection_period' THEN
        status_text := 'Inspection period started for ' || property_title;
      WHEN 'completed' THEN
        status_text := 'Transaction completed for ' || property_title;
      WHEN 'disputed' THEN
        status_text := 'Dispute raised for ' || property_title;
      WHEN 'cancelled' THEN
        status_text := 'Escrow cancelled for ' || property_title;
      ELSE
        status_text := 'Escrow status updated for ' || property_title;
    END CASE;
    
    -- Notify buyer
    PERFORM create_notification(
      NEW.buyer_id,
      'Escrow Status Update',
      status_text,
      'escrow'
    );
    
    -- Notify seller
    PERFORM create_notification(
      NEW.seller_id,
      'Escrow Status Update',
      status_text,
      'escrow'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_escrow_status_change
  AFTER UPDATE ON escrow_transactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_escrow_status_change();

-- Trigger for new messages
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_id UUID;
  sender_name TEXT;
  property_title TEXT;
  conv_data RECORD;
BEGIN
  SELECT buyer_id, seller_id, property_id
  INTO conv_data
  FROM conversations
  WHERE id = NEW.conversation_id;
  
  -- Determine recipient (the other person in conversation)
  IF NEW.sender_id = conv_data.buyer_id THEN
    recipient_id := conv_data.seller_id;
  ELSE
    recipient_id := conv_data.buyer_id;
  END IF;
  
  SELECT full_name INTO sender_name
  FROM profiles
  WHERE id = NEW.sender_id;
  
  IF conv_data.property_id IS NOT NULL THEN
    SELECT title INTO property_title
    FROM properties
    WHERE id = conv_data.property_id;
    
    PERFORM create_notification(
      recipient_id,
      'New Message',
      sender_name || ' sent you a message about ' || property_title,
      'message'
    );
  ELSE
    PERFORM create_notification(
      recipient_id,
      'New Message',
      sender_name || ' sent you a message',
      'message'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- Trigger for verification status updates
CREATE OR REPLACE FUNCTION notify_verification_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    IF NEW.status = 'verified' THEN
      PERFORM create_notification(
        NEW.user_id,
        'Account Verified!',
        'Your identity has been successfully verified',
        'verification'
      );
    ELSIF NEW.status = 'rejected' THEN
      PERFORM create_notification(
        NEW.user_id,
        'Verification Failed',
        'Your identity verification was rejected. Please resubmit',
        'verification'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_verification_status_change
  AFTER UPDATE ON kyc_documents
  FOR EACH ROW
  EXECUTE FUNCTION notify_verification_status();

-- Trigger for property listing status changes
CREATE OR REPLACE FUNCTION notify_property_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    IF NEW.status = 'published' THEN
      PERFORM create_notification(
        NEW.user_id,
        'Property Published!',
        'Your property "' || NEW.title || '" is now live',
        'property'
      );
    ELSIF NEW.status = 'rejected' THEN
      PERFORM create_notification(
        NEW.user_id,
        'Property Listing Rejected',
        'Your property "' || NEW.title || '" needs review',
        'property'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_property_status_change
  AFTER UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION notify_property_status_change();