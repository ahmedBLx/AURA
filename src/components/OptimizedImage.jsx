'use client';

import React from 'react';
import Image from 'next/image';

const OptimizedImage = ({
  src,
  alt = 'AURA Sneaker',
  className = '',
  style = {},
  aspectRatio = '4/3',
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  ...props
}) => {
  if (!src) return null;

  let normalizedSrc = src;
  if (typeof normalizedSrc === 'string') {
    // Standardize local paths to match public folder references
    if (normalizedSrc.startsWith('assets/')) {
      normalizedSrc = '/' + normalizedSrc;
    } else if (normalizedSrc.startsWith('uploads/')) {
      normalizedSrc = '/' + normalizedSrc;
    }
  }

  // Handle aspectRatio style mapping
  const containerStyle = {
    position: 'relative',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...style,
  };

  if (aspectRatio) {
    containerStyle.aspectRatio = aspectRatio;
  }

  return (
    <div className={className} style={containerStyle}>
      <Image
        src={normalizedSrc}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        style={{
          objectFit: style.objectFit || 'contain',
          maxWidth: '100%',
          maxHeight: '100%',
        }}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;
