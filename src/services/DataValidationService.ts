// Data validation service for Treasury Document Extractor

/**
 * Validates and formats an IBAN number according to Saudi standards
 * @param iban The IBAN string to validate
 * @returns An object with validation result
 */
export const validateIBAN = (iban: string): {
  isValid: boolean;
  formattedValue: string;
  bankName?: string;
  errorMessage?: string;
} => {
  // Remove spaces and convert to uppercase
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();
  
  // Check if it's a Saudi IBAN (SA followed by 22 digits)
  if (!cleanIban.startsWith('SA')) {
    return {
      isValid: false,
      formattedValue: cleanIban,
      errorMessage: 'IBAN must start with SA (Saudi Arabia)'
    };
  }
  
  // Check length
  if (cleanIban.length !== 24) {
    return {
      isValid: false,
      formattedValue: cleanIban,
      errorMessage: 'Saudi IBAN must be 24 characters (SA + 22 digits)'
    };
  }
  
  // Check if all characters after SA are digits
  if (!/^SA\d{22}$/.test(cleanIban)) {
    return {
      isValid: false,
      formattedValue: cleanIban,
      errorMessage: 'IBAN format invalid - must be SA followed by 22 digits'
    };
  }
  
  // For demonstration, determine bank from IBAN
  // In a real system, this would use a proper API or database
  const bankCode = cleanIban.substring(4, 6);
  let bankName = 'Unknown Bank';
  
  switch (bankCode) {
    case '10':
      bankName = 'The Saudi National Bank (SNB)';
      break;
    case '15':
      bankName = 'Al Rajhi Bank';
      break;
    case '20':
      bankName = 'Riyad Bank';
      break;
    case '30':
      bankName = 'Saudi British Bank (SABB)';
      break;
    case '40':
      bankName = 'Banque Saudi Fransi';
      break;
    case '50':
      bankName = 'Arab National Bank';
      break;
    case '60':
      bankName = 'Bank AlJazira';
      break;
    // More banks could be added here
  }
  
  // Format IBAN with spaces for readability
  // Format: SA12 3456 7890 1234 5678 9012
  const formattedIban = cleanIban.replace(/(.{4})/g, '$1 ').trim();
  
  return {
    isValid: true,
    formattedValue: formattedIban,
    bankName
  };
};

/**
 * Validates and formats a customer service number
 * @param serviceNumber The service number to validate
 * @returns An object with validation result
 */
export const validateServiceNumber = (serviceNumber: string): {
  isValid: boolean;
  formattedValue: string;
  errorMessage?: string;
} => {
  // Remove spaces and convert to uppercase
  const cleanNumber = serviceNumber.replace(/\s/g, '').toUpperCase();
  
  // Check if it starts with FTTH
  if (!cleanNumber.startsWith('FTTH')) {
    return {
      isValid: false,
      formattedValue: cleanNumber,
      errorMessage: 'Service number must start with FTTH'
    };
  }
  
  // Check if it has digits after FTTH
  if (!/^FTTH\d+$/.test(cleanNumber)) {
    return {
      isValid: false,
      formattedValue: cleanNumber,
      errorMessage: 'Service number must be FTTH followed by digits'
    };
  }
  
  // Check if it has between 3 and 9 digits
  const digits = cleanNumber.substring(4);
  if (digits.length < 3 || digits.length > 9) {
    return {
      isValid: false,
      formattedValue: cleanNumber,
      errorMessage: 'Service number must have between 3 and 9 digits after FTTH'
    };
  }
  
  return {
    isValid: true,
    formattedValue: cleanNumber
  };
};

/**
 * Validates and formats a refund amount
 * @param amount The amount string to validate
 * @returns An object with validation result
 */
