import React from 'react';

interface ConfidenceIndicatorProps {
  confidence: number;
  showText?: boolean;
}

const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({ 
  confidence, 
  showText = true 
}) => {
  // Get the appropriate color based on confidence level
  const getColor = (confidence: number): string => {
    if (confidence >= 95) return 'bg-green-500';
    if (confidence >= 85) return 'bg-green-400';
    if (confidence >= 75) return 'bg-yellow-400';
    if (confidence >= 65) return 'bg-yellow-500';
    if (confidence >= 55) return 'bg-orange-400';
    return 'bg-red-500';
  };

  // Get a text descriptor for the confidence level
  const getConfidenceText = (confidence: number): string => {
    if (confidence >= 95) return 'Very High';
    if (confidence >= 85) return 'High';
    if (confidence >= 75) return 'Good';
    if (confidence >= 65) return 'Moderate';
    if (confidence >= 55) return 'Low';
    return 'Very Low';
  };
  
  // Get text color appropriate for each confidence level
  const getTextColor = (confidence: number): string => {
    if (confidence >= 75) return 'text-green-700';
    if (confidence >= 65) return 'text-yellow-700';
    if (confidence >= 55) return 'text-orange-700';
    return 'text-red-700';
  };

  // Determine the pattern for colorblind accessibility
  const getPattern = (confidence: number): string => {
    if (confidence >= 95) return 'after:content-["✓✓"]';
    if (confidence >= 85) return 'after:content-["✓"]';
    if (confidence >= 75) return '';
    if (confidence >= 55) return 'after:content-["!"]';
    return 'after:content-["!!"]';
  };

  return (
    <div className="flex items-center">
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full ${getColor(confidence)} mr-2 relative ${getPattern(confidence)} after:absolute after:text-xs after:text-white after:font-bold after:right-0 after:top-0.5`}></div>
        {showText && (
          <span className={`text-sm font-medium ${getTextColor(confidence)}`}>
            {confidence.toFixed(1)}% - {getConfidenceText(confidence)}
          </span>
        )}
      </div>
    </div>
  );
};

export default ConfidenceIndicator;