import React from 'react';

export const Logo = ({ className = "w-8 h-8", ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    {...props}
  >
    {/* Pente (Comb) - Original, clean design */}
    <rect x="3" y="6" width="18" height="3" rx="1" fill="currentColor" />
    <path d="M5 9V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 9V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M11 9V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M14 9V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M17 9V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M20 9V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default Logo;