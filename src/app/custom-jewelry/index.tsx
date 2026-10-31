/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useEffect, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { ShowStepper, CustomJewelryDiamondFilter } from '@/page';

import CustomDiamondPDP from './customize-diamond/CustomDiamondPDP';
import CustomJewelryDiamondListTable, { CustomDiamondType } from './customize-diamond/CustomJewelryDiamondListTable';
import CustomJewelrySettingFilter from './customize-setting/CustomJewelrySettingFilter';
import CustomJewelryCompletePage from './customjewelrycomplete';
import ProductPageSpecificProductPage from '../[jewelryType]/premade';
import CustomJewelrySettingList, { CustomSettingType } from './customize-setting/CustomJewelrySettingList';

export default function CUSTOMJEWELRYCHOOSEADIAMONDPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams?.get('type');
  const state = searchParams?.get('state');
  const dId = searchParams?.get('did') ?? null;
  const sId = searchParams?.get('id') ?? null;

  const [selectionRoute, setSelectionRoute] = useState<number>(Number(type) ?? 1);
  const [activeStep, setActiveStep] = useState<'diamond' | 'setting' | 'complete'>(selectionRoute === 1 ? 'diamond' : 'setting');
  const [selectedDiamond, setSelectedDiamond] = useState<CustomDiamondType | null>(null);
  const [selectedSetting, setSelectedSetting] = useState<CustomSettingType | null>(null);

  const [isLoadingSetting, setIsLoadingSetting] = useState<boolean>(true);
  const [isLoadingDiamond, setIsLoadingDiamond] = useState<boolean>(true);

  useEffect(() => {
    if (!type || !['1', '2'].includes(type)) {
      return router.push(`/design-your-own`);
    }
    if (!state || !['d', 's', 'c'].includes(state)) {
      if (type === '2') {
        return router.push('/custom-jewelry?type=2&state=s');
      } else {
        return router.push('/custom-jewelry?type=1&state=d');
      }
    }
    if (type == '1' && state == 's' && !dId) {
      return router.push('/custom-jewelry?type=1&state=d');
    }
    if (type == '2' && state == 'd' && !sId) {
      return router.push('/custom-jewelry?type=2&state=s');
    }
  }, [type, state]);
  useEffect(() => {
    setSelectionRoute(Number(type) ?? 1);
  }, [searchParams?.toString()]);

  return (
    <div className="w-full bg-[#ffffff]">
      <div className="flex flex-col gap-[20px] relative lg:gap-5 sm:gap-[10px]">
        <div className="sticky top-0 sm:top-[87px] w-full bg-[#ffffff] z-[20]">
          <ShowStepper
            selectionRoute={selectionRoute}
            activeStep={activeStep}
            setSelectionRoute={setSelectionRoute}
            selectedDiamond={selectedDiamond}
            selectedSetting={selectedSetting}
            setActiveStep={setActiveStep}
            dId={dId}
            sId={sId}
            state={state as string}
            setSelectedDiamond={setSelectedDiamond}
            setSelectedSetting={setSelectedSetting}
          />
        </div>

        {/* diamonds filters */}
        {state === 'c'
          ? null
          : dId === null && state == 'd' && <CustomJewelryDiamondFilter isLoading={isLoadingDiamond} setIsLoading={setIsLoadingDiamond} />}

        {/* diamonds */}
        {state == 'd' ? (
          !dId ? (
            <CustomJewelryDiamondListTable
              selectionRoute={selectionRoute}
              dId={dId}
              sId={sId}
              isLoading={isLoadingDiamond}
              setSelectedDiamond={setSelectedDiamond}
              setActiveStep={setActiveStep}
            />
          ) : (
            <CustomDiamondPDP setActiveStep={setActiveStep} selectionRoute={selectionRoute} />
          )
        ) : null}

        {/* settings filters */}
        {state === 'c'
          ? null
          : sId === null && state == 's' && <CustomJewelrySettingFilter isLoading={isLoadingSetting} setIsLoading={setIsLoadingSetting} />}
        {/* settings */}
        {state == 's' ? (
          !sId ? (
            <CustomJewelrySettingList
              selectionRoute={selectionRoute}
              setSelectedSetting={setSelectedSetting}
              setActiveStep={setActiveStep}
              isLoading={isLoadingSetting}
            />
          ) : (
            <div className="relative">
              <ProductPageSpecificProductPage selectionRoute={selectionRoute} />
            </div>
          )
        ) : null}

        {/* complete */}
        {state == 'c' && <CustomJewelryCompletePage dId={dId} sId={sId} selectedDiamond={selectedDiamond} selectedSetting={selectedSetting} />}
      </div>
    </div>
  );
}
