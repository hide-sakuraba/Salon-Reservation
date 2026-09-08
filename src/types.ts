export type UserRole = 'member' | 'host' | 'admin';

export type MembershipTier = 'free' | 'standard' | 'vip';

export interface MemberProfileDetails {
  phone?: string;
  kanaName?: string;
  nailConcerns?: string[];
  preferredStyle?: string;
  hasAllergy?: boolean;
  allergyNote?: string;
  notifyByEmail?: boolean;
  notifyByLine?: boolean;
  registeredAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  tier: MembershipTier;
  stripeCustomerId?: string;
  profile?: MemberProfileDetails;
}

export type SlotCategory =
  | 'gel_art'
  | 'gel_simple'
  | 'paragel_care'
  | 'foot_nail'
  | 'special_custom'
  | 'care_off';

export type SlotStatus = 'available' | 'booked' | 'full' | 'closed';

export interface SalonSlot {
  id: string;
  title: string;
  description: string;
  category: SlotCategory;
  hostName: string;
  hostAvatar: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  price: number; // in JPY
  vipPrice: number; // in JPY
  capacity: number;
  bookedCount: number;
  status: SlotStatus;
  meetingUrl?: string; // or salon note/private room
  bookedUserIds: string[];
  durationMinutes?: number;
}

export interface Reservation {
  id: string;
  slotId: string;
  slotTitle: string;
  date: string;
  startTime: string;
  endTime: string;
  category: SlotCategory;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  createdAt: string;
  status: 'confirmed' | 'cancelled' | 'attended';
  amount: number;
  stripePaymentIntentId?: string;
  receiptUrl?: string;
  meetingUrl?: string;
  nailRequests?: string;
  offRequired?: boolean;
}

export interface StripePaymentData {
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvc: string;
  nameOnCard: string;
  postalCode: string;
}

export interface RealtimeNotification {
  id: string;
  timestamp: string;
  type: 'booking' | 'cancellation' | 'slot_created' | 'slot_updated';
  message: string;
  slotId?: string;
}

export interface SalonInfo {
  name: string;
  tagline: string;
  ownerName: string;
  ownerTitle: string;
  ownerBio: string;
  ownerQualifications: string[];
  postalCode: string;
  address: string;
  station: string;
  accessGuide: string[];
  businessHours: string;
  holidays: string;
  phone: string;
  lineId: string;
  instagram: string;
  paymentMethods: string[];
  features: { title: string; desc: string; icon: string }[];
}
