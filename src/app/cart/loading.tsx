import React from 'react';

import { LuLoader } from 'react-icons/lu';

const Loading: React.FC = () => {
  return (
    <div className="flex h-[80vh] items-center justify-center bg-paper">
      <LuLoader className="h-10 w-10 animate-spin text-ink" aria-label="Loading your bag" />
    </div>
  );
};

export default Loading;
