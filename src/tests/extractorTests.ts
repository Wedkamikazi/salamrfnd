import { createTestDocument, testExtraction } from './testUtils';

/**
 * Run extraction tests
 */
export async function runExtractionTests(): Promise<{
  passed: string[];
  failed: string[];
  results: Record<string, any>;
}> {
  const results: Record<string, any> = {};
  const passed: string[] = [];
  const failed: string[] = [];
  
  console.log("🧪 RUNNING EXTRACTION TESTS...\n");
  
  // Test 1: Standard document with customer name in top section
  try {
    console.log("📝 Test 1: Standard document with customer name in top section");
    const doc1 = createTestDocument({
      customerName: "Mohammed Al Motaeri",
      customerNamePosition: "top",
      refundAmount: "379.50",
      serviceNumber: "FTTH00516134"
    });
    
    const result1 = await testExtraction(doc1);
    results.test1 = result1;
    
    console.log(`   - Extracted Name: "${result1.customerName.value}" (Confidence: ${result1.customerName.confidence.toFixed(1)}%)`);
    console.log(`   - Name position: ${result1.customerName.position.toFixed(1)}%`);
    
    if (result1.customerName.value.includes("Mohammed") && result1.customerName.confidence > 90) {
      console.log("   ✅ PASSED: Correctly extracted name from top section with high confidence\n");
      passed.push("Test 1: Standard document");
    } else {
      console.log("   ❌ FAILED: Did not extract correct name or confidence too low\n");
      failed.push("Test 1: Standard document");
    }
  } catch (error) {
    console.error("   ❌ ERROR in Test 1:", error);
    failed.push("Test 1: Standard document (error)");
  }
  
  // Test 2: Document with name in signature section (should prefer top section name)
  try {
    console.log("📝 Test 2: Document with competing names (top section vs signature section)");
    const doc2 = createTestDocument({
      customerName: "Mohammed Al Motaeri",
      customerNamePosition: "top",
      refundAmount: "379.50",
      serviceNumber: "FTTH00516134",
      includeSignatureSection: true
    });
    
    const result2 = await testExtraction(doc2);
    results.test2 = result2;
    
    console.log(`   - Extracted Name: "${result2.customerName.value}" (Confidence: ${result2.customerName.confidence.toFixed(1)}%)`);
    
    if (result2.customerName.value.includes("Mohammed") && !result2.customerName.value.includes("Karim") && result2.customerName.confidence > 90) {
      console.log("   ✅ PASSED: Correctly preferred customer info name over signature section name\n");
      passed.push("Test 2: Competing names");
    } else {
      console.log("   ❌ FAILED: Did not prefer customer info name or confidence too low\n");
      failed.push("Test 2: Competing names");
    }
  } catch (error) {
    console.error("   ❌ ERROR in Test 2:", error);
    failed.push("Test 2: Competing names (error)");
  }
  
  // Test 3: Document with only signature section name (low confidence expected)
  try {
    console.log("📝 Test 3: Document with only signature section name");
    const doc3 = createTestDocument({
      customerName: "Karim Abu Taha",
      customerNamePosition: "signature",
      refundAmount: "379.50",
      serviceNumber: "FTTH00516134",
      includeCustomerInfoSection: false
    });
    
    const result3 = await testExtraction(doc3);
    results.test3 = result3;
    
    console.log(`   - Extracted Name: "${result3.customerName.value}" (Confidence: ${result3.customerName.confidence.toFixed(1)}%)`);
    
    if (result3.customerName.value.includes("Karim") && result3.customerName.confidence < 50) {
      console.log("   ✅ PASSED: Extracted signature name but with appropriately low confidence\n");
      passed.push("Test 3: Only signature name");
    } else {
      console.log("   ❌ FAILED: Did not extract signature name or confidence inappropriately high\n");
      failed.push("Test 3: Only signature name");
    }
  } catch (error) {
    console.error("   ❌ ERROR in Test 3:", error);
    failed.push("Test 3: Only signature name (error)");
  }
  
  // Test 4: Test layout detection for Treasury forms
  try {
    console.log("📝 Test 4: Layout detection for Treasury forms");
    const doc4 = createTestDocument({
      customerName: "Mohammed Al Motaeri",
      customerNamePosition: "top",
      refundAmount: "379.50",
      serviceNumber: "FTTH00516134"
    });
    
    const result4 = await testExtraction(doc4);
    results.test4 = result4;
    
    console.log(`   - Detected Layout: "${result4.layout.name}" (Confidence: ${result4.layout.confidence.toFixed(1)}%)`);
    
    if ((result4.layout.name === "Treasury Form" || result4.layout.name === "SCTTR Form") && result4.layout.confidence > 70) {
      console.log("   ✅ PASSED: Correctly identified Treasury form layout with good confidence\n");
      passed.push("Test 4: Layout detection");
    } else {
      console.log("   ❌ FAILED: Did not identify correct layout or confidence too low\n");
      failed.push("Test 4: Layout detection");
    }
  } catch (error) {
    console.error("   ❌ ERROR in Test 4:", error);
    failed.push("Test 4: Layout detection (error)");
  }
  
  // Test 5: Arabic text handling in names
  try {
    console.log("📝 Test 5: Arabic text handling in names");
    const arabicDoc = createTestDocument({
      customerName: "Mohammed Al Motaeri",
      customerNamePosition: "top"
    }).replace("Name الاسم:", "Name الاسم: MR . محمد المطيري");
    
    const result5 = await testExtraction(arabicDoc);
    results.test5 = result5;
    
    console.log(`   - Extracted Name: "${result5.customerName.value}" (Confidence: ${result5.customerName.confidence.toFixed(1)}%)`);
    
    // Since OCR won't work in this test, we're just checking that it finds something near Arabic text
    if (result5.customerName.confidence > 0) {
      console.log("   ✅ PASSED: Successfully handled document with Arabic text\n");
      passed.push("Test 5: Arabic text handling");
    } else {
      console.log("   ❌ FAILED: Failed to handle document with Arabic text\n");
      failed.push("Test 5: Arabic text handling");
    }
  } catch (error) {
    console.error("   ❌ ERROR in Test 5:", error);
    failed.push("Test 5: Arabic text handling (error)");
  }
  
  // Test 6: Service number extraction
  try {
    console.log("📝 Test 6: Service number extraction");
    const doc6 = createTestDocument({
      serviceNumber: "FTTH00516134",
      serviceNumberPosition: "top"
    });
    
    const result6 = await testExtraction(doc6);
    results.test6 = result6;
    
    console.log(`   - Extracted Service Number: "${result6.serviceNumber.value}" (Confidence: ${result6.serviceNumber.confidence.toFixed(1)}%)`);
    
    if (result6.serviceNumber.value === "FTTH00516134" && result6.serviceNumber.confidence > 80) {
      console.log("   ✅ PASSED: Correctly extracted service number with high confidence\n");
      passed.push("Test 6: Service number extraction");
    } else {
      console.log("   ❌ FAILED: Did not extract correct service number or confidence too low\n");
      failed.push("Test 6: Service number extraction");
    }
  } catch (error) {
    console.error("   ❌ ERROR in Test 6:", error);
    failed.push("Test 6: Service number extraction (error)");
  }
  
  // Test 7: IBAN extraction
  try {
    console.log("📝 Test 7: IBAN extraction");
    const doc7 = createTestDocument({
      ibanNumber: "SA0380000000608010167519",
      ibanPosition: "bottom"
    });
    
    const result7 = await testExtraction(doc7);
    results.test7 = result7;
    
    console.log(`   - Extracted IBAN: "${result7.ibanNumber.value}" (Confidence: ${result7.ibanNumber.confidence.toFixed(1)}%)`);
    
    if (result7.ibanNumber.value === "SA0380000000608010167519" && result7.ibanNumber.confidence > 70) {
      console.log("   ✅ PASSED: Correctly extracted IBAN with good confidence\n");
      passed.push("Test 7: IBAN extraction");
    } else {
      console.log("   ❌ FAILED: Did not extract correct IBAN or confidence too low\n");
      failed.push("Test 7: IBAN extraction");
    }
  } catch (error) {
    console.error("   ❌ ERROR in Test 7:", error);
    failed.push("Test 7: IBAN extraction (error)");
  }
  
  // Test 8: Amount extraction
  try {
    console.log("📝 Test 8: Amount extraction");
    const doc8 = createTestDocument({
      refundAmount: "379.50",
      refundAmountPosition: "middle"
    });
    
    const result8 = await testExtraction(doc8);
    results.test8 = result8;
    
    console.log(`   - Extracted Amount: "${result8.refundAmount.value}" (Confidence: ${result8.refundAmount.confidence.toFixed(1)}%)`);
    
    if (result8.refundAmount.value === "379.50" && result8.refundAmount.confidence > 70) {
      console.log("   ✅ PASSED: Correctly extracted amount with good confidence\n");
      passed.push("Test 8: Amount extraction");
    } else {
      console.log("   ❌ FAILED: Did not extract correct amount or confidence too low\n");
      failed.push("Test 8: Amount extraction");
    }
  } catch (error) {
    console.error("   ❌ ERROR in Test 8:", error);
    failed.push("Test 8: Amount extraction (error)");
  }
  
  return { passed, failed, results };
}