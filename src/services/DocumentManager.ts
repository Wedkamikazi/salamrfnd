import Dexie from 'dexie';
import { ExtractedData } from '../types';

// Define the document storage database
class DocumentDatabase extends Dexie {
  documents: Dexie.Table<StoredDocument, string>;
  extractionResults: Dexie.Table<ExtractedData, string>;

  constructor() {
    super('TreasuryExtractorDocuments');
    
    this.version(1).stores({
      documents: 'id, fileName, mimeType, size, timestamp',
      extractionResults: 'id, fileName, timestamp'
    });
    
    this.documents = this.table('documents');
    this.extractionResults = this.table('extractionResults');
  }
}

// Document storage interface
interface StoredDocument {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  data: ArrayBuffer;
  objectUrl?: string;
  timestamp: string;
}

// Create database instance
const db = new DocumentDatabase();

// Document manager service
class DocumentManager {
  private static instance: DocumentManager;
  private documentCache: Map<string, File> = new Map();
  private lastUsedIds: string[] = []; // Track recently used IDs for debugging
  
  private constructor() {
    // Private constructor for singleton
    window.addEventListener('beforeunload', () => {
      this.revokeAllObjectUrls();
    });

    // Log current documents to help debug document not found issues
    this.logStoredDocuments();
  }
  
  static getInstance(): DocumentManager {
    if (!DocumentManager.instance) {
      DocumentManager.instance = new DocumentManager();
    }
    return DocumentManager.instance;
  }

  // Log stored documents for debugging
  private async logStoredDocuments() {
    try {
      const docs = await db.documents.toArray();
      console.log(`DocumentManager: ${docs.length} documents in database:`, 
        docs.map(d => ({ id: d.id, name: d.fileName })));
    } catch (error) {
      console.error("Error logging stored documents:", error);
    }
  }
  
