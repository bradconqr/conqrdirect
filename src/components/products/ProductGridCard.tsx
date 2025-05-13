import React from 'react';
import { BookOpen, Download, Users, Video, ExternalLink, Link, Mail, Phone, MessageSquare } from 'lucide-react';
import { Product, ProductType } from '../../types';
import { Button } from '../ui/Button';

interface ProductGridCardProps {
  product: Product;
  onAdd?: (product: Product) => void;
  onView?: (product: Product) => void;
  showAddButton?: boolean;
}

export const ProductGridCard: React.FC<ProductGridCardProps> = ({
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
      case 'external_link':
        return <Link className={iconClass} />;
      case '1on1call':
        return <Phone className={iconClass} />;
      case 'lead_magnet':
        return <Mail className={iconClass} />;
      case 'ama':
        return <MessageSquare className={iconClass} />;
      default:
        return null;
    }
  };

  const formatProductType = (type: ProductType) => {
    if (type === 'external_link') return 'External Link';
    if (type === '1on1call') return '1:1 Call';
    if (type === 'lead_magnet') return 'Free Download';
    if (type === 'ama') return 'Ask Me Anything';
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
        <div className="flex items-center">
          <span className="text-lg font-semibold text-gray-900">{formattedDiscountPrice}</span>
          <span className="ml-2 text-sm text-gray-500 line-through">{formattedPrice}</span>
        </div>
      );
    }

    return <span className="text-lg font-semibold text-gray-900">{formattedPrice}</span>;
  };

  return (
    <div className="group relative flex flex-col h-full rounded-lg overflow-hidden transition-all duration-300 
      hover:scale-[1.03] hover:z-10 hover:shadow-[0_0_30px_rgba(128,0,255,0.3)] cursor-pointer card-glow-animation">
      {/* Card glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 
        bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-lg -z-10"></div>
      
      <div className="relative pt-[56.25%] bg-gray-900 overflow-hidden">
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
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
        
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-black/60 text-white backdrop-blur-sm shadow-sm">
            {formatProductType(product.type)}
          </span>
        </div>
        {product.featured && (
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/80 text-white backdrop-blur-sm">
              Featured
            </span>
          </div>
        )}
      </div>
      
      <div className="flex-grow flex flex-col p-4 bg-gradient-to-b from-gray-900 to-black text-white">
        <h3 className="mt-2 text-lg font-semibold line-clamp-2 group-hover:text-purple-300 transition-colors duration-300">{product.name}</h3>
        <p className="mt-1 text-sm text-gray-400 line-clamp-3">{product.description}</p>
        <div className="mt-4 flex items-center justify-between text-white">
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
          ) : product.type === 'ama' ? (
            <div className="text-sm font-medium text-purple-300">
              Paid Q&A Service
            </div>
          ) : (
            <div className="text-white">
              {formatPrice(product.price, product.discountPrice)}
            </div>
          )}
          <div className="flex items-center space-x-2">
            {getProductIcon(product.type)}
          </div>
        </div>
        
        {/* Button container with reveal animation */}
        {(onAdd || onView) && (
          <div className="mt-4 grid grid-cols-1 gap-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            {onView && (
              <Button 
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => onView(product)}
              >
                View Details
              </Button>
            )}
            {onAdd && showAddButton && product.type !== 'external_link' && product.type !== 'lead_magnet' && (
              <Button 
                variant="outline"
                className="bg-transparent border-white/30 text-white hover:bg-white/10"
                onClick={() => onAdd(product)}
              >
                Add to Cart
              </Button>
            )}
            {product.type === 'external_link' && product.targetUrl && (
              <Button 
                variant="outline"
                className="bg-transparent border-white/30 text-white hover:bg-white/10"
                onClick={() => window.open(product.targetUrl, '_blank', 'noopener,noreferrer')}
                leftIcon={<ExternalLink className="h-4 w-4" />}
              >
                {product.linkText || 'Visit Site'}
              </Button>
            )}
            {product.type === 'lead_magnet' && (
              <Button 
                variant="outline"
                className="bg-transparent border-white/30 text-white hover:bg-white/10"
                onClick={() => onView && onView(product)}
                leftIcon={<Download className="h-4 w-4" />}
              >
                Get Free
              </Button>
            )}
            {product.type === 'ama' && (
              <Button 
                variant="outline"
                className="bg-transparent border-white/30 text-white hover:bg-white/10"
                onClick={() => onAdd && onAdd(product)}
                leftIcon={<MessageSquare className="h-4 w-4" />}
              >
                Ask Question
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};