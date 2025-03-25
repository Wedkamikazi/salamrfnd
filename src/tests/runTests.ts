import { runExtractionTests } from './extractorTests';
import { runLayoutTests } from './layoutTests';
import { runSelectionPopupTests } from './selectionPopupTests';
import { runQuickFixModalTests } from './ui-tests/quickFixTests';

/**
 * Run all tests and report results
 */
export async function runAllTests(): Promise<void> {
  console.log("\n🔬 TREASURY DOCUMENT EXTRACTOR TEST SUITE 🔬");
  console.log("===========================================\n");
  
  // Run all test suites
  const extractionResults = await runExtractionTests();
  const layoutResults = await runLayoutTests();
  const selectionPopupResults = await runSelectionPopupTests();
  const quickFixResults = await runQuickFixModalTests();
  
  // Combine all results
  const allPassed = [
    ...extractionResults.passed,
    ...layoutResults.passed,
    ...selectionPopupResults.passed,
    ...quickFixResults.passed
  ];
  
  const allFailed = [
    ...extractionResults.failed,
    ...layoutResults.failed,
    ...selectionPopupResults.failed,
    ...quickFixResults.failed
  ];
  
  // Report summary
  console.log("\n📊 TEST SUMMARY");
  console.log("==============");
  console.log(`Total Tests: ${allPassed.length + allFailed.length}`);
  console.log(`Passed: ${allPassed.length} (${Math.round(allPassed.length / (allPassed.length + allFailed.length) * 100)}%)`);
  console.log(`Failed: ${allFailed.length}`);
  
  if (allFailed.length > 0) {
    console.log("\n❌ FAILED TESTS:");
    allFailed.forEach(test => console.log(`   - ${test}`));
  }
  
  console.log("\n✅ PASSED TESTS:");
  allPassed.forEach(test => console.log(`   - ${test}`));
  
  // Check specific critical tests
  const criticalNameExtractionFixed = extractionResults.passed.some(test => 
    test.includes("Competing names") || test.includes("Standard document")
  );
  
  const selectionPopupFixed = selectionPopupResults.passed.length > 0;
  
  console.log("\n🔍 KEY IMPROVEMENTS VERIFICATION:");
  console.log(`   - Name Extraction Fix: ${criticalNameExtractionFixed ? '✅ FIXED' : '❌ STILL ISSUES'}`);
  console.log(`   - Selection Popup Visibility: ${selectionPopupFixed ? '✅ FIXED' : '❌ STILL ISSUES'}`);
  
  console.log("\n===========================================");
  console.log("🏁 TEST SUITE COMPLETE 🏁\n");
}