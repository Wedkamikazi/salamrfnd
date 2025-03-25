import React, { useState, useEffect } from 'react';
import { AlertCircle, Check, X } from 'lucide-react';
import { validateCustomerName, validateAmount, validateIBAN, validateServiceNumber } from '../services/DataValidationService';
import TrainingService from '../services/TrainingService';

interface DataCorrectionProps {
  fieldName: string;
  fieldType: 'customerName' | 'refundAmount' | 'ibanNumber' | 'customerServiceNumber';
  currentValue: string;
  confidence: number;
  onValueCorrect: (value: string, confidence: number) => void;
  context?: string;
  documentId?: string;
}

const DataCorrection: React.FC<DataCorrectionProps> = ({
  fieldName,
  fieldType,
  currentValue,
  confidence,
  onValueCorrect,
  context,
  documentId
}) => {
  const [editMode, setEditMode] = useState<boolean>(false);
  const [value, setValue] = useState<string>(currentValue);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [validationMessage, setValidationMessage] = useState<string>('');
  const [additionalInfo, setAdditionalInfo] = useState<string>('');
  
  const trainingService = TrainingService.getInstance();
  
  useEffect(() => {
    setValue(currentValue);
    validateField(currentValue);
  }, [currentValue]);
  
  const validateField = (input: string) => {
    let validationResult: any = { isValid: true };
    
    switch (fieldType) {
      case 'customerName':
        validationResult = validateCustomerName(input);
        break;
      case 'refundAmount':
        validationResult = validateAmount(input);
        break;
      case 'ibanNumber':
        validationResult = validateIBAN(input);
        if (validationResult.isValid && validationResult.bankName) {
          setAdditionalInfo(validationResult.bankName);
        } else {
          setAdditionalInfo('');
        }
        break;
      case 'customerServiceNumber':
        validationResult = validateServiceNumber(input);
        break;
    }
    
    setIsValid(validationResult.isValid);
    setValidationMessage(validationResult.errorMessage || '');
    
    return validationResult.isValid;
  };
  
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    validateField(newValue);
  };
  
  const handleCancel = () => {
    setValue(currentValue);
    setEditMode(false);
    validateField(currentValue);
  };
  
  const handleSave = async () => {
    if (validateField(value)) {
      // Record the correction in the training system
      if (value !== currentValue && documentId) {
        try {
          // Record the correction for learning
          await trainingService.recordCorrection(
            fieldType,
            currentValue,
            value,
            documentId,
            context
          );
          
          // Also add as a training example
          await trainingService.addTrainingExample({
            fieldType,
            pattern: fieldName.toLowerCase(),
            value,
            context,
            confidence: 90
          });
        } catch (error) {
          console.error('Error saving training example:', error);
        }
      }
      
      onValueCorrect(value, 100); // Set to 100% confidence when manually corrected
      setEditMode(false);
    }
  };
  
  return (
    <div className="border rounded-md p-3 bg-white">
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-medium text-gray-600">{fieldName}</span>
        
        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="text-blue-600 text-sm hover:text-blue-800"
          >
            Edit
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
            <button
              onClick={handleSave}
              className={`${isValid ? 'text-green-600 hover:text-green-800' : 'text-gray-400 cursor-not-allowed'}`}
              disabled={!isValid}
            >
              <Check size={16} />
            </button>
          </div>
        )}
      </div>
      
      {editMode ? (
        <div>
          <input
            type="text"
            value={value}
            onChange={handleValueChange}
            className={`w-full border rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 ${
              isValid ? 'focus:ring-blue-300 border-gray-300' : 'focus:ring-red-300 border-red-300'
            }`}
          />
          
          {!isValid && validationMessage && (
            <div className="mt-1 flex items-start text-red-600 text-xs">
              <AlertCircle size={12} className="mr-1 mt-0.5" />
              <span>{validationMessage}</span>
            </div>
          )}
          
          {isValid && additionalInfo && (
            <div className="mt-1 text-green-600 text-xs">
              {additionalInfo}
            </div>
          )}
        </div>
      ) : (
        <div>
          <span className="text-lg font-medium text-gray-800 block">{currentValue}</span>
          
          {additionalInfo && (
            <span className="text-xs text-gray-600 block mt-1">
              {additionalInfo}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default DataCorrection;