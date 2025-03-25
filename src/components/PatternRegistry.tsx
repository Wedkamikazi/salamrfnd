import React, { useState, useEffect } from 'react';
import { Database, ScrollText, Edit, Trash2, Plus, Save, X, Info, RefreshCw } from 'lucide-react';
import TrainingService from '../services/TrainingService';

interface Pattern {
  id?: number;
  fieldType: string;
  patternRegex: string;
  priority: number;
  successRate: number;
  usageCount: number;
  timestamp: string;
}

const PatternRegistry: React.FC = () => {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFieldType, setSelectedFieldType] = useState<string>('all');
  const [editingPattern, setEditingPattern] = useState<Pattern | null>(null);
  const [newPattern, setNewPattern] = useState<Omit<Pattern, 'id' | 'timestamp' | 'successRate' | 'usageCount'> | null>(null);
  
  const trainingService = TrainingService.getInstance();
  
  const fieldTypes = [
    { value: 'all', label: 'All Fields' },
    { value: 'customerName', label: 'Customer Name' },
    { value: 'refundAmount', label: 'Refund Amount' },
    { value: 'ibanNumber', label: 'IBAN Number' },
    { value: 'customerServiceNumber', label: 'Service Number' }
  ];
  
  // Load patterns
  const loadPatterns = async () => {
    try {
      setLoading(true);
      
      let fetchedPatterns: Pattern[];
      if (selectedFieldType === 'all') {
        fetchedPatterns = await trainingService.getExtractionPatterns();
      } else {
        fetchedPatterns = await trainingService.getExtractionPatterns(selectedFieldType);
      }
      
      setPatterns(fetchedPatterns);
      setError(null);
    } catch (err) {
      console.error("Error loading patterns:", err);
      setError("Failed to load patterns");
    } finally {
      setLoading(false);
    }
  };
  
  // Load patterns on component mount and when field type changes
  useEffect(() => {
    loadPatterns();
  }, [selectedFieldType]);
  
  // Start editing a pattern
  const handleEditPattern = (pattern: Pattern) => {
    setEditingPattern(pattern);
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setEditingPattern(null);
  };
  
  // Start creating a new pattern
  const handleCreateNew = () => {
    setNewPattern({
      fieldType: selectedFieldType === 'all' ? 'customerName' : selectedFieldType,
      patternRegex: '',
      priority: 5
    });
  };
  
  // Cancel creating new pattern
  const handleCancelNew = () => {
    setNewPattern(null);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Get success rate color
  const getSuccessRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-blue-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  // Safe pattern test
  const testPattern = (pattern: string, testString: string): boolean => {
    try {
      const regex = new RegExp(pattern, 'i');
      return regex.test(testString);
    } catch (error) {
      return false;
    }
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <p className="text-gray-600">Loading pattern registry...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium flex items-center">
          <Database className="mr-2 text-blue-600" size={20} />
          Pattern Registry
        </h3>
        
        <div className="flex space-x-2">
          <select
            value={selectedFieldType}
            onChange={(e) => setSelectedFieldType(e.target.value)}
            className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
          >
            {fieldTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          
          <button
            onClick={loadPatterns}
            className="p-2 text-gray-500 hover:text-gray-700"
            title="Refresh patterns"
          >
            <RefreshCw size={18} />
          </button>
          
          <button
            onClick={handleCreateNew}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md px-3 py-2 flex items-center"
            disabled={!!newPattern}
          >
            <Plus size={16} className="mr-1" />
            New Pattern
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md mb-4">
          <p className="flex items-center">
            <Info size={16} className="mr-2" />
            {error}
          </p>
        </div>
      )}
      
      {newPattern && (
        <div className="mb-6 border-b pb-6">
          <h4 className="text-md font-medium mb-3">Create New Pattern</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="new-field-type" className="block text-sm font-medium text-gray-700 mb-1">
                Field Type
              </label>
              <select
                id="new-field-type"
                value={newPattern.fieldType}
                onChange={(e) => setNewPattern({...newPattern, fieldType: e.target.value})}
                className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 w-full"
              >
                {fieldTypes.filter(t => t.value !== 'all').map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="new-priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority (1-10, lower is higher priority)
              </label>
              <input
                type="number"
                id="new-priority"
                min="1"
                max="10"
                value={newPattern.priority}
                onChange={(e) => setNewPattern({...newPattern, priority: parseInt(e.target.value)})}
                className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 w-full"
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="new-pattern" className="block text-sm font-medium text-gray-700 mb-1">
                Pattern Regex
              </label>
              <input
                type="text"
                id="new-pattern"
                value={newPattern.patternRegex}
                onChange={(e) => setNewPattern({...newPattern, patternRegex: e.target.value})}
                className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 w-full"
                placeholder="e.g., customer\\s*name\\s*:\\s*([A-Za-z\\s.'-]+)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use regular expressions with one capturing group () to extract the value.
              </p>
            </div>
            
            <div className="md:col-span-2 flex justify-end space-x-2 mt-2">
              <button
                onClick={handleCancelNew}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    // Validate pattern
                    if (!newPattern.patternRegex.trim()) {
                      alert('Pattern cannot be empty');
                      return;
                    }
                    
                    // Try to compile the regex to catch errors
                    try {
                      new RegExp(newPattern.patternRegex);
                    } catch (e) {
                      alert('Invalid regular expression');
                      return;
                    }
                    
                    // Add new pattern
                    await trainingService.getExtractionPatterns(); // Make sure DB is initialized
                    
                    const newPatternObj = {
                      fieldType: newPattern.fieldType,
                      patternRegex: newPattern.patternRegex,
                      priority: newPattern.priority,
                      successRate: 60, // Initial success rate
                      usageCount: 0,
                      timestamp: new Date().toISOString()
                    };
                    
                    // Add to database - get database reference from service
                    const db = trainingService.getDatabase();
                    await db.extractionPatterns.add(newPatternObj);
                    
                    // Reload patterns
                    await loadPatterns();
                    
                    // Reset new pattern
                    setNewPattern(null);
                  } catch (error) {
                    console.error('Error adding pattern:', error);
                    alert('Failed to add pattern');
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Add Pattern
              </button>
            </div>
          </div>
        </div>
      )}
      
      {patterns.length === 0 ? (
        <div className="text-center py-8 border rounded-lg">
          <ScrollText className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-600">No patterns found</p>
          <p className="text-sm text-gray-500 mb-3">Start by adding your first pattern or select a different field type</p>
          <button 
            onClick={handleCreateNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
          >
            Create First Pattern
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Field Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pattern
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uses
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {patterns.map((pattern) => (
                <tr key={pattern.id} className="hover:bg-gray-50">
                  {editingPattern && editingPattern.id === pattern.id ? (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={editingPattern.fieldType}
                          onChange={(e) => setEditingPattern({...editingPattern, fieldType: e.target.value})}
                          className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg p-1.5"
                        >
                          {fieldTypes.filter(t => t.value !== 'all').map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editingPattern.patternRegex}
                          onChange={(e) => setEditingPattern({...editingPattern, patternRegex: e.target.value})}
                          className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg p-1.5 w-full"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={editingPattern.priority}
                          onChange={(e) => setEditingPattern({...editingPattern, priority: parseInt(e.target.value)})}
                          className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg p-1.5 w-20"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getSuccessRateColor(editingPattern.successRate)}>
                          {editingPattern.successRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingPattern.usageCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(editingPattern.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X size={16} />
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                // Try to compile the regex to catch errors
                                try {
                                  new RegExp(editingPattern.patternRegex);
                                } catch (e) {
                                  alert('Invalid regular expression');
                                  return;
                                }
                                
                                // Update pattern using database reference
                                const db = trainingService.getDatabase();
                                
                                await db.extractionPatterns.update(editingPattern.id!, {
                                  fieldType: editingPattern.fieldType,
                                  patternRegex: editingPattern.patternRegex,
                                  priority: editingPattern.priority,
                                  timestamp: new Date().toISOString()
                                });
                                
                                // Reload pattern registry
                                await trainingService.initialize();
                                
                                // Reload patterns
                                await loadPatterns();
                                
                                // Clear editing state
                                setEditingPattern(null);
                              } catch (error) {
                                console.error('Error updating pattern:', error);
                                alert('Failed to update pattern');
                              }
                            }}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Save size={16} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {fieldTypes.find(t => t.value === pattern.fieldType)?.label || pattern.fieldType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-mono overflow-hidden text-ellipsis" style={{ maxWidth: '250px' }}>
                          {pattern.patternRegex}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {pattern.priority}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`${getSuccessRateColor(pattern.successRate)} font-medium`}>
                          {pattern.successRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {pattern.usageCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(pattern.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => handleEditPattern(pattern)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit pattern"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this pattern?')) {
                                try {
                                  const db = trainingService.getDatabase();
                                  await db.extractionPatterns.delete(pattern.id!);
                                  await trainingService.initialize(); // Reinitialize to update pattern registry
                                  await loadPatterns();
                                } catch (error) {
                                  console.error('Error deleting pattern:', error);
                                  alert('Failed to delete pattern');
                                }
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Delete pattern"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PatternRegistry;