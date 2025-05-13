import React, { useState } from 'react';
import { Plus, X, CheckCircle, Grip, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';

interface Benefit {
  id: string;
  description: string;
}

interface MembershipBenefitEditorProps {
  benefits: Benefit[];
  onChange: (benefits: Benefit[]) => void;
}

export const MembershipBenefitEditor: React.FC<MembershipBenefitEditorProps> = ({
  benefits,
  onChange
}) => {
  const [newBenefit, setNewBenefit] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const generateId = () => `benefit_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const addBenefit = () => {
    if (!newBenefit.trim()) {
      setError('Benefit description cannot be empty');
      return;
    }
    
    const newBenefitItem: Benefit = {
      id: generateId(),
      description: newBenefit.trim()
    };
    
    onChange([...benefits, newBenefitItem]);
    setNewBenefit('');
    setError(null);
  };
  
  const removeBenefit = (id: string) => {
    onChange(benefits.filter(benefit => benefit.id !== id));
  };
  
  const moveBenefitUp = (index: number) => {
    if (index === 0) return;
    
    const newBenefits = [...benefits];
    [newBenefits[index - 1], newBenefits[index]] = [newBenefits[index], newBenefits[index - 1]];
    onChange(newBenefits);
  };
  
  const moveBenefitDown = (index: number) => {
    if (index === benefits.length - 1) return;
    
    const newBenefits = [...benefits];
    [newBenefits[index], newBenefits[index + 1]] = [newBenefits[index + 1], newBenefits[index]];
    onChange(newBenefits);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addBenefit();
    }
  };
  
  return (
    <div className="space-y-4">
      <label htmlFor="benefits" className="block text-sm font-medium text-gray-700">
        Membership Benefits
      </label>
      
      <div className="relative">
        <div className="flex rounded-md shadow-sm">
          <input
            type="text"
            name="newBenefit"
            id="newBenefit"
            value={newBenefit}
            onChange={(e) => {
              setNewBenefit(e.target.value);
              if (error) setError(null);
            }}
            onKeyPress={handleKeyPress}
            className="focus:ring-purple-500 focus:border-purple-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300"
            placeholder="Add a benefit..."
          />
          <Button
            type="button"
            onClick={addBenefit}
            className="relative inline-flex items-center px-4 py-2 rounded-r-md border border-l-0 border-gray-300 bg-purple-600 text-sm font-medium text-white hover:bg-purple-700"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
      
      {benefits.length > 0 && (
        <ul className="space-y-2 mt-3">
          {benefits.map((benefit, index) => (
            <li 
              key={benefit.id} 
              className="flex items-center p-2 border rounded-md bg-white"
            >
              <Grip className="h-4 w-4 text-gray-400 mr-2 cursor-move" />
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span className="flex-1 text-sm text-gray-700">{benefit.description}</span>
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => moveBenefitUp(index)}
                  disabled={index === 0}
                  className={`p-1 rounded-md ${
                    index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveBenefitDown(index)}
                  disabled={index === benefits.length - 1}
                  className={`p-1 rounded-md ${
                    index === benefits.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeBenefit(benefit.id)}
                  className="p-1 rounded-md text-gray-500 hover:text-red-500 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {benefits.length === 0 && (
        <div className="border border-dashed rounded-md p-4 text-center">
          <CheckCircle className="h-6 w-6 mx-auto text-gray-400" />
          <p className="mt-1 text-sm text-gray-500">No benefits added yet</p>
          <p className="text-xs text-gray-400">
            Add benefits to highlight what members will receive
          </p>
        </div>
      )}
    </div>
  );
};