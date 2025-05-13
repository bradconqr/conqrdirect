import React, { useState, useRef } from 'react';
import { Upload, XCircle, Loader, Check, Video, FileText, Music, Globe, Image as ImageIcon, Film, BookOpen, FileQuestion } from 'lucide-react';
import { Button } from '../ui/Button';
import { formatFileSize } from '../../lib/fileStorage';

type MediaType = 'video' | 'audio' | 'pdf' | 'doc' | 'image' | 'iframe';

interface MediaUploaderProps {
  onFileSelected: (file: File, type: MediaType) => void;
  onIframeUrlSubmit?: (url: string) => void;
  onClear: () => void;
  accept?: string;
  maxSize?: number; // in MB
  currentFileName?: string;
  currentFileType?: MediaType;
  isUploading?: boolean;
  previewUrl?: string;
  mediaType?: MediaType;
  iframeUrl?: string;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  onFileSelected,
  onIframeUrlSubmit,
  onClear,
  accept = 'video/*,audio/*,image/*,application/pdf',
  maxSize = 500, // Default 500MB
  currentFileName,
  currentFileType,
  isUploading = false,
  previewUrl,
  mediaType,
  iframeUrl
}) => {
  const [step, setStep] = useState<'choose' | 'upload' | 'embed' | 'preview'>(
    currentFileName || previewUrl || iframeUrl ? 'preview' : 'choose'
  );
  const [selectedContentType, setSelectedContentType] = useState<MediaType | null>(currentFileType || null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [embeddedUrl, setEmbeddedUrl] = useState(iframeUrl || '');
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

  const detectFileType = (file: File): MediaType => {
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type.includes('image/')) return 'image';
    // Handle MS Office formats and other document types
    if (file.type.includes('word') || 
        file.type.includes('document') ||
        file.name.endsWith('.doc') || 
        file.name.endsWith('.docx')) {
      return 'doc';
    }
    // Default to document type if we can't determine
    return 'doc';
  };

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${maxSize}MB`);
      return false;
    }
    
    // Check if the file type is acceptable
    const type = detectFileType(file);
    if (!type) {
      setError('Unsupported file type');
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
      handleFileSelection(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileSelection(file);
    }
  };

  const handleFileSelection = (file: File) => {
    if (validateFile(file)) {
      const fileType = detectFileType(file);
      setSelectedFile(file);
      setSelectedContentType(fileType);
      setError(null);
      onFileSelected(file, fileType);
      setStep('preview');
    }
  };

  const handleButtonClick = (acceptTypes?: string) => {
    if (fileInputRef.current) {
      if (acceptTypes) {
        fileInputRef.current.accept = acceptTypes;
      }
      fileInputRef.current.click();
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setSelectedContentType(null);
    setEmbeddedUrl('');
    setStep('choose');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClear();
    setError(null);
  };

  const handleIframeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!embeddedUrl) {
      setError('Please enter a valid URL');
      return;
    }
    
    if (onIframeUrlSubmit) {
      onIframeUrlSubmit(embeddedUrl);
    }
    setError(null);
    setStep('preview');
  };

  const getMediaIcon = (type: MediaType | null, size = 'md') => {
    const sizeClasses = {
      sm: "h-5 w-5",
      md: "h-8 w-8",
      lg: "h-12 w-12"
    };
    const iconClass = sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.md;
    
    switch (type) {
      case 'video': return <Video className={`${iconClass} text-purple-600`} />;
      case 'audio': return <Music className={`${iconClass} text-green-600`} />;
      case 'pdf': return <FileText className={`${iconClass} text-red-600`} />;
      case 'doc': return <FileText className={`${iconClass} text-blue-600`} />;
      case 'image': return <ImageIcon className={`${iconClass} text-amber-600`} />;
      case 'iframe': return <Globe className={`${iconClass} text-cyan-600`} />;
      default: return <Upload className={`${iconClass} text-gray-400`} />;
    }
  };

  // Render media preview based on type
  const renderMediaPreview = () => {
    if (!previewUrl && !selectedFile && !embeddedUrl) return null;
    
    const displayUrl = previewUrl || (selectedFile ? URL.createObjectURL(selectedFile) : '');
    const type = selectedContentType || currentFileType;
    
    if (type === 'iframe' || embeddedUrl) {
      return (
        <div className="mt-3 border rounded-md overflow-hidden bg-gray-50 h-60">
          <iframe 
            src={embeddedUrl} 
            title="Embedded content"
            className="w-full h-full"
            allowFullScreen
          />
        </div>
      );
    }

    switch (type) {
      case 'video':
        return (
          <div className="mt-3 border rounded-md overflow-hidden bg-gray-50">
            <video 
              src={displayUrl} 
              controls 
              className="w-full max-h-60"
              preload="metadata"
            />
          </div>
        );
      case 'audio':
        return (
          <div className="mt-3 border rounded-md p-3 bg-gray-50">
            <audio 
              src={displayUrl} 
              controls 
              className="w-full"
            />
          </div>
        );
      case 'image':
        return (
          <div className="mt-3 border rounded-md overflow-hidden bg-gray-50">
            <img 
              src={displayUrl} 
              alt="Preview" 
              className="w-full max-h-60 object-contain"
            />
          </div>
        );
      case 'pdf':
        return (
          <div className="mt-3 border rounded-md overflow-hidden bg-gray-50 h-60">
            <iframe 
              src={`${displayUrl}#toolbar=0`}
              title="PDF Preview" 
              className="w-full h-full"
            />
          </div>
        );
      default:
        return (
          <div className="mt-3 border rounded-md p-3 bg-gray-50 flex items-center justify-center h-32">
            <div className="text-center">
              {getMediaIcon(type, 'md')}
              <p className="mt-2 text-sm text-gray-600">{currentFileName || 'File uploaded'}</p>
            </div>
          </div>
        );
    }
  };

  // Content type selection cards
  const contentTypeOptions = [
    { type: 'video' as MediaType, icon: <Film className="h-8 w-8 text-purple-600 mb-2" />, title: 'Video', description: 'Upload an MP4, MOV or WebM file', accepts: 'video/*' },
    { type: 'audio' as MediaType, icon: <Music className="h-8 w-8 text-green-600 mb-2" />, title: 'Audio', description: 'Upload an MP3 or WAV file', accepts: 'audio/*' },
    { type: 'pdf' as MediaType, icon: <FileText className="h-8 w-8 text-red-600 mb-2" />, title: 'PDF', description: 'Upload a PDF document', accepts: 'application/pdf' },
    { type: 'doc' as MediaType, icon: <BookOpen className="h-8 w-8 text-blue-600 mb-2" />, title: 'Document', description: 'Upload a document file', accepts: '.doc,.docx,.ppt,.pptx' },
    { type: 'image' as MediaType, icon: <ImageIcon className="h-8 w-8 text-amber-600 mb-2" />, title: 'Image', description: 'Upload a JPG, PNG or GIF image', accepts: 'image/*' },
    { type: 'iframe' as MediaType, icon: <Globe className="h-8 w-8 text-cyan-600 mb-2" />, title: 'Embed', description: 'Embed external content via URL', accepts: '' }
  ];

  // Render the appropriate step
  const renderStep = () => {
    if (isUploading) {
      return (
        <div className="border rounded-lg p-6">
          <div className="flex items-center">
            <Loader className="h-5 w-5 text-purple-500 animate-spin mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-700">Uploading...</p>
              <p className="text-xs text-gray-500">Please wait</p>
            </div>
          </div>
        </div>
      );
    }

    switch (step) {
      case 'choose':
        return (
          <div className="border rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Choose Content Type</h3>
            <p className="text-xs text-gray-500 mb-4">Select the type of content you want to add to this lesson</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {contentTypeOptions.map(option => (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => {
                    setSelectedContentType(option.type);
                    if (option.type === 'iframe') {
                      setStep('embed');
                    } else {
                      setStep('upload');
                      // Set the appropriate accept type for the file input
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = option.accepts;
                      }
                    }
                  }}
                  className="border rounded-lg p-4 text-center hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                >
                  {option.icon}
                  <h4 className="text-sm font-medium text-gray-900">{option.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                </button>
              ))}
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept={accept}
              className="hidden"
            />
          </div>
        );
      
      case 'upload':
        return (
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
            onClick={() => handleButtonClick()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept={selectedContentType === 'video' ? 'video/*' : 
                     selectedContentType === 'audio' ? 'audio/*' :
                     selectedContentType === 'pdf' ? 'application/pdf' :
                     selectedContentType === 'image' ? 'image/*' :
                     selectedContentType === 'doc' ? '.doc,.docx,.ppt,.pptx' : 
                     accept}
              className="hidden"
            />
            
            {getMediaIcon(selectedContentType, 'lg')}
            
            <p className="text-sm font-medium text-gray-700 mb-1 mt-3">
              {selectedContentType === 'video' ? 'Upload Video File' :
               selectedContentType === 'audio' ? 'Upload Audio File' :
               selectedContentType === 'pdf' ? 'Upload PDF Document' :
               selectedContentType === 'image' ? 'Upload Image' :
               selectedContentType === 'doc' ? 'Upload Document' :
               'Upload File'}
            </p>
            
            <p className="text-xs text-gray-500 mb-2">
              Drag and drop or click to browse
            </p>
            
            <p className="text-xs text-gray-400">
              {selectedContentType === 'video' ? 'MP4, WebM, or MOV file' :
               selectedContentType === 'audio' ? 'MP3 or WAV file' :
               selectedContentType === 'pdf' ? 'PDF document' :
               selectedContentType === 'image' ? 'JPG, PNG, or GIF image' :
               selectedContentType === 'doc' ? 'DOC, DOCX, PPT, or PPTX file' :
               `Maximum file size: ${maxSize}MB`}
            </p>
            
            <div className="mt-4">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setStep('choose')}
              >
                Back to Content Types
              </Button>
            </div>
          </div>
        );
      
      case 'embed':
        return (
          <div className="border rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Embed External Content</h3>
            
            <form onSubmit={handleIframeSubmit} className="space-y-4">
              <div>
                <label htmlFor="iframe-url" className="block text-sm font-medium text-gray-700 mb-1">
                  Content URL
                </label>
                <input
                  type="text"
                  id="iframe-url"
                  value={embeddedUrl}
                  onChange={(e) => setEmbeddedUrl(e.target.value)}
                  placeholder="https://www.youtube.com/embed/..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter a URL for the content you want to embed
                </p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="text-xs font-medium text-gray-700 mb-2">Supported content types:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• YouTube videos (use the embed URL)</li>
                  <li>• Vimeo videos (use the embed URL)</li>
                  <li>• Google Slides presentations</li>
                  <li>• Other iframe-compatible content</li>
                </ul>
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setStep('choose')}
                >
                  Back
                </Button>
                
                <Button type="submit">
                  Embed Content
                </Button>
              </div>
            </form>
          </div>
        );
      
      case 'preview':
        return (
          <div className="border rounded-lg p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded bg-purple-100 flex items-center justify-center">
                  {getMediaIcon(selectedContentType || currentFileType || null)}
                </div>
                
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">
                    {selectedFile ? selectedFile.name : currentFileName || 'Content Added'}
                  </p>
                  
                  {selectedFile && (
                    <p className="text-xs text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  )}
                  
                  {(selectedContentType || currentFileType) && (
                    <p className="text-xs text-gray-500">
                      Type: {selectedContentType || currentFileType}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex">
                <button
                  type="button"
                  onClick={handleClearFile}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {renderMediaPreview()}
            
            <div className="mt-4 flex justify-end">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setStep('choose')}
              >
                Change Content Type
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full space-y-4">
      {renderStep()}
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {step !== 'preview' && (
        <div className="mt-2 text-xs text-gray-500">
          <p className="font-medium mb-1">Tips for adding content:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Videos should be in MP4, WebM, or MOV format for best compatibility</li>
            <li>For YouTube or Vimeo content, use the Embed option with their embed URL</li>
            <li>PDF documents can be viewed directly in the lesson</li>
            <li>Keep files under {maxSize}MB for better performance</li>
          </ul>
        </div>
      )}
    </div>
  );
};