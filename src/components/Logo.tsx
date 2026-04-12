import React from 'react';

export const Logo = ({ className = "w-8 h-8", ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    {...props}
  >
    {/* Frame for a more "precise" look */}
    <path 
      d="M3 8V5a2 2 0 012-2h3m8 0h3a2 2 0 012 2v3m0 8v3a2 2 0 01-2 2h-3m-8 0H5a2 2 0 01-2-2v-3" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      className="text-primary/30"
    />
    {/* Magnifying Glass Frame */}
    <circle 
      cx="11" 
      cy="11" 
      r="5" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      className="text-primary"
    />
    <path 
      d="M15 15L19 19" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round"
      className="text-primary"
    />
    {/* Checkmark inside */}
    <path 
      d="M9 11L10.5 12.5L13.5 9.5" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className="text-accent"
    />
  </svg>
);

export default Logo;
