import React, { useState } from 'react';
import { Plus, X, File, Paperclip } from 'lucide-react';
import { Button } from '../ui/Button';
import { FileUploader } from './FileUploader';
import { formatFileSize } from '../../lib/fileStorage';

interface Resource {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: number;
}

interface ResourceUploaderProps {
  resources: Resource[];
  onAdd: (resource: Resource) => void;
  onRemove: (resourceId: string) => void;
}

export const ResourceUploader: React.FC<ResourceUploaderProps> = ({
  resources,
  onAdd,
  onRemove
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [resourceName, setResourceName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    if (!resourceName) {
      setResourceName(file.name.split('.')[0]);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
  };

  const handleAddResource = () => {
    if (!resourceName.trim()) {
      setError('Resource name is required');
      return;
    }

    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    // In a real implementation, you would upload the file to storage here
    // For this example, we'll simulate adding a resource with a local URL
    setIsUploading(true);
    
    // Simulate an upload delay
    setTimeout(() => {
      const newResource: Resource = {
        id: Date.now().toString(),
        name: resourceName.trim(),
        url: URL.createObjectURL(selectedFile), // This is temporary and would be replaced with the actual URL
        type: selectedFile.type,
        size: selectedFile.size
      };
      
      onAdd(newResource);
      
      // Reset the form
      setResourceName('');
      setSelectedFile(null);
      setIsAdding(false);
      setIsUploading(false);
      setError(null);
    }, 1000);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <img src={type} alt="Preview" className="h-8 w-8 object-cover rounded" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">Resources</h3>
        {!isAdding && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsAdding(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Resource
          </Button>
        )}
      </div>
      
      {isAdding ? (
        <div className="border rounded-lg p-4 space-y-4">
          <div>
            <label htmlFor="resourceName" className="block text-sm font-medium text-gray-700 mb-1">
              Resource Name
            </label>
            <input
              type="text"
              id="resourceName"
              value={resourceName}
              onChange={(e) => setResourceName(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="e.g., Workbook PDF, Design Template"
            />
          </div>
          
          <div>
            <label htmlFor="resourceFile" className="block text-sm font-medium text-gray-700 mb-1">
              Resource File
            </label>
            <FileUploader
              onFileSelected={handleFileSelected}
              onClear={clearFile}
              isUploading={isUploading}
            />
          </div>
          
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          
          <div className="flex justify-end space-x-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setResourceName('');
                setSelectedFile(null);
                setError(null);
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddResource}
              disabled={isUploading}
              isLoading={isUploading}
            >
              Add Resource
            </Button>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {resources.length === 0 ? (
            <li className="border border-dashed rounded-md p-4 text-center">
              <Paperclip className="h-6 w-6 mx-auto text-gray-400" />
              <p className="mt-1 text-sm text-gray-500">No resources added yet</p>
              <p className="text-xs text-gray-400">
                Add downloadable files, templates, or other resources for your customers
              </p>
            </li>
          ) : (
            resources.map((resource) => (
              <li key={resource.id} className="border rounded-md p-3 flex items-center justify-between">
                <div className="flex items-center">
                  {getFileIcon(resource.type)}
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">{resource.name}</p>
                    <p className="text-xs text-gray-500">
                      {resource.size ? formatFileSize(resource.size) : 'Unknown size'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(resource.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};