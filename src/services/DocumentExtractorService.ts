import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import { processDocumentText } from '../utils/extractors';
import { ExtractedData } from '../types';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Service for extracting text from different document formats
 */
class DocumentExtractorService {
  private static instance: DocumentExtractorService;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): DocumentExtractorService {
    if (!DocumentExtractorService.instance) {
      DocumentExtractorService.instance = new DocumentExtractorService();
    }
    return DocumentExtractorService.instance;
  }

  /**
   * Extract text from a file based on its type
   */
  async extractText(file: File): Promise<string> {
    const fileType = file.type;
    
    // Process based on file type
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return this.extractFromWord(file);
    } else if (fileType === 'application/pdf') {
      return this.extractFromPDF(file);
    } else if (fileType.startsWith('image/')) {
      return this.extractFromImage(file);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  /**
   * Extract text from Word document
   */
  private async extractFromWord(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      console.error('Error extracting text from Word document:', error);
      throw new Error('Failed to extract text from Word document');
    }
  }

  /**
   * Extract text from PDF document
   */
  private async extractFromPDF(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      
      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
          
        fullText += pageText + '\n\n';
      }
      
      return fullText;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Extract text from image using OCR
   */
  private async extractFromImage(file: File): Promise<string> {
    try {
      const result = await Tesseract.recognize(file, 'eng');
      return result.data.text;
    } catch (error) {
      console.error('Error extracting text from image:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  /**
   * Process document to extract structured data
   */
  async processDocument(file: File): Promise<ExtractedData> {
    try {
      // Extract text from document
      const text = await this.extractText(file);
      
      // Process the extracted text to get structured data
      return processDocumentText(text, file.name);
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      
      // Return placeholder with error status
      return {
        id: Date.now().toString(),
        fileName: file.name,
        customerName: { value: "Error processing file", confidence: 0 },
        refundAmount: { value: "0.00", confidence: 0 },
        ibanNumber: { value: "Unknown", confidence: 0 },
        customerServiceNumber: { value: "Unknown", confidence: 0 },
        detectedLayout: "Error",
        layoutConfidence: 0,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default DocumentExtractorService;