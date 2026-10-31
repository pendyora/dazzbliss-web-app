'use client';
import React from 'react';

import AccountShell from '@/components/Account/AccountShell';

import OrderList from '../OrderList';

// Signed out (or guest) visitors - typically arriving from the "Track your order" button in an
// order email - go to /login?callbackUrl=/profile/purchases and come straight back here
// (useRequireAuth inside AccountShell).
export default function MyPurchases() {
  return (
    <AccountShell active="orders">
      <OrderList />
    </AccountShell>
  );
}
