import React, { useState, useEffect } from 'react';
import { TrendingUp, Check, BarChart, AlertTriangle, BookOpen, Brain, RefreshCw } from 'lucide-react';
import TrainingService from '../services/TrainingService';

interface LearningInsightsProps {
  refreshInterval?: number; // In milliseconds
}

const LearningInsights: React.FC<LearningInsightsProps> = ({ refreshInterval = 0 }) => {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const trainingService = TrainingService.getInstance();
  
  const loadInsights = async () => {
    try {
      setLoading(true);
      const data = await trainingService.generateInsights();
      setInsights(data);
      setError(null);
    } catch (err) {
      console.error("Error loading learning insights:", err);
      setError("Failed to load learning insights");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadInsights();
    
    // Set up refresh interval if specified
    let intervalId: number | undefined;
    if (refreshInterval > 0) {
      intervalId = window.setInterval(loadInsights, refreshInterval);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [refreshInterval]);
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="text-center p-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <p className="text-gray-600">Loading learning insights...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="text-center text-red-600">
          <AlertTriangle className="mx-auto mb-2" size={24} />
          <p>{error}</p>
          <button 
            onClick={loadInsights}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  if (!insights) {
    return null;
  }
  
  // Calculate colors based on improvement rate
  const getImprovementColor = () => {
    if (insights.improvementRate > 5) return 'text-green-600';
    if (insights.improvementRate > 0) return 'text-blue-600';
    if (insights.improvementRate > -5) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  // Calculate field correction percentages
  const totalFieldCorrections = Object.values(insights.fieldCorrections).reduce((a: any, b: any) => a + b, 0);
  
  const getFieldPercentage = (fieldCount: number) => {
    if (totalFieldCorrections === 0) return 0;
    return Math.round((fieldCount / totalFieldCorrections) * 100);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium flex items-center">
          <Brain className="mr-2 text-blue-600" size={20} />
          Learning System Insights
        </h3>
        <button 
          onClick={loadInsights}
          className="text-gray-500 hover:text-gray-700"
          title="Refresh data"
        >
          <RefreshCw size={16} />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-start mb-4">
            <div className="bg-blue-50 p-2 rounded-lg mr-3">
              <TrendingUp className="text-blue-600" size={20} />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-800">System Improvement</h4>
              <div className={`text-lg font-medium ${getImprovementColor()}`}>
                {insights.improvementRate > 0 ? '+' : ''}{insights.improvementRate.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-600">
                Based on {insights.totalCorrections} user corrections
              </p>
            </div>
          </div>
          
          <div className="flex items-start mb-4">
            <div className="bg-green-50 p-2 rounded-lg mr-3">
              <Check className="text-green-600" size={20} />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-800">Pattern Learning</h4>
              <p className="text-sm text-gray-600">
                {insights.recentPatterns.length} recently learned patterns
              </p>
              <div className="mt-1 text-xs">
                {insights.recentPatterns.slice(0, 2).map((pattern, idx) => (
                  <div key={idx} className="bg-gray-50 p-1 rounded mb-1 truncate max-w-xs">
                    <span className="text-blue-600">{pattern.fieldType}: </span>
                    <span className="text-gray-700">{pattern.patternRegex.substring(0, 25)}...</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center">
              <BarChart className="text-blue-600 mr-1" size={16} />
              Correction Distribution
            </h4>
            
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Customer Name</span>
                  <span>{getFieldPercentage(insights.fieldCorrections.customerName)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full" 
                    style={{ width: `${getFieldPercentage(insights.fieldCorrections.customerName)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Refund Amount</span>
                  <span>{getFieldPercentage(insights.fieldCorrections.refundAmount)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-green-600 h-1.5 rounded-full" 
                    style={{ width: `${getFieldPercentage(insights.fieldCorrections.refundAmount)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>IBAN Number</span>
                  <span>{getFieldPercentage(insights.fieldCorrections.ibanNumber)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-yellow-500 h-1.5 rounded-full" 
                    style={{ width: `${getFieldPercentage(insights.fieldCorrections.ibanNumber)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Service Number</span>
                  <span>{getFieldPercentage(insights.fieldCorrections.customerServiceNumber)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-purple-500 h-1.5 rounded-full" 
                    style={{ width: `${getFieldPercentage(insights.fieldCorrections.customerServiceNumber)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-md p-3 text-sm">
            <div className="flex items-start">
              <BookOpen className="text-blue-600 mr-2 mt-0.5" size={16} />
              <div>
                <h5 className="font-medium text-blue-800 mb-1">Top patterns to refine:</h5>
                <p className="text-blue-700">
                  {insights.problemFields.length > 0 
                    ? `Focus on ${insights.problemFields[0]} patterns for highest impact.` 
                    : 'No problematic patterns identified yet.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningInsights;