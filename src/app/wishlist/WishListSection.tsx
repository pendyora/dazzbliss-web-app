import React from 'react';

import { TabList, Tab } from 'react-tabs';

import { Text } from '../../components/Text';

export default function WishListSection({
  selectedIndex,
  tabTitles,
  setTabIndex,

  groupedData,
}: {
  selectedIndex: number;
  tabTitles: any;
  setTabIndex: any;

  groupedData: any;
}) {
  return (
    <>
      {/* wish list section */}
      <div className="flex flex-col items-center self-stretch">
        <div className="container-xs flex flex-col gap-[42px] sm:gap-3 2xl:px-[160px] xl:px-28 lg:px-20 md:px-5 sm:px-3">
          <div className="flex items-start justify-between gap-5 sm:gap-3 md:flex-col">
            <Text as="p" size="text5xl" className="self-center sm:self-start font-normal uppercase text-black-900_01">
              Wish List
            </Text>
          </div>
          <TabList className="flex flex-wrap gap-4 sm:gap-3">
            {tabTitles?.map((title: any, index: number) => {
              return (
                <Tab
                  key={index}
                  // onSelect={(index) => console.log(index)}
                  onClick={() => {
                    setTabIndex(index);
                  }}
                  className={`tracking-[0.80px] select-none text-lg lg:text-[14px] px-2 sm:px-1.5 sm:py-0 py-0.5 2xl:text-[16px] rounded-full flex  items-center sm:!text-[10px] sm:self-auto ${
                    index === selectedIndex ? '!bg-secondary !text-text_w !border !border-secondary ' : 'border border-black'
                  }`}
                >
                  {title?.split('_').join(' ')}
                </Tab>
              );
            })}
          </TabList>
        </div>
      </div>
    </>
  );
}
