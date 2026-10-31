'use client';
import React from 'react';

import JournalPage from '@/components/Journal/JournalPage';

// The Journal (design-mockups/blog). /blog and /blog/all-blogs share it, so old links and ?category= URLs keep working.
export default function BlogPage() {
  return <JournalPage />;
}
