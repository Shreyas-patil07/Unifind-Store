import React from 'react';

export const ProductCardSkeleton = () => {
  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden" data-testid="product-skeleton">
      <div className="aspect-[4/3] skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-6 skeleton w-3/4" />
        <div className="h-8 skeleton w-1/3" />
        <div className="h-4 skeleton w-1/2" />
        <div className="flex items-center gap-3 py-3">
          <div className="h-8 w-8 rounded-full skeleton" />
          <div className="flex-1 space-y-2">
            <div className="h-3 skeleton w-1/2" />
            <div className="h-3 skeleton w-2/3" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 skeleton flex-1 rounded-xl" />
          <div className="h-10 skeleton flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export const DashboardCardSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6" data-testid="dashboard-card-skeleton">
      <div className="h-6 skeleton w-2/3 mb-4" />
      <div className="h-10 skeleton w-1/2" />
    </div>
  );
};

export const ChatListSkeleton = () => {
  return (
    <div className="flex items-center gap-3 p-4 border-b border-slate-100" data-testid="chat-skeleton">
      <div className="h-12 w-12 rounded-full skeleton" />
      <div className="flex-1 space-y-2">
        <div className="h-4 skeleton w-1/3" />
        <div className="h-3 skeleton w-2/3" />
      </div>
    </div>
  );
};
