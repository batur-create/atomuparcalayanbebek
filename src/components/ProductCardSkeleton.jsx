import React from 'react';

export default function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col">
      {/* Resim Alanı */}
      <div className="h-56 bg-gray-200 animate-pulse"></div>
      
      <div className="p-5 flex flex-col flex-grow">
        {/* Başlık Alanı */}
        <div className="h-6 w-3/4 mb-4 bg-gray-200 rounded animate-pulse"></div>
        
        {/* Etiket Alanı */}
        <div className="flex flex-wrap gap-2 mb-3">
          <div className="h-5 w-1/4 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-5 w-1/4 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-5 w-1/4 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
        
        {/* Puanlama Alanı */}
        <div className="h-5 w-1/2 mb-4 bg-gray-200 rounded animate-pulse"></div>

        <div className="mt-auto pt-4">
          {/* Fiyat Alanı */}
          <div className="h-8 w-1/3 mb-4 bg-gray-200 rounded animate-pulse"></div>
          
          {/* Buton Alanı */}
          <div className="flex gap-2">
            <div className="h-10 flex-1 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-10 flex-1 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}