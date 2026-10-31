import React from 'react';

import { LuLoader } from 'react-icons/lu';

const Loading = () => (
  <div className="w-full flex justify-center items-center">
    <LuLoader className="h-10 w-10 animate-spin" />
  </div>
);

export default Loading;
