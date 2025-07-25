'use client'

import { CampModal } from '@campnetwork/origin/react';

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Writing Registry
            </h2>
            <span className="text-sm text-gray-500">on Camp Network</span>
          </div>
          <div className="flex items-center space-x-4">
            <CampModal />
          </div>
        </div>
      </div>
    </header>
  );
} 