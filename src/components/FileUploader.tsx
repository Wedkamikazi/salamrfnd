import React, { useRef } from 'react';
import { Upload, File as FileIcon } from 'lucide-react';

interface FileUploaderProps {
  onFilesSelected: (files: FileList) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div>
      <div 
        className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center cursor-pointer hover:bg-blue-50 transition-colors"
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <Upload className="mx-auto text-blue-500 mb-3" size={38} />
        <p className="text-lg mb-1 font-medium text-gray-700">Click or drag files to upload</p>
        <p className="text-sm text-gray-500">Supports Word (.docx), PDF (.pdf), and Images (.jpg, .png)</p>
        
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          <div className="flex items-center bg-blue-50 rounded-md p-2">
            <FileIcon size={16} className="text-blue-500 mr-2" />
            <span className="text-xs text-blue-700">DOCX</span>
          </div>
          <div className="flex items-center bg-red-50 rounded-md p-2">
            <FileIcon size={16} className="text-red-500 mr-2" />
            <span className="text-xs text-red-700">PDF</span>
          </div>
          <div className="flex items-center bg-green-50 rounded-md p-2">
            <FileIcon size={16} className="text-green-500 mr-2" />
            <span className="text-xs text-green-700">Images</span>
          </div>
        </div>
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept=".docx,.pdf,.jpg,.jpeg,.png" 
        multiple
      />
    </div>
  );
};

export default FileUploader;