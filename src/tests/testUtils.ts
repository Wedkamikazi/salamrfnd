import { ExtractedData, DocumentSection } from '../types';
import { divideDocumentIntoSections, detectFormLayout } from '../utils/layoutDetection';
import { 
  extractCustomerName, 
  extractRefundAmount,
  extractIBAN,
  extractServiceNumber
} from '../utils/extractors';

/**
 * Utility function to create test document text
 */
export function createTestDocument(options: {
  customerName?: string;
  customerNamePosition?: 'top' | 'middle' | 'bottom' | 'signature';
  refundAmount?: string;
  refundAmountPosition?: 'top' | 'middle' | 'bottom';
  ibanNumber?: string;
  ibanPosition?: 'top' | 'middle' | 'bottom';
  serviceNumber?: string;
  serviceNumberPosition?: 'top' | 'middle' | 'bottom';
  includeCustomerInfoSection?: boolean;
  includeSignatureSection?: boolean;
}): string {
  const {
    customerName = 'Mohammed Al Motaeri',
    customerNamePosition = 'top',
    refundAmount = '379.50',
    refundAmountPosition = 'middle',
    ibanNumber = 'SA0380000000608010167519',
    ibanPosition = 'middle',
    serviceNumber = 'FTTH00516134',
    serviceNumberPosition = 'top',
    includeCustomerInfoSection = true,
    includeSignatureSection = true
  } = options;

  // Build document sections
  const sections: string[] = [];
  
  // Header section
  sections.push(`
Form No: F-A-TMP-10-01.0.1

ORDER CANCELLATION/SERVICE TERMINATION REQUEST/
REFUND AND FINAL SETTLEMENT FORM (SCTRR)
  `);

  // Customer Information section
  if (includeCustomerInfoSection) {
    sections.push(`
CUSTOMER INFORMATION
---------------------------------
Name الاسم: ${customerNamePosition === 'top' ? `MR . ${customerName}` : ''}
Mobile No. الجوال: 556130748
Service Number: ${serviceNumberPosition === 'top' ? serviceNumber : ''}
E-mail البريد الإلكتروني: 
    `);
  }

  // Middle section (subscription, fees)
  sections.push(`
Subscription Valid Until: 
One time fees: 
Service fees: 
Last Amount Paid: ${refundAmountPosition === 'middle' ? `SAR ${refundAmount}` : ''}
  `);

  // Additional information section
  sections.push(`
Customer paid for renew for old modem by mistake

${customerNamePosition === 'middle' ? `Customer Name: ${customerName}` : ''}
${serviceNumberPosition === 'middle' ? `Service Number: ${serviceNumber}` : ''}
${ibanPosition === 'middle' ? `IBAN Number: ${ibanNumber}` : ''}
  `);

  // Payment method section
  sections.push(`
Last Payment Method Used:
Please ✓ your selection
Credit Cards البطاقات الائتمانية       x Cash (including ATM) نقدا
  `);

  // Refund section
  sections.push(`
Refund Payment Method:
Please ✓ your selection
□ Wire Transfer تحويل بنكي           □ Cheque شيك           □ Credit Cards البطاقات الائتمانية           □ Cash نقدا
Please provide the required information for the payment method you choose:-

${ibanPosition === 'bottom' ? `${ibanNumber} Rajhi Bank ${customerName}` : ''}
  `);

  // Signature section
  if (includeSignatureSection) {
    sections.push(`
Customer Signature توقيع العميل                                    Date:

---------OFFICE USE ONLY-----------------------------------------------------------------

Regional Sales Manager Name:    ${customerNamePosition === 'signature' ? 'Karim Abu Taha' : ''}
Back Office Manager:            Adnan Mehaidi
Sales Director Name:            Esam Ereifej

Customer Operation Feedback and Recommendation:

Technical Report:
Installation date:
Activation Date:
Recommendation:
  `);
  }

  return sections.join('\n\n');
}

/**
 * Test extraction on a document with specific characteristics
 */
export async function testExtraction(documentText: string): Promise<{
  customerName: { value: string; confidence: number; position: number };
  refundAmount: { value: string; confidence: number; position: number };
  ibanNumber: { value: string; confidence: number; position: number };
  serviceNumber: { value: string; confidence: number; position: number };
  layout: { name: string; confidence: number };
}> {
  const sections = divideDocumentIntoSections(documentText);
  
  const customerName = await extractCustomerName(sections);
  const refundAmount = await extractRefundAmount(sections);
  const ibanNumber = await extractIBAN(sections);
  const serviceNumber = await extractServiceNumber(sections);
  
  const layout = detectFormLayout(
    customerName.position,
    refundAmount.position,
    ibanNumber.position,
    serviceNumber.position
  );
  
  return {
    customerName,
    refundAmount,
    ibanNumber,
    serviceNumber,
    layout
  };
}

/**
 * Analyzes sections of a document for debugging
 */
export function analyzeDocumentSections(text: string): {
  totalSections: number;
  customerInfoSectionIndex: number;
  signatureSectionIndex: number;
  sections: DocumentSection[];
} {
  const sections = divideDocumentIntoSections(text);
  
  const customerInfoSectionIndex = sections.findIndex(s => s.isCustomerInfoSection);
  const signatureSectionIndex = sections.findIndex(s => s.isSignatureSection);
  
  return {
    totalSections: sections.length,
    customerInfoSectionIndex,
    signatureSectionIndex,
    sections
  };
}