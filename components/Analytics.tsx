
import React from 'react';

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-[#1C1C1C] border-2 border-[#3A3A3A] p-8 mb-8 relative transition-all duration-200 ease-in-out hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_rgba(255,229,0,0.5)] hover:border-[#5A5A5A] ${className}`}>
    {children}
  </div>
);

const CardTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-2xl font-bold mb-6 flex items-center gap-4">
    <span className="w-1 h-6 bg-[#FF6B00]"></span>
    {children}
  </h2>
);

export const Analytics: React.FC = () => {
  return (
    <div className="animate-fadeIn">
      <Card>
        <CardTitle>Data Analytics</CardTitle>
        <div className="text-center py-12 text-[#B4B4B4]">
          <p>Analytics dashboard coming soon...</p>
          <p className="text-sm text-[#6B6B6B]">Visual charts and graphs of your productivity will be available here.</p>
        </div>
      </Card>
    </div>
  );
};
