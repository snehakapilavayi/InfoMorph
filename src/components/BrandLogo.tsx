import React from 'react';

export const BrandLogo: React.FC<{ className?: string; size?: number }> = ({
  className = "w-8 h-8",
  size = 32
}) => {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="100" height="100" rx="22" fill="#477A3C" />
      {/* Overlapping geometric morphing shapes in sap green and translucent tints */}
      <circle cx="38" cy="42" r="20" fill="#8DBF67" fillOpacity="0.9" />
      <rect x="42" y="32" width="34" height="34" rx="10" fill="#FFFFFF" fillOpacity="0.85" />
      <path d="M50 28L68 56H32L50 28Z" fill="#EAF4E3" fillOpacity="0.75" />
      <circle cx="56" cy="58" r="14" fill="#8DBF67" />
      <circle cx="56" cy="58" r="6" fill="#172019" />
    </svg>
  );
};
