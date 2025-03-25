import { DocumentSection, FormLayout } from '../types';

// Predefined form layouts based on common patterns
export const formLayouts: FormLayout[] = [
  {
    name: "Standard Layout",
    description: "Standard form with name at top, IBAN in middle, amount in upper-middle",
    nameSection: {
      expectedLocation: 15, // Expect name in top 15% of document
      tolerance: 15
    },
    amountSection: {
      expectedLocation: 35, // Expect amount around 35% down the document
      tolerance: 15
    },
    ibanSection: {
      expectedLocation: 50, // Expect IBAN around middle of document
      tolerance: 20
    },
    serviceNumberSection: {
      expectedLocation: 75, // Expect service number in lower section
      tolerance: 20
    }
  },
  {
    name: "Compact Layout",
    description: "Compact form with all fields close together in upper portion",
    nameSection: {
      expectedLocation: 15,
      tolerance: 10
    },
    amountSection: {
      expectedLocation: 25,
      tolerance: 10
    },
    ibanSection: {
      expectedLocation: 35,
      tolerance: 10
    },
    serviceNumberSection: {
      expectedLocation: 45,
      tolerance: 10
    }
  },
  {
    name: "Extended Layout",
    description: "Extended form with fields spread throughout document",
    nameSection: {
      expectedLocation: 10,
      tolerance: 10
    },
    amountSection: {
      expectedLocation: 40,
      tolerance: 20
    },
    ibanSection: {
      expectedLocation: 70,
      tolerance: 20
    },
    serviceNumberSection: {
      expectedLocation: 85,
      tolerance: 15
    }
  },
  {
    name: "Reverse Layout",
    description: "Fields in reverse order with amount at bottom",
    nameSection: {
      expectedLocation: 15,
      tolerance: 15
    },
    serviceNumberSection: {
      expectedLocation: 40,
      tolerance: 15
    },
    ibanSection: {
      expectedLocation: 65,
      tolerance: 15
    },
    amountSection: {
      expectedLocation: 85,
      tolerance: 15
    }
  },
  {
    name: "Treasury Form",
    description: "Standard Treasury form with customer info at top and signatures at bottom",
    nameSection: {
      expectedLocation: 20, // Customer info in top 20%
      tolerance: 10
    },
    amountSection: {
      expectedLocation: 40,
      tolerance: 15
    },
    ibanSection: {
      expectedLocation: 60,
      tolerance: 20
    },
    serviceNumberSection: {
      expectedLocation: 25, // Service number usually near customer info
      tolerance: 10
    }
  },
  // Added new layout type for SCTTR forms (Service Cancellation/Termination/Refund)
  {
    name: "SCTTR Form",
    description: "Service Cancellation/Termination/Refund form with customer info at top section",
    nameSection: {
      expectedLocation: 18, // Name in customer info section (approx 15-20%)
      tolerance: 8
    },
    serviceNumberSection: {
      expectedLocation: 18, // Service number also in customer info section
      tolerance: 8
    },
    amountSection: {
      expectedLocation: 35, // Amount in the middle third
      tolerance: 12
    },
    ibanSection: {
      expectedLocation: 65, // IBAN in lower half
      tolerance: 15
    }
  },
  // Added layout for forms with tabular structure
  {
    name: "Tabular Layout",
    description: "Form with fields arranged in a table-like structure",
    nameSection: {
      expectedLocation: 22,
      tolerance: 12
    },
    serviceNumberSection: {
      expectedLocation: 22,
      tolerance: 12
    },
    amountSection: {
      expectedLocation: 50,
      tolerance: 18
    },
    ibanSection: {
      expectedLocation: 70,
      tolerance: 20
    }
  },
  {
    name: "Custom Layout",
    description: "Custom layout detected from document patterns",
    nameSection: {
      expectedLocation: 20,
      tolerance: 30
    },
    amountSection: {
      expectedLocation: 40,
      tolerance: 30
    },
    ibanSection: {
      expectedLocation: 60,
      tolerance: 30
    },
    serviceNumberSection: {
      expectedLocation: 80,
      tolerance: 30
    }
  }
];

// Divide document into sections for better position-based analysis
export function divideDocumentIntoSections(text: string, sectionCount: number = 10): DocumentSection[] {
  const lines = text.split('\n');
  const totalLines = lines.length;
  const sectionsArray: DocumentSection[] = [];
  
  // Create sections based on line positions
  for (let i = 0; i < sectionCount; i++) {
    const startLine = Math.floor((i / sectionCount) * totalLines);
    const endLine = Math.floor(((i + 1) / sectionCount) * totalLines);
    const sectionLines = lines.slice(startLine, endLine);
    
    sectionsArray.push({
      startPercentage: (i / sectionCount) * 100,
      endPercentage: ((i + 1) / sectionCount) * 100,
      content: sectionLines.join('\n')
    });
  }
  
  // Try to detect customer information section
  const customerInfoIndex = detectCustomerInfoSection(sectionsArray);
  if (customerInfoIndex >= 0) {
    // Mark this section as the customer information section
    sectionsArray[customerInfoIndex].isCustomerInfoSection = true;
  }
  
  // Try to detect signature/office section (bottom section we want to avoid for customer data)
  const signatureIndex = detectSignatureSection(sectionsArray);
  if (signatureIndex >= 0) {
    // Mark this section as the signature section
    sectionsArray[signatureIndex].isSignatureSection = true;
  }
  
  return sectionsArray;
}

