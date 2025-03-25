import React, { useState, useEffect } from 'react';
import { X, FileText, Edit3, CheckCircle, ArrowRight } from 'lucide-react';
import DocumentViewer from './DocumentViewer';

interface QuickFixModalProps {
  file: File;
  documentId: string;
  onClose: () => void;
  onValueSelect: (text: string, fieldType: string) => void;
}

const QuickFixModal: React.FC<QuickFixModalProps> = ({
  file,
  documentId,
  onClose,
  onValueSelect
}) => {
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Handle value selection with field tracking
  const handleValueSelect = (text: string, fieldType: string) => {
    setSelectedField(fieldType);
    onValueSelect(text, fieldType);
    
    // Show success message
    setSuccessMessage(`Successfully updated ${fieldType} to: ${text}`);
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };
  
  // Clean up on unmount
  useEffect(() => {
    // Log when modal is mounted to verify it's rendering
    console.log("QuickFixModal mounted for document:", documentId);
    
    // Remove loading indicator if it still exists
    try {
      const loadingElements = document.querySelectorAll('.fixed.inset-0.bg-black.bg-opacity-20');
      loadingElements.forEach(element => {
        if (element && element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
    } catch (e) {
      console.error("Error removing loading indicators:", e);
    }
    
    return () => {
      console.log("QuickFixModal unmounted");
    };
  }, [documentId]);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-lg shadow-2xl w-11/12 max-w-5xl h-5/6 flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-lg font-medium flex items-center">
            <FileText className="text-blue-600 mr-2" size={20} />
            Quick Fix - {file.name}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden p-4 flex flex-col">
          <div className="mb-3 bg-blue-50 p-3 rounded-md shadow-sm">
            <div className="flex items-start">
              <Edit3 className="text-blue-600 mr-2 mt-0.5" size={18} />
              <div>
                <h3 className="font-medium text-blue-800 mb-1">Quick Fix Instructions</h3>
                <p className="text-blue-700 text-sm">
                  Click on text in the document to select and correct values. 
                  Choose the field type from the dropdown that appears and confirm to update the extracted data.
                </p>
                <div className="mt-2 flex flex-wrap gap-3">
                  <div className="flex items-center text-xs">
                    <span className={`px-2 py-1 rounded-full ${selectedField === 'customerName' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      Customer Name {selectedField === 'customerName' && <CheckCircle className="inline ml-1" size={12} />}
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    <span className={`px-2 py-1 rounded-full ${selectedField === 'refundAmount' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      Refund Amount {selectedField === 'refundAmount' && <CheckCircle className="inline ml-1" size={12} />}
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    <span className={`px-2 py-1 rounded-full ${selectedField === 'ibanNumber' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      IBAN Number {selectedField === 'ibanNumber' && <CheckCircle className="inline ml-1" size={12} />}
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    <span className={`px-2 py-1 rounded-full ${selectedField === 'customerServiceNumber' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      Service Number {selectedField === 'customerServiceNumber' && <CheckCircle className="inline ml-1" size={12} />}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {successMessage && (
            <div className="mb-3 bg-green-50 p-3 rounded-md border border-green-200 flex items-start shadow-sm">
              <CheckCircle className="text-green-600 mr-2 mt-0.5" size={18} />
              <div className="text-green-800 text-sm font-medium">{successMessage}</div>
            </div>
          )}
          
          <div className="flex-1 overflow-hidden">
            <DocumentViewer
              file={file}
              readOnly={false}
              onValueSelect={handleValueSelect}
            />
          </div>
        </div>
        
        <div className="px-6 py-4 border-t flex justify-between bg-gray-50">
          <div>
            {selectedField && (
              <span className="text-sm text-gray-600">
                Corrected: <span className="font-medium text-blue-600">{selectedField}</span>
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 shadow-sm"
            >
              Close
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center shadow-sm"
            >
              Done <ArrowRight size={16} className="ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickFixModal;