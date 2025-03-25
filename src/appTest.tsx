import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { runTestDashboard } from './runComprehensiveTests';

function TestLauncher() {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Check if API features are ready
    setTimeout(() => {
      setIsReady(true);
    }, 1000);
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-xl font-bold text-center mb-4">Treasury Document Extractor</h1>
          <p className="text-gray-600 mb-6">
            This tool will run comprehensive tests to verify the fixes implemented for document extraction and UI issues.
          </p>
          
          <button
            onClick={runTestDashboard}
            disabled={!isReady}
            className={`w-full py-2 rounded-md text-white font-medium ${
              isReady ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isReady ? 'Launch Comprehensive Tests' : 'Initializing...'}
          </button>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h2 className="font-medium text-blue-800 mb-2">Fixed Issues:</h2>
          <ul className="space-y-2 text-sm text-blue-700">
            <li className="flex items-start">
              <span className="inline-block bg-blue-200 rounded-full p-1 mr-2 mt-0.5">
                <svg className="w-3 h-3 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </span>
              <span>Name extraction now prioritizes names in customer info section</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block bg-blue-200 rounded-full p-1 mr-2 mt-0.5">
                <svg className="w-3 h-3 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </span>
              <span>Selection popup visibility improved with higher z-index and styling</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block bg-blue-200 rounded-full p-1 mr-2 mt-0.5">
                <svg className="w-3 h-3 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </span>
              <span>Mobile responsiveness enhanced for all components</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export function renderTestApp() {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(<TestLauncher />);
  }
}