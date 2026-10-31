import React, { Suspense } from 'react';

import { LuLoader } from 'react-icons/lu';

import NewPassword from './NewPassword';

export default function LOGINPage() {
  return (
    <div className="w-full bg-[#ffffff]">
      <Suspense
        fallback={
          <div className="flex justify-center items-center h-[80vh] bg-white">
            {/* <Spin /> */}
            <div className="w-full flex justify-center items-center">
              <LuLoader className="h-10 w-10 animate-spin" />
            </div>
          </div>
        }
      >
        <NewPassword />
      </Suspense>
    </div>
  );
}
