export interface ExtractedData {
  id: string;
  fileName: string;
  customerName: {
    value: string;
    confidence: number;
  };
  refundAmount: {
    value: string;
    confidence: number;
  };
  ibanNumber: {
    value: string;
    confidence: number;
  };
  customerServiceNumber: {
    value: string;
    confidence: number;
  };
  detectedLayout: string;
  layoutConfidence: number;
  timestamp: string;
}

export interface DocumentSection {
  startPercentage: number;
  endPercentage: number;
  content: string;
  isCustomerInfoSection?: boolean;
  isSignatureSection?: boolean;
}

export interface FormLayout {
  name: string;
  description: string;
  nameSection: {
    expectedLocation: number; // 0-100% document position
    tolerance: number;
  };
  amountSection: {
    expectedLocation: number;
    tolerance: number;
  };
  ibanSection: {
    expectedLocation: number;
    tolerance: number;
  };
  serviceNumberSection: {
    expectedLocation: number;
    tolerance: number;
  };
}