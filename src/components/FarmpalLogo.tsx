import React from 'react';

export interface FarmpalLogoProps {
  variant?: 'full' | 'icon' | 'wordmark';
  theme?: 'green' | 'white' | 'dark' | 'current' | 'adaptive';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTagline?: boolean;
}

export const FarmpalEmblem: React.FC<{
  className?: string;
  color?: string;
  size?: number;
}> = ({ className = 'w-9 h-9', color, size }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden="true"
    >
      <g fill={color || 'currentColor'}>
        {/* Left Person Head */}
        <circle cx="25" cy="20" r="9" />
        {/* Right Person Head */}
        <circle cx="67" cy="20" r="9" />
        {/* Left Person Body & Lower Embracing Arm */}
        <path d="M 23 33 C 15 36 12 43 12 53 L 12 68 C 12 78 18 85 28 85 L 60 85 C 70 85 78 79 77 71 C 76 65 70 64 62 66 L 46 69 C 37 71 32 67 31 58 L 31 46 C 31 38 28 34 23 33 Z" />
        {/* Right Person Body & Upper Embracing Arm */}
        <path d="M 58 34 C 52 36 47 41 41 46 L 35 51 C 30 55 31 61 37 61 C 43 61 50 57 58 52 L 64 48 C 69 45 73 47 73 52 L 73 63 C 73 69 77 71 80 67 C 82 64 82 54 82 46 C 82 38 76 34 67 34 L 58 34 Z" />
      </g>
    </svg>
  );
};

export const FarmpalLogo: React.FC<FarmpalLogoProps> = ({
  variant = 'full',
  theme = 'green',
  size = 'md',
  className = '',
  showTagline = false,
}) => {
  // Official FarmPal Green from brand asset
  const brandGreen = '#3ca83b';

  // Sizing matrix
  const sizeStyles = {
    xs: { icon: 'w-5 h-5', text: 'text-sm', box: 'h-6' },
    sm: { icon: 'w-7 h-7', text: 'text-base', box: 'h-8' },
    md: { icon: 'w-9 h-9', text: 'text-xl', box: 'h-10' },
    lg: { icon: 'w-11 h-11', text: 'text-2xl', box: 'h-12' },
    xl: { icon: 'w-14 h-14', text: 'text-3xl', box: 'h-16' },
  }[size];

  // Theme color mapping
  const iconColor =
    theme === 'white'
      ? '#4ade80' // vibrant green against dark background
      : theme === 'dark'
      ? '#15803d'
      : theme === 'adaptive'
      ? '#34C759'
      : theme === 'current'
      ? 'currentColor'
      : brandGreen;

  const textColor =
    theme === 'white'
      ? 'text-white'
      : theme === 'dark'
      ? 'text-stone-900'
      : theme === 'adaptive'
      ? 'text-apple-primary'
      : theme === 'current'
      ? 'text-current'
      : 'text-[#3ca83b]';

  if (variant === 'icon') {
    return (
      <FarmpalEmblem
        className={`${sizeStyles.icon} ${className}`}
        color={iconColor}
      />
    );
  }

  if (variant === 'wordmark') {
    return (
      <span
        className={`font-black tracking-tight ${sizeStyles.text} ${textColor} ${className}`}
        style={{ fontFamily: "'Nunito', 'Plus Jakarta Sans', system-ui, sans-serif" }}
      >
        Farmpal
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className="shrink-0 flex items-center justify-center">
        <FarmpalEmblem className={sizeStyles.icon} color={iconColor} />
      </div>

      <div className="flex flex-col">
        <span
          className={`font-black tracking-tight leading-none ${sizeStyles.text} ${textColor}`}
          style={{ fontFamily: "'Nunito', 'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
          Farmpal
        </span>
        {showTagline && (
          <span
            className={`text-[10px] tracking-normal font-medium mt-0.5 ${
              theme === 'white' ? 'text-emerald-200/80' : 'text-stone-500'
            }`}
          >
            Farm Notebook & Intelligence
          </span>
        )}
      </div>
    </div>
  );
};
