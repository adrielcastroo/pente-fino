import React from 'react';

export const Logo = ({ className = "w-8 h-8", ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    {...props}
  >
    {/* Pente (Comb) - Refined and modern */}
    <rect x="3" y="6" width="18" height="3" rx="1.5" fill="currentColor" />
    <path d="M5 9V17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M9 9V17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M13 9V17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M17 9V17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M21 9V17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    
    {/* Sparkle/Precision element */}
    <circle cx="19" cy="5" r="1.5" fill="white" className="animate-pulse" />
  </svg>
);

export default Logo;