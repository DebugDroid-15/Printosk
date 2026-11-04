/**
 * Printosk 2.0 Shared Domain Types & Enumerations
 */

export type PaperSize = 'A4' | 'A3' | 'LETTER' | 'LEGAL';

export type ColourMode = 'BW' | 'COLOUR';

export type DuplexMode = 'SINGLE' | 'DOUBLE_LONG' | 'DOUBLE_SHORT';

export type JobStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'READY'
  | 'CLAIMED'
  | 'PRINTING'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'FAILED'
  | 'CANCELLED';

export type PaymentStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'FAILED'
  | 'REFUNDED';

export type DeviceStatus =
  | 'ONLINE'
  | 'OFFLINE'
  | 'BUSY'
  | 'ERROR'
  | 'MAINTENANCE';

export type PrinterStatus =
  | 'READY'
  | 'PRINTING'
  | 'PAPER_EMPTY'
  | 'PAPER_JAM'
  | 'COVER_OPEN'
  | 'LOW_INK'
  | 'DISCONNECTED'
  | 'ERROR';

export type PrinterLanguage =
  | 'EPSON_ESCPR'
  | 'HP_PCL6'
  | 'POSTSCRIPT'
  | 'GENERIC_ESCPOS';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export interface Kiosk {
  id: string;
  kioskCode: string;
  kioskName: string;
  location: string;
  deviceIdentity: string;
  deviceStatus: DeviceStatus;
  printerStatus: PrinterStatus;
  printerModel: string;
  printerLanguage: PrinterLanguage;
  lastHeartbeat?: string;
  createdAt: string;
}

export interface PrintJob {
  id: string;
  jobId: string; // e.g. PSK-824691
  userId?: string;
  kioskId?: string;
  fileId: string;
  status: JobStatus;
  paperSize: PaperSize;
  colourMode: ColourMode;
  duplexMode: DuplexMode;
  copies: number;
  pageRange?: string; // e.g. "1-5, 8"
  totalPages: number;
  totalSheets: number;
  amountPaise: number; // Stored in minor currency unit (Paise for INR)
  paymentStatus: PaymentStatus;
  createdAt: string;
  paidAt?: string;
  expiresAt: string;
  claimedAt?: string;
  printingStartedAt?: string;
  completedAt?: string;
}

export interface PrintFile {
  id: string;
  jobId: string;
  originalFilePath: string;
  processedFilePath?: string;
  fileSize: number;
  fileHash: string;
  mimeType: string;
  processingStatus: 'PENDING' | 'PROCESSED' | 'FAILED';
  createdAt: string;
  deletedAt?: string;
}

export interface PaymentRecord {
  id: string;
  jobId: string;
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  amountPaise: number;
  currency: string;
  paymentStatus: PaymentStatus;
  webhookVerified: boolean;
  createdAt: string;
  verifiedAt?: string;
}

export interface DeviceHeartbeat {
  id: string;
  kioskId: string;
  firmwareVersion: string;
  wifiRssi: number;
  freeHeap: number;
  printerConnected: boolean;
  deviceStatus: DeviceStatus;
  printerStatus: PrinterStatus;
  createdAt: string;
}

export interface PrintLog {
  id: string;
  jobId?: string;
  kioskId?: string;
  eventType: string;
  message: string;
  errorCode?: string;
  timestamp: string;
}

// Pricing rules (in Paise, where 100 Paise = 1 INR)
export interface PricingConfig {
  bwPricePerPagePaise: number;     // 150 (₹1.50)
  colourPricePerPagePaise: number; // 500 (₹5.00)
  duplexDiscountPaise: number;     // 25 (₹0.25)
}

// Kiosk Job Authorization RPC request/response
export interface ClaimJobRequest {
  kioskCode: string;
  jobId: string;
}

export interface ClaimJobResponse {
  success: boolean;
  message: string;
  job?: {
    id: string;
    jobId: string;
    status: JobStatus;
    paperSize: PaperSize;
    colourMode: ColourMode;
    copies: number;
    totalPages: number;
    downloadUrl: string;
  };
}

