'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import AdminPage from '../../page-components/AdminPage';

export default function Page() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
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
