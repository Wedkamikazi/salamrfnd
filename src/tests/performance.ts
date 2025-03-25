import { createTestDocument, testExtraction } from './testUtils';

/**
 * Run performance tests on document extraction
 */
export async function runPerformanceTests(iterations: number = 5): Promise<{
  averageTime: number;
  testResults: Array<{iteration: number; time: number}>;
}> {
  console.log("\n⏱️ RUNNING PERFORMANCE TESTS...\n");
  console.log(`Testing with ${iterations} iterations...\n`);
  
  const testResults: Array<{iteration: number; time: number}> = [];
  
  // Create test documents of varying complexity
  const documents = [
    createTestDocument({ 
      customerName: "Mohammed Al Motaeri",
      customerNamePosition: "top" 
    }),
    createTestDocument({
      customerName: "Karim Abu Taha",
      customerNamePosition: "signature",
      includeCustomerInfoSection: false
    }),
    createTestDocument({
      includeSignatureSection: false,
      includeCustomerInfoSection: false
    })
  ];
  
  let totalTime = 0;
  
  for (let i = 0; i < iterations; i++) {
    const docIndex = i % documents.length;
    const testDoc = documents[docIndex];
    
    console.log(`   Iteration ${i+1} (Document Type ${docIndex+1})`);
    
    const startTime = performance.now();
    await testExtraction(testDoc);
    const endTime = performance.now();
    
    const executionTime = endTime - startTime;
    totalTime += executionTime;
    
    testResults.push({
      iteration: i+1,
      time: executionTime
    });
    
    console.log(`   - Execution time: ${executionTime.toFixed(2)}ms\n`);
  }
  
  const averageTime = totalTime / iterations;
  console.log(`Average execution time: ${averageTime.toFixed(2)}ms`);
  
  return {
    averageTime,
    testResults
  };
}