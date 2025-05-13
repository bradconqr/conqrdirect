import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import { Footer } from './Footer';
import { CustomerNavbar } from './CustomerNavbar';
import { supabase } from '../../lib/supabase';

export const CustomerLayout: React.FC = () => {
  const location = useLocation();
  const { creatorId } = useParams<{ creatorId?: string }>();
  const [storeName, setStoreName] = useState<string>("Stan Store");
  
  useEffect(() => {
    // If we're on a store page, fetch the creator details to get the store name
    if (creatorId) {
      const fetchCreator = async () => {
        const { data, error } = await supabase
          .from('creators')
          .select('store_name')
          .eq('id', creatorId)
          .single();
          
        if (!error && data) {
          setStoreName(data.store_name);
        }
      };
      
      fetchCreator();
    } else {
      setStoreName("Stan Store");
    }
  }, [creatorId]);
  
  // Extract creator ID from URL if present (e.g., /store/:creatorId)
  const extractedCreatorId = location.pathname.match(/\/store\/([^\/]+)/)?.[1];
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <CustomerNavbar storeName={storeName} creatorId={extractedCreatorId} />
      <main className="flex-grow">
        <Outlet />
      </main>
      
      <Footer />
    </div>
  );
};