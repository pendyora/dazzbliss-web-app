'use client';
import React from 'react';

import { useSearchParams } from 'next/navigation';

import AccountShell from '@/components/Account/AccountShell';

import { ORDER_REQUEST_TYPE } from '../../OrderRequest/constants';
import OrderRequestWizard from '../../OrderRequest/OrderRequestWizard';

/**
 * /profile/purchases/request?order=<order no>&type=cancel|return
 * AccountShell does the sign-in guard (useRequireAuth, with this URL as callbackUrl) and shows the
 * loader until the account is resolved, so the wizard only mounts for a signed-in customer.
 */
export default function OrderRequest() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') ?? '';
  const type = searchParams.get('type') === 'cancel' ? ORDER_REQUEST_TYPE.CANCEL : ORDER_REQUEST_TYPE.RETURN;

  return (
    <AccountShell active="orders">
      <OrderRequestWizard key={`${orderNumber}-${type}`} orderNumber={orderNumber} type={type} />
    </AccountShell>
  );
}
