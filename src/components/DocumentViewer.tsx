import React, { useState, useEffect, useRef } from 'react';
import * as mammoth from 'mammoth';
import { FileText, Eye, Edit2, Check, X, Highlighter } from 'lucide-react';
import SelectionPopup from './SelectionPopup';

interface DocumentViewerProps {
  file: File | null;
  onSectionSelect?: (section: string, sectionIndex: number) => void;
  onTextSelect?: (text: string, sectionIndex: number) => void;
  onValueSelect?: (text: string, fieldType: string) => void;
  readOnly?: boolean;
  highlightPattern?: RegExp | null;
}

interface DocumentSection {
  html: string;
  index: number;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  file,
  onSectionSelect,
  onTextSelect,
  onValueSelect,
  readOnly = true,
  highlightPattern = null
}) => {
  const [documentHtml, setDocumentHtml] = useState<string>('');
  const [documentSections, setDocumentSections] = useState<DocumentSection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [showSelectionPopup, setShowSelectionPopup] = useState<boolean>(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  // Convert Word document to HTML
  useEffect(() => {
    if (!file) {
      setDocumentHtml('');
      setDocumentSections([]);
      return;
    }

    const loadDocument = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        
        // Apply highlighting if pattern is provided
        let html = result.value;
        if (highlightPattern) {
          html = html.replace(
            highlightPattern, 
            '<span class="bg-yellow-200">$&</span>'
          );
        }
        
        setDocumentHtml(html);
        
        // Divide document into logical sections
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const paragraphs = tempDiv.querySelectorAll('p');
        
        // Group paragraphs into sections based on spacing or headings
        const sections: DocumentSection[] = [];
        let currentSection: string[] = [];
        let sectionIndex = 0;
        
        paragraphs.forEach((paragraph, index) => {
          // Check if this paragraph should start a new section
          const isHeading = paragraph.querySelector('strong, b, h1, h2, h3, h4, h5, h6');
          const isEmpty = paragraph.textContent?.trim() === '';
          
          // If empty line and we have content, end current section
          if (isEmpty && currentSection.length > 0) {
            sections.push({
              html: currentSection.join(''),
              index: sectionIndex
            });
            currentSection = [];
            sectionIndex++;
            return;
          }
          
          // If heading and we have content, end current section
          if (isHeading && currentSection.length > 0) {
            sections.push({
              html: currentSection.join(''),
              index: sectionIndex
            });
            currentSection = [];
            sectionIndex++;
          }
          
          // Skip empty paragraphs
          if (!isEmpty) {
            currentSection.push(paragraph.outerHTML);
          }
          
          // If last paragraph, add remaining content as a section
          if (index === paragraphs.length - 1 && currentSection.length > 0) {
            sections.push({
              html: currentSection.join(''),
              index: sectionIndex
            });
          }
        });
        
        setDocumentSections(sections);
      } catch (err) {
        console.error('Error processing document:', err);
        setError('Failed to process document. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDocument();
    
    // Cleanup
    return () => {
      setDocumentHtml('');
      setDocumentSections([]);
    };
  }, [file, highlightPattern]);

  // Handle text selection
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // Clear selection state if nothing is selected
      if (selectedText && !showSelectionPopup) {
        setSelectedText('');
        setSelectionPosition(null);
      }
      return;
    }
    
    const selectedText = selection.toString().trim();
    if (!selectedText) {
      setSelectedText('');
      setSelectionPosition(null);
      return;
    }
    
    // Find the section that contains the selection
    const range = selection.getRangeAt(0);
    const sectionElement = range.commonAncestorContainer.parentElement?.closest('.document-section');
    
    // Get selection position for popup
    const rect = range.getBoundingClientRect();
    if (viewerRef.current) {
      const viewerRect = viewerRef.current.getBoundingClientRect();
      
      setSelectedText(selectedText);
      setSelectionPosition({
        x: rect.left + rect.width / 2 - viewerRect.left,
        y: rect.bottom - viewerRect.top
      });
      
      // Show popup for value selection if onValueSelect is provided
      if (onValueSelect && !editMode) {
        setShowSelectionPopup(true);
      }
    }
    
    // Call onTextSelect if in edit mode
    if (editMode && onTextSelect && sectionElement) {
      const sectionIndex = parseInt(sectionElement.getAttribute('data-section-index') || '0');
      onTextSelect(selectedText, sectionIndex);
    }
  };

  // Handle section click
  const handleSectionClick = (index: number) => {
    if (readOnly || !onSectionSelect) return;
    
    setSelectedSection(index);
    const section = documentSections[index];
    if (section) {
      onSectionSelect(section.html, section.index);
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (!readOnly) {
      setEditMode(!editMode);
    }
  };

  // Handle value selection from popup
  const handleValueSelect = (text: string, fieldType: string) => {
    if (onValueSelect) {
      onValueSelect(text, fieldType);
    }
    
    // Clear selection state
    setShowSelectionPopup(false);
    setSelectedText('');
    setSelectionPosition(null);
    
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
  };

  // Close popup without selecting
  const handleClosePopup = () => {
    setShowSelectionPopup(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-50 border rounded-lg">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-center text-red-600">
          <X className="mx-auto mb-2" size={24} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!file || documentSections.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-50 border rounded-lg">
        <div className="text-center text-gray-500">
          <FileText className="mx-auto mb-2" size={32} />
          <p>No document loaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
      <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b">
        <div className="flex items-center">
          <FileText className="text-gray-600 mr-2" size={18} />
          <h3 className="text-sm font-medium text-gray-700 truncate max-w-xs">
            {file.name}
          </h3>
        </div>
        
        {!readOnly && (
          <button
            onClick={toggleEditMode}
            className={`p-1.5 rounded-full ${
              editMode ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
            }`}
            title={editMode ? "View mode" : "Edit mode"}
          >
            {editMode ? <Eye size={16} /> : <Edit2 size={16} />}
          </button>
        )}
      </div>
      
      <div 
        ref={viewerRef}
        className="p-4 max-h-[500px] overflow-y-auto relative"
        onMouseUp={handleTextSelection}
      >
        {documentSections.map((section, index) => (
          <div
            key={index}
            className={`document-section p-2 mb-3 rounded ${
              selectedSection === index ? 'bg-blue-50 border border-blue-200' : ''
            } ${editMode ? 'cursor-pointer hover:bg-gray-50' : !readOnly ? 'hover:bg-blue-50/30' : ''}`}
            data-section-index={index}
            onClick={() => editMode && handleSectionClick(index)}
            dangerouslySetInnerHTML={{ __html: section.html }}
          />
        ))}
        
        {showSelectionPopup && selectionPosition && (
          <SelectionPopup
            position={selectionPosition}
            selectedText={selectedText}
            onSelect={handleValueSelect}
            onClose={handleClosePopup}
          />
        )}
      </div>
      
      {editMode && selectedSection !== null && (
        <div className="p-2 bg-blue-50 border-t flex items-center justify-between">
          <span className="text-xs text-blue-600">
            <Highlighter size={14} className="inline mr-1" />
            Section {selectedSection + 1} selected
          </span>
          <div>
            <button 
              className="p-1 bg-gray-200 rounded-full text-gray-600 hover:bg-gray-300 mr-1"
              onClick={() => setSelectedSection(null)}
            >
              <X size={14} />
            </button>
            <button 
              className="p-1 bg-green-100 rounded-full text-green-600 hover:bg-green-200"
              onClick={() => {
                const section = documentSections[selectedSection];
                if (section && onSectionSelect) {
                  onSectionSelect(section.html, section.index);
                }
              }}
            >
              <Check size={14} />
            </button>
          </div>
        </div>
      )}
      
      {!editMode && onValueSelect && !readOnly && (
        <div className="p-2 bg-blue-50 border-t">
          <p className="text-xs text-blue-700 flex items-center">
            <Highlighter size={14} className="inline mr-1 text-blue-600" />
            Select text on the document to extract values
          </p>
        </div>
      )}

      {/* Mobile-specific view for smaller screens */}
      <style jsx>{`
        @media (max-width: 640px) {
          .max-h-\\[500px\\] {
            max-height: 350px;
          }
          
          .document-section {
            padding: 10px;
          }
          
          .document-section p {
            font-size: 14px;
            line-height: 1.4;
          }
        }
      `}</style>
    </div>
  );
};

export default DocumentViewer;