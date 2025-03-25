import React, { useState, useEffect } from 'react';
import { Search, File, Clock, Calendar, X } from 'lucide-react';
import Fuse from 'fuse.js';

interface Document {
  id: string;
  fileName: string;
  timestamp: string;
}

interface DocumentSearchProps {
  documents: Document[];
  onDocumentSelect: (id: string) => void;
}

const DocumentSearch: React.FC<DocumentSearchProps> = ({ documents, onDocumentSelect }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Document[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [fuse, setFuse] = useState<Fuse<Document> | null>(null);
  
  // Initialize fuzzy search
  useEffect(() => {
    const fuseInstance = new Fuse(documents, {
      keys: ['fileName'],
      threshold: 0.3,
      includeScore: true
    });
    
    setFuse(fuseInstance);
  }, [documents]);
  
  // Handle search
  useEffect(() => {
    if (!fuse || !searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    
    const results = fuse.search(searchTerm).map(result => result.item);
    setSearchResults(results);
  }, [searchTerm, fuse]);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    setShowResults(!!term.trim());
  };
  
  const handleDocumentClick = (id: string) => {
    onDocumentSelect(id);
    setSearchTerm('');
    setShowResults(false);
  };
  
  const handleClearSearch = () => {
    setSearchTerm('');
    setShowResults(false);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search documents..."
          className="w-full px-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        
        {searchTerm && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        )}
      </div>
      
      {showResults && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {searchResults.length > 0 ? (
            <ul className="py-2">
              {searchResults.map(doc => (
                <li 
                  key={doc.id}
                  onClick={() => handleDocumentClick(doc.id)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  <div className="flex items-start">
                    <File className="text-blue-500 mr-2 mt-0.5" size={16} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{doc.fileName}</p>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Calendar size={12} className="mr-1" />
                        <span className="mr-3">{formatDate(doc.timestamp)}</span>
                        <Clock size={12} className="mr-1" />
                        <span>{formatTime(doc.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm">
              No documents found matching "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentSearch;