import React from 'react';

export const Logo = ({ className = "w-8 h-8", ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    {...props}
  >
    {/* Magnifying Glass Frame */}
    <circle 
      cx="10" 
      cy="10" 
      r="7" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      className="text-primary"
    />
    <path 
      d="M15 15L20 20" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round"
      className="text-primary"
    />
    {/* Checkmark inside */}
    <path 
      d="M7 10L9 12L13 8" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className="text-accent"
    />
  </svg>
);

export default Logo;