// Detect customer information section
function detectCustomerInfoSection(sections: DocumentSection[]): number {
  const customerKeywords = [
    /customer information/i,
    /customer info/i,
    /client information/i,
    /بيانات العميل/i,
    /معلومات العميل/i,
    /customer/i
  ];
  
  // IMPROVEMENT: Look for section headers more aggressively
  const customerHeaderPatterns = [
    /CUSTOMER INFORMATION/i,
    /customer information/i,
    /Customer Details/i,
    /CLIENT DETAILS/i,
  ];
  
  // Check first 40% of the document
  const topSections = sections.filter(s => s.endPercentage <= 40);
  
  // First check for explicit headers
  for (let i = 0; i < topSections.length; i++) {
    const section = topSections[i];
    const sectionIndex = sections.findIndex(s => s === section);
    
    for (const headerPattern of customerHeaderPatterns) {
      if (headerPattern.test(section.content)) {
        return sectionIndex;
      }
    }
  }
  
  // Then check for general customer keywords
  for (let i = 0; i < topSections.length; i++) {
    const section = topSections[i];
    const sectionIndex = sections.findIndex(s => s === section);
    
    for (const keyword of customerKeywords) {
      if (keyword.test(section.content)) {
        return sectionIndex;
      }
    }
  }
  
  // IMPROVEMENT: Look for typical customer data fields
  for (let i = 0; i < topSections.length; i++) {
    const section = topSections[i];
    const sectionIndex = sections.findIndex(s => s === section);
    
    // Check for name field
    if (/name\s*[:\.\s]/i.test(section.content) && 
        (/MR\s*\./i.test(section.content) || /phone/i.test(section.content) || /FTTH/i.test(section.content))) {
      return sectionIndex;
    }
  }
  
  // If we didn't find a clear customer section, assume the first section
  return 0;
}

// Detect signature/office use section
function detectSignatureSection(sections: DocumentSection[]): number {
  const signatureKeywords = [
    /office use only/i,
    /signature/i,
    /sign/i,
    /للاستعمال الرسمي/i,
    /توقيع/i,
    /office/i,
    // Added more patterns to detect signature sections
    /OFFICE USE ONLY/i,
    /Regional\s+Sales\s+Manager/i,
    /Back\s+Office\s+Manager/i,
    /Sales\s+Director/i,
    /Customer\s+Operation/i,
    /Customer\s+Signature/i,
    /Technical\s+Report/i
  ];
  
  // Check last 50% of the document (increased from 40%)
  const bottomSections = sections.filter(s => s.startPercentage >= 50);
  
  for (let i = 0; i < bottomSections.length; i++) {
    const section = bottomSections[i];
    const sectionIndex = sections.findIndex(s => s === section);
    
    for (const keyword of signatureKeywords) {
      if (keyword.test(section.content)) {
        return sectionIndex;
      }
    }
  }
  
  // IMPROVEMENT: Look for signature patterns in bottom sections
  for (let i = 0; i < bottomSections.length; i++) {
    const section = bottomSections[i];
    const sectionIndex = sections.findIndex(s => s === section);
    
    // Check for manager names or signature lines
    if ((/Manager/i.test(section.content) && /Name/i.test(section.content)) ||
        (/Director/i.test(section.content)) ||
        (/Signature:/i.test(section.content)) ||
        (/Date:/i.test(section.content) && /Sign/i.test(section.content))) {
      return sectionIndex;
    }
  }
  
  return -1;
}

