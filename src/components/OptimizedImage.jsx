'use client';

import React, { useState, useEffect } from 'react';
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
  let normalizedSrc = src;
  if (typeof src === 'string') {
    if (src.startsWith('assets/')) {
      normalizedSrc = '/' + src;
    } else if (src.startsWith('uploads/')) {
      normalizedSrc = '/' + src;
    }
  }

  const [imgSrc, setImgSrc] = useState(normalizedSrc || '/assets/sneaker_white.png');
  const [prevSrc, setPrevSrc] = useState(normalizedSrc);

  if (normalizedSrc !== prevSrc) {
    setImgSrc(normalizedSrc || '/assets/sneaker_white.png');
    setPrevSrc(normalizedSrc);
  }

  if (!src) return null;

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
        src={imgSrc}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        style={{
          objectFit: style.objectFit || 'contain',
          maxWidth: '100%',
          maxHeight: '100%',
        }}
        onError={() => {
          setImgSrc('/assets/sneaker_white.png');
        }}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;

