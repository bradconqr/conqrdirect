// Stripe product configuration
export const products = {
  // Enterprise Package
  enterprise: {
    id: 'prod_SIzYJkHCZkpKEC',
    priceId: 'price_1RONZoPxt4iTvCogJ8DdA4IG',
    name: 'Enterprise Package',
    description: 'For established businesses and power users - Unlimited everything - Custom reporting - Dedicated support - Unlimited bandwidth - Custom domain - Affiliate program',
    price: 19900, // $199.00 in cents
    mode: 'subscription' as const
  },
  // Professional Package
  professional: {
    id: 'prod_SIzYuYW0t6WnsQ',
    priceId: 'price_1RONYyPxt4iTvCog3dFiZYa3',
    name: 'Professional Package',
    description: 'For growing creators and businesses - Unlimited digital products - Advanced analytics - Priority support - 2 TB bandwidth - Custom domain - Affiliate program',
    price: 7900, // $79.00 in cents
    mode: 'subscription' as const
  },
  // Starter Package
  starter: {
    id: 'prod_SIzWn1uMI8LM8h',
    priceId: 'price_1RONXUPxt4iTvCogaHEffHjp',
    name: 'Starter Package',
    description: 'Perfect for creators just getting started - 5 digital products - Basic analytics - Email support - 500 GB bandwidth - Custom domain - Affiliate program',
    price: 2900, // $29.00 in cents
    mode: 'subscription' as const
  }
};

// Get product by ID
export const getProductById = (id: string) => {
  return Object.values(products).find(product => product.id === id);
};

// Get product by price ID
export const getProductByPriceId = (priceId: string) => {
  return Object.values(products).find(product => product.priceId === priceId);
};

// Format price for display
export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price / 100);
};