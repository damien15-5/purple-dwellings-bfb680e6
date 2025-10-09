export interface Property {
  id: number;
  title: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  propertyType: 'House' | 'Apartment' | 'Villa' | 'Land';
  description: string;
  images: string[];
  seller: {
    name: string;
    id: number;
  };
  status: 'draft' | 'pending' | 'published';
  amenities?: string[];
  sqft?: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  userType: 'Buyer' | 'Seller' | 'Admin';
  profilePhoto?: string;
  phone?: string;
}

export interface ChatMessage {
  id: number;
  sender: number;
  text: string;
  timestamp: Date;
}

export interface Chat {
  id: number;
  participantA: User;
  participantB: User;
  propertyId: number;
  messages: ChatMessage[];
}

export interface EscrowTransaction {
  id: number;
  propertyId: number;
  buyer: User;
  seller: User;
  amount: number;
  status: 'active' | 'completed' | 'disputed';
  createdAt: Date;
}
