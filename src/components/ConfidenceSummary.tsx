import React from 'react';
import { ExtractedData } from '../types';
import { FileText, LayoutGrid } from 'lucide-react';

interface ConfidenceSummaryProps {
  data: ExtractedData[];
}

const ConfidenceSummary: React.FC<ConfidenceSummaryProps> = ({ data }) => {
  if (data.length === 0) return null;

  // Calculate average confidence across all fields and all documents
  const calculateAverageConfidence = () => {
    let total = 0;
    let count = 0;

    data.forEach(item => {
      total += item.customerName.confidence;
      total += item.refundAmount.confidence;
      total += item.ibanNumber.confidence;
      total += item.customerServiceNumber.confidence;
      count += 4;
    });

    return total / count;
  };

  const avgConfidence = calculateAverageConfidence();
  
  // Get chart color based on average confidence
  const getChartColor = () => {
    if (avgConfidence >= 85) return 'bg-green-500';
    if (avgConfidence >= 70) return 'bg-yellow-500';
    if (avgConfidence >= 55) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Get most common layout detected
  const getLayoutStats = () => {
    const layouts: { [key: string]: { count: number, confidence: number } } = {};
    
    data.forEach(item => {
      if (!layouts[item.detectedLayout]) {
        layouts[item.detectedLayout] = {
          count: 0,
          confidence: 0
        };
      }
      
      layouts[item.detectedLayout].count++;
      layouts[item.detectedLayout].confidence += item.layoutConfidence;
    });
    
    let dominantLayout = '';
    let maxCount = 0;
    
    for (const layout in layouts) {
      if (layouts[layout].count > maxCount) {
        maxCount = layouts[layout].count;
        dominantLayout = layout;
      }
      layouts[layout].confidence /= layouts[layout].count;
    }
    
    return {
      dominantLayout,
      layoutCount: Object.keys(layouts).length,
      layouts
    };
  };

  const layoutStats = getLayoutStats();

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-md font-medium text-gray-800 mb-1">Overall Confidence</h3>
          <div className="flex items-center">
            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
              <div 
                className={`h-2.5 rounded-full ${getChartColor()}`} 
                style={{ width: `${avgConfidence}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-700 min-w-[60px]">
              {avgConfidence.toFixed(1)}%
            </span>
          </div>
        </div>
        
        <div className="rounded-md bg-blue-50 p-2">
          <div className="flex items-start">
            <LayoutGrid className="text-blue-600 mt-0.5 mr-2" size={18} />
            <div>
              <h4 className="text-sm font-medium text-blue-800">Form Layout Detection</h4>
              <p className="text-xs text-blue-700 mb-1">
                {layoutStats.layoutCount > 1 
                  ? `${layoutStats.layoutCount} different layouts detected` 
                  : 'Consistent layout detected'}
              </p>
              <div className="flex items-center text-xs text-blue-600">
                <span className="font-medium mr-1">Dominant: </span>
                <span>{layoutStats.dominantLayout}</span>
                <span className="bg-blue-200 text-blue-800 rounded-full px-2 ml-2 text-xs">
                  {layoutStats.layouts[layoutStats.dominantLayout]?.confidence.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
        <div className="p-2 bg-gray-50 rounded-md">
          <span className="block font-medium text-sm text-gray-700">Customer Names</span>
          <span className="text-sm">{(data.reduce((acc, item) => acc + item.customerName.confidence, 0) / data.length).toFixed(1)}%</span>
        </div>
        <div className="p-2 bg-gray-50 rounded-md">
          <span className="block font-medium text-sm text-gray-700">Refund Amounts</span>
          <span className="text-sm">{(data.reduce((acc, item) => acc + item.refundAmount.confidence, 0) / data.length).toFixed(1)}%</span>
        </div>
        <div className="p-2 bg-gray-50 rounded-md">
          <span className="block font-medium text-sm text-gray-700">IBAN Numbers</span>
          <span className="text-sm">{(data.reduce((acc, item) => acc + item.ibanNumber.confidence, 0) / data.length).toFixed(1)}%</span>
        </div>
        <div className="p-2 bg-gray-50 rounded-md">
          <span className="block font-medium text-sm text-gray-700">Service Numbers</span>
          <span className="text-sm">{(data.reduce((acc, item) => acc + item.customerServiceNumber.confidence, 0) / data.length).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

export default ConfidenceSummary;