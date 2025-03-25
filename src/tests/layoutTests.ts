import { createTestDocument, analyzeDocumentSections } from './testUtils';
import { divideDocumentIntoSections, detectCustomerInfoSection, detectSignatureSection } from '../utils/layoutDetection';

/**
 * Run layout detection tests
 */
export async function runLayoutTests(): Promise<{
  passed: string[];
  failed: string[];
  results: Record<string, any>;
}> {
  const results: Record<string, any> = {};
  const passed: string[] = [];
  const failed: string[] = [];
  
  console.log("🧪 RUNNING LAYOUT DETECTION TESTS...\n");
  
  // Test 1: Customer Info Section Detection
  try {
    console.log("📝 Test 1: Customer Info Section Detection");
    const doc1 = createTestDocument({
      includeCustomerInfoSection: true
    });
    
    const analysis = analyzeDocumentSections(doc1);
    results.test1 = analysis;
    
    console.log(`   - Total Sections: ${analysis.totalSections}`);
    console.log(`   - Customer Info Section Index: ${analysis.customerInfoSectionIndex}`);
    
    if (analysis.customerInfoSectionIndex >= 0 && analysis.customerInfoSectionIndex < 3) {
      console.log("   ✅ PASSED: Correctly identified customer info section at top of document\n");
      passed.push("Test 1: Customer Info Section Detection");
    } else {
      console.log("   ❌ FAILED: Did not identify customer info section correctly\n");
      failed.push("Test 1: Customer Info Section Detection");
    }
  } catch (error) {
    console.error("   ❌ ERROR in Test 1:", error);
    failed.push("Test 1: Customer Info Section Detection (error)");
  }
  
  // Test 2: Signature Section Detection
  try {
    console.log("📝 Test 2: Signature Section Detection");
    const doc2 = createTestDocument({
      includeSignatureSection: true
    });
    
    const analysis = analyzeDocumentSections(doc2);
    results.test2 = analysis;
    
    console.log(`   - Total Sections: ${analysis.totalSections}`);
    console.log(`   - Signature Section Index: ${analysis.signatureSectionIndex}`);
    
    if (analysis.signatureSectionIndex > 0 && analysis.signatureSectionIndex >= analysis.totalSections - 3) {
      console.log("   ✅ PASSED: Correctly identified signature section at bottom of document\n");
      passed.push("Test 2: Signature Section Detection");
    } else {
      console.log("   ❌ FAILED: Did not identify signature section correctly\n");
      failed.push("Test 2: Signature Section Detection");
    }
  } catch (error) {
    console.error("   ❌ ERROR in Test 2:", error);
    failed.push("Test 2: Signature Section Detection (error)");
  }
  
  // Test 3: Section Division Logic
  try {
    console.log("📝 Test 3: Section Division Logic");
    const doc3 = createTestDocument({});
    
    const sections = divideDocumentIntoSections(doc3, 10); // 10 sections
    results.test3 = {
      sectionCount: sections.length,
      sections: sections.map(s => ({
        start: s.startPercentage,
        end: s.endPercentage,
        isCustomerInfo: s.isCustomerInfoSection,
        isSignature: s.isSignatureSection
      }))
    };
    
    console.log(`   - Total Sections: ${sections.length}`);
    console.log(`   - Section Distribution: ${sections.map(s => `${s.startPercentage.toFixed(0)}-${s.endPercentage.toFixed(0)}%`).join(', ')}`);
    
    if (sections.length === 10 && 
        sections[0].startPercentage === 0 && 
        sections[sections.length-1].endPercentage === 100) {
      console.log("   ✅ PASSED: Correctly divided document into expected sections\n");
      passed.push("Test 3: Section Division Logic");
    } else {
      console.log("   ❌ FAILED: Document division not working as expected\n");
      failed.push("Test 3: Section Division Logic");
    }
  } catch (error) {
    console.error("   ❌ ERROR in Test 3:", error);
    failed.push("Test 3: Section Division Logic (error)");
  }
  
  // Test 4: Document with missing customer info section
  try {
    console.log("📝 Test 4: Document with missing customer info section");
    const doc4 = createTestDocument({
      includeCustomerInfoSection: false
    });
    
    const analysis = analyzeDocumentSections(doc4);
    results.test4 = analysis;
    
    console.log(`   - Customer Info Section Index: ${analysis.customerInfoSectionIndex}`);
    
    if (analysis.customerInfoSectionIndex === 0) {
      console.log("   ✅ PASSED: Falls back to first section when no explicit customer info section\n");
      passed.push("Test 4: Missing customer info section");
    } else {
      console.log("   ❌ FAILED: Did not handle missing customer info section correctly\n");
      failed.push("Test 4: Missing customer info section");
    }
  } catch (error) {
    console.error("   ❌ ERROR in Test 4:", error);
    failed.push("Test 4: Missing customer info section (error)");
  }
  
  // Test 5: Document with missing signature section
  try {
    console.log("📝 Test 5: Document with missing signature section");
    const doc5 = createTestDocument({
      includeSignatureSection: false
    });
    
    const analysis = analyzeDocumentSections(doc5);
    results.test5 = analysis;
    
    console.log(`   - Signature Section Index: ${analysis.signatureSectionIndex}`);
    
    if (analysis.signatureSectionIndex === -1) {
      console.log("   ✅ PASSED: Correctly identified missing signature section\n");
      passed.push("Test 5: Missing signature section");
    } else {
      console.log("   ❌ FAILED: Incorrectly identified signature section when none exists\n");
      failed.push("Test 5: Missing signature section");
    }
  } catch (error) {
    console.error("   ❌ ERROR in Test 5:", error);
    failed.push("Test 5: Missing signature section (error)");
  }
  
  return { passed, failed, results };
}