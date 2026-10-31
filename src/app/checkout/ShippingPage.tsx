import React from 'react';

import dayjs from 'dayjs';

import { Button, Text } from '@/components';

type Props = {
  BillingAddress: boolean;
  setBillingAddress: React.Dispatch<React.SetStateAction<boolean>>;
  shippingDates: any;
  setShippingDates: any;
  shippingMaxDate: any;
};
const ShippingPage = ({ BillingAddress, setBillingAddress, setShippingDates, shippingDates, shippingMaxDate }: Props) => {
  return (
    <div className="flex flex-col gap-10 self-stretch">
      {BillingAddress ? (
        <div className="flex flex-col items-start gap-3">
          <Text as="p" size="text5xl" className="text-black-900 font-normal uppercase">
            shipping
          </Text>
          <div className="flex items-center self-stretch">
            <div className="flex flex-1 flex-col items-start gap-2.5">
              <Text as="p" size="textlg" className="text-black-900 text-[20px] font-medium tracking-[0.48px] lg:text-[20px]">
                Shipping on us: Free
              </Text>
              <Text as="p" size="textmd" className=" font-normal tracking-[1.00px] ">
                {shippingDates.length > 0
                  ? shippingDates?.join(' to ')
                  : [dayjs().format('YYYY/MM/DD'), dayjs().add(15, 'days').format('YYYY/MM/DD')].join(' to ')}
              </Text>
            </div>
            <Button
              name="Edit Button"
              size="sm"
              shape="square"
              variant="fill"
              color="gray_400"
              className="text-black-900 w-[33%] flex flex-row items-center justify-center text-center uppercase tracking-[2.00px] lg:text-[17px] sm:px-4"
              onClick={() => setBillingAddress(false)}
            >
              edit
            </Button>
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

export default ShippingPage;
