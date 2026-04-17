import React from 'react';

export const Logo = ({ className = "w-8 h-8", ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    {...props}
  >
    <defs>
      <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.8" />
      </linearGradient>
    </defs>
    {/* Pente (Comb) - Refined design with rounded terminals */}
    <rect x="3" y="6" width="18" height="3" rx="1.5" fill="url(#logo-gradient)" />
    <path d="M5 9V17" stroke="url(#logo-gradient)" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M8 9V18" stroke="url(#logo-gradient)" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M11 9V17" stroke="url(#logo-gradient)" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M14 9V18" stroke="url(#logo-gradient)" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M17 9V17" stroke="url(#logo-gradient)" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M20 9V18" stroke="url(#logo-gradient)" strokeWidth="2.5" strokeLinecap="round" />
    
    {/* Subtle highlight dot */}
    <circle cx="19" cy="7.5" r="0.8" fill="white" fillOpacity="0.4" />
  </svg>
);

export default Logo;