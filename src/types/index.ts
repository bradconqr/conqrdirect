// Type definitions for the Stan Store clone

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: Date;
}

export interface Creator extends User {
  storeName: string;
  storeDescription?: string;
  socialLinks?: SocialLinks;
  customDomain?: string;
  stripeConnectedAccountId?: string;
}

export interface Customer extends User {
  purchases: Purchase[];
}

export interface SocialLinks {
  twitter?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  website?: string;
}

// Product types
export type ProductType = 'download' | 'course' | 'membership' | 'webinar' | '1on1call' | 'external_link' | 'lead_magnet' | 'ama' | 'physical' | 'affiliate' | 'service' | 'ticket';
export type LinkType = 'affiliate' | 'personal' | 'subscription';
export type TicketType = 'online' | 'physical' | 'hybrid';

export interface Product {
  id: string;
  creatorId: string;
  name: string;
  description: string;
  type: ProductType;
  price: number;
  discountPrice?: number;
  thumbnail?: string;
  featured: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Optional type-specific fields
  fileUrl?: string;
  fileSize?: number;
  fileType?: string;
  modules?: CourseModule[];
  totalDuration?: number;
  benefits?: Benefit[];
  interval?: 'monthly' | 'yearly';
  startDate?: string | Date;
  endDate?: string | Date;
  maxAttendees?: number;
  meetingUrl?: string;
  
  // 1on1 call specific fields
  callDuration?: number;
  callPlatform?: string;
  availableDays?: string[];
  callTimeSlots?: string[];
  
  // External link specific fields
  targetUrl?: string;
  linkType?: LinkType;
  linkText?: string;
  commissionRate?: number;
  
  // Lead magnet specific fields
  leadMagnetFile?: string;
  emailListName?: string;
  thankYouMessage?: string;
  redirectUrl?: string;
  optInRequired?: boolean;
  optInText?: string;
  
  // AMA specific fields
  responseTime?: number;
  maxQuestionLength?: number;
  topicCategories?: string[];
  allowAttachments?: boolean;
  attachmentTypes?: string[];
  anonymousAllowed?: boolean;
  
  // Physical product specific fields
  sku?: string;
  brand?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  inventory?: number;
  lowStockThreshold?: number;
  shippingWeight?: number;
  shippingDimensions?: {
    length: number;
    width: number;
    height: number;
  };
  shippingClass?: string;
  freeShipping?: boolean;
  handlingTime?: number;
  variations?: ProductVariation[];
  additionalImages?: string[];
  
  // Affiliate product specific fields
  affiliateNetwork?: string;
  cookieDuration?: number;
  termsAndConditions?: string;
  
  // Service specific fields
  serviceType?: string;
  serviceDuration?: number;
  serviceDeliverables?: string[];
  serviceTurnaroundTime?: number;
  serviceRevisions?: number;
  
  // Ticket specific fields
  ticketType?: TicketType;
  venue?: string;
  venueAddress?: string;
  eventDate?: string | Date;
  eventTime?: string;
  ticketQuantity?: number;
  ticketOptions?: TicketOption[];
  seatingChart?: string;
  ticketDeliveryMethod?: 'email' | 'print' | 'will_call' | 'mobile';
  ticketTransferable?: boolean;
  ticketRefundPolicy?: string;
  
  // Common additional fields
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  customAttributes?: Record<string, string>;
  relatedProducts?: string[];
  crossSellProducts?: string[];
  returnPolicy?: string;
  warrantyInfo?: string;
  
  // Relations
  creator?: any;
}

export interface ProductVariation {
  id: string;
  attributes: Record<string, string>; // e.g., { "size": "M", "color": "Blue" }
  price?: number;
  inventory?: number;
  sku?: string;
  image?: string;
}

export interface TicketOption {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  availableQuantity: number;
}

export interface DownloadProduct extends Product {
  type: 'download';
  fileUrl: string;
  fileSize: number;
  fileType: string;
}

export interface CourseProduct extends Product {
  type: 'course';
  modules: CourseModule[];
  totalDuration: number;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  lessons: CourseLesson[];
  isPublished?: boolean;
  sortOrder?: number;
}

export interface CourseLesson {
  id: string;
  title: string;
  description: string;
  mediaContent?: MediaContent;
  duration: number;
  resources?: Resource[];
  isPublished?: boolean;
  isPreviewable?: boolean;
  sortOrder?: number;
}