export const validateAmount = (amount: string): {
  isValid: boolean;
  formattedValue: string;
  numericValue: number;
  errorMessage?: string;
} => {
  // Remove currency symbols and spaces
  let cleanAmount = amount.replace(/[^\d.,]/g, '');
  
  // Handle different numeric formats
  if (cleanAmount.includes(',') && cleanAmount.includes('.')) {
    // Format like 1,234.56
    if (cleanAmount.lastIndexOf('.') > cleanAmount.lastIndexOf(',')) {
      cleanAmount = cleanAmount.replace(/,/g, '');
    } 
    // Format like 1.234,56
    else {
      cleanAmount = cleanAmount.replace(/\./g, '').replace(',', '.');
    }
  } else if (cleanAmount.includes(',') && !cleanAmount.includes('.')) {
    // Could be either 1,234 or 1,23
    if (cleanAmount.length - cleanAmount.indexOf(',') - 1 <= 2) {
      // Likely a decimal comma (e.g., 1,23)
      cleanAmount = cleanAmount.replace(',', '.');
    } else {
      // Likely a thousands separator (e.g., 1,234)
      cleanAmount = cleanAmount.replace(',', '');
    }
  }
  
  // Convert to number and check if valid
  const numericValue = parseFloat(cleanAmount);
  
  if (isNaN(numericValue)) {
    return {
      isValid: false,
      formattedValue: amount,
      numericValue: 0,
      errorMessage: 'Invalid numeric format'
    };
  }
  
  if (numericValue <= 0) {
    return {
      isValid: false,
      formattedValue: amount,
      numericValue,
      errorMessage: 'Amount must be greater than zero'
    };
  }
  
  // Format as currency
  const formattedValue = numericValue.toFixed(2);
  
  return {
    isValid: true,
    formattedValue,
    numericValue
  };
};

/**
 * Validates a customer name
 * @param name The customer name to validate
 * @returns An object with validation result
 */
export const validateCustomerName = (name: string): {
  isValid: boolean;
  formattedValue: string;
  errorMessage?: string;
} => {
  // Trim and remove multiple spaces
  const cleanName = name.trim().replace(/\s+/g, ' ');
  
  if (cleanName.length < 2) {
    return {
      isValid: false,
      formattedValue: cleanName,
      errorMessage: 'Name is too short'
    };
  }
  
  // Check for invalid characters
  if (/[0-9@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(cleanName)) {
    return {
      isValid: false,
      formattedValue: cleanName,
      errorMessage: 'Name contains invalid characters'
    };
  }
  
  // Check for proper name format (simple check for first and last name)
  if (!cleanName.includes(' ')) {
    return {
      isValid: true, // Still valid, but potentially incomplete
      formattedValue: cleanName,
      errorMessage: 'Name may be incomplete - no surname detected'
    };
  }
  
  // Capitalize each word for consistent formatting
  const formattedName = cleanName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  return {
    isValid: true,
    formattedValue: formattedName
  };
};

// Add validation for the full extraction result
export const validateExtractionData = (data: {
  customerName: string;
  refundAmount: string;
  ibanNumber: string;
  customerServiceNumber: string;
}): {
  isValid: boolean;
  validatedData: {
    customerName: { value: string; isValid: boolean; message?: string };
    refundAmount: { value: string; numericValue: number; isValid: boolean; message?: string };
    ibanNumber: { value: string; bankName?: string; isValid: boolean; message?: string };
    customerServiceNumber: { value: string; isValid: boolean; message?: string };
  };
} => {
  const nameValidation = validateCustomerName(data.customerName);
  const amountValidation = validateAmount(data.refundAmount);
  const ibanValidation = validateIBAN(data.ibanNumber);
  const serviceValidation = validateServiceNumber(data.customerServiceNumber);
  
  const isValid = 
    nameValidation.isValid && 
    amountValidation.isValid && 
    ibanValidation.isValid && 
    serviceValidation.isValid;
  
  return {
    isValid,
    validatedData: {
      customerName: {
        value: nameValidation.formattedValue,
        isValid: nameValidation.isValid,
        message: nameValidation.errorMessage
      },
      refundAmount: {
        value: amountValidation.formattedValue,
        numericValue: amountValidation.numericValue,
        isValid: amountValidation.isValid,
        message: amountValidation.errorMessage
      },
      ibanNumber: {
        value: ibanValidation.formattedValue,
        bankName: ibanValidation.bankName,
        isValid: ibanValidation.isValid,
        message: ibanValidation.errorMessage
      },
      customerServiceNumber: {
        value: serviceValidation.formattedValue,
        isValid: serviceValidation.isValid,
        message: serviceValidation.errorMessage
      }
    }
  };
};