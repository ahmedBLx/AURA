'use client';

import React, { Suspense } from 'react';
import ShopPage from '../../page-components/ShopPage';

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading Shop...</div>}>
      <ShopPage />
    </Suspense>
  );
}
