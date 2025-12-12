export enum PreparationType {
  FILET = "فیله",
  CLEANED = "پاک شده",
  DAMAGE = "فروش ماهی حذفی"
}

export enum PaymentStatus {
  PAID_CASH = "پرداخت شده (نقد)",
  PAID_CARD = "پرداخت شده (کارت)",
  UNPAID = "پرداخت نشده"
}

export interface Order {
  id: string;
  invoiceNumber: string;
  date: string;
  timestamp: number;
  
  // Buyer Info
  orderer: string;
  customerName: string;
  customerPhone: string;
  
  // Product Info
  quantity?: number; // Added field for item count
  requestedWeight: number; // kg
  preparationType: PreparationType;
  description?: string; // New field for notes
  
  // Fulfillment Info
  deliveryWeight?: number; // kg
  hasStaffDiscount: boolean;
  isFree?: boolean; // Added field for free orders
  paymentStatus: PaymentStatus;
  
  // Price
  finalPrice: number;

  // New property for office orders
  isOfficeOrder?: boolean;
}