import React from 'react';
import { BookOpen, Download, Users, Video, ExternalLink, ShoppingCart, Link, Phone, Mail } from 'lucide-react';
import { Product, ProductType } from '../../types';
import { Button } from '../ui/Button';

interface ProductListCardProps {
  product: Product;
  onAdd?: (product: Product) => void;
  onView?: (product: Product) => void;
  showAddButton?: boolean;
}

export const ProductListCard: React.FC<ProductListCardProps> = ({
  product,
  onAdd,
  onView,
  showAddButton = true,
}) => {
  const getProductIcon = (type: ProductType) => {
    // All icons will use the same theme color class that will be overridden by CSS
    const iconClass = "h-5 w-5 text-purple-600";
    
    switch (type) {
      case 'download':
        return <Download className={iconClass} />;
      case 'course':
        return <BookOpen className={iconClass} />;
      case 'membership':
        return <Users className={iconClass} />;
      case 'webinar':
        return <Video className={iconClass} />;
      case '1on1call':
        return <Phone className={iconClass} />;
      case 'external_link':
        return <Link className={iconClass} />;
      case 'lead_magnet':
        return <Mail className={iconClass} />;
      case 'ama':
        return <MessageSquare className={iconClass} />;
      default:
        return null;
    }
  };

  const formatProductType = (type: ProductType) => {
    if (type === '1on1call') return '1:1 Call';
    if (type === 'external_link') return 'External Link';
    if (type === 'lead_magnet') return 'Free Download';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatPrice = (price: number, discountPrice?: number) => {
    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price / 100);

    if (discountPrice) {
      const formattedDiscountPrice = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(discountPrice / 100);
      
      return (
        <div>
          <span className="text-lg font-semibold text-gray-900">{formattedDiscountPrice}</span>
          <span className="ml-2 text-sm text-gray-500 line-through">{formattedPrice}</span>
        </div>
      );
    }

    return <span className="text-lg font-semibold text-gray-900">{formattedPrice}</span>;
  };

  return (
    <div className="group relative rounded-lg overflow-hidden transition-all duration-300 
      hover:scale-[1.02] hover:z-10 hover:shadow-[0_0_30px_rgba(128,0,255,0.3)] cursor-pointer card-glow-animation
      bg-gradient-to-b from-gray-900 to-black text-white">
      
      {/* Card glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 
        bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-lg -z-10"></div>
      
      <div className="flex flex-col sm:flex-row">
        <div className="relative sm:w-1/3 lg:w-1/4">
          <div className="pt-[56.25%] sm:h-full sm:pt-0 bg-gray-900 overflow-hidden">
            {product.thumbnail ? (
              <img
                src={product.thumbnail}
                alt={product.name}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 
                  group-hover:scale-110 group-hover:brightness-110"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-purple-700/50">
                <div className="p-6 rounded-full bg-black/30 backdrop-blur-sm shadow-lg group-hover:shadow-purple-500/30 transition-all duration-300">
                  {getProductIcon(product.type)}
                </div>
              </div>
            )}
          </div>
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
          
          <div className="absolute top-2 left-2 z-10">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-black/60 text-white backdrop-blur-sm shadow-sm">
              {formatProductType(product.type)}
            </span>
          </div>
          {product.featured && (
            <div className="absolute top-2 right-2 z-10">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/80 text-white backdrop-blur-sm">
                Featured
              </span>
            </div>
          )}
        </div>
        
        <div className="p-4 sm:p-6 flex-1 flex flex-col">
          <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors duration-300">{product.name}</h3>
          <p className="text-gray-400 text-sm mb-4 line-clamp-2">{product.description}</p>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-auto">
            <div className="mb-3 sm:mb-0">
              {product.type === 'external_link' ? (
                <div className="text-sm font-medium text-purple-300">
                  {product.linkType === 'affiliate' ? 'Affiliate Link' : 
                   product.linkType === 'subscription' ? 'Subscription Service' : 
                   'External Website'}
                </div>
              ) : product.type === 'lead_magnet' ? (
                <div className="text-sm font-medium text-purple-300">
                  Free Email Download
                </div>
              ) : (
                <div className="text-white">
                  {formatPrice(product.price, product.discountPrice)}
                </div>
              )}
            </div>
            
            {/* Button container with reveal animation */}
            <div className="flex space-x-2 w-full sm:w-auto opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
              {onView && (
                <Button 
                  variant="outline"
                  className="bg-transparent border-white/30 text-white hover:bg-white/10 flex-1 sm:flex-auto"
                  onClick={() => onView(product)}
                  leftIcon={<ExternalLink className="h-4 w-4" />}
                >
                  View Details
                </Button>
              )}
              
              {product.type === 'external_link' && product.targetUrl ? (
                <Button 
                  className="bg-purple-600 hover:bg-purple-700 text-white flex-1 sm:flex-auto"
                  onClick={() => window.open(product.targetUrl, '_blank', 'noopener,noreferrer')}
                  leftIcon={<ExternalLink className="h-4 w-4" />}
                >
                  {product.linkText || 'Visit Site'}
                </Button>
              ) : product.type === 'lead_magnet' ? (
                <Button 
                  className="bg-purple-600 hover:bg-purple-700 text-white flex-1 sm:flex-auto"
                  onClick={() => onView && onView(product)}
                  leftIcon={<Download className="h-4 w-4" />}
                >
                  Get Free
                </Button>
              ) : onAdd && showAddButton ? (
                <Button 
                  className="bg-purple-600 hover:bg-purple-700 text-white flex-1 sm:flex-auto"
                  onClick={() => onAdd(product)}
                  leftIcon={<ShoppingCart className="h-4 w-4" />}
                >
                  Add to Cart
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};