  // Generate a unique ID for a document
  private generateDocumentId(file: File): string {
    // Use a more reliable ID format that includes file details
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 9);
    const filenamePart = file.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 10);
    const sizePart = file.size.toString().substring(0, 8);
    
    // Combine parts to create a unique ID
    const id = `doc_${timestamp}_${filenamePart}_${sizePart}_${randomPart}`;
    
    // Track this ID for debugging
    this.lastUsedIds.push(id);
    if (this.lastUsedIds.length > 10) {
      this.lastUsedIds.shift();
    }
    
    return id;
  }
  
  // Store a document in the database
  async storeDocument(file: File): Promise<string> {
    try {
      // Generate a unique ID for the document
      const id = this.generateDocumentId(file);
      
      // Read the file as ArrayBuffer
      const data = await file.arrayBuffer();
      
      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file);
      
      // Store document in database
      await db.documents.put({
        id,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        data,
        objectUrl,
        timestamp: new Date().toISOString()
      });
      
      // Add to in-memory cache
      this.documentCache.set(id, file);
      
      console.log("Document stored with ID:", id);
      return id;
    } catch (error) {
      console.error('Error storing document:', error);
      throw error;
    }
  }
  
  // Get a document by ID
  async getDocument(id: string): Promise<File | null> {
    try {
      // Check in-memory cache first
      if (this.documentCache.has(id)) {
        console.log("Document found in cache:", id);
        return this.documentCache.get(id) || null;
      }
      
      console.log("Fetching document from database:", id);
      const doc = await db.documents.get(id);
      
      if (!doc) {
        console.error("Document not found in database:", id);
        
        // Try to find the document by ID prefix (for backward compatibility)
        // This helps if the ID format changed but part of it still matches
        if (id.includes('_')) {
          const prefix = id.split('_')[1]; // Get the timestamp part
          console.log("Trying to find document with prefix:", prefix);
          
          const allDocs = await db.documents.toArray();
          const possibleMatch = allDocs.find(d => d.id.includes(prefix));
          
          if (possibleMatch) {
            console.log("Found possible matching document:", possibleMatch.id);
            
            // Convert stored data back to File
            const file = new File([possibleMatch.data], possibleMatch.fileName, {
              type: possibleMatch.mimeType
            });
            
            // Add to cache with both IDs for future reference
            this.documentCache.set(id, file);
            this.documentCache.set(possibleMatch.id, file);
            
            return file;
          }
        }
        
        // If still not found, try to use extraction results to find the document
        try {
          const extractionResult = await db.extractionResults.get(id);
          if (extractionResult) {
            console.log("Found extraction results but no document. Searching for document with same filename...");
            
            const allDocs = await db.documents.toArray();
            const matchByName = allDocs.find(d => d.fileName === extractionResult.fileName);
            
            if (matchByName) {
              console.log("Found document with matching filename:", matchByName.id);
              
              // Convert stored data back to File
              const file = new File([matchByName.data], matchByName.fileName, {
                type: matchByName.mimeType
              });
              
              // Add to cache with both IDs
              this.documentCache.set(id, file);
              this.documentCache.set(matchByName.id, file);
              
              return file;
            }
          }
        } catch (e) {
          console.error("Error searching for alternative document:", e);
        }
        
        return null;
      }
      
      // Convert stored data back to File
      const file = new File([doc.data], doc.fileName, {
        type: doc.mimeType
      });
      
      // Add to cache
      this.documentCache.set(id, file);
      
      return file;
    } catch (error) {
      console.error('Error retrieving document:', error);
      return null;
    }
  }
  
  // Get preview URL for a document
  async getDocumentPreviewUrl(id: string): Promise<string | null> {
    try {
      const doc = await db.documents.get(id);
      
      if (!doc) return null;
      
      // If object URL exists, return it
      if (doc.objectUrl) return doc.objectUrl;
      
      // Otherwise, create a new one
      const file = await this.getDocument(id);
      if (!file) return null;
      
      const objectUrl = URL.createObjectURL(file);
      
      // Update the document with the new URL
      await db.documents.update(id, { objectUrl });
      
      return objectUrl;
    } catch (error) {
      console.error('Error getting preview URL:', error);
      return null;
    }
  }
  
  // Store extraction results
  async storeExtractionResults(results: ExtractedData): Promise<void> {
    try {
      // Make sure document exists in database before storing results
      const docExists = await db.documents.get(results.id);
      if (!docExists) {
        console.warn(`Storing extraction results for document ${results.id} which isn't in the database.`);
      }
      
      await db.extractionResults.put(results);
      console.log("Stored extraction results for document:", results.id);
    } catch (error) {
      console.error('Error storing extraction results:', error);
      throw error;
    }
  }
  
  // Get all documents
  async getAllDocuments(): Promise<{ id: string; fileName: string; timestamp: string }[]> {
    try {
      const docs = await db.documents.toArray();
      
      return docs.map(doc => ({
        id: doc.id,
        fileName: doc.fileName,
        timestamp: doc.timestamp
      }));
    } catch (error) {
      console.error('Error retrieving all documents:', error);
      return [];
    }
  }
  
  // Get extraction results for a document
  async getExtractionResults(id: string): Promise<ExtractedData | null> {
    try {
      // First try to get results directly by ID
      const results = await db.extractionResults.get(id);
      if (results) return results;
      
      // If not found, try finding by ID in a more lenient way
      console.log("Extraction results not found by exact ID, trying alternative search...");
      
      if (id.includes('_')) {
        const prefix = id.split('_')[1]; // Get timestamp part
        const allResults = await db.extractionResults.toArray();
        const possibleMatch = allResults.find(r => r.id.includes(prefix));
        
        if (possibleMatch) {
          console.log("Found possible matching extraction results:", possibleMatch.id);
          return possibleMatch;
        }
      }
      
      console.log("No extraction results found for document:", id);
      return null;
    } catch (error) {
      console.error('Error retrieving extraction results:', error);
      return null;
    }
  }
  
  // Delete a document and its extraction results
  async deleteDocument(id: string): Promise<void> {
    try {
      const doc = await db.documents.get(id);
      
      if (doc?.objectUrl) {
        URL.revokeObjectURL(doc.objectUrl);
      }
      
      // Remove from cache
      if (this.documentCache.has(id)) {
        this.documentCache.delete(id);
      }
      
      await db.documents.delete(id);
      await db.extractionResults.delete(id);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }
  
  // Revoke all object URLs to prevent memory leaks
  private async revokeAllObjectUrls(): Promise<void> {
    try {
      const docs = await db.documents.toArray();
      
      docs.forEach(doc => {
        if (doc.objectUrl) {
          URL.revokeObjectURL(doc.objectUrl);
        }
      });
    } catch (error) {
      console.error('Error revoking object URLs:', error);
    }
  }
  
  // Clear all stored documents and results
  async clearAllData(): Promise<void> {
    try {
      await this.revokeAllObjectUrls();
      this.documentCache.clear();
      await db.documents.clear();
      await db.extractionResults.clear();
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }
  
  // Get document cache stats
  getCacheStats(): { size: number, ids: string[], lastUsed: string[] } {
    return {
      size: this.documentCache.size,
      ids: Array.from(this.documentCache.keys()),
      lastUsed: [...this.lastUsedIds]
    };
  }
  
  // Check if a document exists in database or cache
  async documentExists(id: string): Promise<boolean> {
    // Check cache first
    if (this.documentCache.has(id)) {
      return true;
    }
    
    // Then check database
    try {
      const doc = await db.documents.get(id);
      return !!doc;
    } catch (error) {
      console.error("Error checking if document exists:", error);
      return false;
    }
  }
}

export default DocumentManager;