import Dexie from 'dexie';
import Fuse from 'fuse.js';
import { ExtractedData } from '../types';

// Define the database schema using Dexie
class TrainingDatabase extends Dexie {
  trainingExamples: Dexie.Table<TrainingExample, number>;
  extractionPatterns: Dexie.Table<ExtractionPattern, number>;
  correctionHistory: Dexie.Table<CorrectionRecord, number>;

  constructor() {
    super('TreasuryExtractorTraining');
    
    // Upgrade database with new schema version for IndexedDB
    this.version(2).stores({
      trainingExamples: '++id, fieldType, pattern, value, confidence, timestamp',
      extractionPatterns: '++id, fieldType, patternRegex, priority, successRate, usageCount, timestamp',
      correctionHistory: '++id, fieldType, originalValue, correctedValue, documentId, confidence, timestamp'
    });
    
    this.trainingExamples = this.table('trainingExamples');
    this.extractionPatterns = this.table('extractionPatterns');
    this.correctionHistory = this.table('correctionHistory');
  }
}

// Training example interface
interface TrainingExample {
  id?: number;
  fieldType: 'customerName' | 'refundAmount' | 'ibanNumber' | 'customerServiceNumber';
  pattern: string;
  value: string;
  context?: string;
  confidence: number;
  timestamp: string;
}

// Extraction pattern interface
interface ExtractionPattern {
  id?: number;
  fieldType: 'customerName' | 'refundAmount' | 'ibanNumber' | 'customerServiceNumber';
  patternRegex: string;
  priority: number;
  successRate: number;
  usageCount: number;
  timestamp: string;
}

// Correction record interface
interface CorrectionRecord {
  id?: number;
  fieldType: 'customerName' | 'refundAmount' | 'ibanNumber' | 'customerServiceNumber';
  originalValue: string;
  correctedValue: string;
  documentId: string;
  confidence: number;
  timestamp: string;
}

// Initial seeding data for the training system
const initialTrainingData: TrainingExample[] = [
  {
    fieldType: 'customerName',
    pattern: 'customer name:',
    value: 'John Smith',
    confidence: 90,
    timestamp: new Date().toISOString()
  },
  {
    fieldType: 'refundAmount',
    pattern: 'refund amount:',
    value: '500.00',
    confidence: 95,
    timestamp: new Date().toISOString()
  },
  {
    fieldType: 'ibanNumber',
    pattern: 'iban:',
    value: 'SA0123456789012345678901',
    confidence: 95,
    timestamp: new Date().toISOString()
  },
  {
    fieldType: 'customerServiceNumber',
    pattern: 'service number:',
    value: 'FTTH123456',
    confidence: 90,
    timestamp: new Date().toISOString()
  }
];

// Initial extraction patterns
const initialExtractionPatterns: ExtractionPattern[] = [
  {
    fieldType: 'customerName',
    patternRegex: 'customer\\s*name\\s*:\\s*([A-Za-z\\s.\'-]+)',
    priority: 1,
    successRate: 95,
    usageCount: 10,
    timestamp: new Date().toISOString()
  },
  {
    fieldType: 'customerName',
    patternRegex: 'name\\s*:\\s*([A-Za-z\\s.\'-]+)',
    priority: 2,
    successRate: 90,
    usageCount: 15,
    timestamp: new Date().toISOString()
  },
  {
    fieldType: 'refundAmount',
    patternRegex: 'refund\\s*amount\\s*:\\s*(?:SAR|SR|ر.س.|﷼)?\\s*([0-9,.]+)',
    priority: 1,
    successRate: 92,
    usageCount: 12,
    timestamp: new Date().toISOString()
  },
  {
    fieldType: 'ibanNumber',
    patternRegex: 'iban\\s*:\\s*(SA\\d{22})',
    priority: 1,
    successRate: 98,
    usageCount: 14,
    timestamp: new Date().toISOString()
  },
  {
    fieldType: 'customerServiceNumber',
    patternRegex: 'service\\s*number\\s*:\\s*(FTTH\\d+)',
    priority: 1,
    successRate: 94,
    usageCount: 8,
    timestamp: new Date().toISOString()
  }
];

// Create an instance of the database
const db = new TrainingDatabase();

