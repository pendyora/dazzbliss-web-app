import React from 'react';

import { Metadata } from 'next';

import Page from '.';

export const metadata: Metadata = {
  title: 'Book a Virtual Appointment | Pendyora',
  description: 'See pieces live with a Pendyora jeweler, compare stones and get sized from home. Free, no obligation.',
};

export default function VirtualAppointmentPage() {
  return <Page />;
}
