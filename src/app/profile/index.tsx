'use client';
import React from 'react';

import { useSearchParams } from 'next/navigation';

import AccountShell from '@/components/Account/AccountShell';

import { Addresses, Details, Overview } from './AccountPanels';

/**
 * /profile → Overview; ?section=addresses | details opens those panels (design-mockups/account).
 * Signed out (or guest) visitors are sent to sign in and returned here afterwards (useRequireAuth in AccountShell).
 */
export default function MyProfileMyAccount() {
  const section = useSearchParams()?.get('section');
  const active = section === 'addresses' ? 'addresses' : section === 'details' ? 'details' : 'overview';
  return <AccountShell active={active}>{active === 'addresses' ? <Addresses /> : active === 'details' ? <Details /> : <Overview />}</AccountShell>;
}
