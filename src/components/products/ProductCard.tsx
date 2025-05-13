import React from 'react';
import { BookOpen, Download, Users, Video, ExternalLink, Link as LinkIcon, Mail, Phone, MessageSquare, Star, Heart } from 'lucide-react';
import { Product, ProductType } from '../../types';
import { Button } from '../ui/Button';

interface ProductCardProps {
  product: Product;
  onAdd?: (product: Product) => void;
  onView?: (product: Product) => void;
  showAddButton?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
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
        return <LinkIcon className={iconClass} />;
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
          <span className="text-lg font-semibold text-white">{formattedDiscountPrice}</span>
          <span className="ml-2 text-sm text-gray-400 line-through">{formattedPrice}</span>
        </div>
      );
    }

    return <span className="text-lg font-semibold text-white">{formattedPrice}</span>;
  };
  
  const handleCardClick = () => {
    if (onView) {
      onView(product);
    }
  };
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAdd) {
      onAdd(product);
    }
  };
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Favorite functionality would go here
    console.log('Favorite clicked for product:', product.id);
  };

  return (
    <div
      className="group relative flex flex-col h-full rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300
      hover:translate-y-[-8px] hover:z-10 cursor-pointer bg-gray-900 border border-gray-800 card-dark card-glow-animation"
      onClick={handleCardClick}
    >
      {/* Favorite button */}
      <button 
        className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/60 backdrop-blur-sm shadow-sm 
        hover:bg-black/80 transition-colors duration-200 group/fav text-purple-500"
        onClick={handleFavoriteClick}
      >
        <Heart className="h-5 w-5 text-purple-500 group-hover/fav:text-purple-300 
          transition-colors duration-200 group-hover/fav:scale-110 transform" />
      </button>
      
      <div className="relative aspect-[4/3] overflow-hidden">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 
              group-hover:scale-110 group-hover:filter group-hover:brightness-110"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-black">
            <div className="p-6 rounded-full bg-black/60 shadow-lg transition-all duration-300">
              {getProductIcon(product.type)}
            </div>
          </div>
        )}
        
        {/* Product type badge */}
        <div className="absolute top-3 left-3 z-10 transition-transform duration-300 group-hover:translate-y-[-3px]">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-black/70 shadow-md text-white">
            {formatProductType(product.type)}
          </span>
        </div>
        
        {product.featured && (
          <div className="absolute bottom-3 left-3 z-10 transition-transform duration-300 group-hover:translate-y-[-3px]">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-amber-500 to-pink-500 text-white shadow-md">
              Featured
            </span>
          </div>
        )}
      </div>
      
      <div className="flex-grow flex flex-col p-5 bg-gray-900 text-white card-dark-gradient">
        {/* Rating */}
        <div className="flex items-center mb-1">
          <Star className="h-4 w-4 text-amber-500 mr-1 fill-current" />
          <span className="text-sm font-medium">4.9</span>
          <span className="mx-1 text-gray-500">·</span>
          <span className="text-sm text-gray-400">
            {product.type === 'course' ? 'Course' : 
             product.type === 'membership' ? 'Membership' : 
             product.type === 'download' ? 'Digital Product' : 
             'Product'}
          </span>
        </div>
        
        <h3 className="text-base font-medium line-clamp-1 group-hover:text-purple-700 transition-colors duration-300">{product.name}</h3>
        <p className="mt-1 text-sm text-gray-400 line-clamp-2">{product.description}</p>
        
        <div className="mt-auto pt-4 flex items-center justify-between">
          {product.type === 'external_link' ? (
            <div className="text-sm font-medium text-gray-300">
              {product.linkType === 'affiliate' ? 'Affiliate Link' : 
               product.linkType === 'subscription' ? 'Subscription Service' : 
               'External Website'}
            </div>
          ) : product.type === 'lead_magnet' ? (
            <div className="text-sm font-medium text-gray-300">
              Free Email Download
            </div>
          ) : product.type === 'ama' ? (
            <div className="text-sm font-medium text-gray-300">
              Paid Q&A Service
            </div>
          ) : (
            <div className="text-white">
              {formatPrice(product.price, product.discountPrice)}
            </div>
          )}
        </div>
        
        {/* Button container with reveal animation */}
        <div className="absolute inset-x-0 bottom-0 p-5 pt-20 opacity-0 group-hover:opacity-100 transition-all duration-300 
          bg-gradient-to-t from-black via-gray-900/95 to-transparent translate-y-1/2 group-hover:translate-y-0">
          <div className="grid grid-cols-1 gap-2">
            <Button 
              className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white
                shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
              onClick={() => onView && onView(product)}
            >
              View Details
            </Button>
            {product.type === 'external_link' ? (
              <Button 
                variant="outline"
                className="w-full border-purple-600 text-purple-300 hover:bg-purple-900/30 transition-all duration-300"
                onClick={() => {
                  if (product.targetUrl) {
                    window.open(product.targetUrl, '_blank', 'noopener,noreferrer');
                  } else if (onView) {
                    onView(product);
                  }
                }}
                leftIcon={<ExternalLink className="h-4 w-4" />}
              >
                {product.linkText || 'Visit Site'}
              </Button>
            ) : product.type === 'lead_magnet' ? (
              <Button 
                variant="outline"
                className="w-full border-purple-600 text-purple-300 hover:bg-purple-900/30 transition-all duration-300"
                onClick={() => onView && onView(product)}
                leftIcon={<Download className="h-4 w-4" />}
              >
                Get Free
              </Button>
            ) : showAddButton && (
              <Button 
                variant="outline"
                className="w-full border-purple-600 text-purple-300 hover:bg-purple-900/30 transition-all duration-300"
                onClick={handleAddToCart}
              >
                Add to Cart
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 
        transition-opacity duration-300 bg-gradient-to-t from-purple-900/30 to-transparent"></div>
    </div>
  );
};