import React from 'react';

import { Button, ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { PiSignOut } from 'react-icons/pi';

import { Text } from '@/components';
import { useAppDispatch, useAppSelector } from '@/store';
import { logoutUser } from '@/store/slices/auth/authSlice';
import { clearCartProducts, clearWishlistProducts } from '@/store/slices/Cart/cartSlice';

import ChangePasswordForm from './ChangePasswordForm';
import ProfileForm from './ProfileForm';
import BillingAddress from '../checkout/BillingAddress';
import DeliveryAddress from '../checkout/DeliveryAddress';

type Props = {
  isEditProfile: boolean;
  isEditPassword: boolean;
  setIsEditProfile: React.Dispatch<React.SetStateAction<boolean>>;
  setIsEditPassword: React.Dispatch<React.SetStateAction<boolean>>;
  isEditBillingAddress: boolean;
  setIsEditBillingAddress: React.Dispatch<React.SetStateAction<boolean>>;
  isEditDeliveryAddress: boolean;
  setIsEditDeliveryAddress: React.Dispatch<React.SetStateAction<boolean>>;
};
const MyDetails = ({
  isEditProfile,
  isEditPassword,
  setIsEditProfile,
  setIsEditPassword,
  isEditBillingAddress,
  setIsEditBillingAddress,
  isEditDeliveryAddress,
  setIsEditDeliveryAddress,
}: Props) => {
  const { user } = useAppSelector((state) => state.auth.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLogout = () => {
    router.push('/');
    dispatch(clearCartProducts());
    dispatch(clearWishlistProducts());
    dispatch(logoutUser());
  };
  return (
    <div>
      <div className="w-[100%] sm:w-full">
        {!isEditPassword && (
          <>
            <div className="flex flex-col items-start gap-5 sm:gap-3">
              <Text as="p" size="text3xl" className="text-black-900 font-medium uppercase sm:!text-[18px]">
                My details
              </Text>
              {isEditProfile ? (
                <div className="w-full flex flex-col-reverse justify-between">
                  <div className="w-[80%] md:w-full">
                    <ProfileForm setProfile={setIsEditProfile} />
                  </div>
                </div>
              ) : (
                <div className="flex sm:flex-col w-full items-end justify-between ">
                  <div className="flex flex-col gap-3.5 sm:gap-2 w-[67%] sm:w-full">
                    <div className="grid grid-cols-3">
                      <Text as="p" size="textlg" className=" font-light capitalize tracking-[2.00px] text-gray-600 sm:!text-[12px]">
                        first name{' '}
                      </Text>
                      <Text as="p" size="textxl" className="text-black-900 col-span-2 font-normal capitalize tracking-[0.48px] sm:!text-[12px]">
                        : {user?.first_name}
                      </Text>
                    </div>
                    <div className="grid grid-cols-3">
                      <Text as="p" size="textlg" className=" font-light capitalize tracking-[2.00px] text-gray-600 sm:!text-[12px]">
                        Last Name
                      </Text>
                      <Text as="p" size="textxl" className="sm:!text-[12px] text-black-900 col-span-2 font-normal capitalize tracking-[0.48px] ">
                        : {user?.last_name}
                      </Text>
                    </div>
                    <div className="grid grid-cols-3">
                      <Text as="p" size="textlg" className=" font-light capitalize tracking-[2.00px] text-gray-600 sm:!text-[12px]">
                        Email
                      </Text>
                      <Text
                        as="p"
                        size="textxl"
                        className="sm:!text-[12px] text-black-900 col-span-2 font-normal break-words whitespace-nowrap text-wrap lowercase tracking-[0.48px]"
                      >
                        : {user?.email}
                      </Text>
                    </div>
                    <div className="grid grid-cols-3">
                      <Text as="p" size="textlg" className="font-light capitalize tracking-[2.00px] text-gray-600 sm:!text-[12px]">
                        Mobile Number
                      </Text>
                      <Text as="p" size="textxl" className="sm:!text-[12px] text-black-900 col-span-2 font-normal capitalize tracking-[0.48px]">
                        : {user?.phone ?? '----'}
                      </Text>
                    </div>
                    <div className="grid grid-cols-3">
                      <Text as="p" size="textlg" className=" font-light capitalize tracking-[2.00px] text-gray-600 sm:!text-[12px]">
                        Gender
                      </Text>
                      <Text as="p" size="textxl" className="sm:!text-[12px] text-black-900 col-span-2 font-normal capitalize tracking-[0.48px]">
                        : {user?.gender ?? '----'}
                      </Text>
                    </div>
                    <div className="grid grid-cols-3">
                      <Text as="p" size="textlg" className=" font-light capitalize tracking-[2.00px] text-gray-600 sm:!text-[12px]">
                        Date of Birth
                      </Text>
                      <Text as="p" size="textxl" className="sm:!text-[12px] text-black-900 col-span-2 font-normal capitalize tracking-[0.48px]">
                        : {user?.dob ? dayjs(user?.dob).format('Do MMMM YYYY') : '----'}
                      </Text>
                    </div>
                    <div className="grid grid-cols-3">
                      <Text as="p" size="textlg" className=" font-light capitalize tracking-[2.00px] text-gray-600 sm:!text-[12px]">
                        Date Of Anniversary
                      </Text>
                      <Text as="p" size="textxl" className="sm:!text-[12px] text-black-900 col-span-2 font-normal capitalize tracking-[0.48px]">
                        : {user?.doa ? dayjs(user?.doa).format('Do MMMM YYYY') : '----'}
                      </Text>
                    </div>
                  </div>
                  <Button
                    onClick={() => setIsEditProfile(true)}
                    type="default"
                    name="Edit Button"
                    className="!text-text_w !bg-secondary w-[348px] 2xl:w-[33%] !h-[45px] tracking-[1.50px] 2xl:text-[16px] xl:text-[16px] lg:text-[14px] sm:!text-[12px] lg:!h-[37px] uppercase"
                  >
                    edit
                  </Button>
                </div>
              )}
            </div>
            <div className="bg-gray-200 h-px mt-12 sm:mt-3" />
          </>
        )}

        <div className="mt-10 sm:mt-3 flex flex-col gap-10 sm:gap-3">
          <div className="flex flex-col items-start gap-5 sm:gap-3">
            <Text as="p" size="text3xl" className="text-black-900 text-[24px] font-medium uppercase lg:text-[20px] sm:!text-[18px]">
              {isEditPassword ? 'change password' : 'password'}
            </Text>
            {isEditPassword ? (
              <div className="w-full flex flex-col-reverse justify-between">
                <div className="sm:w-full w-[70%]">
                  <ChangePasswordForm setProfile={setIsEditPassword} />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center self-stretch ">
                  <div className="flex items-center flex-1 sm:self-stretch">
                    <Text as="p" size="textxl" className="text-black-900 font-normal tracking-[0.48px]">
                      ***********
                    </Text>
                  </div>
                  <Button
                    onClick={() => setIsEditPassword(true)}
                    type="default"
                    name="Change Button"
                    className="!text-text_w !bg-secondary w-[348px] uppercase 2xl:w-[33%] !h-[45px] tracking-[1.50px] 2xl:text-[16px] xl:text-[16px] lg:text-[14px] lg:!h-[37px] sm:!text-[12px]"
                  >
                    change
                  </Button>
                </div>
                <div className="bg-gray-200 h-[1px] mt-8 sm:mt-3 w-[100%]" />

                {/* This will show only when we have to edit or add billing address. */}
                {isEditBillingAddress ? (
                  <div className="w-full flex flex-col-reverse justify-between">
                    <div className="sm:w-full w-[70%]">
                      {/* <AddressForm setAddress={setIsEditBillingAddress} title='Edit'/> */}
                      <BillingAddress formState={isEditBillingAddress} setBillingAddress={setIsEditBillingAddress} />
                    </div>
                  </div>
                ) : user?.billing_address?.id ? (
                  // If we have already billing address then it will show here.
                  <div className="flex items-center self-stretch ">
                    <div className="sm:!max-w-[66%] flex flex-1 flex-col items-start gap-3 sm:gap-2 sm:self-stretch">
                      <Text as="p" size="text3xl" className="text-black-900 text-[24px] font-medium uppercase lg:text-[20px] sm:!text-[18px]">
                        BILLING ADDRESS
                      </Text>
                      <Text
                        as="p"
                        size="text2xl"
                        className="text-black-900 col-span-2 font-normal break-words whitespace-nowrap text-wrap tracking-[0.48px] mt-2 sm:!text-[12px] capitalize"
                      >
                        {user?.billing_address?.first_name} {user?.billing_address?.last_name}
                      </Text>
                      <Text
                        as="p"
                        size="textxl"
                        className="font-light tracking-[2.00px] text-gray-600 break-words sm:tracking-[0px] sm:!text-[12px]"
                        style={{ lineHeight: '28px' }}
                      >
                        {user?.billing_address?.email} <br />
                        {user?.billing_address?.address1}
                        {user?.billing_address?.address2 ? `, ${user.billing_address.address2}` : ''}
                        <br />
                        {(user?.billing_address?.cityDetails?.name ?? user?.billing_address?.city_text)
                          ? `${user?.billing_address?.cityDetails?.name ?? user?.billing_address?.city_text} - ${user?.billing_address?.postal_code ?? ''}`
                          : (user?.billing_address?.postal_code ?? '')}
                      </Text>
                      <Text
                        as="p"
                        size="text2xl"
                        className="text-black-900 col-span-2 font-normal break-words whitespace-nowrap text-wrap lowercase tracking-[0.48px] sm:!text-[12px]"
                      >
                        {user?.billing_address?.mobile}
                      </Text>
                    </div>
                    <Button
                      onClick={() => setIsEditBillingAddress(true)}
                      type="default"
                      name="Edit Button"
                      className="!text-text_w !bg-secondary w-[348px] uppercase 2xl:w-[33%]  !h-[45px] tracking-[1.50px] 2xl:text-[16px] xl:text-[16px] lg:text-[14px] lg:!h-[37px] mt-auto sm:!text-[12px]"
                    >
                      Edit
                    </Button>
                  </div>
                ) : (
                  // If we don't have billing address then it will show here.
                  <Button
                    onClick={() => setIsEditBillingAddress(true)}
                    type="default"
                    name="Change Button"
                    className="!text-text_w !bg-secondary w-[348px] uppercase 2xl:w-[33%] !h-[45px] tracking-[1.50px] 2xl:text-[16px] xl:text-[16px] lg:text-[14px] lg:!h-[37px] ml-auto sm:!text-[12px]"
                  >
                    Add Billing Address
                  </Button>
                )}
                <div className="bg-gray-200 h-[1px] mt-8 sm:mt-3 w-[100%]" />
                {/* This will show only when we have to edit or add delivery address */}
                {isEditDeliveryAddress ? (
                  <div className="w-full flex flex-col-reverse justify-between">
                    <div className="sm:w-full w-[70%]">
                      <DeliveryAddress formState={isEditDeliveryAddress} setIsEditDeliveryAddress={setIsEditDeliveryAddress} />
                    </div>
                  </div>
                ) : user?.delivery_address?.id ? (
                  // If we have already delivery address then it will show here.
                  <div className="flex items-center self-stretch ">
                    <div className="sm:!max-w-[66%] flex flex-1 flex-col items-start gap-3 sm:self-stretch">
                      <Text as="p" size="text3xl" className="text-black-900 text-[24px] font-medium uppercase lg:text-[20px] sm:!text-[18px]">
                        DELIVERY ADDRESS
                      </Text>
                      <Text
                        as="p"
                        size="text2xl"
                        className="text-black-900 col-span-2 font-normal break-words whitespace-nowrap text-wrap tracking-[0.48px] mt-2 sm:!text-[12px]"
                      >
                        {user?.delivery_address?.first_name} {user?.delivery_address?.last_name}
                      </Text>
                      <Text
                        as="p"
                        size="textxl"
                        className="font-light tracking-[2.00px] text-gray-600 sm:tracking-[0px] sm:!text-[12px]"
                        style={{ lineHeight: '28px' }}
                      >
                        {user?.delivery_address?.email} <br />
                        {user?.delivery_address?.address1}
                        {user?.delivery_address?.address2 ? `, ${user.delivery_address.address2}` : ''}
                        <br />
                        {(user?.delivery_address?.cityDetails?.name ?? user?.delivery_address?.city_text)
                          ? `${user?.delivery_address?.cityDetails?.name ?? user?.delivery_address?.city_text} - ${user?.delivery_address?.postal_code ?? ''}`
                          : (user?.delivery_address?.postal_code ?? '')}
                      </Text>
                      <Text
                        as="p"
                        size="text2xl"
                        className="text-black-900 col-span-2 font-normal break-words whitespace-nowrap text-wrap lowercase tracking-[0.48px] sm:!text-[12px]"
                      >
                        {user?.delivery_address?.mobile}
                      </Text>
                    </div>
                    <Button
                      onClick={() => setIsEditDeliveryAddress(true)}
                      type="default"
                      name="Edit Button"
                      className="!text-text_w !bg-secondary w-[348px] uppercase 2xl:w-[33%] !h-[45px] tracking-[1.50px] 2xl:text-[16px] xl:text-[16px] lg:text-[14px] lg:!h-[37px] mt-auto sm:!text-[12px]"
                    >
                      Edit
                    </Button>
                  </div>
                ) : (
                  // If we don't have delivery address then it will show here.
                  <Button
                    onClick={() => setIsEditDeliveryAddress(true)}
                    type="default"
                    name="Change Button"
                    className="!text-text_w !bg-secondary w-[348px] uppercase 2xl:w-[33%] !h-[45px] tracking-[1.50px] 2xl:text-[16px] xl:text-[16px] lg:text-[14px] lg:!h-[37px] ml-auto"
                  >
                    Add Delivery Address
                  </Button>
                )}
                <div className="bg-gray-200 h-[1px] mt-8 sm:mt-3 w-[100%]" />

                <div className="mt-10 sm:mt-3 w-full">
                  <ConfigProvider
                    theme={{
                      components: {
                        Button: {
                          borderRadius: 0,
                          colorPrimary: '#c5ccb4',
                          colorPrimaryHover: '#e5ccb4',
                          algorithm: true,
                        },
                      },
                    }}
                  >
                    <Button
                      type="default"
                      name="Sign Out Button"
                      onClick={handleLogout}
                      iconPosition="end"
                      icon={<PiSignOut className="w-5 h-5" />}
                      className="!text-text_w !bg-secondary w-[348px] sm:!w-full uppercase 2xl:w-[33%] !h-[45px] tracking-[1.50px] 2xl:text-[16px] xl:text-[16px] lg:text-[14px] lg:!h-[37px] "
                    >
                      Sign Out
                    </Button>
                  </ConfigProvider>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyDetails;
