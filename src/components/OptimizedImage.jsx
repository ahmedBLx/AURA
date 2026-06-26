'use client';

import React, { useState } from 'react';
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

  const [imgSrc, setImgSrc] = useState(normalizedSrc);
  const [prevSrc, setPrevSrc] = useState(normalizedSrc);
  const [hasError, setHasError] = useState(false);

  if (normalizedSrc !== prevSrc) {
    setImgSrc(normalizedSrc);
    setPrevSrc(normalizedSrc);
    setHasError(false);
  }

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

  if (!src || hasError) {
    return (
      <div className={className} style={{ ...containerStyle, background: '#f5f5f5' }} />
    );
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
        onError={() => setHasError(true)}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;
