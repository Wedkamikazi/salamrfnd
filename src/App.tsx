import React, { useState, useEffect, useRef } from 'react';
import { FileUp, Upload, FileText, Download, Search, FileCheck, Archive, Layers, Edit2 } from 'lucide-react';
import FileUploader from './components/FileUploader';
import Header from './components/Header';
import ResultsTable from './components/ResultsTable';
import ConfidenceSummary from './components/ConfidenceSummary';
import FormLayoutAnalyzer from './components/FormLayoutAnalyzer';
import DocumentViewer from './components/DocumentViewer';
import DataCorrection from './components/DataCorrection';
import DocumentSearch from './components/DocumentSearch';
import LearningInsights from './components/LearningInsights';
import QuickFixModal from './components/QuickFixModal';
import { ExtractedData } from './types';
import * as mammoth from 'mammoth';
import { processDocumentText } from './utils/extractors';
import TrainingService from './services/TrainingService';
import DocumentManager from './services/DocumentManager';
import DocumentExtractorService from './services/DocumentExtractorService';
import { validateExtractionData } from './services/DataValidationService';

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFiles, setProcessedFiles] = useState<number>(0);
  const [totalFiles, setTotalFiles] = useState<number>(0);
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [storedDocuments, setStoredDocuments] = useState<{id: string; fileName: string; timestamp: string}[]>([]);
  const [showDocumentViewer, setShowDocumentViewer] = useState<boolean>(false);
  const [searchPattern, setSearchPattern] = useState<RegExp | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [documentText, setDocumentText] = useState<string>('');
  const [showLearningInsights, setShowLearningInsights] = useState<boolean>(false);
  const [valueEditMode, setValueEditMode] = useState<boolean>(false);
  const [showQuickFixModal, setShowQuickFixModal] = useState<boolean>(false);
  const [quickFixDocId, setQuickFixDocId] = useState<string | null>(null);
  const [documentCache, setDocumentCache] = useState<Map<string, File>>(new Map());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Refs for scrolling
  const documentViewerRef = useRef<HTMLDivElement>(null);
  
  const trainingService = TrainingService.getInstance();
  const documentManager = DocumentManager.getInstance();
  const documentExtractor = DocumentExtractorService.getInstance();
  
  // Initialize services
  useEffect(() => {
    const initialize = async () => {
      try {
        await trainingService.initialize();
        await loadStoredDocuments();
        await loadDocumentsIntoCache();
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize services:", error);
      }
    };
    
    initialize();
  }, []);
  
  // Preload documents into cache
  const loadDocumentsIntoCache = async () => {
    try {
      const documentsInfo = await documentManager.getAllDocuments();
      const newCache = new Map(documentCache);
      
      // Only preload the 5 most recent documents to avoid memory issues
      const recentDocuments = documentsInfo
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);
      
      console.log(`Preloading ${recentDocuments.length} recent documents into cache`);
      
      for (const docInfo of recentDocuments) {
        try {
          const file = await documentManager.getDocument(docInfo.id);
          if (file) {
            newCache.set(docInfo.id, file);
          }
        } catch (err) {
          console.warn(`Failed to preload document ${docInfo.id} into cache:`, err);
        }
      }
      
      setDocumentCache(newCache);
      console.log(`Document cache loaded with ${newCache.size} documents`);
    } catch (error) {
      console.error("Error preloading documents into cache:", error);
    }
  };
  
  // Load stored documents
  const loadStoredDocuments = async () => {
    try {
      const documents = await documentManager.getAllDocuments();
      setStoredDocuments(documents);
    } catch (error) {
      console.error("Error loading stored documents:", error);
    }
  };
  
  // Handle document selection
  const handleDocumentSelect = async (id: string) => {
    setErrorMessage(null);
    try {
      setIsProcessing(true);
      
      // Check if document is in cache first
      let file: File | null = null;
      if (documentCache.has(id)) {
        file = documentCache.get(id) || null;
        console.log("Document found in cache:", id);
      } else {
        console.log("Document not in cache, fetching from storage:", id);
        file = await documentManager.getDocument(id);
        if (file) {
          // Update the cache
          setDocumentCache(prev => {
            const newCache = new Map(prev);
            newCache.set(id, file as File);
            return newCache;
          });
        }
      }
      
      if (file) {
        setCurrentFile(file);
        setSelectedDocumentId(id);
        
        // Try to load existing extraction results
        const results = await documentManager.getExtractionResults(id);
        if (results) {
          setExtractedData([results]);
          setShowResults(true);
        } else {
          // Extract data from the selected document
          processSelectedFile(file, id);
        }
        
        // Extract text for context
        try {
          const text = await documentExtractor.extractText(file);
          setDocumentText(text);
        } catch (error) {
          console.error("Error extracting document text:", error);
          setDocumentText('');
        }
        
        setShowDocumentViewer(true);
      } else {
        console.error("Document not found with ID:", id);
        setErrorMessage(`Could not load document with ID: ${id}`);
      }
    } catch (error) {
      console.error("Error selecting document:", error);
      setErrorMessage(`Error loading document: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Process selected file
  const processSelectedFile = async (file: File, id?: string) => {
    setIsProcessing(true);
    
    try {
      // Extract text from file
      const text = await documentExtractor.extractText(file);
      setDocumentText(text);
      
      // Process the extracted text to get structured data
      const extractedInfo = await processDocumentText(text, file.name);
      
      // Apply validation
      const validated = validateExtractionData({
        customerName: extractedInfo.customerName.value,
        refundAmount: extractedInfo.refundAmount.value,
        ibanNumber: extractedInfo.ibanNumber.value,
        customerServiceNumber: extractedInfo.customerServiceNumber.value
      });
      
      // Update with validated values
      if (validated.isValid) {
        extractedInfo.customerName.value = validated.validatedData.customerName.value;
        extractedInfo.refundAmount.value = validated.validatedData.refundAmount.value;
        extractedInfo.ibanNumber.value = validated.validatedData.ibanNumber.value;
        extractedInfo.customerServiceNumber.value = validated.validatedData.customerServiceNumber.value;
      }
      
      // Ensure we have an ID
      const docId = id || `generated_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Store extraction results if document ID is provided
      if (id) {
        const resultWithId = {
          ...extractedInfo,
          id
        };
        
        await documentManager.storeExtractionResults(resultWithId);
        setExtractedData([resultWithId]);
      } else {
        // For files without ID yet
        setExtractedData([{
          ...extractedInfo,
          id: docId
        }]);
      }
      
      setShowResults(true);
      
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      
      // Create a document ID if none provided
      const docId = id || `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Add a placeholder with error status
      setExtractedData([{
        id: docId,
        fileName: file.name,
        customerName: { value: "Error processing file", confidence: 0 },
        refundAmount: { value: "0.00", confidence: 0 },
        ibanNumber: { value: "Unknown", confidence: 0 },
        customerServiceNumber: { value: "Unknown", confidence: 0 },
        detectedLayout: "Error",
        layoutConfidence: 0,
        timestamp: new Date().toISOString()
      }]);
      
      setShowResults(true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Process multiple files
  const handleFilesSelected = async (files: FileList) => {
    setTotalFiles(files.length);
    setProcessedFiles(0);
    setIsProcessing(true);
    setShowResults(false);
    setCurrentFile(null);
    setSelectedDocumentId(null);
    setShowDocumentViewer(false);
    setErrorMessage(null);
    
    const newExtractedData: ExtractedData[] = [];
    const newCache = new Map(documentCache);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Store document first
        const docId = await documentManager.storeDocument(file);
        
        // Add file to cache
        newCache.set(docId, file);
        
        // Process the document
        const text = await documentExtractor.extractText(file);
        
        // Process the extracted text to get structured data
        const extractedInfo = await processDocumentText(text, file.name);
        
        // Apply validation
        const validated = validateExtractionData({
          customerName: extractedInfo.customerName.value,
          refundAmount: extractedInfo.refundAmount.value,
          ibanNumber: extractedInfo.ibanNumber.value,
          customerServiceNumber: extractedInfo.customerServiceNumber.value
        });
        
        // Update with validated values if valid
        if (validated.isValid) {
          extractedInfo.customerName.value = validated.validatedData.customerName.value;
          extractedInfo.refundAmount.value = validated.validatedData.refundAmount.value;
          extractedInfo.ibanNumber.value = validated.validatedData.ibanNumber.value;
          extractedInfo.customerServiceNumber.value = validated.validatedData.customerServiceNumber.value;
        }

        // Create extraction result with ID
        const resultWithId = {
          ...extractedInfo,
          id: docId
        };
        
        // Store extraction results
        await documentManager.storeExtractionResults(resultWithId);
        
        newExtractedData.push(resultWithId);
        
        setProcessedFiles(i + 1);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        // Add a placeholder with error status
        newExtractedData.push({
          id: Date.now().toString() + i,
          fileName: file.name,
          customerName: { value: "Error processing file", confidence: 0 },
          refundAmount: { value: "0.00", confidence: 0 },
          ibanNumber: { value: "Unknown", confidence: 0 },
          customerServiceNumber: { value: "Unknown", confidence: 0 },
          detectedLayout: "Error",
          layoutConfidence: 0,
          timestamp: new Date().toISOString()
        });
        setProcessedFiles(i + 1);
      }
    }
    
    // Update document cache with all processed files
    setDocumentCache(newCache);
    
    // Refresh the list of stored documents
    await loadStoredDocuments();
    
    setExtractedData(newExtractedData);
    setIsProcessing(false);
    setShowResults(true);
    
    // Show learning insights after multiple files are processed
    if (files.length > 1) {
      setShowLearningInsights(true);
    }
  };

  // Handle exporting data as CSV
  const handleExportData = () => {
    if (extractedData.length === 0) return;
    
    // Create CSV content
    const csvHeader = [
      'File Name',
      'Customer Name',
      'Name Confidence',
      'Refund Amount',
      'Amount Confidence',
      'IBAN Number',
      'IBAN Confidence',
      'Customer Service Number',
      'Service Number Confidence',
      'Detected Layout',
      'Layout Confidence',
      'Timestamp'
    ].join(',');
    
    const csvRows = extractedData.map(item => {
      return [
        `"${item.fileName}"`,
        `"${item.customerName.value}"`,
        item.customerName.confidence,
        `"${item.refundAmount.value}"`,
        item.refundAmount.confidence,
        `"${item.ibanNumber.value}"`,
        item.ibanNumber.confidence,
        `"${item.customerServiceNumber.value}"`,
        item.customerServiceNumber.confidence,
        `"${item.detectedLayout}"`,
        item.layoutConfidence,
        `"${item.timestamp}"`
      ].join(',');
    });
    
    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `extracted_data_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up
  };

  // Handle copying data to clipboard
  const handleCopyData = (data: ExtractedData) => {
    const textToCopy = `
Customer Name: ${data.customerName.value} (${data.customerName.confidence.toFixed(1)}% confidence)
Refund Amount: ${data.refundAmount.value} (${data.refundAmount.confidence.toFixed(1)}% confidence)
IBAN Number: ${data.ibanNumber.value} (${data.ibanNumber.confidence.toFixed(1)}% confidence)
Customer Service Number: ${data.customerServiceNumber.value} (${data.customerServiceNumber.confidence.toFixed(1)}% confidence)
Detected Layout: ${data.detectedLayout} (${data.layoutConfidence.toFixed(1)}% match)
    `.trim();
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        alert('Data copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };
  
  // Handle data correction
  const handleDataCorrection = async (fieldType: keyof ExtractedData, value: string, confidence: number) => {
    if (!selectedDocumentId || extractedData.length === 0) return;
    
    try {
      // Get the current extraction result
      const currentData = extractedData[0];
      
      // Create updated data
      let updatedData = { ...currentData };
      
      // Update the specified field
      switch (fieldType) {
        case 'customerName':
          updatedData.customerName = { value, confidence };
          break;
        case 'refundAmount':
          updatedData.refundAmount = { value, confidence };
          break;
        case 'ibanNumber':
          updatedData.ibanNumber = { value, confidence };
          break;
        case 'customerServiceNumber':
          updatedData.customerServiceNumber = { value, confidence };
          break;
      }
      
      // Save the updated data
      await documentManager.storeExtractionResults(updatedData);
      
      // Update state
      setExtractedData([updatedData]);
      
      // Show learning insights after manual correction
      setShowLearningInsights(true);
      
    } catch (error) {
      console.error("Error updating extraction data:", error);
    }
  };
  
  // Handle search in document
  const handleSearchInDocument = (searchText: string) => {
    if (!searchText.trim()) {
      setSearchPattern(null);
      return;
    }
    
    try {
      // Create case-insensitive regex pattern
      const pattern = new RegExp(searchText, 'gi');
      setSearchPattern(pattern);
    } catch (error) {
      console.error("Invalid search pattern:", error);
      setSearchPattern(null);
    }
  };

  // Handle value selection from document viewer
  const handleValueSelect = async (text: string, fieldType: string) => {
    if (!selectedDocumentId || extractedData.length === 0) return;
    
    // Define a mapping to convert fieldType to ExtractedData key
    const fieldTypeMapping: Record<string, keyof ExtractedData> = {
      'customerName': 'customerName',
      'refundAmount': 'refundAmount',
      'ibanNumber': 'ibanNumber',
      'customerServiceNumber': 'customerServiceNumber'
    };
    
    const fieldKey = fieldTypeMapping[fieldType];
    if (!fieldKey) return;
    
    try {
      // Record the correction in the training system
      await trainingService.recordCorrection(
        fieldKey as 'customerName' | 'refundAmount' | 'ibanNumber' | 'customerServiceNumber',
        extractedData[0][fieldKey].value,
        text,
        selectedDocumentId,
        documentText
      );
      
      // Also update the extraction data with 100% confidence
      await handleDataCorrection(fieldKey, text, 100);
      
      // Show a success message
      alert(`Successfully updated ${fieldType} to: ${text}`);
      
      // Turn off edit mode
      setValueEditMode(false);
      setShowQuickFixModal(false);
      
    } catch (error) {
      console.error("Error handling value selection:", error);
      alert("Failed to update value. Please try again.");
    }
  };
  
  // Toggle value edit mode
  const toggleValueEditMode = () => {
    setValueEditMode(!valueEditMode);
  };
  
  // Find a document in the results table by ID
  const findDocumentById = (id: string): ExtractedData | undefined => {
    return extractedData.find(doc => doc.id === id);
  };
  
  // Handle Quick Fix action from the results table
  const handleQuickFix = async (docId: string) => {
    console.log("Quick Fix clicked for document:", docId);
    setErrorMessage(null);
    
    try {
      // Create and add the loading indicator to the DOM
      const loadingIndicator = document.createElement('div');
      loadingIndicator.className = 'fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50';
      loadingIndicator.id = 'quickFixLoader';
      loadingIndicator.innerHTML = `
        <div class="bg-white rounded-lg shadow-lg p-4 flex items-center">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
          <p class="text-gray-700">Preparing document for Quick Fix...</p>
        </div>
      `;
      document.body.appendChild(loadingIndicator);
      
      // Set document ID being fixed
      setQuickFixDocId(docId);
      
      // Check if document exists in database
      const exists = await documentManager.documentExists(docId);
      if (!exists) {
        console.error(`Document with ID ${docId} does not exist in database`);
        throw new Error(`Document with ID ${docId} not found in database`);
      }
      
      // First check if we already have a row for this document in the results table
      const existingDoc = findDocumentById(docId);
      
      // If the document is not already selected, load it first
      if (docId !== selectedDocumentId) {
        try {
          let file: File | null = null;
          
          // Check cache first
          if (documentCache.has(docId)) {
            console.log("Using document from cache for Quick Fix");
            file = documentCache.get(docId) || null;
          } else {
            console.log("Fetching document from storage for Quick Fix");
            file = await documentManager.getDocument(docId);
            
            // If found, add to cache
            if (file) {
              setDocumentCache(prev => {
                const newCache = new Map(prev);
                newCache.set(docId, file as File);
                return newCache;
              });
            }
          }
          
          if (!file) {
            console.error("Document not found in cache or storage:", docId);
            throw new Error("Document not found in storage or cache");
          }
          
          // Set document data directly
          setCurrentFile(file);
          setSelectedDocumentId(docId);
          
          // Load extraction results
          let results: ExtractedData | null = null;
          
          // Check if we already have the results in memory
          if (existingDoc) {
            console.log("Using existing extraction results from memory");
            results = existingDoc;
          } else {
            console.log("Fetching extraction results from storage");
            results = await documentManager.getExtractionResults(docId);
          }
          
          if (results) {
            setExtractedData([results]);
          } else {
            console.log("No extraction results found, processing file");
            // Process the file to extract data if no results found
            await processSelectedFile(file, docId);
          }
          
          // Extract text for context if not already done
          if (!documentText) {
            const text = await documentExtractor.extractText(file);
            setDocumentText(text);
          }
          
          // Show document viewer
          setShowDocumentViewer(true);
          
          // Show results
          setShowResults(true);
          
          // Show the Quick Fix modal after a short delay
          setTimeout(() => {
            // Remove the loading indicator
            const loader = document.getElementById('quickFixLoader');
            if (loader) {
              loader.remove();
            }
            
            // Show the modal
            setShowQuickFixModal(true);
            console.log("Quick Fix modal should now be visible");
          }, 500);
        } catch (error) {
          console.error("Error loading document for Quick Fix:", error);
          setErrorMessage(`Failed to load document for Quick Fix: ${error instanceof Error ? error.message : 'Unknown error'}`);
          
          // Remove the loading indicator
          const loader = document.getElementById('quickFixLoader');
          if (loader) {
            loader.remove();
          }
        }
      } else {
        // Document is already loaded, just show the Quick Fix modal
        setTimeout(() => {
          // Remove the loading indicator
          const loader = document.getElementById('quickFixLoader');
          if (loader) {
            loader.remove();
          }
          
          // Show the modal
          setShowQuickFixModal(true);
          console.log("Quick Fix modal should now be visible (already loaded document)");
        }, 300);
      }
    } catch (error) {
      console.error("Error in Quick Fix:", error);
      setErrorMessage(`An error occurred while preparing Quick Fix: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Remove the loading indicator if it exists
      const loader = document.getElementById('quickFixLoader');
      if (loader) {
        loader.remove();
      }
    }
  };
  
  // Close the Quick Fix modal
  const handleCloseQuickFix = () => {
    setShowQuickFixModal(false);
    setValueEditMode(false);
    setQuickFixDocId(null);
    
    // Remove any lingering loading indicators
    const loaders = document.querySelectorAll('.fixed.inset-0.bg-black.bg-opacity-20');
    loaders.forEach(loader => {
      if (loader.parentNode) {
        loader.parentNode.removeChild(loader);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6">
              <span className="block sm:inline">{errorMessage}</span>
              <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setErrorMessage(null)}>
                <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <title>Close</title>
                  <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
                </svg>
              </span>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <FileUp className="mr-2 text-blue-600" size={20} />
                Upload & Process Documents
              </h2>
              
              {storedDocuments.length > 0 && (
                <div className="flex items-center text-sm text-gray-600">
                  <Archive size={16} className="mr-1" />
                  <span>{storedDocuments.length} stored document{storedDocuments.length !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
            
            {storedDocuments.length > 0 && (
              <div className="mb-4">
                <DocumentSearch 
                  documents={storedDocuments}
                  onDocumentSelect={handleDocumentSelect}
                />
              </div>
            )}
            
            <FileUploader onFilesSelected={handleFilesSelected} />
            
            {isProcessing && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Processing documents...</span>
                  <span className="text-sm font-medium">{processedFiles} of {totalFiles}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${(processedFiles / totalFiles) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
          
          {showLearningInsights && (
            <LearningInsights refreshInterval={5 * 60 * 1000} />
          )}
          
          {showDocumentViewer && currentFile && (
            <div 
              ref={documentViewerRef}
              className="bg-white rounded-lg shadow-md p-6 mb-8 document-viewer-section relative transition-all duration-300"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Layers className="mr-2 text-blue-600" size={18} />
                  Document Viewer {valueEditMode && <span className="ml-2 text-xs font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Selection Mode</span>}
                </h3>
                
                <div className="flex items-center space-x-3">
                  <div className="relative w-64">
                    <input
                      type="text"
                      placeholder="Search in document..."
                      className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-md"
                      onChange={(e) => handleSearchInDocument(e.target.value)}
                    />
                    <Search className="absolute left-2.5 top-2 text-gray-400" size={14} />
                  </div>
                  
                  <button 
                    onClick={toggleValueEditMode}
                    className={`px-3 py-1.5 text-sm rounded flex items-center ${
                      valueEditMode 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Edit2 size={15} className="mr-1.5" />
                    {valueEditMode ? 'Exit Selection Mode' : 'Select Values'}
                  </button>
                </div>
              </div>
              
              <DocumentViewer
                file={currentFile}
                readOnly={!valueEditMode}
                highlightPattern={searchPattern}
                onValueSelect={valueEditMode ? handleValueSelect : undefined}
              />
              
              {valueEditMode && (
                <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                  <div className="flex items-start">
                    <Edit2 size={18} className="text-blue-600 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-800 font-medium mb-1">Selection Mode Active</p>
                      <p className="text-xs text-blue-700">
                        Click on text in the document to select values. 
                        Choose the field type from the dropdown that appears and confirm to update the extracted data.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {extractedData.length > 0 && showResults && selectedDocumentId && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <FileCheck className="mr-2 text-blue-600" size={18} />
                Data Verification
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DataCorrection
                  fieldName="Customer Name"
                  fieldType="customerName"
                  currentValue={extractedData[0].customerName.value}
                  confidence={extractedData[0].customerName.confidence}
                  onValueCorrect={(value, confidence) => 
                    handleDataCorrection('customerName', value, confidence)
                  }
                  context={documentText}
                  documentId={selectedDocumentId}
                />
                
                <DataCorrection
                  fieldName="Refund Amount"
                  fieldType="refundAmount"
                  currentValue={extractedData[0].refundAmount.value}
                  confidence={extractedData[0].refundAmount.confidence}
                  onValueCorrect={(value, confidence) => 
                    handleDataCorrection('refundAmount', value, confidence)
                  }
                  context={documentText}
                  documentId={selectedDocumentId}
                />
                
                <DataCorrection
                  fieldName="IBAN Number"
                  fieldType="ibanNumber"
                  currentValue={extractedData[0].ibanNumber.value}
                  confidence={extractedData[0].ibanNumber.confidence}
                  onValueCorrect={(value, confidence) => 
                    handleDataCorrection('ibanNumber', value, confidence)
                  }
                  context={documentText}
                  documentId={selectedDocumentId}
                />
                
                <DataCorrection
                  fieldName="Customer Service Number"
                  fieldType="customerServiceNumber"
                  currentValue={extractedData[0].customerServiceNumber.value}
                  confidence={extractedData[0].customerServiceNumber.confidence}
                  onValueCorrect={(value, confidence) => 
                    handleDataCorrection('customerServiceNumber', value, confidence)
                  }
                  context={documentText}
                  documentId={selectedDocumentId}
                />
              </div>
            </div>
          )}
          
          {showResults && extractedData.length > 0 && (
            <>
              <ConfidenceSummary data={extractedData} />
              <FormLayoutAnalyzer data={extractedData} />
            </>
          )}
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <FileText className="mr-2 text-blue-600" size={20} />
                Extracted Information
              </h2>
              
              {showResults && extractedData.length > 0 && (
                <button 
                  onClick={handleExportData}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Download size={16} className="mr-2" />
                  Export CSV
                </button>
              )}
            </div>
            
            {showResults ? (
              <ResultsTable 
                data={extractedData} 
                onCopyData={handleCopyData}
                onQuickFix={handleQuickFix}
              />
            ) : (
              <div className="border rounded-lg p-8 text-center text-gray-500">
                <Upload className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-lg mb-1">No documents processed yet</p>
                <p className="text-sm">Upload and process documents to see extracted information</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {showQuickFixModal && currentFile && selectedDocumentId && (
        <QuickFixModal
          file={currentFile}
          documentId={selectedDocumentId}
          onClose={handleCloseQuickFix}
          onValueSelect={handleValueSelect}
        />
      )}
      
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-sm text-gray-500">
            Treasury Document Extractor • Document processing with layout detection
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;