import React from 'react';

export const LoadingSpinner = ({ text = 'Loading data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-8 h-8 border-2 border-gray-300 border-t-[#8b3a3a] rounded-full animate-spin mb-3"></div>
      <p className="text-xs sm:text-sm text-gray-500">{text}</p>
    </div>
  );
};
