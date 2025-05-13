import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Shield, Globe, Users, ChevronRight, Check, X, Menu, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const TronHomePage: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="tron-header fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <Zap className="h-8 w-8 text-[#4de2ff]" />
                <span className="ml-2 text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text tracking-wider">CONQR DIRECT</span>
              </Link>
            </div>
            
            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/features" className="text-white hover:text-[#4de2ff] transition-colors">Features</Link>
              <Link to="/pricing" className="text-white hover:text-[#4de2ff] transition-colors">Pricing</Link>
              <Link to="/about" className="text-white hover:text-[#4de2ff] transition-colors">About</Link>
              <Link to="/contact" className="text-white hover:text-[#4de2ff] transition-colors">Contact</Link>
            </nav>
            
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/auth" className="text-white hover:text-[#4de2ff] transition-colors">
                Log in
              </Link>
              <Link to="/signup">
                <button className="tron-button px-4 py-2 rounded">
                  Sign up
                </button>
              </Link>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white hover:text-[#4de2ff]"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black border-t border-[#4de2ff] shadow-lg">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link to="/features" className="block px-3 py-2 text-white hover:text-[#4de2ff] hover:bg-gray-900 rounded-md">
                Features
              </Link>
              <Link to="/pricing" className="block px-3 py-2 text-white hover:text-[#4de2ff] hover:bg-gray-900 rounded-md">
                Pricing
              </Link>
              <Link to="/about" className="block px-3 py-2 text-white hover:text-[#4de2ff] hover:bg-gray-900 rounded-md">
                About
              </Link>
              <Link to="/contact" className="block px-3 py-2 text-white hover:text-[#4de2ff] hover:bg-gray-900 rounded-md">
                Contact
              </Link>
              <Link to="/auth" className="block px-3 py-2 text-white hover:text-[#4de2ff] hover:bg-gray-900 rounded-md">
                Log in
              </Link>
              <Link to="/signup" className="block px-3 py-2 text-[#4de2ff] border border-[#4de2ff] rounded-md mt-4">
                Sign up
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="tron-container pt-32 pb-20 relative">
        <div className="tron-grid"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pb-10">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
              <span className="tron-glow bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">Direct-to-Consumer</span>
              <br />
              <span className="text-white">Digital Solutions</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-300">
              Launch your digital products, courses, and memberships with our all-in-one platform. No coding required.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-md text-lg font-medium shadow-lg hover:shadow-indigo-500/20 transition-all duration-300"
              >
                Start Free Trial
              </button>
              <button 
                onClick={() => navigate('/demo')}
                className="px-8 py-3 rounded-md text-lg font-medium bg-transparent text-white border border-white hover:border-[#4de2ff] hover:text-[#4de2ff] transition-colors"
              >
                Watch Demo
              </button>
            </div>
          </div>
          
          <div className="mt-20 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full max-w-4xl bg-gradient-to-r from-indigo-600 to-purple-600 opacity-20 blur-3xl rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">Powerful Features</h2>
            <div className="tron-divider w-24 mx-auto my-6"></div>
            <p className="max-w-2xl mx-auto text-lg text-gray-300">
              Everything you need to create, sell, and deliver digital products
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="tron-card p-6 rounded-lg">
              <div className="tron-feature-icon h-12 w-12 rounded-full flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-indigo-600">Digital Products</h3>
              <p className="text-gray-300">
                Sell ebooks, templates, software, and any downloadable files with secure delivery.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Secure file hosting</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Automatic delivery</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Version updates</span>
                </li>
              </ul>
            </div>
            
            <div className="tron-card p-6 rounded-lg">
              <div className="tron-feature-icon h-12 w-12 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-purple-600">Online Courses</h3>
              <p className="text-gray-300">
                Create and sell engaging courses with videos, quizzes, and completion certificates.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Video hosting</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Progress tracking</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Student engagement tools</span>
                </li>
              </ul>
            </div>
            
            <div className="tron-card p-6 rounded-lg">
              <div className="tron-feature-icon h-12 w-12 rounded-full flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-indigo-600">Memberships</h3>
              <p className="text-gray-300">
                Build recurring revenue with subscription-based content and community access.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Recurring billing</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Member-only content</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Community forums</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link to="/features">
              <button className="inline-flex items-center text-indigo-600 hover:text-purple-600 transition-colors">
                <span>Explore all features</span>
                <ChevronRight className="h-5 w-5 ml-1" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 relative">
        <div className="tron-grid"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">Pricing Plans</h2>
            <div className="tron-divider w-24 mx-auto my-6"></div>
            <p className="max-w-2xl mx-auto text-lg text-gray-300">
              Choose the perfect plan for your business needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <div className="tron-pricing-card rounded-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-bold text-indigo-600 mb-2">Starter</h3>
                <div className="flex items-end mb-4">
                  <span className="text-4xl font-bold text-white">$29</span>
                  <span className="text-gray-400 ml-1">/month</span>
                </div>
                <p className="text-gray-300 mb-6">Perfect for creators just getting started</p>
                
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>5 digital products</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Basic analytics</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Email support</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>500 GB bandwidth</span>
                  </li>
                  <li className="flex items-start">
                    <X className="h-5 w-5 text-gray-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-500">Custom domain</span>
                  </li>
                  <li className="flex items-start">
                    <X className="h-5 w-5 text-gray-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-500">Affiliate program</span>
                  </li>
                </ul>
                
                <button 
                  onClick={() => navigate('/signup', { state: { plan: 'starter', price: 29 } })}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white w-full py-2 rounded-md shadow-lg hover:shadow-indigo-500/20 transition-all duration-300"
                >
                  Start Free Trial
                </button>
              </div>
            </div>
            
            {/* Pro Plan */}
            <div className="tron-pricing-card tron-pricing-popular rounded-lg overflow-hidden transform scale-105">
              <div className="bg-[#ff6d10] text-black text-center py-1 font-bold text-sm">
                MOST POPULAR
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#ff6d10] mb-2">Professional</h3>
                <div className="flex items-end mb-4">
                  <span className="text-4xl font-bold text-white">$79</span>
                  <span className="text-gray-400 ml-1">/month</span>
                </div>
                <p className="text-gray-300 mb-6">For growing creators and businesses</p>
                
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#ff6d10] mr-2 flex-shrink-0 mt-0.5" />
                    <span>Unlimited digital products</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#ff6d10] mr-2 flex-shrink-0 mt-0.5" />
                    <span>Advanced analytics</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#ff6d10] mr-2 flex-shrink-0 mt-0.5" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#ff6d10] mr-2 flex-shrink-0 mt-0.5" />
                    <span>2 TB bandwidth</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#ff6d10] mr-2 flex-shrink-0 mt-0.5" />
                    <span>Custom domain</span>
                  </li>
                  <li className="flex items-start">
                    <X className="h-5 w-5 text-gray-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-500">Affiliate program</span>
                  </li>
                </ul>
                
                <button 
                  onClick={() => navigate('/signup', { state: { plan: 'professional', price: 79 } })}
                  className="w-full py-2 rounded-md bg-[#ff6d10] text-black font-bold hover:bg-[#ff8c40] transition-colors"
                >
                  Start Free Trial
                </button>
              </div>
            </div>
            
            {/* Enterprise Plan */}
            <div className="tron-pricing-card rounded-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-bold text-indigo-600 mb-2">Enterprise</h3>
                <div className="flex items-end mb-4">
                  <span className="text-4xl font-bold text-white">$199</span>
                  <span className="text-gray-400 ml-1">/month</span>
                </div>
                <p className="text-gray-300 mb-6">For established businesses and power users</p>
                
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Unlimited everything</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Custom reporting</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Dedicated support</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Unlimited bandwidth</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Custom domain</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Affiliate program</span>
                  </li>
                </ul>
                
                <button 
                  onClick={() => navigate('/signup', { state: { plan: 'enterprise', price: 199 } })}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white w-full py-2 rounded-md shadow-lg hover:shadow-indigo-500/20 transition-all duration-300"
                >
                  Start Free Trial
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">What Our Customers Say</h2>
            <div className="tron-divider w-24 mx-auto my-6"></div>
            <p className="max-w-2xl mx-auto text-lg text-gray-300">
              Join thousands of creators who trust CONQR Direct
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="tron-testimonial p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <img 
                  src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Customer" 
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div className="ml-4">
                  <h4 className="text-lg font-bold text-white">Michael Johnson</h4>
                  <p className="text-indigo-500">Digital Course Creator</p>
                </div>
              </div>
              <p className="text-gray-300">
                "CONQR Direct transformed my business. I was able to launch my course in days instead of months, and the sales have been incredible. The platform is intuitive and powerful."
              </p>
            </div>
            
            <div className="tron-testimonial p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <img 
                  src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Customer" 
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div className="ml-4">
                  <h4 className="text-lg font-bold text-white">Sarah Williams</h4>
                  <p className="text-indigo-500">eBook Publisher</p>
                </div>
              </div>
              <p className="text-gray-300">
                "I've tried several platforms for selling my ebooks, but CONQR Direct is by far the best. The analytics are detailed, and the customer support is exceptional. Highly recommended!"
              </p>
            </div>
            
            <div className="tron-testimonial p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <img 
                  src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Customer" 
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div className="ml-4">
                  <h4 className="text-lg font-bold text-white">David Chen</h4>
                  <p className="text-indigo-500">Membership Site Owner</p>
                </div>
              </div>
              <p className="text-gray-300">
                "The membership features are game-changing. I've been able to build a thriving community around my content, and the recurring revenue has given me the stability I needed."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/90 to-purple-900/90"></div>
        <div className="tron-grid opacity-30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text mb-6">
              Ready to Launch Your Digital Empire?
            </h2>
            <p className="max-w-2xl mx-auto text-xl text-gray-300 mb-10">
              Join thousands of successful creators on CONQR Direct today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-md text-lg font-medium shadow-lg hover:shadow-indigo-500/20 transition-all duration-300"
              >
                Start 14-Day Free Trial
              </button>
              <button 
                onClick={() => navigate('/contact')}
                className="px-8 py-3 rounded-md text-lg font-medium bg-transparent text-white border border-white hover:border-[#4de2ff] hover:text-[#4de2ff] transition-colors"
              >
                Schedule a Demo
              </button>
            </div>
            <p className="mt-4 text-sm text-gray-400">
              No credit card required. Cancel anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="tron-footer py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center">
                <Zap className="h-6 w-6 text-[#4de2ff]" />
                <span className="ml-2 text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">CONQR DIRECT</span>
              </div>
              <p className="mt-4 text-gray-400">
                The all-in-one platform for digital creators and entrepreneurs.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link to="/features" className="text-gray-400 hover:text-indigo-500">Features</Link></li>
                <li><Link to="/pricing" className="text-gray-400 hover:text-indigo-500">Pricing</Link></li>
                <li><Link to="/testimonials" className="text-gray-400 hover:text-indigo-500">Testimonials</Link></li>
                <li><Link to="/roadmap" className="text-gray-400 hover:text-indigo-500">Roadmap</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-400 hover:text-indigo-500">About Us</Link></li>
                <li><Link to="/blog" className="text-gray-400 hover:text-indigo-500">Blog</Link></li>
                <li><Link to="/careers" className="text-gray-400 hover:text-indigo-500">Careers</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-indigo-500">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="text-gray-400 hover:text-indigo-500">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-gray-400 hover:text-indigo-500">Terms of Service</Link></li>
                <li><Link to="/cookies" className="text-gray-400 hover:text-indigo-500">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400">
                &copy; {new Date().getFullYear()} CONQR Direct. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0 text-gray-400">
                <a href="#" className="text-gray-400 hover:text-indigo-500">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-indigo-500">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-indigo-500">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-indigo-500">
                  <span className="sr-only">YouTube</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TronHomePage;