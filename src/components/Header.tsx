import React, { useState } from 'react';
import { FileSearch, Settings, Database, BarChart, Brain } from 'lucide-react';
import PatternRegistry from './PatternRegistry';
import LearningInsights from './LearningInsights';

const Header: React.FC = () => {
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'patterns' | 'insights'>('patterns');
  
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileSearch className="text-blue-600" size={28} />
            <div>
              <h1 className="text-xl font-bold text-gray-800">Treasury Document Extractor</h1>
              <p className="text-sm text-gray-500">Extract customer refund information from documents</p>
            </div>
          </div>
          
          <button
            className="flex items-center text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings size={18} className="mr-2" />
            <span>System Settings</span>
          </button>
        </div>
        
        {showSettings && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4 shadow-inner">
            <div className="flex border-b">
              <button
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'patterns' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('patterns')}
              >
                <div className="flex items-center">
                  <Database size={16} className="mr-2" />
                  Pattern Registry
                </div>
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'insights' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('insights')}
              >
                <div className="flex items-center">
                  <Brain size={16} className="mr-2" />
                  Learning Insights
                </div>
              </button>
            </div>
            
            <div className="py-4">
              {activeTab === 'patterns' && <PatternRegistry />}
              {activeTab === 'insights' && <LearningInsights />}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;