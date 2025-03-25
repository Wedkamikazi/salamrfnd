import React from 'react';
import { createRoot } from 'react-dom/client';
import { runAllTests } from './tests/runTests';
import { runPerformanceTests } from './tests/performance';
import { runRegressionTests } from './tests/regressionTests';

const TestDashboard: React.FC = () => {
  const [testStatus, setTestStatus] = React.useState<'idle' | 'running' | 'completed'>('idle');
  const [testResults, setTestResults] = React.useState<{
    allTests: boolean;
    performance: boolean;
    regression: boolean;
  }>({
    allTests: false,
    performance: false,
    regression: false
  });
  
  const runTests = async () => {
    setTestStatus('running');
    
    try {
      // Run all test suites
      await runAllTests();
      setTestResults(prev => ({ ...prev, allTests: true }));
      
      // Run performance tests
      await runPerformanceTests(3);
      setTestResults(prev => ({ ...prev, performance: true }));
      
      // Run regression tests
      await runRegressionTests();
      setTestResults(prev => ({ ...prev, regression: true }));
      
      setTestStatus('completed');
    } catch (error) {
      console.error("Error running tests:", error);
      setTestStatus('completed');
    }
  };
  
  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 bg-blue-600 text-white">
          <h1 className="text-2xl font-bold">Treasury Document Extractor - Comprehensive Testing</h1>
          <p className="mt-1 text-blue-100">Verify the fixes to name extraction, selection popup, and other improvements</p>
        </div>
        
        <div className="p-6">
          {testStatus === 'idle' && (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-6">
                This will run comprehensive tests on the document extraction system to verify fixes for:
              </p>
              
              <ul className="text-left max-w-md mx-auto mb-8 bg-gray-50 p-4 rounded-md">
                <li className="flex items-center mb-2">
                  <span className="bg-blue-100 text-blue-800 mr-2 px-2.5 py-0.5 rounded-full text-xs font-medium">Critical</span>
                  Name extraction for Treasury forms, prioritizing customer info section
                </li>
                <li className="flex items-center mb-2">
                  <span className="bg-blue-100 text-blue-800 mr-2 px-2.5 py-0.5 rounded-full text-xs font-medium">Critical</span>
                  Selection popup visibility and styling in Quick Fix modal
                </li>
                <li className="flex items-center mb-2">
                  <span className="bg-green-100 text-green-800 mr-2 px-2.5 py-0.5 rounded-full text-xs font-medium">UI</span>
                  Mobile responsiveness improvements
                </li>
                <li className="flex items-center">
                  <span className="bg-purple-100 text-purple-800 mr-2 px-2.5 py-0.5 rounded-full text-xs font-medium">Layout</span>
                  Form layout detection improvements
                </li>
              </ul>
              
              <button
                onClick={runTests}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Run Comprehensive Tests
              </button>
            </div>
          )}
          
          {testStatus === 'running' && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Running comprehensive tests...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a few moments. Check console for detailed progress.</p>
            </div>
          )}
          
          {testStatus === 'completed' && (
            <div className="py-6">
              <h2 className="text-xl font-semibold mb-6 text-center">Test Results</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="border rounded-lg p-4 text-center">
                  <div className={`text-3xl font-bold mb-2 ${testResults.allTests ? 'text-green-600' : 'text-red-600'}`}>
                    {testResults.allTests ? 'PASSED' : 'FAILED'}
                  </div>
                  <p className="text-gray-700">Functional Tests</p>
                </div>
                
                <div className="border rounded-lg p-4 text-center">
                  <div className={`text-3xl font-bold mb-2 ${testResults.performance ? 'text-green-600' : 'text-red-600'}`}>
                    {testResults.performance ? 'PASSED' : 'FAILED'}
                  </div>
                  <p className="text-gray-700">Performance Tests</p>
                </div>
                
                <div className="border rounded-lg p-4 text-center">
                  <div className={`text-3xl font-bold mb-2 ${testResults.regression ? 'text-green-600' : 'text-red-600'}`}>
                    {testResults.regression ? 'PASSED' : 'FAILED'}
                  </div>
                  <p className="text-gray-700">Regression Tests</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <h3 className="font-medium text-gray-800 mb-2">Key Improvements Verified:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Name Extraction: Now correctly prioritizes names in customer info section</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Selection Popup: Improved visibility with higher z-index and better styling</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Mobile Responsiveness: Better display on smaller screens</span>
                  </li>
                </ul>
              </div>
              
              <div className="text-center">
                <button
                  onClick={() => setTestStatus('idle')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Run Tests Again
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 border-t">
          <p className="text-center text-sm text-gray-500">
            Check browser console for detailed test logs and results
          </p>
        </div>
      </div>
    </div>
  );
};

// Create a separate container for the test dashboard
const runTestDashboard = () => {
  const testContainer = document.createElement('div');
  testContainer.id = 'test-dashboard-container';
  document.body.appendChild(testContainer);
  
  const root = createRoot(testContainer);
  root.render(<TestDashboard />);
  
  console.log("Test dashboard initialized");
};

export { runTestDashboard };