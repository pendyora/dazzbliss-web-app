import React from 'react';

import { LuLoader } from 'react-icons/lu';

const Loading = () => (
  <div role="status" className="flex w-full items-center justify-center bg-paper py-16">
    <LuLoader className="h-7 w-7 animate-spin text-ink-faint" strokeWidth={1.25} aria-hidden="true" />
    <span className="sr-only">Loading</span>
  </div>
);

export default Loading;
