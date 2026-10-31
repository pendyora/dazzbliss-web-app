import React from 'react';

import { LuLoader } from 'react-icons/lu';

const Loading: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-[80vh] bg-white">
      {/* <Spin /> */}
      <div className="w-full flex justify-center items-center">
        <LuLoader className="h-10 w-10 animate-spin" />
      </div>
    </div>
  );
};

export default Loading;
