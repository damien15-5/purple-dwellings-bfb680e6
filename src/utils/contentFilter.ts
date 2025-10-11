// Content filtering to remove contact information from messages
export const filterContactInfo = (text: string): { filtered: string; blocked: boolean } => {
  let filtered = text;
  let blocked = false;

  // Email pattern
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  if (emailPattern.test(filtered)) {
    filtered = filtered.replace(emailPattern, '[EMAIL REMOVED]');
    blocked = true;
  }

  // Phone number patterns (various formats)
  const phonePatterns = [
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // 123-456-7890
    /\b\d{10,11}\b/g, // 1234567890
    /\+\d{1,3}\s?\d{3,4}\s?\d{3,4}\s?\d{3,4}/g, // +234 123 456 7890
    /\b0\d{10}\b/g, // 01234567890
  ];
  
  phonePatterns.forEach(pattern => {
    if (pattern.test(filtered)) {
      filtered = filtered.replace(pattern, '[PHONE REMOVED]');
      blocked = true;
    }
  });

  // URL patterns
  const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(\b[a-zA-Z0-9-]+\.(com|net|org|io|co|ng|uk)[^\s]*)/g;
  if (urlPattern.test(filtered)) {
    filtered = filtered.replace(urlPattern, '[LINK REMOVED]');
    blocked = true;
  }

  // WhatsApp pattern
  const whatsappPattern = /whatsapp|wa\.me/gi;
  if (whatsappPattern.test(filtered)) {
    filtered = filtered.replace(whatsappPattern, '[CONTACT REMOVED]');
    blocked = true;
  }

  // Social media handles
  const socialPattern = /@[a-zA-Z0-9_]+/g;
  if (socialPattern.test(filtered)) {
    filtered = filtered.replace(socialPattern, '[USERNAME REMOVED]');
    blocked = true;
  }

  // Telegram pattern
  const telegramPattern = /telegram|t\.me/gi;
  if (telegramPattern.test(filtered)) {
    filtered = filtered.replace(telegramPattern, '[CONTACT REMOVED]');
    blocked = true;
  }

  return { filtered, blocked };
};
