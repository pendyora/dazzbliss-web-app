import React from 'react';

import { Metadata } from 'next';

import { BRAND } from '@/config/brand';

import Page from '.';

export const metadata: Metadata = {
  title: `Book a Virtual Appointment${BRAND.titleSuffix}`,
  description: `See pieces live with a ${BRAND.name} jeweler, compare stones and get sized from home. Free, no obligation.`,
};

export default function VirtualAppointmentPage() {
  return <Page />;
}
