import React, { Suspense } from 'react';

import PayPalReturnSection from './PayPalReturnSection';

export default function PayPalReturnPage() {
  return (
    <div className="w-full bg-white-a700">
      <div className="border-b border-solid border-gray-800_01 py-8 md:py-4 sm:py-3">
        {/* `useSearchParams` opts the subtree into client-side rendering, and Next requires a
            Suspense boundary around it or the whole route is forced dynamic at build time. */}
        <Suspense
          fallback={
            <div className="w-full min-h-[50vh] flex items-center justify-center">
              <div className="animate-spin h-10 w-10 border-2 border-secondary border-t-transparent rounded-full" />
            </div>
          }
        >
          <PayPalReturnSection />
        </Suspense>
      </div>
    </div>
  );
}