// Training service class
class TrainingService {
  private static instance: TrainingService;
  private initialized: boolean = false;
  private fuseSearch: Fuse<TrainingExample> | null = null;
  private patternRegistry: Map<string, RegExp[]> = new Map();
  private learningRate: number = 0.1; // How quickly the system adapts to corrections
  private db: TrainingDatabase;

  private constructor() {
    // Private constructor for singleton
    this.db = db;
  }

  static getInstance(): TrainingService {
    if (!TrainingService.instance) {
      TrainingService.instance = new TrainingService();
    }
    return TrainingService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Check if we need to seed the database
      // The tables might not exist yet, so we need to handle possible errors
      let exampleCount = 0;
      let patternCount = 0;
      
      try {
        exampleCount = await this.db.trainingExamples.count();
      } catch (error) {
        console.warn('Error counting training examples:', error);
        // Table might not exist yet, so count is 0
      }
      
      try {
        patternCount = await this.db.extractionPatterns.count();
      } catch (error) {
        console.warn('Error counting extraction patterns:', error);
        // Table might not exist yet, so count is 0
      }
      
      if (exampleCount === 0) {
        console.log('Seeding training database with initial examples...');
        await this.db.trainingExamples.bulkAdd(initialTrainingData);
      }
      
      if (patternCount === 0) {
        console.log('Seeding pattern registry with initial patterns...');
        await this.db.extractionPatterns.bulkAdd(initialExtractionPatterns);
      }
      
      // Initialize the fuzzy search
      await this.initializeFuseSearch();
      
      // Load patterns into the pattern registry
      await this.loadPatternRegistry();
      
      this.initialized = true;
      console.log('Training service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize training service:', error);
      throw error;
    }
  }

  private async initializeFuseSearch(): Promise<void> {
    try {
      const allExamples = await this.db.trainingExamples.toArray();
      
      this.fuseSearch = new Fuse(allExamples, {
        keys: ['pattern', 'value', 'context'],
        includeScore: true,
        threshold: 0.3
      });
    } catch (error) {
      console.error('Error initializing fuzzy search:', error);
      // Initialize with empty array as fallback
      this.fuseSearch = new Fuse([], {
        keys: ['pattern', 'value', 'context'],
        includeScore: true,
        threshold: 0.3
      });
    }
  }

  private async loadPatternRegistry(): Promise<void> {
    try {
      // Clear existing registry
      this.patternRegistry.clear();
      
      // Get all patterns sorted by priority
      const patterns = await this.db.extractionPatterns
        .orderBy('priority')
        .toArray();
      
      // Group patterns by field type
      for (const fieldType of ['customerName', 'refundAmount', 'ibanNumber', 'customerServiceNumber']) {
        const fieldPatterns = patterns
          .filter(p => p.fieldType === fieldType)
          .sort((a, b) => a.priority - b.priority);
          
        // Convert pattern strings to RegExp objects
        const regexPatterns = fieldPatterns.map(p => {
          try {
            return new RegExp(p.patternRegex, 'i');
          } catch (error) {
            console.error(`Invalid pattern regex: ${p.patternRegex}`, error);
            return null;
          }
        }).filter(p => p !== null) as RegExp[];
        
        // Store in registry
        this.patternRegistry.set(fieldType, regexPatterns);
      }
      
      console.log('Pattern registry loaded successfully');
    } catch (error) {
      console.error('Error loading pattern registry:', error);
      // Initialize with empty patterns as fallback
      for (const fieldType of ['customerName', 'refundAmount', 'ibanNumber', 'customerServiceNumber']) {
        this.patternRegistry.set(fieldType, []);
      }
    }
  }

  // Get patterns for a specific field type
  getPatterns(fieldType: string): RegExp[] {
    if (!this.initialized) {
      console.warn('Training service not initialized. Call initialize() first.');
      return [];
    }
    
    return this.patternRegistry.get(fieldType) || [];
  }

  // Create a new extraction pattern from a correction
  async learnNewPattern(
    fieldType: 'customerName' | 'refundAmount' | 'ibanNumber' | 'customerServiceNumber',
    context: string,
    correctValue: string
  ): Promise<void> {
    // Simple heuristic to try to derive a pattern from the correction
    // This is a simplified approach - in a real system, this would be more sophisticated
    
    // Look for common indicator words before the value
    const lines = context.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes(correctValue.toLowerCase())) {
        // Try to identify the pattern before the value
        const beforeValue = line.substring(0, line.toLowerCase().indexOf(correctValue.toLowerCase()));
        
        if (beforeValue.trim()) {
          // Create a basic pattern - this is simplified and would be more advanced in a real system
          const patternWord = beforeValue.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          let patternRegex = '';
          
          switch (fieldType) {
            case 'customerName':
              patternRegex = `${patternWord}\\s*([A-Za-z\\s.'-]+)`;
              break;
            case 'refundAmount':
              patternRegex = `${patternWord}\\s*(?:SAR|SR|ر.س.|﷼)?\\s*([0-9,.]+)`;
              break;
            case 'ibanNumber':
              patternRegex = `${patternWord}\\s*(SA\\d{22})`;
              break;
            case 'customerServiceNumber':
              patternRegex = `${patternWord}\\s*(FTTH\\d+)`;
              break;
          }
          
          if (patternRegex) {
            // Check if pattern already exists
            const existingPatterns = await this.db.extractionPatterns
              .where('patternRegex')
              .equals(patternRegex)
              .count();
              
            if (existingPatterns === 0) {
              // Add as a new pattern with low priority and confidence initially
              await this.db.extractionPatterns.add({
                fieldType,
                patternRegex,
                priority: 5, // Lower priority for new patterns
                successRate: 60, // Initial success rate is moderate
                usageCount: 1,
                timestamp: new Date().toISOString()
              });
              
              // Reload pattern registry
              await this.loadPatternRegistry();
            }
          }
        }
      }
    }
  }

  async addTrainingExample(example: Omit<TrainingExample, 'id' | 'timestamp'>): Promise<number> {
    await this.initialize();
    
    const newExample: TrainingExample = {
      ...example,
      timestamp: new Date().toISOString()
    };
    
    const id = await this.db.trainingExamples.add(newExample);
    
    // Update the fuzzy search index
    await this.initializeFuseSearch();
    
    // If context is provided, try to learn a new pattern
    if (example.context) {
      await this.learnNewPattern(example.fieldType, example.context, example.value);
    }
    
    return id;
  }

  // Record a user correction
  async recordCorrection(
    fieldType: 'customerName' | 'refundAmount' | 'ibanNumber' | 'customerServiceNumber',
    originalValue: string,
    correctedValue: string,
    documentId: string,
    context?: string
  ): Promise<void> {
    await this.initialize();
    
    // Store the correction record
    await this.db.correctionHistory.add({
      fieldType,
      originalValue,
      correctedValue,
      documentId,
      confidence: 100, // User corrections have 100% confidence
      timestamp: new Date().toISOString()
    });
    
    // Add to training examples
    await this.addTrainingExample({
      fieldType,
      pattern: fieldType, // Generic pattern for now
      value: correctedValue,
      context,
      confidence: 90
    });
    
    // Try to learn from this correction
    if (context) {
      await this.learnNewPattern(fieldType, context, correctedValue);
    }
    
    // Update pattern success rates based on this correction
    await this.updatePatternSuccessRates(fieldType, originalValue, correctedValue);
  }

  // Update pattern success rates based on corrections
  private async updatePatternSuccessRates(
    fieldType: 'customerName' | 'refundAmount' | 'ibanNumber' | 'customerServiceNumber',
    originalValue: string,
    correctedValue: string
  ): Promise<void> {
    // Get all patterns for this field type
    const patterns = await this.db.extractionPatterns
      .where('fieldType')
      .equals(fieldType)
      .toArray();
      
    for (const pattern of patterns) {
      try {
        // Check if this pattern would have extracted the original value
        const regex = new RegExp(pattern.patternRegex, 'i');
        const match = originalValue.match(regex);
        
        if (match) {
          // This pattern was used and produced a wrong result
          const newSuccessRate = pattern.successRate * (1 - this.learningRate) + 
                                 (originalValue === correctedValue ? 100 : 0) * this.learningRate;
          
          // Update the pattern's success rate
          await this.db.extractionPatterns.update(pattern.id!, {
            successRate: newSuccessRate,
            usageCount: pattern.usageCount + 1,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`Error processing pattern ${pattern.patternRegex}:`, error);
      }
    }
    
    // Reload pattern registry to reflect changes
    await this.loadPatternRegistry();
  }

  async findSimilarPatterns(text: string, fieldType?: string): Promise<TrainingExample[]> {
    await this.initialize();
    
    if (!this.fuseSearch) return [];
    
    const results = this.fuseSearch.search(text);
    
    // Filter by field type if provided
    const filteredResults = fieldType 
      ? results.filter(r => r.item.fieldType === fieldType)
      : results;
      
    // Return the top 5 results
    return filteredResults.slice(0, 5).map(r => r.item);
  }

  async getTrainingExamples(fieldType?: string): Promise<TrainingExample[]> {
    await this.initialize();
    
    if (fieldType) {
      return this.db.trainingExamples.where('fieldType').equals(fieldType).toArray();
    }
    
    return this.db.trainingExamples.toArray();
  }

  // Get all extraction patterns
  async getExtractionPatterns(fieldType?: string): Promise<ExtractionPattern[]> {
    await this.initialize();
    
    if (fieldType) {
      return this.db.extractionPatterns.where('fieldType').equals(fieldType).toArray();
    }
    
    return this.db.extractionPatterns.toArray();
  }

  // Get correction history
  async getCorrectionHistory(limit: number = 50): Promise<CorrectionRecord[]> {
    await this.initialize();
    
    return this.db.correctionHistory
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray();
  }

  // Generate insights from correction history
  async generateInsights(): Promise<{
    totalCorrections: number;
    fieldCorrections: Record<string, number>;
    improvementRate: number;
    problemFields: string[];
    recentPatterns: ExtractionPattern[];
  }> {
    await this.initialize();
    
    const corrections = await this.getCorrectionHistory(1000);
    const patterns = await this.getExtractionPatterns();
    
    // Count corrections by field type
    const fieldCorrections: Record<string, number> = {
      customerName: 0,
      refundAmount: 0,
      ibanNumber: 0,
      customerServiceNumber: 0
    };
    
    corrections.forEach(c => {
      if (fieldCorrections[c.fieldType] !== undefined) {
        fieldCorrections[c.fieldType]++;
      }
    });
    
    // Calculate improvement rate (comparing newer to older corrections)
    const midpoint = Math.floor(corrections.length / 2);
    const olderCorrections = corrections.slice(midpoint);
    const newerCorrections = corrections.slice(0, midpoint);
    
    // Calculate the rate of "no change" corrections (where user confirmed the extraction)
    const olderNoChangeCount = olderCorrections.filter(c => c.originalValue === c.correctedValue).length;
    const newerNoChangeCount = newerCorrections.filter(c => c.originalValue === c.correctedValue).length;
    
    const olderRate = olderCorrections.length > 0 ? olderNoChangeCount / olderCorrections.length : 0;
    const newerRate = newerCorrections.length > 0 ? newerNoChangeCount / newerCorrections.length : 0;
    
    const improvementRate = newerRate - olderRate;
    
    // Identify problem fields (most corrections)
    const problemFields = Object.entries(fieldCorrections)
      .sort((a, b) => b[1] - a[1])
      .map(([field]) => field);
    
    // Get recently added patterns
    const recentPatterns = patterns
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
    
    return {
      totalCorrections: corrections.length,
      fieldCorrections,
      improvementRate: improvementRate * 100, // Convert to percentage
      problemFields,
      recentPatterns
    };
  }

  async improveConfidence(id: number, increment: number): Promise<void> {
    await this.initialize();
    
    const example = await this.db.trainingExamples.get(id);
    
    if (example) {
      const newConfidence = Math.min(100, example.confidence + increment);
      
      await this.db.trainingExamples.update(id, {
        confidence: newConfidence,
        timestamp: new Date().toISOString()
      });
      
      // Update the fuzzy search index
      await this.initializeFuseSearch();
    }
  }

  async clearAllTrainingData(): Promise<void> {
    await this.db.trainingExamples.clear();
    await this.db.extractionPatterns.clear();
    await this.db.correctionHistory.clear();
    
    await this.db.trainingExamples.bulkAdd(initialTrainingData);
    await this.db.extractionPatterns.bulkAdd(initialExtractionPatterns);
    
    await this.initializeFuseSearch();
    await this.loadPatternRegistry();
  }
  
  // Method to access database for PatternRegistry component
  getDatabase(): TrainingDatabase {
    return this.db;
  }
}

export default TrainingService;