'use client';
import React, { useEffect, useState } from 'react';

import { Image } from 'antd';
import { useRouter } from 'next/navigation';
import { BsChevronRight } from 'react-icons/bs';
import { LuLoader } from 'react-icons/lu';

import { Text } from '@/components';
import { useAppSelector } from '@/store';

import MyDetails from './MyDetails';

function ProfileParent({ children = null }: any) {
  const { user } = useAppSelector((state) => state.auth.auth);
  const router = useRouter();
  const [isEditProfile, setIsEditProfile] = useState(false);
  const [isEditPassword, setIsEditPassword] = useState(false);
  const [isEditBillingAddress, setIsEditBillingAddress] = useState(false);
  const [isEditDeliveryAddress, setIsEditDeliveryAddress] = useState(false);

  const [loading, setLoading] = useState(!user?.first_name ? true : false);
  useEffect(() => {
    if (user == null) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [user]);
  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center h-[80vh] bg-white">
          {/* <Spin /> */}
          <div className="w-full flex justify-center items-center">
            <LuLoader className="h-10 w-10 animate-spin" />
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-8 sm:gap-3 sm:flex-col md:flex-col">
          <div className="flex w-[25%] flex-col gap-5 sm:gap-3 sm:w-full md:w-full">
            <div className="flex items-center gap-3.5 sm:gap-2 py-2">
              <Image
                src="/images/img_fi_4331290_blue_gray_900.svg"
                alt="Profile Image"
                width={40}
                height={40}
                className="h-[40px] w-[40px] 2xl:h-[30px] 2xl:w-[30px]"
              />
              <div className="w-[82%]">
                <Text as="p" size="texts" className="tracking-[2.00px] ">
                  <span>Hello!</span>
                </Text>
                <Text as="p" size="textlg" className="text-black-900  font-normal uppercase leading-6 tracking-[2.00px] ">
                  {`${user?.first_name} ${user?.last_name}`}
                </Text>
              </div>
            </div>
            <div className="sm:flex sm:w-full md:flex md:w-full">
              <div className="sm:w-1/2 md:w-1/2">
                <div
                  className={`flex sm:w-full md:w-full items-center justify-between gap-5 ${
                    !children ? '!text-text_w !bg-secondary ' : 'border border-b-0 '
                  } px-5 py-3.5 sm:px-3 sm:py-1.5 sm:border md:border cursor-pointer`}
                  onClick={() => {
                    router.push(`/profile`);
                  }}
                >
                  <Text
                    as="p"
                    size="textlg"
                    className={`font-normal uppercase tracking-[2.00px] whitespace-nowrap sm:w-full sm:text-center ${!children ? '!text-text_w' : ''}`}
                  >
                    my account
                  </Text>
                  <BsChevronRight
                    // src="images/img_fi_5802728.svg"
                    // alt="Account Icon"
                    width={20}
                    height={20}
                    // preview={false}
                    className={`h-[20px] w-[20px] sm:hidden md:hidden ${!children ? '!text-text_w' : ''}`}
                  />
                </div>
              </div>
              <div className="sm:w-1/2 md:w-1/2">
                <div
                  className={`flex sm:w-full md:w-full items-center justify-between gap-5 ${
                    children ? '!text-text_w !bg-secondary' : 'border border-t-0'
                  } px-5 py-3.5 sm:px-3 sm:py-1.5 sm:border md:border cursor-pointer`}
                  onClick={() => {
                    router.push(`/profile/purchases`);
                  }}
                >
                  <Text
                    as="p"
                    size="textlg"
                    className={`font-normal uppercase tracking-[2.00px] whitespace-nowrap sm:w-full sm:text-center ${children ? '!text-text_w' : ''}`}
                  >
                    my purchases
                  </Text>
                  <BsChevronRight
                    // src="images/img_fi_5802728.svg"
                    // alt="Account Icon"
                    // preview={false}
                    width={20}
                    height={20}
                    className={`h-[20px] w-[20px] sm:hidden md:hidden ${children ? '!text-text_w' : ''}`}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="w-[75%] sm:w-full md:w-full">
            {children ? (
              children
            ) : (
              <MyDetails
                isEditProfile={isEditProfile}
                isEditPassword={isEditPassword}
                setIsEditProfile={setIsEditProfile}
                setIsEditPassword={setIsEditPassword}
                isEditBillingAddress={isEditBillingAddress}
                setIsEditBillingAddress={setIsEditBillingAddress}
                isEditDeliveryAddress={isEditDeliveryAddress}
                setIsEditDeliveryAddress={setIsEditDeliveryAddress}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default ProfileParent;
