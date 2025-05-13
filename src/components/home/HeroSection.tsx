import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
  ctaText?: string;
  onCtaClick?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title = "Direct to Consumer Solutions",
  subtitle = "Discover unique digital products from CONQR Direct",
  backgroundImage = "https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  ctaText = "Explore products",
  onCtaClick,
}) => {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={backgroundImage}
          alt="Hero background"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/90 via-purple-900/80 to-purple-800/70 mix-blend-multiply" />
      </div>
      <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mt-6 text-xl text-purple-100 max-w-xl">
            {subtitle}
          </p>
          <div className="mt-10">
            <Button 
              size="lg" 
              onClick={onCtaClick}
              rightIcon={<ArrowRight className="h-5 w-5" />}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
            >
              {ctaText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};