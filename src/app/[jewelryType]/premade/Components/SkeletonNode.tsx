import React from 'react';

import { Skeleton } from 'antd';
import { FaHeart, FaRegHeart } from 'react-icons/fa6';

const SkeletonNode = () => {
  return (
    <Skeleton.Node
      active={true}
      className="hidden sm:!block"
      style={{
        borderRadius: '0px',
        width: '100%',
        height: '100%',
        aspectRatio: '1 / 1',
      }}
    />
  );
};
const SkeletonInput = () => {
  return <Skeleton.Input active={true} size="small" className="h-[12px]" />;
};

export { SkeletonNode, SkeletonInput };
