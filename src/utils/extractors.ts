/**
 * Utility functions for extracting information from document text
 */
import { ExtractedData, DocumentSection } from '../types';
import { 
  divideDocumentIntoSections, 
  findPatternInSections, 
  detectFormLayout 
} from './layoutDetection';
import TrainingService from '../services/TrainingService';

// Training service instance
const trainingService = TrainingService.getInstance();

// Extract customer name with confidence score, considering position
export const extractCustomerName = async (
  sections: DocumentSection[]
): Promise<{ 
  value: string; 
  confidence: number;
  position: number;
}> => {
  // Get trained patterns from training service
  const trainedPatterns = trainingService.getPatterns('customerName');
  
  // Combine with default patterns - put highly specific patterns first for priority
  const namePatterns = [
    ...trainedPatterns,
    // Treasury form specific patterns targeting customer info section
    /customer information[\s\S]{0,50}name\s*[:\.\s]*([A-Za-z\s.'-]+)/i, // Look for name in customer info section
    /MR\s*\.\s*([A-Za-z\s.'-]+)/i, // Match format "MR. Name"
    /(MR\s*\.)?\s*([A-Za-z\s.'-]+)\s+(?:Al|El)\s+([A-Za-z\s.'-]+)/i, // Middle Eastern name format
    /customer[\s\S]{0,50}name\s*[:\.\s]*([A-Za-z\s.'-]+)/i, // Alternative customer info format
    
    // Generic patterns with lower priority
    /customer\s*name\s*:\s*([A-Za-z\s.'-]+)/i,
    /name\s*:\s*([A-Za-z\s.'-]+)/i,
    /client\s*:\s*([A-Za-z\s.'-]+)/i,
    /applicant\s*:\s*([A-Za-z\s.'-]+)/i,
    /recipient\s*:\s*([A-Za-z\s.'-]+)/i,
    /account\s*holder\s*:\s*([A-Za-z\s.'-]+)/i
  ];

  // CRITICAL FIX: Explicitly search for names in the customer information section first
  const customerInfoSection = sections.find(s => s.isCustomerInfoSection);
  const topSections = sections.filter(s => s.endPercentage <= 30 && !s.isSignatureSection);
  const topSectionsWithNameField = topSections.filter(s => 
    /name\s*[:\.\s]/i.test(s.content) || 
    /MR\s*\./i.test(s.content) || 
    /customer/i.test(s.content)
  );
  
  // Special handling: First check for names with titles like MR., DR., etc.
  const titlePattern = /\b(MR\.|DR\.|MS\.|MRS\.)\s*([A-Za-z\s.'-]+(?:\s+(?:Al|El)\s+[A-Za-z\s.'-]+)?)\b/i;
  
  // First try to extract from explicit customer information section
  if (customerInfoSection) {
    // Special pattern for treasury forms - look for name following "Name" label with Arabic text
    const treasuryNamePattern = /name[\s\u0600-\u06FF]*(?:\s*[:\.\s]\s*)((?:[A-Za-z\s.'-]+\s*)+)/i;
    const treasuryNameMatch = customerInfoSection.content.match(treasuryNamePattern);
    
    if (treasuryNameMatch && treasuryNameMatch[1]) {
      const position = (customerInfoSection.startPercentage + customerInfoSection.endPercentage) / 2;
      return { 
        value: treasuryNameMatch[1].trim(), 
        confidence: 98, // Very high confidence
        position
      };
    }
    
    // Look for title pattern (MR., etc.)
    const titleMatch = customerInfoSection.content.match(titlePattern);
    if (titleMatch && titleMatch[2]) {
      const position = (customerInfoSection.startPercentage + customerInfoSection.endPercentage) / 2;
      return { 
        value: titleMatch[2].trim(), 
        confidence: 98, // Very high confidence
        position
      };
    }
    
    // Try general name patterns in customer info section
    for (const pattern of namePatterns) {
      const match = customerInfoSection.content.match(pattern);
      if (match && match[1]) {
        const position = (customerInfoSection.startPercentage + customerInfoSection.endPercentage) / 2;
        return {
          value: match[1].trim(),
          confidence: 95, // High confidence for customer info section
          position
        };
      }
    }
  }
  
  // Next try top sections with name fields (high priority)
  for (const section of topSectionsWithNameField) {
    // First look for title pattern (MR., etc.)
    const titleMatch = section.content.match(titlePattern);
    if (titleMatch && titleMatch[2]) {
      const position = (section.startPercentage + section.endPercentage) / 2;
      return { 
        value: titleMatch[2].trim(), 
        confidence: 95, // High confidence
        position
      };
    }
    
    // Then try general name patterns
    for (const pattern of namePatterns) {
      const match = section.content.match(pattern);
      if (match && match[1]) {
        const position = (section.startPercentage + section.endPercentage) / 2;
        return {
          value: match[1].trim(),
          confidence: 90, // Good confidence for top sections with name fields
          position
        };
      }
    }
  }
  
  // Try remaining top sections (medium priority)
  for (const section of topSections) {
    // First look for title pattern
    const titleMatch = section.content.match(titlePattern);
    if (titleMatch && titleMatch[2]) {
      const position = (section.startPercentage + section.endPercentage) / 2;
      return { 
        value: titleMatch[2].trim(), 
        confidence: 85,
        position
      };
    }
    
    // Then try general name patterns
    for (const pattern of namePatterns) {
      const match = section.content.match(pattern);
      if (match && match[1]) {
        const position = (section.startPercentage + section.endPercentage) / 2;
        return {
          value: match[1].trim(),
          confidence: 80, // Medium confidence for general top sections
          position
        };
      }
    }
  }
  
  // Use standard pattern matching with section priority as fallback
  const result = findPatternInSections(sections, namePatterns);
  
  if (result.match) {
    const name = result.match.trim();
    // Adjust confidence based on name format
    let confidence = result.confidence;
    
    // Boost confidence for names in the customer info section
    if (result.sectionType === 'customerInfo') {
      confidence += 15;
    } else if (result.sectionType === 'top') {
      confidence += 10;
    } else if (result.sectionType === 'signature') {
      confidence -= 50; // Severely reduce confidence for names in signature sections
    }
    
    // Additional confidence adjustments based on name format
    if (name.length > 3 && name.length < 50) confidence += 5;
    if (/^[A-Z][a-z]+(\s[A-Z][a-z]+)+$/.test(name)) confidence += 5;
    
    // Extra boost for Middle Eastern names with Al/El
    if (/\b(Al|El)\b/i.test(name)) confidence += 8;
    
    // CRITICAL FIX: If this is in a signature section, only use if nothing else was found
    // and apply a very low confidence
    if (result.sectionType === 'signature') {
      confidence = Math.min(confidence, 40); // Cap confidence for signature section names
    }
    
    return { value: name, confidence: Math.min(confidence, 100), position: result.position };
  }
  
  // Fallback: try to find any sequence that looks like a name in non-signature sections
  const nonSignatureSections = sections.filter(s => !s.isSignatureSection);
  for (const section of nonSignatureSections) {
    const nameRegex = /([A-Z][a-z]+(?:\s[A-Z][a-z]+)+(?:\s(?:Al|El)\s[A-Z][a-z]+)?)/;
    const possibleName = section.content.match(nameRegex);
    if (possibleName && possibleName[1]) {
      const position = (section.startPercentage + section.endPercentage) / 2;
      
      // Higher confidence for customer info or top sections
      let confidence = 60;
      if (section.isCustomerInfoSection) {
        confidence = 80;
      } else if (section.endPercentage <= 30) {
        confidence = 70;
      }
      
      return { 
        value: possibleName[1].trim(), 
        confidence,
        position
      };
    }
  }
  
  return { value: "Unknown", confidence: 0, position: -1 };
};

// Extract refund amount with confidence score, considering position
export const extractRefundAmount = async (
  sections: DocumentSection[]
): Promise<{ 
  value: string; 
  confidence: number;
  position: number;
}> => {
  // Get trained patterns from training service
  const trainedPatterns = trainingService.getPatterns('refundAmount');
  
  // Combine with default patterns
  const amountPatterns = [
    ...trainedPatterns,
    /refund\s*amount\s*:\s*(?:SAR|SR|ر.س.|﷼)?\s*([0-9,.]+)/i,
    /amount\s*:\s*(?:SAR|SR|ر.س.|﷼)?\s*([0-9,.]+)/i,
    /total\s*:\s*(?:SAR|SR|ر.س.|﷼)?\s*([0-9,.]+)/i,
    /payment\s*amount\s*:\s*(?:SAR|SR|ر.س.|﷼)?\s*([0-9,.]+)/i,
    /(?:SAR|SR|ر.س.|﷼)\s*([0-9,.]+)/i,
    /([0-9,.]+)\s*(?:SAR|SR|ر.س.|﷼)/i,
  ];
  
  const result = findPatternInSections(sections, amountPatterns);
  
  if (result.match) {
    const amount = result.match.trim();
    // Adjust confidence based on amount format
    let confidence = result.confidence;
    // Check if section contains refund keywords
    const sectionWithAmount = sections.find(s => s.content.includes(amount));
    if (sectionWithAmount && 
        sectionWithAmount.content.toLowerCase().includes("refund")) confidence += 5;
    if (/^[0-9]+(\.[0-9]{2})?$/.test(amount)) confidence += 5; // Proper format like 100.00
    return { value: amount, confidence: Math.min(confidence, 100), position: result.position };
  }
  
  // Fallback: search for any number that might be an amount
  for (const section of sections) {
    const possibleAmount = section.content.match(/([0-9]+(\.[0-9]{2})?)/);
    if (possibleAmount && possibleAmount[1]) {
      const position = (section.startPercentage + section.endPercentage) / 2;
      // Check if section has any money-related keywords
      const hasCurrencyContexts = 
        section.content.toLowerCase().includes("amount") || 
        section.content.toLowerCase().includes("payment") ||
        section.content.toLowerCase().includes("total") ||
        section.content.toLowerCase().includes("sum") ||
        section.content.toLowerCase().includes("sar") ||
        section.content.toLowerCase().includes("refund");
      
      return { 
        value: possibleAmount[1], 
        confidence: hasCurrencyContexts ? 60 : 40,
        position
      };
    }
  }
  
  return { value: "0.00", confidence: 0, position: -1 };
};

// Extract IBAN with confidence score, considering position
export const extractIBAN = async (
  sections: DocumentSection[]
): Promise<{ 
  value: string; 
  confidence: number;
  position: number;
}> => {
  // Get trained patterns from training service
  const trainedPatterns = trainingService.getPatterns('ibanNumber');
  
  // Combine with default patterns
  const ibanPatterns = [
    ...trainedPatterns,
    /iban\s*:\s*(SA\d{22})/i,
    /iban\s*number\s*:\s*(SA\d{22})/i,
    /bank\s*account\s*:\s*(SA\d{22})/i,
    /account\s*number\s*:\s*(SA\d{22})/i,
    /(SA\d{22})/i
  ];
  
  const result = findPatternInSections(sections, ibanPatterns);
  
  if (result.match) {
    const iban = result.match.trim();
    // Adjust confidence based on IBAN format
    let confidence = result.confidence;
    // Check if section contains bank keywords
    const sectionWithIban = sections.find(s => s.content.includes(iban));
    if (sectionWithIban && 
        (sectionWithIban.content.toLowerCase().includes("iban") || 
         sectionWithIban.content.toLowerCase().includes("bank"))) confidence += 5;
    if (/^SA\d{22}$/.test(iban)) confidence += 5; // Perfect IBAN format
    return { value: iban, confidence: Math.min(confidence, 100), position: result.position };
  }
  
  // Fallback: search for anything that looks like an IBAN
  for (const section of sections) {
    const possibleIban = section.content.match(/(SA\d{10,})/i);
    if (possibleIban && possibleIban[1]) {
      const position = (section.startPercentage + section.endPercentage) / 2;
      return { 
        value: possibleIban[1], 
        confidence: 60,
        position
      };
    }
  }
  
  return { value: "Unknown", confidence: 0, position: -1 };
};

// Extract Customer Service Number with confidence score, considering position
export const extractServiceNumber = async (
  sections: DocumentSection[]
): Promise<{ 
  value: string; 
  confidence: number;
  position: number;
}> => {
  // Get trained patterns from training service
  const trainedPatterns = trainingService.getPatterns('customerServiceNumber');
  
  // Combine with default patterns
  const servicePatterns = [
    ...trainedPatterns,
    // Specifically look for FTTH pattern in customer info section
    /customer information[\s\S]{0,100}(FTTH\d+)/i,
    // Standard patterns
    /service\s*number\s*:\s*(FTTH\d+)/i,
    /customer\s*service\s*number\s*:\s*(FTTH\d+)/i,
    /customer\s*id\s*:\s*(FTTH\d+)/i,
    /reference\s*number\s*:\s*(FTTH\d+)/i,
    /reference\s*:\s*(FTTH\d+)/i,
    /(FTTH\d+)/i
  ];
  
  const result = findPatternInSections(sections, servicePatterns);
  
  if (result.match) {
    const serviceNumber = result.match.trim();
    // Adjust confidence based on service number format
    let confidence = result.confidence;
    // Check if section contains service keywords
    const sectionWithService = sections.find(s => s.content.includes(serviceNumber));
    if (sectionWithService && 
        (sectionWithService.content.toLowerCase().includes("service") || 
         sectionWithService.content.toLowerCase().includes("customer id"))) confidence += 5;
    if (/^FTTH\d{3,9}$/.test(serviceNumber)) confidence += 5; // Expected format
    
    // Boost confidence if found in customer information section
    if (result.sectionType === 'customerInfo') {
      confidence += 10;
    }
    
    return { value: serviceNumber, confidence: Math.min(confidence, 100), position: result.position };
  }
  
  // Fallback: search for anything that looks like a service number
  for (const section of sections) {
    const possibleService = section.content.match(/(FTTH\d+)/i);
    if (possibleService && possibleService[1]) {
      const position = (section.startPercentage + section.endPercentage) / 2;
      // Higher confidence if in customer info section
      let confidence = 70;
      if (section.isCustomerInfoSection) {
        confidence = 85;
      }
      return { 
        value: possibleService[1], 
        confidence,
        position
      };
    }
  }
  
  return { value: "Unknown", confidence: 0, position: -1 };
};

// Process document text to extract all required information with layout detection
export const processDocumentText = async (text: string, fileName: string): Promise<ExtractedData> => {
  // Ensure training service is initialized
  await trainingService.initialize();
  
  // Add new patterns specifically for treasury documents
  await ensureTreasuryPatterns();
  
  // Divide document into sections for position-based analysis
  const sections = divideDocumentIntoSections(text);
  
  // Extract each field with position information
  const nameResult = await extractCustomerName(sections);
  const amountResult = await extractRefundAmount(sections);
  const ibanResult = await extractIBAN(sections);
  const serviceResult = await extractServiceNumber(sections);
  
  // Detect form layout based on field positions
  const layoutDetection = detectFormLayout(
    nameResult.position,
    amountResult.position,
    ibanResult.position,
    serviceResult.position
  );
  
  // Boost confidence if layout is well-detected
  const confidenceBoost = layoutDetection.confidence > 70 ? 5 : 0;
  
  return {
    id: Date.now().toString(),
    fileName,
    customerName: {
      value: nameResult.value,
      confidence: Math.min(nameResult.confidence + confidenceBoost, 100)
    },
    refundAmount: {
      value: amountResult.value,
      confidence: Math.min(amountResult.confidence + confidenceBoost, 100)
    },
    ibanNumber: {
      value: ibanResult.value,
      confidence: Math.min(ibanResult.confidence + confidenceBoost, 100)
    },
    customerServiceNumber: {
      value: serviceResult.value,
      confidence: Math.min(serviceResult.confidence + confidenceBoost, 100)
    },
    detectedLayout: layoutDetection.layout.name,
    layoutConfidence: layoutDetection.confidence,
    timestamp: new Date().toISOString()
  };
};

// Ensure treasury-specific patterns are added to the pattern registry
async function ensureTreasuryPatterns() {
  try {
    const patternService = TrainingService.getInstance();
    const db = patternService.getDatabase();
    
    // Check if treasury patterns already exist
    const existingCustomerPattern = await db.extractionPatterns
      .where('patternRegex')
      .equals('MR\\\\s*\\\\.\\\\s*([A-Za-z\\\\s.\\\'-]+)')
      .count();
    
    if (existingCustomerPattern === 0) {
      // Add treasury-specific customer name patterns with high priority
      await db.extractionPatterns.add({
        fieldType: 'customerName',
        patternRegex: 'MR\\s*\\.\\s*([A-Za-z\\s.\'-]+)',
        priority: 1, // Highest priority
        successRate: 95,
        usageCount: 5,
        timestamp: new Date().toISOString()
      });
      
      await db.extractionPatterns.add({
        fieldType: 'customerName',
        patternRegex: 'customer\\s*information[\\s\\S]{0,50}name\\s*[:\\.\\s]*([A-Za-z\\s.\'-]+)',
        priority: 2,
        successRate: 90,
        usageCount: 5,
        timestamp: new Date().toISOString()
      });
      
      // Add special pattern for Middle Eastern names
      await db.extractionPatterns.add({
        fieldType: 'customerName',
        patternRegex: '([A-Za-z\\s.\'-]+)\\s+(?:Al|El)\\s+([A-Za-z\\s.\'-]+)',
        priority: 3,
        successRate: 85,
        usageCount: 5,
        timestamp: new Date().toISOString()
      });
      
      // Add pattern for Treasury form customer name with MR prefix
      await db.extractionPatterns.add({
        fieldType: 'customerName',
        patternRegex: 'name[\\s\\u0600-\\u06FF]*(?:\\s*[:\\.\\s]\\s*)((?:[A-Za-z\\s.\'-]+\\s*)+)',
        priority: 1,
        successRate: 95,
        usageCount: 5,
        timestamp: new Date().toISOString()
      });
      
      // Reload patterns
      await patternService.initialize();
    }
  } catch (error) {
    console.error('Error ensuring treasury patterns:', error);
  }
}