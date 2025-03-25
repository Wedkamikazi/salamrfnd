import React, { useState } from 'react';
import { ExtractedData } from '../types';
import { formLayouts } from '../utils/layoutDetection';
import { ChevronDown, ChevronUp, LayoutGrid, Info } from 'lucide-react';

interface FormLayoutAnalyzerProps {
  data: ExtractedData[];
}

const FormLayoutAnalyzer: React.FC<FormLayoutAnalyzerProps> = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (data.length === 0) return null;
  
  // Group documents by detected layout
  const layoutGroups = data.reduce((groups: Record<string, ExtractedData[]>, item) => {
    const layout = item.detectedLayout;
    if (!groups[layout]) {
      groups[layout] = [];
    }
    groups[layout].push(item);
    return groups;
  }, {});
  
  // Sort layouts by count (most frequent first)
  const sortedLayouts = Object.keys(layoutGroups).sort(
    (a, b) => layoutGroups[b].length - layoutGroups[a].length
  );
  
  // Get the layout object from the name
  const getLayoutDescription = (layoutName: string) => {
    const layout = formLayouts.find(l => l.name === layoutName);
    return layout ? layout.description : 'Unknown layout pattern';
  };
  
  // Calculate average confidence for each layout
  const getLayoutConfidence = (layoutName: string) => {
    const docs = layoutGroups[layoutName];
    return docs.reduce((sum, doc) => sum + doc.layoutConfidence, 0) / docs.length;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <LayoutGrid className="text-blue-600 mr-2" size={20} />
          <h3 className="text-lg font-medium text-gray-800">Form Layout Analysis</h3>
        </div>
        {isExpanded ? 
          <ChevronUp className="text-gray-500" size={20} /> : 
          <ChevronDown className="text-gray-500" size={20} />
        }
      </div>
      
      {isExpanded && (
        <div className="mt-4">
          <div className="text-sm text-gray-600 flex items-start mb-4">
            <Info size={16} className="text-blue-500 mr-2 mt-0.5" />
            <p>
              The system detected {sortedLayouts.length} different form layout patterns across your documents. 
              This analysis helps understand the consistency of your document formats.
            </p>
          </div>
          
          <div className="space-y-4">
            {sortedLayouts.map(layout => (
              <div key={layout} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-800">{layout}</h4>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {layoutGroups[layout].length} document{layoutGroups[layout].length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{getLayoutDescription(layout)}</p>
                
                <div className="flex items-center mb-1">
                  <span className="text-xs text-gray-500 w-32">Pattern confidence:</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5 mr-2">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full" 
                      style={{ width: `${getLayoutConfidence(layout)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-gray-700">
                    {getLayoutConfidence(layout).toFixed(1)}%
                  </span>
                </div>
                
                <div className="grid grid-cols-4 gap-2 mt-3">
                  <div className="text-center relative h-16 bg-gray-50 rounded-md flex flex-col justify-center items-center">
                    <div 
                      className="absolute top-0 h-1 bg-blue-500 rounded-t-md" 
                      style={{ 
                        width: '100%', 
                        opacity: layout === 'Error' ? 0.2 : 0.8
                      }}
                    ></div>
                    <span className="text-xs font-medium text-gray-700">Name</span>
                    <span className="text-xs text-gray-500">Top Section</span>
                  </div>
                  <div className="text-center relative h-16 bg-gray-50 rounded-md flex flex-col justify-center items-center">
                    <div 
                      className="absolute top-0 h-1 bg-green-500 rounded-t-md" 
                      style={{ 
                        width: '100%',
                        opacity: layout === 'Error' ? 0.2 : 0.8
                      }}
                    ></div>
                    <span className="text-xs font-medium text-gray-700">Amount</span>
                    <span className="text-xs text-gray-500">Upper-Middle</span>
                  </div>
                  <div className="text-center relative h-16 bg-gray-50 rounded-md flex flex-col justify-center items-center">
                    <div 
                      className="absolute top-0 h-1 bg-yellow-500 rounded-t-md" 
                      style={{ 
                        width: '100%',
                        opacity: layout === 'Error' ? 0.2 : 0.8
                      }}
                    ></div>
                    <span className="text-xs font-medium text-gray-700">IBAN</span>
                    <span className="text-xs text-gray-500">Middle Section</span>
                  </div>
                  <div className="text-center relative h-16 bg-gray-50 rounded-md flex flex-col justify-center items-center">
                    <div 
                      className="absolute top-0 h-1 bg-purple-500 rounded-t-md" 
                      style={{ 
                        width: '100%',
                        opacity: layout === 'Error' ? 0.2 : 0.8
                      }}
                    ></div>
                    <span className="text-xs font-medium text-gray-700">Service #</span>
                    <span className="text-xs text-gray-500">Lower Section</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FormLayoutAnalyzer;