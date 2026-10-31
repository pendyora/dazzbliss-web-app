import React, { Suspense } from 'react';

import { LuLoader } from 'react-icons/lu';

import PayPalReturnSection from './PayPalReturnSection';

export default function PayPalReturnPage() {
  return (
    <div className="w-full bg-paper">
      <div className="border-b border-line">
        {/* `useSearchParams` opts the subtree into client-side rendering, and Next requires a
            Suspense boundary around it or the whole route is forced dynamic at build time. */}
        <Suspense
          fallback={
            <div className="flex min-h-[60vh] w-full items-center justify-center">
              <LuLoader className="h-9 w-9 animate-spin text-ink" aria-hidden />
            </div>
          }
        >
          <PayPalReturnSection />
        </Suspense>
      </div>
    </div>
  );
}
