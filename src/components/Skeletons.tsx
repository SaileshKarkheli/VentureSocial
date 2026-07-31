import React from 'react';

export function FeedSkeleton() {
  return (
    <div className="space-y-6 w-full">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-hairline rounded-[2rem] p-4 flex flex-col gap-4 animate-pulse shadow-sm">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-zinc-200 rounded-full" />
            <div className="space-y-2">
              <div className="w-32 h-4 bg-zinc-200 rounded-md" />
              <div className="w-24 h-3 bg-zinc-200 rounded-md" />
            </div>
          </div>
          
          {/* Main Content Area (Image Carousel simulation) */}
          <div className="w-full aspect-[4/3] bg-zinc-200 rounded-3xl" />
          
          {/* Caption */}
          <div className="space-y-2 pt-2">
            <div className="w-3/4 h-4 bg-zinc-200 rounded-md" />
            <div className="w-1/2 h-4 bg-zinc-200 rounded-md" />
          </div>

          {/* Action Bar */}
          <div className="flex gap-4 pt-2">
            <div className="w-20 h-8 bg-zinc-200 rounded-full" />
            <div className="w-20 h-8 bg-zinc-200 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TripGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="aspect-[4/5] bg-white border border-hairline p-2 rounded-[2rem] flex flex-col gap-2 animate-pulse shadow-sm">
           <div className="flex-1 bg-zinc-200 rounded-[1.5rem]" />
           <div className="h-4 w-1/2 bg-zinc-200 rounded-md mx-2 mb-2 mt-1" />
        </div>
      ))}
    </div>
  );
}
