'use client';

import React from 'react';
import Link from 'next/link';

interface ShimmerButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  as?: 'button' | 'link';
  ariaLabel?: string;
}

const ShimmerButton: React.FC<ShimmerButtonProps> = ({ 
  children, 
  className = '', 
  onClick,
  href,
  as = 'button',
  ariaLabel
}) => {
  const baseClasses = `
    relative overflow-hidden group
    bg-gradient-to-r from-sky-400 via-sky-500 to-orange-400
    text-white px-8 py-4 rounded-lg text-lg font-semibold
    hover:from-sky-500 hover:via-sky-600 hover:to-orange-500
    transition-all duration-300 cursor-pointer
    whitespace-nowrap inline-block shadow-lg
  `;

  // shimmer matches the base gradient for better blending
  const shimmer = `
    before:absolute before:inset-0
    before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent
    before:translate-x-[-150%] before:skew-x-12
    before:animate-[shimmer_2.8s_infinite]
    before:pointer-events-none
  `;

  return as === 'link' && href ? (
    <Link href={href} className={`${baseClasses} ${shimmer} ${className}`} aria-label={ariaLabel}>
      <span className="relative z-10">{children}</span>
    </Link>
  ) : (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClasses} ${shimmer} ${className}`}
      aria-label={ariaLabel}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
};

export default ShimmerButton;