// Find the section where a specific pattern appears with section prioritization
export function findPatternInSections(
  sections: DocumentSection[], 
  patterns: RegExp[]
): { 
  position: number; 
  match: string | null;
  confidence: number;
  sectionType?: string;
} {
  // First try to match in customer information section (highest priority)
  const customerInfoSection = sections.find(s => s.isCustomerInfoSection);
  if (customerInfoSection) {
    for (const pattern of patterns) {
      const match = customerInfoSection.content.match(pattern);
      if (match && match[1]) {
        // Calculate position as middle point of section
        const position = (customerInfoSection.startPercentage + customerInfoSection.endPercentage) / 2;
        // Higher confidence if found in customer info section
        const patternConfidence = 95 - (patterns.indexOf(pattern) * 5);
        return { 
          position, 
          match: match[1],
          confidence: patternConfidence,
          sectionType: 'customerInfo'
        };
      }
    }
  }
  
  // Then try to match in top 30% of document (high priority)
  const topSections = sections.filter(s => s.endPercentage <= 30 && !s.isSignatureSection);
  for (const section of topSections) {
    for (const pattern of patterns) {
      const match = section.content.match(pattern);
      if (match && match[1]) {
        // Calculate position as middle point of section
        const position = (section.startPercentage + section.endPercentage) / 2;
        // High confidence if found in top section
        const patternConfidence = 90 - (patterns.indexOf(pattern) * 5);
        return { 
          position, 
          match: match[1],
          confidence: patternConfidence,
          sectionType: 'top'
        };
      }
    }
  }
  
  // Then try middle sections (medium priority)
  const middleSections = sections.filter(s => s.startPercentage > 30 && s.endPercentage < 70 && !s.isSignatureSection);
  for (const section of middleSections) {
    for (const pattern of patterns) {
      const match = section.content.match(pattern);
      if (match && match[1]) {
        // Calculate position as middle point of section
        const position = (section.startPercentage + section.endPercentage) / 2;
        // Medium confidence for middle sections
        const patternConfidence = 80 - (patterns.indexOf(pattern) * 5);
        return { 
          position, 
          match: match[1],
          confidence: patternConfidence,
          sectionType: 'middle'
        };
      }
    }
  }
  
  // AVOID signature/office sections for most fields
  const nonSignatureSections = sections.filter(s => !s.isSignatureSection);
  for (const section of nonSignatureSections) {
    for (const pattern of patterns) {
      const match = section.content.match(pattern);
      if (match && match[1]) {
        // Calculate position as middle point of section
        const position = (section.startPercentage + section.endPercentage) / 2;
        // Base confidence on pattern position and section location
        const patternConfidence = 75 - (patterns.indexOf(pattern) * 7);
        return { 
          position, 
          match: match[1],
          confidence: patternConfidence
        };
      }
    }
  }
  
  // IMPROVEMENT: Almost never use signature sections for important fields like names
  // Only check signature sections as absolute last resort and with very low confidence
  const signatureSections = sections.filter(s => s.isSignatureSection);
  for (const section of signatureSections) {
    for (const pattern of patterns) {
      const match = section.content.match(pattern);
      if (match && match[1]) {
        // Calculate position as middle point of section
        const position = (section.startPercentage + section.endPercentage) / 2;
        
        // Very low confidence for signature sections
        const patternConfidence = 30 - (patterns.indexOf(pattern) * 5);
        
        return { 
          position, 
          match: match[1],
          confidence: patternConfidence,
          sectionType: 'signature'
        };
      }
    }
  }
  
  // If no match found, try a global search through the entire document
  const combinedContent = sections.map(s => s.content).join('\n');
  for (const pattern of patterns) {
    const match = combinedContent.match(pattern);
    if (match && match[1]) {
      // Lower confidence since we couldn't locate it precisely
      return { 
        position: 50, // Middle of document as fallback
        match: match[1],
        confidence: 45 - (patterns.indexOf(pattern) * 5)
      };
    }
  }
  
  return { position: -1, match: null, confidence: 0 };
}

// Calculate score for how well a document matches a form layout
export function calculateLayoutMatchScore(
  namePosition: number,
  amountPosition: number,
  ibanPosition: number,
  serviceNumberPosition: number,
  layout: FormLayout
): number {
  // Skip if any essential position is missing
  if (namePosition < 0 || amountPosition < 0 || ibanPosition < 0 || serviceNumberPosition < 0) {
    return 0;
  }
  
  // Calculate deviation from expected positions, adjusted for tolerance
  const nameDeviation = Math.abs(namePosition - layout.nameSection.expectedLocation) / layout.nameSection.tolerance;
  const amountDeviation = Math.abs(amountPosition - layout.amountSection.expectedLocation) / layout.amountSection.tolerance;
  const ibanDeviation = Math.abs(ibanPosition - layout.ibanSection.expectedLocation) / layout.ibanSection.tolerance;
  const serviceDeviation = Math.abs(serviceNumberPosition - layout.serviceNumberSection.expectedLocation) / layout.serviceNumberSection.tolerance;
  
  // Calculate score (100 is perfect match, lower values for larger deviations)
  // Each field can contribute up to 25 points
  const nameScore = 25 * Math.max(0, 1 - nameDeviation);
  const amountScore = 25 * Math.max(0, 1 - amountDeviation);
  const ibanScore = 25 * Math.max(0, 1 - ibanDeviation);
  const serviceScore = 25 * Math.max(0, 1 - serviceDeviation);
  
  return nameScore + amountScore + ibanScore + serviceScore;
}

// Detect the best matching form layout for a document
export function detectFormLayout(
  namePosition: number,
  amountPosition: number,
  ibanPosition: number,
  serviceNumberPosition: number
): {
  layout: FormLayout;
  confidence: number;
} {
  let bestMatch = formLayouts[0]; // Default to first layout
  let highestScore = 0;
  
  // Calculate match scores for all predefined layouts
  for (const layout of formLayouts) {
    const score = calculateLayoutMatchScore(
      namePosition,
      amountPosition,
      ibanPosition,
      serviceNumberPosition,
      layout
    );
    
    if (score > highestScore) {
      highestScore = score;
      bestMatch = layout;
    }
  }
  
  // Convert score to a confidence percentage
  const confidence = highestScore;
  
  return {
    layout: bestMatch,
    confidence
  };
}