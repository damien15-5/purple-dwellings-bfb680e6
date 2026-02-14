// Content filtering - no restrictions, pass through as-is
export const filterContactInfo = (text: string): { filtered: string; blocked: boolean } => {
  return { filtered: text, blocked: false };
};
