import React from 'react';

export const Logo = ({ className = "w-8 h-8", ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    {...props}
  >
    {/* Pente (Comb) - Minimalist & Professional */}
    <path 
      d="M4 6h16a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" 
      fill="currentColor" 
      className="text-primary"
    />
    <path d="M5 12v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary" />
    <path d="M8 12v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary" />
    <path d="M11 12v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary" />
    <path d="M14 12v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary" />
    <path d="M17 12v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary" />
    <path d="M20 12v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary" />
    
    {/* Accent detail for "Fino" / precision */}
    <path 
      d="M2 9h20" 
      stroke="white" 
      strokeWidth="0.5" 
      strokeOpacity="0.3"
    />
  </svg>
);

export default Logo;