export interface MediaContent {
  id: string;
  type: 'video' | 'audio' | 'pdf' | 'doc' | 'image' | 'iframe';
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  title?: string;
  size?: number;
}

export interface Resource {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: number;
}

export interface Benefit {
  id: string;
  description: string;
}

export interface MembershipProduct extends Product {
  type: 'membership';
  benefits: Benefit[];
  interval: 'monthly' | 'yearly';
}

export interface WebinarProduct extends Product {
  type: 'webinar';
  startDate: Date;
  endDate: Date;
  maxAttendees?: number;
  meetingUrl?: string;
}

export interface OneOnOneCallProduct extends Product {
  type: '1on1call';
  callDuration: number;
  callPlatform: string;
  availableDays: string[];
  callTimeSlots: string[];
}

export interface ExternalLinkProduct extends Product {
  type: 'external_link';
  targetUrl: string;
  linkType: LinkType;
  linkText?: string;
  commissionRate?: number;
}

export interface LeadMagnetProduct extends Product {
  type: 'lead_magnet';
  leadMagnetFile: string;
  emailListName: string;
  thankYouMessage?: string;
  redirectUrl?: string;
  optInRequired?: boolean;
  optInText?: string;
}

export interface AMAProduct extends Product {
  type: 'ama';
  responseTime: number;
  maxQuestionLength?: number;
  topicCategories?: string[];
  allowAttachments?: boolean;
  attachmentTypes?: string[];
  anonymousAllowed?: boolean;
}

export interface PhysicalProduct extends Product {
  type: 'physical';
  sku: string;
  brand?: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  inventory: number;
  lowStockThreshold?: number;
  shippingWeight: number;
  shippingDimensions?: {
    length: number;
    width: number;
    height: number;
  };
  shippingClass?: string;
  freeShipping?: boolean;
  handlingTime?: number;
  variations?: ProductVariation[];
  additionalImages?: string[];
}

export interface AffiliateProduct extends Product {
  type: 'affiliate';
  affiliateNetwork?: string;
  targetUrl: string;
  commissionRate: number;
  cookieDuration?: number;
  termsAndConditions?: string;
}

export interface ServiceProduct extends Product {
  type: 'service';
  serviceType: string;
  serviceDuration: number;
  serviceDeliverables: string[];
  serviceTurnaroundTime: number;
  serviceRevisions: number;
}

export interface TicketProduct extends Product {
  type: 'ticket';
  ticketType: TicketType;
  venue: string;
  venueAddress?: string;
  eventDate: Date;
  eventTime: string;
  ticketQuantity: number;
  ticketOptions?: TicketOption[];
  seatingChart?: string;
  ticketDeliveryMethod: 'email' | 'print' | 'will_call' | 'mobile';
  ticketTransferable: boolean;
  ticketRefundPolicy?: string;
}

// Purchase and checkout types
export interface Purchase {
  id: string;
  customerId: string;
  productId: string;
  price: number;
  discountApplied?: number;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: Date;
}

export interface Discount {
  id: string;
  code: string;
  productId?: string; // If null, applies to all products
  type: 'percentage' | 'fixed';
  value: number;
  startDate?: Date;
  endDate?: Date;
  maxUses?: number;
  currentUses: number;
}

// Analytics types
export interface AnalyticsData {
  revenue: {
    total: number;
    byDay: { date: string; amount: number }[];
    byProduct: { productId: string; amount: number }[];
  };
  visitors: {
    total: number;
    byDay: { date: string; count: number }[];
  };
  conversions: {
    rate: number;
    byProduct: { productId: string; rate: number }[];
  };
}

// Marketing types
export interface AffiliateProgram {
  id: string;
  creatorId: string;
  name: string;
  commission: number; // Percentage
  active: boolean;
}

export interface Affiliate {
  id: string;
  userId: string;
  programId: string;
  code: string;
  sales: number;
  earnings: number;
  createdAt: Date;
}

export interface EmailTemplate {
  id: string;
  creatorId: string;
  name: string;
  subject: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

// Community types
export interface CommunityPost {
  id: string;
  creatorId: string;
  authorId: string;
  title: string;
  content: string;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityComment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  likes: number;
  createdAt: Date;
}