import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { FileUploader } from './FileUploader';
import { Package, Tag, Truck, DollarSign, BarChart, Ruler, ShoppingBag, AlertCircle } from 'lucide-react';

interface PhysicalProductSettingsProps {
  sku: string;
  onSkuChange: (value: string) => void;
  brand: string;
  onBrandChange: (value: string) => void;
  weight: number;
  onWeightChange: (value: number) => void;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  onDimensionsChange: (dimensions: { length: number; width: number; height: number }) => void;
  inventory: number;
  onInventoryChange: (value: number) => void;
  lowStockThreshold: number;
  onLowStockThresholdChange: (value: number) => void;
  shippingWeight: number;
  onShippingWeightChange: (value: number) => void;
  shippingDimensions: {
    length: number;
    width: number;
    height: number;
  };
  onShippingDimensionsChange: (dimensions: { length: number; width: number; height: number }) => void;
  shippingClass: string;
  onShippingClassChange: (value: string) => void;
  freeShipping: boolean;
  onFreeShippingChange: (value: boolean) => void;
  handlingTime: number;
  onHandlingTimeChange: (value: number) => void;
  additionalImages: string[];
  onAdditionalImagesChange: (images: string[]) => void;
}

export const PhysicalProductSettings: React.FC<PhysicalProductSettingsProps> = ({
  sku,
  onSkuChange,
  brand,
  onBrandChange,
  weight,
  onWeightChange,
  dimensions,
  onDimensionsChange,
  inventory,
  onInventoryChange,
  lowStockThreshold,
  onLowStockThresholdChange,
  shippingWeight,
  onShippingWeightChange,
  shippingDimensions,
  onShippingDimensionsChange,
  shippingClass,
  onShippingClassChange,
  freeShipping,
  onFreeShippingChange,
  handlingTime,
  onHandlingTimeChange,
  additionalImages,
  onAdditionalImagesChange
}) => {
  const [currentImage, setCurrentImage] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');

  const handleDimensionChange = (field: 'length' | 'width' | 'height', value: number) => {
    onDimensionsChange({
      ...dimensions,
      [field]: value
    });
  };

  const handleShippingDimensionChange = (field: 'length' | 'width' | 'height', value: number) => {
    onShippingDimensionsChange({
      ...shippingDimensions,
      [field]: value
    });
  };

  const handleImageUpload = (file: File) => {
    setCurrentImage(file);
    // In a real implementation, you would upload the file to storage
    // and get back a URL. For now, we'll create a temporary URL.
    const imageUrl = URL.createObjectURL(file);
    setCurrentImageUrl(imageUrl);
  };

  const addImageToGallery = () => {
    if (currentImageUrl) {
      onAdditionalImagesChange([...additionalImages, currentImageUrl]);
      setCurrentImage(null);
      setCurrentImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...additionalImages];
    newImages.splice(index, 1);
    onAdditionalImagesChange(newImages);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Physical Product Details</h3>
        
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                  SKU/Product ID*
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tag className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="sku"
                    value={sku}
                    onChange={(e) => onSkuChange(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    placeholder="SKU123"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Unique identifier for your product
                </p>
              </div>
              
              <div>
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  id="brand"
                  value={brand}
                  onChange={(e) => onBrandChange(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="Your Brand"
                />
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Product Dimensions & Weight*</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="weight" className="block text-xs text-gray-500 mb-1">
                    Weight (oz)
                  </label>
                  <input
                    type="number"
                    id="weight"
                    value={weight || ''}
                    onChange={(e) => onWeightChange(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.1"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="length" className="block text-xs text-gray-500 mb-1">
                    Length (in)
                  </label>
                  <input
                    type="number"
                    id="length"
                    value={dimensions.length || ''}
                    onChange={(e) => handleDimensionChange('length', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.1"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="width" className="block text-xs text-gray-500 mb-1">
                    Width (in)
                  </label>
                  <input
                    type="number"
                    id="width"
                    value={dimensions.width || ''}
                    onChange={(e) => handleDimensionChange('width', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.1"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="height" className="block text-xs text-gray-500 mb-1">
                    Height (in)
                  </label>
                  <input
                    type="number"
                    id="height"
                    value={dimensions.height || ''}
                    onChange={(e) => handleDimensionChange('height', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.1"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="inventory" className="block text-sm font-medium text-gray-700 mb-1">
                  Inventory Quantity*
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Package className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="inventory"
                    value={inventory || ''}
                    onChange={(e) => onInventoryChange(parseInt(e.target.value) || 0)}
                    min="0"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700 mb-1">
                  Low Stock Alert Threshold
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <AlertCircle className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="lowStockThreshold"
                    value={lowStockThreshold || ''}
                    onChange={(e) => onLowStockThresholdChange(parseInt(e.target.value) || 0)}
                    min="0"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Get notified when inventory falls below this number
                </p>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Shipping Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="shippingWeight" className="block text-xs text-gray-500 mb-1">
                    Shipping Weight (oz)*
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Truck className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      id="shippingWeight"
                      value={shippingWeight || ''}
                      onChange={(e) => onShippingWeightChange(parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.1"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="handlingTime" className="block text-xs text-gray-500 mb-1">
                    Handling Time (days)
                  </label>
                  <input
                    type="number"
                    id="handlingTime"
                    value={handlingTime || ''}
                    onChange={(e) => onHandlingTimeChange(parseInt(e.target.value) || 0)}
                    min="0"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Days needed to prepare the product for shipping
                  </p>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="shippingLength" className="block text-xs text-gray-500 mb-1">
                    Package Length (in)
                  </label>
                  <input
                    type="number"
                    id="shippingLength"
                    value={shippingDimensions.length || ''}
                    onChange={(e) => handleShippingDimensionChange('length', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.1"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="shippingWidth" className="block text-xs text-gray-500 mb-1">
                    Package Width (in)
                  </label>
                  <input
                    type="number"
                    id="shippingWidth"
                    value={shippingDimensions.width || ''}
                    onChange={(e) => handleShippingDimensionChange('width', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.1"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="shippingHeight" className="block text-xs text-gray-500 mb-1">
                    Package Height (in)
                  </label>
                  <input
                    type="number"
                    id="shippingHeight"
                    value={shippingDimensions.height || ''}
                    onChange={(e) => handleShippingDimensionChange('height', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.1"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="shippingClass" className="block text-xs text-gray-500 mb-1">
                    Shipping Class
                  </label>
                  <select
                    id="shippingClass"
                    value={shippingClass}
                    onChange={(e) => onShippingClassChange(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  >
                    <option value="">Select a class</option>
                    <option value="standard">Standard</option>
                    <option value="expedited">Expedited</option>
                    <option value="overnight">Overnight</option>
                    <option value="international">International</option>
                    <option value="bulky">Bulky</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="freeShipping"
                      name="freeShipping"
                      type="checkbox"
                      checked={freeShipping}
                      onChange={(e) => onFreeShippingChange(e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="freeShipping" className="font-medium text-gray-700">Free Shipping</label>
                    <p className="text-gray-500">Offer free shipping for this product</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Product Images</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FileUploader
                    onFileSelected={handleImageUpload}
                    onClear={() => {
                      setCurrentImage(null);
                      setCurrentImageUrl('');
                    }}
                    accept="image/*"
                    maxSize={5}
                    currentFileName={currentImage?.name}
                    isImage={true}
                    imagePreviewUrl={currentImageUrl}
                  />
                  {currentImageUrl && (
                    <button
                      type="button"
                      onClick={addImageToGallery}
                      className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      Add to Gallery
                    </button>
                  )}
                </div>
                
                <div>
                  <div className="border rounded-md p-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Image Gallery</h5>
                    {additionalImages.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {additionalImages.map((image, index) => (
                          <div key={index} className="relative">
                            <img 
                              src={image} 
                              alt={`Product image ${index + 1}`} 
                              className="h-20 w-full object-cover rounded-md"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-sm"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center">No additional images added yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 flex items-center mb-2">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Physical Product Tips
          </h4>
          <ul className="text-sm text-blue-700 space-y-1 list-disc pl-5">
            <li>Accurate dimensions and weight are crucial for correct shipping calculations</li>
            <li>Keep your inventory updated to avoid overselling products</li>
            <li>High-quality product images from multiple angles help increase sales</li>
            <li>Set a low stock threshold to get notified when it's time to restock</li>
            <li>Consider offering free shipping as an incentive for customers</li>
          </ul>
        </div>
      </div>
    </div>
  );
};