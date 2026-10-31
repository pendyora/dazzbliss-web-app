'use client';
import React from 'react';

import { LuLoader } from 'react-icons/lu';

import useRequireAuth from '@/hook/useRequireAuth';
import { useAppSelector } from '@/store';

import ProfileParent from './ProfileParent';
// import TabsComponent from './TabsComponent';
import { Text } from '../../components/Text';

export default function MyProfileMyAccount() {
  const { loading } = useAppSelector((state) => state.auth.auth);
  // Signed out (or guest) visitors are sent to sign in and returned to this page afterwards.
  const { isAuthResolved, isAuthenticated } = useRequireAuth();

  if (!isAuthResolved || !isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-[80vh] bg-white">
        <LuLoader className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {loading && (
        <>
          {/* <Spin /> */}
          <div className="w-full flex justify-center items-center">
            <LuLoader className="h-10 w-10 animate-spin" />
          </div>
        </>
      )}
      <div className="container-xs flex flex-col items-center border-b border-solid border-gray-800 py-14 lg:py-5 sm:py-3">
        <div className="mx-auto mb-[22px] flex w-full flex-col gap-5 sm:gap-3 2xl:px-[160px] xl:px-28 lg:px-20 md:px-5 sm:px-3">
          <div className="flex items-start sm:flex-col sm:gap-3 justify-between gap-8 md:justify-start">
            <Text as="p" size="text5xl" className="text-black-900 w-[25%] self-center sm:self-start sm:w-full  font-normal uppercase">
              my profile
            </Text>
          </div>
          <div>
            {/* <TabsComponent /> */}
            <ProfileParent></ProfileParent>
          </div>
        </div>
      </div>
    </div>
  );
}
