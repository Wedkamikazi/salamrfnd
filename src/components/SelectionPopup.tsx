import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Edit3 } from 'lucide-react';

interface SelectionPopupProps {
  position: { x: number; y: number };
  selectedText: string;
  onSelect: (text: string, fieldType: string) => void;
  onClose: () => void;
}

const SelectionPopup: React.FC<SelectionPopupProps> = ({
  position,
  selectedText,
  onSelect,
  onClose
}) => {
  const [fieldType, setFieldType] = useState<string>('');
  const [editedText, setEditedText] = useState<string>(selectedText);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const popupRef = useRef<HTMLDivElement>(null);
  
  // Update edited text when selected text changes
  useEffect(() => {
    setEditedText(selectedText);
  }, [selectedText]);
  
  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // Position popup above or below selection based on available space
  const popupStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y + 10}px`,
    transform: 'translateX(-50%)',
    zIndex: 9999 // Ensure it's always on top
  };
  
  // Confirm selection
  const handleConfirm = () => {
    if (fieldType && editedText) {
      onSelect(editedText, fieldType);
    }
  };
  
  // Toggle edit mode
  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };
  
  // Handle showing predefined values based on field type
  const getPredefinedValues = (type: string) => {
    switch (type) {
      case 'customerName':
        // Check if text looks like a name
        if (/^[A-Z][a-z]+ [A-Z][a-z]+/.test(editedText)) {
          return null; // No suggestions if already looks like a name
        }
        return ['John Smith', 'Mohammed Al Saud', 'Sarah Johnson'];
        
      case 'refundAmount':
        // Format as currency if it's a number
        if (/^[\d,.]+$/.test(editedText)) {
          const numValue = parseFloat(editedText.replace(/,/g, ''));
          if (!isNaN(numValue)) {
            return [numValue.toFixed(2)];
          }
        }
        return ['100.00', '250.50', '1,500.00'];
        
      case 'ibanNumber':
        // Check if starts with SA
        if (/^SA\d+$/.test(editedText)) {
          return null;
        }
        return ['SA0380000000608010167519']; 
        
      case 'customerServiceNumber':
        // Check if starts with FTTH
        if (/^FTTH\d+$/.test(editedText)) {
          return null;
        }
        return ['FTTH123456', 'FTTH987654'];
        
      default:
        return null;
    }
  };
  
  const predefinedValues = fieldType ? getPredefinedValues(fieldType) : null;
  
  return (
    <div 
      ref={popupRef}
      className="fixed bg-white border rounded-lg shadow-xl p-4 w-80 selection-popup"
      style={popupStyle}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-sm font-medium text-gray-800">Extract Selected Value</h3>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={16} />
        </button>
      </div>
      
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Selected Text
        </label>
        {isEditing ? (
          <div className="flex">
            <input
              type="text"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="flex-1 p-2 border rounded text-sm"
              autoFocus
            />
            <button 
              onClick={toggleEdit}
              className="ml-1 p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
            >
              <Check size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            <div className="bg-gray-50 p-2 rounded text-sm flex-1 border border-gray-200">
              {editedText}
            </div>
            <button 
              onClick={toggleEdit}
              className="ml-1 p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
              title="Edit value"
            >
              <Edit3 size={16} />
            </button>
          </div>
        )}
      </div>
      
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Field Type
        </label>
        <select
          value={fieldType}
          onChange={(e) => setFieldType(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md text-sm bg-white shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
        >
          <option value="" disabled>Select field type...</option>
          <option value="customerName">Customer Name</option>
          <option value="refundAmount">Refund Amount</option>
          <option value="ibanNumber">IBAN Number</option>
          <option value="customerServiceNumber">Customer Service #</option>
        </select>
      </div>
      
      {predefinedValues && predefinedValues.length > 0 && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Suggestions
          </label>
          <div className="flex flex-wrap gap-1">
            {predefinedValues.map((value, idx) => (
              <button
                key={idx}
                onClick={() => setEditedText(value)}
                className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={onClose}
          className="px-3 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded hover:bg-gray-50 shadow-sm"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={!fieldType}
          className={`px-3 py-2 text-white text-sm font-medium rounded flex items-center shadow-sm ${
            fieldType ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          <Check size={16} className="mr-1" />
          Confirm
        </button>
      </div>
    </div>
  );
};

export default SelectionPopup;