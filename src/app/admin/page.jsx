'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import AdminPage from '../../page-components/AdminPage';

export default function Page() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && (!user || user.role !== 'admin')) {
      router.replace('/login');
    }
  }, [user, loading, mounted, router]);

  if (!mounted || loading) {
    return (
      <div style={{ padding: '80px 40px', textAlign: 'center', color: '#fff', fontSize: '18px' }}>
        Verifying administrator credentials...
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null; // will redirect to login
  }

  return <AdminPage />;
}
