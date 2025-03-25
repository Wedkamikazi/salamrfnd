import { createTestDocument, testExtraction } from './testUtils';

/**
 * Run regression tests to ensure old functionality still works
 */
export async function runRegressionTests(): Promise<{
  passed: string[];
  failed: string[];
  results: Record<string, any>;
}> {
  const results: Record<string, any> = {};
  const passed: string[] = [];
  const failed: string[] = [];
  
  console.log("\n🔄 RUNNING REGRESSION TESTS...\n");
  
  // Test 1: Amount extraction still works
  try {
    console.log("📝 Test 1: Amount extraction still works");
    const doc1 = createTestDocument({
      refundAmount: "1250.75",
      refundAmountPosition: "middle"
    });
    
    const result1 = await testExtraction(doc1);
    results.test1 = result1;
    
    console.log(`   - Extracted Amount: "${result1.refundAmount.value}" (Confidence: ${result1.refundAmount.confidence.toFixed(1)}%)`);
    
    if (result1.refundAmount.value === "1250.75" && result1.refundAmount.confidence > 70) {
      console.log("   ✅ PASSED: Amount extraction still works correctly\n");
      passed.push("Test 1: Amount extraction regression");
    } else {
      console.log("   ❌ FAILED: Amount extraction regression failure\n");
      failed.push("Test 1: Amount extraction regression");
    }
  } catch (error) {
    console.error("   ❌ ERROR in Test 1:", error);
    failed.push("Test 1: Amount extraction regression (error)");
  }
  
  // Test 2: IBAN extraction still works
  try {
    console.log("📝 Test 2: IBAN extraction still works");
    const doc2 = createTestDocument({
      ibanNumber: "SA1234567890123456789012",
      ibanPosition: "middle"
    });
    
    const result2 = await testExtraction(doc2);
    results.test2 = result2;
    
    console.log(`   - Extracted IBAN: "${result2.ibanNumber.value}" (Confidence: ${result2.ibanNumber.confidence.toFixed(1)}%)`);
    
    if (result2.ibanNumber.value === "SA1234567890123456789012" && result2.ibanNumber.confidence > 70) {
      console.log("   ✅ PASSED: IBAN extraction still works correctly\n");
      passed.push("Test 2: IBAN extraction regression");
    } else {
      console.log("   ❌ FAILED: IBAN extraction regression failure\n");
      failed.push("Test 2: IBAN extraction regression");
    }
  } catch (error) {
    console.error("   ❌ ERROR in Test 2:", error);
    failed.push("Test 2: IBAN extraction regression (error)");
  }
  
  // Test 3: Service number extraction still works
  try {
    console.log("📝 Test 3: Service number extraction still works");
    const doc3 = createTestDocument({
      serviceNumber: "FTTH987654321",
      serviceNumberPosition: "top"
    });
    
    const result3 = await testExtraction(doc3);
    results.test3 = result3;
    
    console.log(`   - Extracted Service Number: "${result3.serviceNumber.value}" (Confidence: ${result3.serviceNumber.confidence.toFixed(1)}%)`);
    
    if (result3.serviceNumber.value === "FTTH987654321" && result3.serviceNumber.confidence > 70) {
      console.log("   ✅ PASSED: Service number extraction still works correctly\n");
      passed.push("Test 3: Service number extraction regression");
    } else {
      console.log("   ❌ FAILED: Service number extraction regression failure\n");
      failed.push("Test 3: Service number extraction regression");
    }
  } catch (error) {
    console.error("   ❌ ERROR in Test 3:", error);
    failed.push("Test 3: Service number extraction regression (error)");
  }
  
  // Test 4: Layout detection still works
  try {
    console.log("📝 Test 4: Layout detection still works");
    const doc4 = createTestDocument({});
    
    const result4 = await testExtraction(doc4);
    results.test4 = result4;
    
    console.log(`   - Detected Layout: "${result4.layout.name}" (Confidence: ${result4.layout.confidence.toFixed(1)}%)`);
    
    if (result4.layout.confidence > 70) {
      console.log("   ✅ PASSED: Layout detection still works with good confidence\n");
      passed.push("Test 4: Layout detection regression");
    } else {
      console.log("   ❌ FAILED: Layout detection regression failure\n");
      failed.push("Test 4: Layout detection regression");
    }
  } catch (error) {
    console.error("   ❌ ERROR in Test 4:", error);
    failed.push("Test 4: Layout detection regression (error)");
  }
  
  return { passed, failed, results };
}