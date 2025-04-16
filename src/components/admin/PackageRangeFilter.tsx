
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PackageRangeFilterProps {
  minPackage: number;
  maxPackage: number;
  currentRange: [number, number];
  onChange: (range: [number, number]) => void;
}

const PackageRangeFilter: React.FC<PackageRangeFilterProps> = ({
  minPackage,
  maxPackage,
  currentRange,
  onChange
}) => {
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (isNaN(value)) return;
    
    onChange([Math.max(minPackage, value), currentRange[1]]);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (isNaN(value)) return;
    
    onChange([currentRange[0], Math.min(maxPackage, value)]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-1">
        <Label htmlFor="min-package">Min Package (LPA)</Label>
        <Input
          id="min-package"
          type="number"
          min={minPackage}
          max={currentRange[1]}
          value={currentRange[0]}
          onChange={handleMinChange}
        />
      </div>
      
      <div className="flex flex-col space-y-1">
        <Label htmlFor="max-package">Max Package (LPA)</Label>
        <Input
          id="max-package"
          type="number"
          min={currentRange[0]}
          max={maxPackage}
          value={currentRange[1]}
          onChange={handleMaxChange}
        />
      </div>
    </div>
  );
};

export default PackageRangeFilter;
