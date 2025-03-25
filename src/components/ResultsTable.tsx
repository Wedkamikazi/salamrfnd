import React from 'react';
import { ExtractedData } from '../types';
import ConfidenceIndicator from './ConfidenceIndicator';
import { FileCheck, AlertCircle, Copy, LayoutGrid, Edit2 } from 'lucide-react';

interface ResultsTableProps {
  data: ExtractedData[];
  onCopyData: (data: ExtractedData) => void;
  onQuickFix?: (documentId: string) => void;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ data, onCopyData, onQuickFix }) => {
  if (data.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-gray-500">
        <AlertCircle className="mx-auto text-gray-300 mb-3" size={48} />
        <p className="text-lg mb-1">No results available</p>
        <p className="text-sm">Upload and process documents to see extracted information</p>
      </div>
    );
  }

  // Helper to find items with low confidence
  const hasLowConfidence = (item: ExtractedData): boolean => {
    return (
      item.customerName.confidence < 75 ||
      item.refundAmount.confidence < 75 ||
      item.ibanNumber.confidence < 75 ||
      item.customerServiceNumber.confidence < 75
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              File Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Refund Amount
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              IBAN Number
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer Service #
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Layout
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {item.fileName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-900">{item.customerName.value}</span>
                  <ConfidenceIndicator confidence={item.customerName.confidence} />
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-900">{item.refundAmount.value}</span>
                  <ConfidenceIndicator confidence={item.refundAmount.confidence} />
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-900">{item.ibanNumber.value}</span>
                  <ConfidenceIndicator confidence={item.ibanNumber.confidence} />
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-900">{item.customerServiceNumber.value}</span>
                  <ConfidenceIndicator confidence={item.customerServiceNumber.confidence} />
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <LayoutGrid size={14} className="text-blue-500 mr-1.5" />
                  <div>
                    <span className="text-xs font-medium block text-blue-600">{item.detectedLayout}</span>
                    <span className="text-xs text-gray-500">{item.layoutConfidence.toFixed(0)}% match</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className="flex space-x-3">
                  <button 
                    onClick={() => onCopyData(item)}
                    className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                    title="Copy data to clipboard"
                  >
                    <Copy size={16} className="mr-1" />
                    Copy
                  </button>
                  
                  <button 
                    onClick={() => onQuickFix && onQuickFix(item.id)}
                    className="text-orange-600 hover:text-orange-800 inline-flex items-center"
                    title="Quick fix extraction errors"
                  >
                    <Edit2 size={16} className="mr-1" />
                    {hasLowConfidence(item) ? (
                      <span className="relative flex h-2 w-2 mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                      </span>
                    ) : null}
                    Quick Fix
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;