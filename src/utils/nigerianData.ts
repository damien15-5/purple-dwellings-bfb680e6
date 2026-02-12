export const nigerianStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi',
  'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

export const idDocumentTypes = [
  { value: 'national_id', label: 'National Identity Card (NIN)', format: '11-digit number', issuer: 'NIMC' },
  { value: 'passport', label: 'International Passport', format: 'Alphanumeric (e.g., A12345678)', issuer: 'Nigerian Immigration Service' },
  { value: 'drivers_license', label: "Driver's License", format: 'State-specific alphanumeric', issuer: 'FRSC' },
  { value: 'voters_card', label: "Voter's Card (PVC)", format: '19-character alphanumeric', issuer: 'INEC' },
];

export const validateNIN = (nin: string): boolean => /^\d{11}$/.test(nin);
export const validatePassportNumber = (num: string): boolean => /^[A-Z]\d{8}$/i.test(num);
export const validateNigerianPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/[\s-]/g, '');
  return /^(\+234|0)[789]\d{9}$/.test(cleaned);
};

export const extractNINData = (ocrText: string) => ({
  nin: ocrText.match(/\b\d{11}\b/)?.[0] || null,
  name: ocrText.match(/(?:Name|SURNAME)[:\s]+([A-Z\s]+)/i)?.[1]?.trim() || null,
  dob: ocrText.match(/(?:Date of Birth|DOB)[:\s]+(\d{2}[-/]\d{2}[-/]\d{4})/i)?.[1] || null,
  gender: ocrText.match(/(?:Sex|Gender)[:\s]+(Male|Female|M|F)/i)?.[1] || null,
});

export const extractPassportData = (ocrText: string) => ({
  passportNumber: ocrText.match(/[A-Z]\d{8}/)?.[0] || null,
  name: [
    ocrText.match(/(?:Surname)[:\s]+([A-Z\s]+)/i)?.[1]?.trim(),
    ocrText.match(/(?:Given Names?)[:\s]+([A-Z\s]+)/i)?.[1]?.trim(),
  ].filter(Boolean).join(' ') || null,
  dob: ocrText.match(/\d{2}\s?[A-Z]{3}\s?\d{4}/)?.[0] || null,
  nationality: ocrText.match(/(?:Nationality)[:\s]+([A-Z]+)/i)?.[1] || null,
});

export const extractDriverLicenseData = (ocrText: string) => ({
  licenseNumber: ocrText.match(/[A-Z]{3}\s?[A-Z0-9]{8,12}/)?.[0] || null,
  name: ocrText.match(/(?:Name)[:\s]+([A-Z\s]+)/i)?.[1]?.trim() || null,
  dob: ocrText.match(/\d{2}[-/]\d{2}[-/]\d{4}/)?.[0] || null,
});

export const extractVotersCardData = (ocrText: string) => ({
  vinNumber: ocrText.match(/[A-Z0-9]{19}/)?.[0] || null,
  name: ocrText.match(/(?:Name|Voter)[:\s]+([A-Z\s]+)/i)?.[1]?.trim() || null,
});

export const extractDataByDocType = (ocrText: string, docType: string) => {
  switch (docType) {
    case 'national_id': return { ...extractNINData(ocrText), documentNumber: extractNINData(ocrText).nin };
    case 'passport': return { ...extractPassportData(ocrText), documentNumber: extractPassportData(ocrText).passportNumber };
    case 'drivers_license': return { ...extractDriverLicenseData(ocrText), documentNumber: extractDriverLicenseData(ocrText).licenseNumber };
    case 'voters_card': return { ...extractVotersCardData(ocrText), documentNumber: extractVotersCardData(ocrText).vinNumber };
    default: return { documentNumber: null, name: null };
  }
};
