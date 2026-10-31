'use client';
import React, { Suspense } from 'react';

import { Skeleton } from 'antd';

import ProductProfile from '@/components/ProductProfile';
import { useAppSelector } from '@/store';

import { Text } from '../../components';

export default function YouMayAlsoLike() {
  const { suggestion } = useAppSelector((state) => state?.products);
  return (
    <div className="flex flex-col items-center">
      <div className="container-xs flex flex-col items-start gap-[50px] 2xl:px-[30px] sm:gap-[20px] xl:px-28 lg:px-20 md:px-5 sm:px-3 sm:my-3">
        <Text size="text5xl" as="p" className="uppercase tracking-[2.20px] md:ml-0 md:text-[26px] sm:text-[22px] sm:w-full sm:text-center">
          YOU MAY ALSO LIKE
        </Text>
        <div className="grid grid-cols-4 md:grid-cols-3 sm:grid-cols-2 gap-5 sm:gap-2 self-stretch overflow-x-auto w-full">
          <Suspense fallback={<div>Loading feed...</div>}>
            {suggestion && suggestion.length > 0 ? (
              suggestion?.map((d, index) => <ProductProfile {...d} isStatic={true} key={'frame60' + index} />)
            ) : (
              <>
                <div className="w-full h-full flex flex-col gap-3">
                  <Skeleton.Node
                    active={true}
                    className="sm:hidden"
                    style={{
                      borderRadius: '0px',
                      width: '100%',
                      height: '100%',
                      aspectRatio: '1 / 1',
                    }}
                  />
                  <Skeleton.Input active={true} block={true} />
                  <Skeleton.Input active={true} size="small" />
                </div>
                <div className="w-full h-full flex flex-col gap-3">
                  <Skeleton.Node
                    active={true}
                    className="sm:hidden"
                    style={{
                      borderRadius: '0px',
                      width: '100%',
                      height: '100%',
                      aspectRatio: '1 / 1',
                    }}
                  />
                  <Skeleton.Input active={true} block={true} />
                  <Skeleton.Input active={true} size="small" />
                </div>
                <div className="w-full h-full flex flex-col gap-3">
                  <Skeleton.Node
                    active={true}
                    className="sm:hidden"
                    style={{
                      borderRadius: '0px',
                      width: '100%',
                      height: '100%',
                      aspectRatio: '1 / 1',
                    }}
                  />
                  <Skeleton.Input active={true} block={true} />
                  <Skeleton.Input active={true} size="small" />
                </div>
                <div className="w-full h-full flex flex-col gap-3">
                  <Skeleton.Node
                    active={true}
                    className="sm:hidden"
                    style={{
                      borderRadius: '0px',
                      width: '100%',
                      height: '100%',
                      aspectRatio: '1 / 1',
                    }}
                  />
                  <Skeleton.Input active={true} block={true} />
                  <Skeleton.Input active={true} size="small" />
                </div>
              </>
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
