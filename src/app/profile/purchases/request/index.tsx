'use client';
import React from 'react';

import { useSearchParams } from 'next/navigation';
import { LuLoader } from 'react-icons/lu';

import useRequireAuth from '@/hook/useRequireAuth';

import { ORDER_REQUEST_TYPE } from '../../OrderRequest/constants';
import OrderRequestWizard from '../../OrderRequest/OrderRequestWizard';

/** /profile/purchases/request?order=<order no>&type=cancel|return */
export default function OrderRequest() {
  const { isAuthResolved, isAuthenticated } = useRequireAuth();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') ?? '';
  const type = searchParams.get('type') === 'cancel' ? ORDER_REQUEST_TYPE.CANCEL : ORDER_REQUEST_TYPE.RETURN;

  if (!isAuthResolved || !isAuthenticated) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-white">
        <LuLoader className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container-xs py-14 lg:py-8 sm:py-5">
      <div className="mx-auto w-full 2xl:px-[160px] xl:px-28 lg:px-20 md:px-5 sm:px-3">
        <OrderRequestWizard key={`${orderNumber}-${type}`} orderNumber={orderNumber} type={type} />
      </div>
    </div>
  );
}
