import React, { useState, useRef } from 'react';
import { Upload, XCircle, Loader, Check, File, Download, Image as ImageIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { formatFileSize } from '../../lib/fileStorage';

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
  onClear: () => void;
  accept?: string;
  maxSize?: number; // in MB
  currentFileName?: string;
  isUploading?: boolean;
  isImage?: boolean;
  imagePreviewUrl?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelected,
  onClear,
  accept = '*/*',
  maxSize = 5120, // Default 5GB (5120MB)
  currentFileName,
  isUploading = false,
  isImage = false,
  imagePreviewUrl
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    // Check file type if accept is specified
    if (accept !== '*/*') {
      const fileType = file.type;
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      const acceptableTypes = accept.split(',');
      
      // Check if the file type or extension matches any of the acceptable types
      const isAcceptableType = acceptableTypes.some(type => {
        // Handle wildcards like 'image/*'
        if (type.endsWith('/*')) {
          const category = type.split('/')[0];
          return fileType.startsWith(`${category}/`);
        }
        
        // Handle file extensions like '.pdf'
        if (type.startsWith('.')) {
          return `.${fileExtension}` === type;
        }
        
        // Check exact mime type match
        return type === fileType;
      });

      if (!isAcceptableType) {
        setError(`File type not accepted. Please upload ${accept}`);
        return false;
      }
    }
    
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${maxSize}MB`);
      return false;
    }
    
    return true;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        setError(null);
        onFileSelected(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        setError(null);
        onFileSelected(file);
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClear();
    setError(null);
  };

  return (
    <div className="w-full">
      {!selectedFile && !currentFileName && !isUploading ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            dragActive
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={accept}
            className="hidden"
          />
          
          <Upload className="h-8 w-8 text-gray-400 mb-2" />
          
          <p className="text-sm font-medium text-gray-700 mb-1">
            {isImage ? 'Drag and drop an image here' : 'Drag and drop a file here'}
          </p>
          
          <p className="text-xs text-gray-500 mb-2">
            or click to browse
          </p>
          
          <p className="text-xs text-gray-400">
            {isImage 
              ? 'PNG, JPG or GIF up to 10MB' 
              : `Maximum file size: ${maxSize}MB`}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          {isUploading ? (
            <div className="flex items-center">
              <Loader className="h-5 w-5 text-purple-500 animate-spin mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-700">Uploading...</p>
                <p className="text-xs text-gray-500">Please wait</p>
              </div>
            </div>
          ) : (
            <>
              {isImage && imagePreviewUrl ? (
                <div className="space-y-3">
                  <div className="w-full h-40 overflow-hidden rounded-md bg-gray-100 relative">
                    <img
                      src={imagePreviewUrl} 
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleClearFile}
                      className="absolute top-2 right-2 rounded-full bg-white p-1 shadow-sm"
                    >
                      <XCircle className="h-5 w-5 text-red-500" />
                    </button>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <ImageIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="truncate flex-1">
                      {selectedFile ? selectedFile.name : currentFileName || 'Image'}
                    </span>
                    {selectedFile && <span className="ml-2">{formatFileSize(selectedFile.size)}</span>}
                  </div>
                </div>
              ) : (
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded bg-purple-100 flex items-center justify-center">
                      <File className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                  
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {selectedFile ? selectedFile.name : currentFileName || 'File uploaded'}
                        </p>
                        
                        {selectedFile && (
                          <p className="text-xs text-gray-500">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        )}
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleClearFile}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div className="mt-2 flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-xs text-green-600">File ready to upload</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      
      <div className="mt-2 flex justify-between">
        <div className="text-xs text-gray-500">
          {isImage 
            ? 'Recommended size: 1200x800 pixels' 
            : 'Accepted formats depend on product type'}
        </div>
        {!selectedFile && !currentFileName && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleButtonClick} 
            leftIcon={<Upload className="h-4 w-4" />}
          >
            {isImage ? 'Upload Image' : 'Upload File'}
          </Button>
        )}
      </div>
    </div>
  );
};