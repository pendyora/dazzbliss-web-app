/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';

import { Button, Image, Pagination, Steps, Table, TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import ralativeTime from 'dayjs/plugin/relativeTime';
import { useRouter, useSearchParams } from 'next/navigation';
import { LuLoader } from 'react-icons/lu';
import { MdOutlineArrowBackIosNew, MdOutlineClose } from 'react-icons/md';

import { useAppDispatch, useAppSelector } from '@/store';
import { fetchGetOrdeDetails, fetchOrderList } from '@/store/slices/Order/orderSlice';
import { formatCurrency } from '@/utils/common';

import { OPEN_REQUEST_STATUSES, REQUEST_TYPE_LABEL } from './OrderRequest/constants';
import OrderRequestPanel, { itemRequestLabels } from './OrderRequest/OrderRequestPanel';

const steps = [
  {
    title: 'Confirmed',
  },
  {
    title: 'Manufacturing',
  },
  {
    title: 'Out for Delivery',
  },
  {
    title: 'Delivered',
  },
];
dayjs.extend(ralativeTime);

/** "Return requested" etc. under the status badge while a customer request is still open. */
const openRequestLabel = (order: any) => {
  const open = order?.orderRequests?.find((r: any) => OPEN_REQUEST_STATUSES.includes(Number(r.status)));
  return open ? `${REQUEST_TYPE_LABEL[open.request_type]} in progress` : null;
};
const OrderList = () => {
  const { loading, orderList, orderDetails } = useAppSelector((state) => state.order);
  const { data } = useAppSelector((state) => state.master);
  const { user } = useAppSelector((state) => state.auth.auth);

  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('order');

  const [dataList, setDataList] = useState([]);
  const [dataDetails, setDataDetails] = useState<any>({});
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState(1);
  const fetchProducts = async () => {
    await dispatch(fetchOrderList());
  };
  useEffect(() => {
    if (!user) {
      return router.push(`/`);
    } else {
      if (!id) {
        return router.push(`/profile/purchases`);
      }
    }
  }, [user, id]);
  useEffect(() => {
    setDataList(orderList);
  }, [orderList]);

  useEffect(() => {
    fetchProducts();
  }, [dispatch]);

  useEffect(() => {
    if (orderDetails && orderDetails.order_id) {
      setDataDetails(orderDetails);
    }
  }, [orderDetails]);
  useEffect(() => {
    if (user && id) {
      dispatch(fetchGetOrdeDetails(id));
    }
  }, [user, id]);

  const items = steps.map((item) => ({ key: item.title, title: item.title }));

  // Cancel / return info comes with the order detail; empty for non-website orders.
  const eligibility = dataDetails?.request_eligibility ?? null;
  const requests: any[] = dataDetails?.order_requests ?? [];

  // `total_coupon_price` / `total_discount_price` hold the order total *after* the discount, not
  // the discount itself, so the coupon saving is the difference from whatever the total was
  // before the code was applied. Any product-level discount is already struck on the line items.
  const coupon = dataDetails?.couponDetails;
  const preCouponTotal = Number(dataDetails?.total_discount_price ?? dataDetails?.total_price ?? 0);
  const couponSaving = dataDetails?.total_coupon_price ? Math.max(0, preCouponTotal - Number(dataDetails?.total_coupon_price)) : 0;
  // discount_type: 1 = fixed amount, 2 = percentage. A percentage reads the same in every
  // currency; a fixed `discount_value` is stored in USD and is not converted on read, so it is
  // left off rather than shown as a wrong figure - the saving row below is already converted.
  const couponRule = coupon && Number(coupon?.discount_type) === 2 ? `${coupon?.discount_value}% off` : null;

  // Delivery date worked out and worded exactly like the order invoice's "Expected Delivery": each
  // item stores the PDP's estimation_date, and the window runs from the earliest item's date to the
  // slowest item's plus the PDP's 2-day range, e.g. "October 12 - 14, 2026".
  // Free gifts are left out, as on the invoice: they ship with the order, so their own (often
  // earlier) date would pull the start of the window forward.
  const estimationDates = (dataDetails?.orderDetails ?? [])
    .filter((item: any) => !item?.is_free_gift)
    .map((item: any) => item?.estimation_date && dayjs(item.estimation_date))
    .filter((d: any) => d?.isValid())
    .sort((a: dayjs.Dayjs, b: dayjs.Dayjs) => a.valueOf() - b.valueOf());
  const deliveryFrom = estimationDates[0];
  const deliveryTo = estimationDates[estimationDates.length - 1]?.add(2, 'day');
  const deliveryDate = !deliveryFrom
    ? null
    : !deliveryFrom.isSame(deliveryTo, 'year')
      ? `${deliveryFrom.format('MMMM DD, YYYY')} - ${deliveryTo.format('MMMM DD, YYYY')}`
      : deliveryFrom.isSame(deliveryTo, 'month')
        ? `${deliveryFrom.format('MMMM DD')} - ${deliveryTo.format('DD, YYYY')}`
        : `${deliveryFrom.format('MMMM DD')} - ${deliveryTo.format('MMMM DD, YYYY')}`;

  const columns: TableColumnsType<any> = [
    {
      title: 'ORDER DATE',
      dataIndex: 'createdAt',
      key: 'orderDate',
      render: (date: string) => <p>{dayjs(date).format('D MMM, YYYY')}</p>,
    },
    {
      title: 'ORDER ID',
      dataIndex: 'order_id',
      key: 'order_id',
    },
    {
      title: 'STATUS',
      dataIndex: 'order_status',
      key: 'status',
      render: (status: number, record: any) => {
        return (
          <>
            <div
              className={`px-2 flex items-center justify-center h-[28px] w-[150px] text-center rounded ${
                status === 0
                  ? 'bg-amber-100 text-amber-600'
                  : status === 1
                    ? 'bg-amber-100 text-amber-600'
                    : status === 2
                      ? 'bg-blue-100 text-blue-600'
                      : status === 3
                        ? 'bg-purple-100 text-purple-600'
                        : status === 4
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
              }`}
            >
              {status == 0
                ? 'Processing'
                : status == 1
                  ? ' Confirmed'
                  : status == 2
                    ? 'Manufacturing'
                    : status == 3
                      ? 'Out for Delivery'
                      : status == 4
                        ? ' Delivered'
                        : status >= 5
                          ? // 6 = Rejected, 7 = Payment Cancelled internally; the customer only ever sees "Cancelled".
                            'Cancelled'
                          : ''}
            </div>
            {openRequestLabel(record) && <p className="mb-0 mt-1 text-[12px] text-amber-600">{openRequestLabel(record)}</p>}
          </>
        );
      },
    },

    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <div
          className={`px-2 cursor-pointer flex items-center uppercase justify-center  !bg-secondary !text-text_w  h-[28px] w-[100px] text-center`}
          onClick={() => {
            setDataDetails(record);
            router.push(`/profile/purchases?order=${record?.order_id}`);
          }}
        >
          View
        </div>
      ),
    },
  ];
  return (
    <div>
      <div className="">
        {loading && (
          <div className="w-full flex justify-center items-center min-h-[50vh]">
            {/* <Spin></Spin> */}
            <div className="w-full flex justify-center items-center">
              <LuLoader className="h-10 w-10 animate-spin" />
            </div>
          </div>
        )}
        {id && !loading && dataDetails && Object.keys(dataDetails).length > 0 ? (
          <>
            <div className="flex flex-col gap-3 p-3 sm:px-0">
              <Button
                type="default"
                className="w-28 !bg-secondary !text-text_w uppercase rounded-lg sm:!text-[12px] sm:!h-[35px]"
                onClick={() => {
                  setDataDetails({});
                  router.push(`/profile/purchases`);
                }}
              >
                <MdOutlineArrowBackIosNew /> Back
              </Button>
              <div className="py-7 lg:py-4 md:flex-wrap ">
                <Steps
                  // `order_status` 1-4 are Confirmed / Manufacturing / Out for Delivery / Delivered,
                  // so the step index is one less than the status - a freshly placed order (1) sits
                  // ON "Confirmed" rather than past it. Status 0 (payment pending) and 5+ (cancelled,
                  // rejected) have no step of their own, and -1 highlights nothing rather than
                  // rendering every step as complete.
                  current={
                    Number(dataDetails?.order_status) >= 1 && Number(dataDetails?.order_status) <= 4 ? Number(dataDetails.order_status) - 1 : -1
                  }
                  // A delivered order is finished, not still in progress, so the last step is ticked
                  // rather than left as the active one.
                  status={Number(dataDetails?.order_status) === 4 ? 'finish' : 'process'}
                  // progressDot
                  className="p-4 py-10 flex mb-10 md:p-2 order-details-progress"
                  items={items}
                />
              </div>

              {/* Cancellation summary.
                  Status 5 (cancelled) and 6 (rejected) both read as "Cancelled" to the buyer —
                  they are never told an order was refused rather than cancelled. The reason is
                  shown ONLY for a real cancellation: a rejection reason is written for the
                  operations team and the API does not send it here at all. */}
              {dataDetails?.order_status >= 5 && (
                <div className="mb-4 rounded-lg border border-[#e7c3c3] bg-[#fdf5f5] p-4 md:text-[15px]">
                  <p className="mb-1 font-semibold text-[#a13b3b]">This order was cancelled</p>
                  {(dataDetails?.cancelled_at || dataDetails?.rejected_at) && (
                    <p className="mb-1 text-[#6b5a5a]">
                      Cancelled on {dayjs(dataDetails?.cancelled_at || dataDetails?.rejected_at).format('D MMM, YYYY')}
                    </p>
                  )}
                  {dataDetails?.cancellation_reason_text && <p className="mb-1 text-[#6b5a5a]">Reason: {dataDetails.cancellation_reason_text}</p>}
                  <p className="mb-0 text-[#6b5a5a]">
                    {Number(dataDetails?.total_refunded_amount ?? 0) > 0
                      ? `We have refunded ${formatCurrency(Number(dataDetails.total_refunded_amount))} to your original payment method. It can take 5–10 business days to appear on your statement.`
                      : 'You have not been charged for this order.'}
                  </p>
                </div>
              )}

              {/* Customer cancel / return: entry point and request tracking. */}
              <OrderRequestPanel
                orderNumber={dataDetails?.order_id}
                eligibility={eligibility}
                requests={requests}
                onChanged={() => {
                  dispatch(fetchGetOrdeDetails(dataDetails?.order_id));
                  fetchProducts();
                }}
              />

              <div className="flex bg-[#f9f9f9] md:flex-col rounded-lg gap-2 p-2 shadow-[0_4px_4px_0_#e2e2e23f] md:text-[15px]">
                <div className="flex px-2 sm:px-3 md:px-6 py-2 flex-col gap-2 w-1/2 md:w-full">
                  <div className="flex">
                    <p className="w-[30%] min-w-[110px] shrink-0 md:w-1/2">Order Date</p>
                    <p className="">: {dayjs(dataDetails?.createdAt).format('D MMM, YYYY')}</p>
                  </div>
                  <div className="flex">
                    <p className="w-[30%] min-w-[110px] shrink-0 md:w-1/2"> Order No</p> <p className="">: {dataDetails?.order_id}</p>
                  </div>
                  {/* The delivery window only means something while the order is still on its way. */}
                  {/* Hidden only for cancelled orders (5 / 6), which will not be delivered. */}
                  {Number(dataDetails?.order_status) < 5 && deliveryDate && (
                    <div className="flex">
                      <p className="w-[30%] min-w-[110px] shrink-0 md:w-1/2">Delivery Date</p>
                      <p className="">: {deliveryDate}</p>
                    </div>
                  )}
                  {dataDetails?.shipped_date && (
                    <div className="flex">
                      <p className="w-[30%] min-w-[110px] shrink-0 md:w-1/2">Shipped On</p>
                      <p className="">: {dayjs(dataDetails.shipped_date).format('D MMM, YYYY')}</p>
                    </div>
                  )}
                  {dataDetails?.delivered_date && (
                    <div className="flex">
                      <p className="w-[30%] min-w-[110px] shrink-0 md:w-1/2">Delivered On</p>
                      <p className="">: {dayjs(dataDetails.delivered_date).format('D MMM, YYYY')}</p>
                    </div>
                  )}
                  {dataDetails?.courier_name?.trim() && (
                    <div className="flex">
                      <p className="w-[30%] min-w-[110px] shrink-0 md:w-1/2">Courier Name</p>
                      <p className="">: {dataDetails.courier_name}</p>
                    </div>
                  )}
                  {dataDetails?.track_id && (
                    <div className="flex">
                      <p className="w-[30%] min-w-[110px] shrink-0 md:w-1/2">Tracking ID</p>
                      <p className="break-all">
                        :{' '}
                        {dataDetails?.tracking_url ? (
                          <a href={dataDetails.tracking_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                            {dataDetails.track_id}
                          </a>
                        ) : (
                          dataDetails.track_id
                        )}
                      </p>
                    </div>
                  )}
                  {/* A refund can also be issued against an order that is still open, so this
                      line is not tied to the cancellation banner above. */}
                  {Number(dataDetails?.total_refunded_amount ?? 0) > 0 && (
                    <>
                      <div className="flex">
                        <p className="w-[30%] min-w-[110px] shrink-0 md:w-1/2">Refunded</p>
                        <p className="">: {formatCurrency(Number(dataDetails?.total_refunded_amount))}</p>
                      </div>
                      <div className="flex">
                        <p className="w-[30%] min-w-[110px] shrink-0 md:w-1/2">Refunded To</p>
                        <p className="">: Original payment method</p>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex flex-col gap-2 w-1/2 md:w-full">
                  <div className="px-2 flex flex-col gap-2 py-2 sm:px-0 sm:py-0">
                    {dataDetails?.orderDetails?.map((item: any) => {
                      return (
                        <>
                          <div className="flex px-4 sm:px-3 lg:grid lg:grid-cols-3 md:grid-cols-2 gap-4 ">
                            <p className="w-[50%] whitespace-nowrap lg:w-auto lg:whitespace-normal lg:col-span-2 md:col-span-1 flex items-center lg:text-[16px] sm:text-[14px]">
                              {item.jewelryOrderItems?.jewelrySubType?.group}
                              <span className="ml-1 flex items-center">
                                (<MdOutlineClose />
                                {item.count})
                              </span>
                            </p>
                            <div className="md:-ml-2 sm:!text-[14px] whitespace-nowrap">
                              {': '}
                              {/* Only a product-level flat/percentage discount strikes the line price.
                                  Coupon savings are reflected in the Paid Amount, not by striking the item. */}
                              {item?.is_free_gift ? (
                                <span className="inline-block whitespace-nowrap bg-secondary px-1.5 py-[1px] align-middle font-sans text-[9px] uppercase leading-[14px] tracking-[1px] text-text_w">
                                  Free Gift
                                </span>
                              ) : (
                                <>
                                  <span
                                    className={`!font-castoro ${item?.jewelry_discount_price ? 'line-through text-[14px] text-gray-500 mr-2' : ''}`}
                                  >
                                    {formatCurrency(item?.jewelry_price + item?.appraisal_amount) || '-'}
                                  </span>
                                  {item?.jewelry_discount_price && (
                                    <span className="!font-castoro">
                                      {formatCurrency(item?.jewelry_discount_price + item?.appraisal_amount) || '-'}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          {item?.engravingText && item?.engravingText?.Text.trim() != '' && (
                            <div className="flex px-4 sm:px-3 lg:grid lg:grid-cols-3 md:grid-cols-2 gap-4 ">
                              <p className="w-[50%] whitespace-nowrap lg:w-auto lg:whitespace-normal lg:col-span-2 md:col-span-1 flex items-center lg:text-[16px] sm:text-[14px]">
                                {' '}
                                Engraving (<MdOutlineClose />
                                {item.count})
                              </p>
                              <div className="md:-ml-2 sm:!text-[14px] whitespace-nowrap">
                                {': '}
                                <span
                                  className={`!font-castoro ${item?.jewelry_discount_price ? 'line-through text-[14px] text-gray-500 mr-2' : ''}`}
                                >
                                  {item?.engravingText?.Text.trim() != '' ? formatCurrency(item.engraving_price) : '0'}
                                </span>
                              </div>
                            </div>
                          )}
                          {item.diamondDetails && (
                            <div className="flex px-4 sm:px-3 lg:grid lg:grid-cols-3 md:grid-cols-2 gap-4 ">
                              <p className="w-[50%] whitespace-nowrap lg:w-auto lg:whitespace-normal lg:col-span-2 md:col-span-1 flex items-center lg:text-[16px] sm:text-[14px]">
                                {item?.diamondDetails?.diamond_type == 2 ? 'Lab' : 'Natural'}
                                {' Diamond'}
                                (<MdOutlineClose />
                                {item.count})
                              </p>

                              <div className="md:-ml-2 sm:!text-[14px] whitespace-nowrap">
                                {': '}
                                {item?.diamond_amount && <span className="!font-castoro">{formatCurrency(item?.diamond_amount) || '-'}</span>}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })}
                    {/* Which code the buyer used, not just that some money came off. Shown whenever a
                        coupon is attached to the order, even if the saving works out to nothing. */}
                    {coupon?.coupon_code && (
                      <div className="flex px-4 sm:px-3 lg:grid lg:grid-cols-3 md:grid-cols-2 gap-4">
                        <p className="w-[50%] whitespace-nowrap lg:w-auto lg:whitespace-normal lg:col-span-2 md:col-span-1 flex items-center lg:text-[16px] sm:text-[14px]">
                          Discount Code
                        </p>
                        <div className="md:-ml-2 sm:!text-[14px] flex flex-wrap items-center gap-2">
                          <span className="whitespace-nowrap">
                            {': '}
                            <span className="rounded bg-[#E9F8EC] px-2 py-0.5 text-[13px] font-semibold uppercase tracking-wide text-primary">
                              {coupon?.coupon_code}
                            </span>
                          </span>
                          {couponRule && <span className="text-[13px] text-gray-600">({couponRule})</span>}
                        </div>
                      </div>
                    )}
                    {couponSaving > 0 && (
                      <div className="flex px-4 sm:px-3 lg:grid lg:grid-cols-3 md:grid-cols-2 gap-4">
                        <p className="w-[50%] whitespace-nowrap lg:w-auto lg:whitespace-normal lg:col-span-2 md:col-span-1 flex items-center lg:text-[16px] sm:text-[14px]">
                          Discount Applied
                        </p>
                        <div className="md:-ml-2 sm:!text-[14px] whitespace-nowrap">
                          {': '}
                          <span className="!font-castoro text-[#15803d]">- {formatCurrency(couponSaving)}</span>
                        </div>
                      </div>
                    )}
                    <div className="flex px-4 lg:grid lg:grid-cols-3 md:grid-cols-2 py-2 sm:px-3 sm:gap-0 bg-[#E9F8EC] font-semibold gap-4">
                      <p className=" w-[50%] lg:col-span-2 whitespace-nowrap md:col-span-1 flex  items-center">Paid Amount</p>
                      <div className=" tracking-wide">
                        {': '}
                        {dataDetails?.after_gst_amount && (
                          <span className="!font-castoro">{formatCurrency(dataDetails?.after_gst_amount) || '-'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {dataDetails?.orderDetails?.map((item: any, index: number) => {
                return (
                  <div className=" p-3.5 sm:px-3 bg-[#f9f9f9] rounded-lg shadow-[0_4px_4px_0_#e2e2e23f] " key={index}>
                    <div className="flex px-1 pb-2 sm:grid sm:grid-cols-4 sm:gap-3">
                      <div className="w-[100px] sm:col-span-1 md:w-[80px] md:h-auto sm:w-full sm:block hidden">
                        <Image
                          src={item?.skuOrderItems?.carat_images?.[0] || '/images/no_images.svg'}
                          alt="Product Image"
                          preview={false}
                          fallback="/images/no_images.svg"
                          className="w-[100px] md:w-[80px] md:h-auto object-contain sm:w-full"
                        />
                      </div>
                      <div className="flex flex-wrap items-start gap-x-2 gap-y-1 sm:col-span-3">
                        {item?.is_free_gift && (
                          <span className="mt-[6px] shrink-0 bg-secondary px-2 py-[2px] font-sans text-[9px] uppercase leading-[14px] tracking-[1.2px] text-text_w">
                            Free Gift
                          </span>
                        )}
                        <p className="tracking-wide text-[20px] font-medium sm:text-[15px]">{item.jewelryOrderItems.fullTitle}</p>
                        {itemRequestLabels(item, requests).map((label) => (
                          <span
                            key={label}
                            className="mt-[5px] shrink-0 rounded-full border border-[#d6dccb] bg-white px-2 py-[1px] text-[11px] uppercase tracking-[1px] text-primary"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-6 sm:flex-col justify-between md:gap-[10px] sm:gap-1">
                      <div className="flex sm:flex-col items-start  sm:w-full w-[60%] md:w-[65%] gap-3 md:text-[15px]">
                        <div className="w-[110px] shrink-0 md:w-[85px] md:h-auto sm:w-full sm:hidden">
                          <Image
                            src={item?.skuOrderItems?.carat_images?.[0] || '/images/no_images.svg'}
                            alt="Product Image"
                            preview={false}
                            fallback="/images/no_images.svg"
                            className="w-[110px] md:w-[85px] md:h-auto object-contain sm:w-full"
                          />
                        </div>
                        <div className="flex flex-col sm:w-full flex-1 min-w-0 gap-2 sm:gap-1 sm:mx-4">
                          {/* <div className="flex sm:text-[14px]">
                            <p className="w-[100px] shrink-0 sm:w-[40%]">Type</p>
                            <p className=""> : {item?.jewelryOrderItems?.jewelrySubType?.group || '-'}</p>
                          </div>
                          <div className="flex sm:text-[14px]">
                            <p className="w-[100px] shrink-0 sm:w-[40%]">Sub Type</p>
                            <p className=""> : {item?.jewelryOrderItems?.jewelrySubType?.name || '-'}</p>
                          </div>
                          <div className="flex sm:text-[14px]">
                            <p className="w-[100px] shrink-0 sm:w-[40%]">Code</p>
                            <p className=""> : {item?.jewelryOrderItems?.code || '-'}</p>
                          </div> */}
                          <div className="flex sm:text-[14px]">
                            <p className="w-[100px] shrink-0 sm:w-[40%]">Metal Type</p>
                            <p className="flex flex-1 gap-1">
                              <span>:</span>
                              <span>
                                {[
                                  data.find((ele: any) => ele.id == item?.skuOrderItems?.metal_type_id)?.name,
                                  data.find((ele: any) => ele.id == item?.skuOrderItems?.metal_color_id)?.name,
                                ]
                                  .filter(Boolean)
                                  .join(' ') || '-'}
                              </span>
                            </p>
                          </div>
                          {data.find((ele: any) => ele.id == item?.skuOrderItems?.carat_id)?.name && (
                            <div className="flex sm:text-[14px]">
                              <p className="w-[100px] shrink-0 sm:w-[40%]">Carat Weight</p>
                              <p className=""> : {data.find((ele: any) => ele.id == item?.skuOrderItems?.carat_id)?.name} ct</p>
                            </div>
                          )}
                          {(item?.jewelryOrderItems?.jewelrySubType?.parent_code === 'WEDDING_BANDS' ||
                            item?.jewelryOrderItems?.jewelrySubType?.parent_code === 'ENGAGEMENT_RINGS') && (
                            <div className="flex sm:text-[14px]">
                              <p className="w-[100px] shrink-0 sm:w-[40%]">Ring Size</p>
                              <p className=""> : {item.ring_size || '-'}</p>
                            </div>
                          )}
                          {item?.skuOrderItems?.bracelet_length_ids && (
                            <div className="flex sm:text-[14px]">
                              <p className="w-[100px] shrink-0 sm:w-[40%]">Bracelet Length - Inch</p>
                              <p className=""> : {data.find((el: any) => el.id === item?.skuOrderItems?.bracelet_length_ids)?.name}</p>
                            </div>
                          )}
                          {item?.skuOrderItems?.band_width_ids && (
                            <div className="flex sm:text-[14px]">
                              <p className="w-[100px] shrink-0 sm:w-[40%]">Band Width - mm</p>
                              <p className=""> : {data.find((el: any) => el.id === item?.skuOrderItems?.band_width_ids)?.name}</p>
                            </div>
                          )}
                          <div className="flex sm:text-[14px]">
                            <p className="w-[100px] shrink-0 sm:w-[40%]">Qty</p>
                            <p className=""> : {item.count || '-'}</p>
                          </div>
                          {/* {item?.skuOrderItems?.centerDiamondDetails?.diamond_type && (
                            <div className="flex sm:text-[14px]">
                              <p className="w-[100px] shrink-0 sm:w-[40%]">Stone Type</p>
                              <p className="">
                                {' '}
                                :{' '}
                                {item.skuOrderItems.centerDiamondDetails.diamond_type == 'N'
                                  ? 'Natural Diamond'
                                  : item.skuOrderItems.centerDiamondDetails.diamond_type == 'L'
                                    ? 'Lab Grown Diamond'
                                    : item.skuOrderItems.centerDiamondDetails.diamond_type == 'NG'
                                      ? 'Natural Gemstone'
                                      : 'Lab Gemstone'}
                              </p>
                            </div>
                          )} */}
                        </div>
                      </div>
                      <div className="flex flex-col  sm:w-full  w-[40%] lg:w-[42%] md:text-[15px] sm:mx-4 sm:gap-1 gap-2">
                        {/* <p className="tracking-wide">Discount Amount: -</p> */}
                        <div className="flex sm:text-[14px]">
                          <p className="w-[130px] shrink-0 whitespace-nowrap sm:w-[40%]">Amount</p>
                          <div className="">
                            {': '}
                            {item?.is_free_gift ? (
                              <>
                                {Number(item?.skuOrderItems?.selling_price) > 0 && (
                                  <span className="!font-castoro mr-2 text-[14px] text-gray-500 line-through">
                                    {formatCurrency(Math.ceil(Number(item.skuOrderItems.selling_price)))}
                                  </span>
                                )}
                                <span className="font-sans text-[13px] font-semibold uppercase tracking-[1px] text-secondary">Free</span>
                              </>
                            ) : (
                              <span className={`!font-castoro ${item?.jewelry_discount_price ? 'line-through text-[14px] text-gray-500 mr-2' : ''}`}>
                                {formatCurrency(item?.jewelry_price + item?.appraisal_amount) || '-'}
                              </span>
                            )}
                            {item?.jewelry_discount_price && (
                              <span className="!font-castoro">
                                {formatCurrency(item?.jewelry_discount_price ? item?.jewelry_discount_price : item?.jewelry_price) || '-'}
                              </span>
                            )}
                          </div>
                        </div>
                        {(item?.ashclair_sku || item?.skuOrderItems?.sku_code) && (
                          <div className="flex sm:text-[14px]">
                            <p className="w-[130px] shrink-0 whitespace-nowrap sm:w-[40%]">SKU</p>
                            <p className="flex flex-1 gap-1">
                              <span>:</span>
                              <span className="break-all">{item?.ashclair_sku || item?.skuOrderItems?.sku_code}</span>
                            </p>
                          </div>
                        )}
                        {item?.is_appraisal && (
                          <div className="flex sm:text-[14px]">
                            <p className="w-[130px] shrink-0 whitespace-nowrap sm:w-[40%]">Appraisal Price</p>
                            <p className=""> : {formatCurrency(item.appraisal_amount) || '-'}</p>
                          </div>
                        )}
                        {item?.appraisalDetails && (
                          <div className="flex sm:text-[14px]">
                            <p className="w-[130px] shrink-0 whitespace-nowrap sm:w-[40%]">Appraisal</p>
                            <p className="">
                              {' '}
                              :{' '}
                              <span
                                onClick={() => window.open(item?.appraisalDetails?.appraisal_link, '_blank')}
                                className="text-blue-600 underline cursor-pointer"
                              >
                                Download
                              </span>
                            </p>
                          </div>
                        )}
                        {item?.is_warranty && (
                          <div className="flex sm:text-[14px]">
                            <p className="w-[130px] shrink-0 whitespace-nowrap sm:w-[40%]">Warranty Price</p>
                            <p className="">
                              {' '}
                              : {item?.warranty_year} Year {formatCurrency(item.warranty_amount) || '-'}
                            </p>
                          </div>
                        )}
                        {item?.engravingText?.Text?.trim() && (
                          <div className="flex sm:text-[14px]">
                            <p className="w-[130px] shrink-0 whitespace-nowrap sm:w-[40%]">Engraving Text</p>
                            <p className="" style={{ fontFamily: item?.engravingText?.fontFamily }}>
                              : {item?.engravingText?.Text.trim() || '-'}
                            </p>
                          </div>
                        )}
                        {item?.engravingText?.Text?.trim() && (
                          <div className="flex sm:text-[14px]">
                            <p className="w-[130px] shrink-0 whitespace-nowrap sm:w-[40%]">Engraving Font</p>
                            <p className=""> : {item?.engravingText?.fontFamily || '-'}</p>
                          </div>
                        )}
                        {/* <div className="flex sm:text-[14px]">
                          <p className="w-[100px] shrink-0 sm:w-[40%]">Type</p>
                          <p className=""> : {item.jewelryOrderItems.customisable == true ? 'Customized' : 'Premade'}</p>
                        </div> */}
                      </div>
                    </div>
                    {item?.diamondDetails && (
                      <div className="flex flex-col gap-3 sm:mt-3">
                        <p className="text-[16px] mt-2 uppercase font-semibold text-[#090909]">Diamond Details</p>
                        <div className="flex gap-6 sm:flex-col justify-between md:gap-[10px] sm:gap-1 sm:mx-2">
                          <div className="flex items-start sm:justify-between  sm:w-full w-[60%] md:w-[65%] gap-3 md:text-[15px] ">
                            <div className="w-[100px] md:w-[80px] md:h-auto sm:w-1/3">
                              <Image
                                src={item.diamondDetails?.imageFile || '/images/no_images.svg'}
                                alt="Product Image"
                                preview={false}
                                fallback="/images/no_images.svg"
                                className="w-[100px] md:w-[80px] md:h-auto object-contain sm:w-full"
                              />
                            </div>
                            <div className="flex flex-col sm:w-full w-2/3 lg:w-2/3 gap-2 sm:gap-1">
                              <div className="flex sm:text-[14px]">
                                <p className="w-[100px] shrink-0 sm:w-[40%]">Stone No.</p>
                                <p className="">: {item?.diamondDetails?.stock_no || '-'}</p>
                              </div>
                              <div className="flex sm:text-[14px]">
                                <p className="w-[100px] shrink-0 sm:w-[40%]">Shape</p>
                                <p className="">: {item?.diamondDetails?.shape_name || '-'}</p>
                              </div>
                              <div className="flex sm:text-[14px]">
                                <p className="w-[100px] shrink-0 sm:w-[40%]">Type</p>
                                <p className="">: {item?.diamondDetails?.diamond_type == 2 ? 'Lab' : 'Natural'}</p>
                              </div>
                              <div className="flex sm:text-[14px]">
                                <p className="w-[100px] shrink-0 sm:w-[40%]">Qty</p>
                                <p className=""> : {item.count || '-'}</p>
                              </div>
                            </div>
                          </div>
                          <div className="sm:flex hidden items-start sm:justify-between  sm:w-full w-[60%] md:w-[65%] gap-3 md:text-[15px] ">
                            <div className="w-[100px] md:w-[80px] md:h-auto sm:w-1/3"></div>
                            <div className=" flex flex-col  sm:w-full  w-[40%] lg:w-[42%] md:text-[15px] sm:gap-1 gap-2">
                              {/* <p className="tracking-wide">Discount Amount: -</p> */}
                              <div className="flex sm:text-[14px]">
                                <p className="w-[100px] shrink-0 sm:w-[40%]">Report No.</p>
                                <div className="">
                                  {': '}
                                  <a href={item?.diamondDetails?.certificateFile} target="_blank" rel="noreferrer">
                                    {item?.diamondDetails?.report_no}
                                  </a>
                                </div>
                              </div>
                              <div className="flex sm:text-[14px]">
                                <p className="w-[100px] shrink-0 sm:w-[40%]">Carat</p>
                                <p className="">: {item?.diamondDetails?.carats || '-'}</p>
                              </div>
                              <div className="flex sm:text-[14px]">
                                <p className="w-[100px] shrink-0 sm:w-[40%]">Color</p>
                                <p className="">: {item.diamondDetails.col || '-'}</p>
                              </div>

                              <div className="flex sm:text-[14px]">
                                <p className="w-[100px] shrink-0 sm:w-[40%]">Lab</p>
                                <p className="">: {item.diamondDetails.lab || '-'}</p>
                              </div>
                            </div>
                          </div>
                          <div className="sm:hidden flex flex-col  sm:w-full  w-[40%] lg:w-[42%] md:text-[15px] sm:gap-1 gap-2">
                            {/* <p className="tracking-wide">Discount Amount: -</p> */}
                            <div className="flex sm:text-[14px]">
                              <p className="w-[100px] shrink-0 sm:w-[40%]">Report No.</p>
                              <div className="">
                                {': '}
                                <a href={item?.diamondDetails?.certificateFile} target="_blank" rel="noreferrer">
                                  {item?.diamondDetails?.report_no}
                                </a>
                              </div>
                            </div>
                            <div className="flex sm:text-[14px]">
                              <p className="w-[100px] shrink-0 sm:w-[40%]">Carat</p>
                              <p className="">: {item?.diamondDetails?.carats || '-'}</p>
                            </div>
                            <div className="flex sm:text-[14px]">
                              <p className="w-[100px] shrink-0 sm:w-[40%]">Color</p>
                              <p className="">: {item.diamondDetails.col || '-'}</p>
                            </div>

                            <div className="flex sm:text-[14px]">
                              <p className="w-[100px] shrink-0 sm:w-[40%]">Lab</p>
                              <p className="">: {item.diamondDetails.lab || '-'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {(item.skuOrderItems?.center_diamond_id || item.skuOrderItems?.accent_diamond_id) && (
                      <>
                        <hr className="mt-6" />
                        <div className="flex flex-col w-full mb-2 gap-3 sm:gap-0 sm:mx-2">
                          <p className="text-[16px] mt-2 font-semibold text-[#090909]">Diamond Details</p>
                          <div className="flex gap-4 sm:gap-1 flex-row sm:flex-col">
                            {item.skuOrderItems?.centerDiamondDetails && (
                              <div className="w-1/3 sm:w-full flex flex-col gap-2 mb-1 sm:mb-0 p-2 sm:gap-1 sm:py-1 bg-gray-100 shadow-[0_4px_4px_0_#e2e2e23f] ">
                                <div>
                                  <p className="text-[16px] mt-2 uppercase sm:font-medium sm:capitalize font-semibold text-[#090909] sm:text-[16px]">
                                    Center Diamond
                                  </p>
                                </div>
                                <div className="flex sm:text-[14px]">
                                  <div className="w-[40%] lg:w-[43%] ">Shape</div>
                                  <div className="w-[60%] lg:w-[57%]">
                                    : {`${data.find((ele: any) => ele.id == item?.skuOrderItems?.centerDiamondDetails?.name)?.name}`}{' '}
                                  </div>
                                </div>
                                <div className="flex sm:text-[14px]">
                                  <div className="w-[40%] lg:w-[43%]">Type</div>
                                  <div className="w-[60%] lg:w-[57%]">
                                    :{' '}
                                    {item?.skuOrderItems?.centerDiamondDetails?.diamond_type == 'N'
                                      ? 'Natural'
                                      : item?.skuOrderItems?.centerDiamondDetails?.diamond_type == 'L'
                                        ? 'Lab'
                                        : item?.skuOrderItems?.centerDiamondDetails?.diamond_type == 'NG'
                                          ? 'Natural Gems Stone'
                                          : 'Lab Gems Stone'}
                                  </div>
                                </div>
                                <div className="flex sm:text-[14px]">
                                  <div className="w-[40%] lg:w-[43%]">Size Type</div>
                                  <div className="w-[60%] lg:w-[57%]">: {item?.skuOrderItems?.centerDiamondDetails?.size}</div>
                                </div>
                                <div className="flex sm:text-[14px]">
                                  <div className="w-[40%] lg:w-[43%]">Color</div>
                                  <div className="w-[60%] lg:w-[57%]">
                                    :{' '}
                                    {`${
                                      data.find((ele: any) => ele.id == item?.skuOrderItems?.centerDiamondDetails?.color)?.name
                                        ? `${data.find((ele: any) => ele.id == item?.skuOrderItems?.centerDiamondDetails?.color)?.name}`
                                        : '-'
                                    }`}
                                  </div>
                                </div>
                                {/* <div className="flex sm:text-[14px]">
                                  <div className="w-[40%] lg:w-[43%]">Price</div>
                                  <div className="w-[60%] lg:w-[57%]">: {formatCurrency(item?.skuOrderItems?.centerDiamondDetails?.rate)}</div>
                                </div> */}
                              </div>
                            )}
                            {item.skuOrderItems?.accentDiamondDetails && (
                              <div className="w-1/3 sm:w-full flex flex-col gap-2 mb-2 sm:mb-0 p-2 sm:gap-1 sm:py-1 bg-gray-100 shadow-[0_4px_4px_0_#e2e2e23f] ">
                                <div>
                                  <p className="text-[16px] uppercase mt-2 sm:font-medium sm:capitalize font-semibold text-[#090909]">Accent 1</p>
                                </div>
                                <div className="flex sm:text-[14px]">
                                  <div className="w-[40%] lg:w-[43%]">Shape</div>
                                  <div className="w-[60%] lg:w-[57%]">
                                    : {`${data.find((ele: any) => ele.id == item?.skuOrderItems?.accentDiamondDetails?.name)?.name || '-'}`}
                                  </div>
                                </div>
                                <div className="flex sm:text-[14px]">
                                  <div className="w-[40%] lg:w-[43%]">Type</div>
                                  <div className="w-[60%] lg:w-[57%] ">
                                    :{' '}
                                    {item?.skuOrderItems?.accentDiamondDetails?.diamond_type == 'N'
                                      ? 'Natural'
                                      : item?.skuOrderItems?.accentDiamondDetails?.diamond_type == 'L'
                                        ? 'Lab'
                                        : item?.skuOrderItems?.accentDiamondDetails?.diamond_type == 'NG'
                                          ? 'Natural Gems Stone'
                                          : 'Lab Gems Stone'}
                                  </div>
                                </div>
                                <div className="flex sm:text-[14px]">
                                  <div className="w-[40%] lg:w-[43%]">Size Type</div>
                                  <div className="w-[60%] lg:w-[57%]">: {item?.skuOrderItems?.accentDiamondDetails?.size}</div>
                                </div>
                                <div className="flex sm:text-[14px]">
                                  <div className="w-[40%] lg:w-[43%]">Color</div>
                                  <div className="w-[60%] lg:w-[57%]">
                                    :{' '}
                                    {`${
                                      data.find((ele: any) => ele.id == item?.skuOrderItems?.accentDiamondDetails?.color)?.name
                                        ? `${data.find((ele: any) => ele.id == item?.skuOrderItems?.accentDiamondDetails?.color)?.name}`
                                        : '-'
                                    }`}
                                  </div>
                                </div>
                                {/* <div className="flex sm:text-[14px]">
                                  <div className="w-[40%] lg:w-[43%]">Price</div>
                                  <div className="w-[60%] lg:w-[57%]">: {formatCurrency(item?.skuOrderItems?.accentDiamondDetails?.rate) || '-'}</div>
                                </div> */}
                                <div className="flex sm:text-[14px]">
                                  <div className="w-[40%] lg:w-[43%]">count</div>
                                  <div className="w-[60%] lg:w-[57%]">: {item?.skuOrderItems?.accent_diamond_count || '-'}</div>
                                </div>
                              </div>
                            )}
                            {item.skuOrderItems?.secondAccentDiamondId && (
                              <div className="w-1/3  sm:w-full flex flex-col gap-2 mb-2 sm:mb-0 p-2 sm:gap-1 sm:py-1 bg-gray-100 shadow-[0_4px_4px_0_#e2e2e23f] ">
                                <div>
                                  <p className="text-[16px] mt-2 uppercase sm:font-medium sm:capitalize font-semibold text-[#090909]">Accent 2</p>
                                </div>
                                <div className="flex sm:text-[14px]">
                                  <div className="w-[40%] lg:w-[43%]">Shape</div>
                                  <div className="w-[60%] lg:w-[57%]">
                                    : {`${data.find((ele: any) => ele.id == item?.skuOrderItems?.secondAccentDiamondId?.name)?.name || '-'}`}{' '}
                                  </div>
                                </div>
                                <div className="flex sm:text-[14px]">
                                  <div className="w-[40%] lg:w-[43%]">Type</div>
                                  <div className="w-[60%] lg:w-[57%]">
                                    :{' '}
                                    {item?.skuOrderItems?.secondAccentDiamondId?.diamond_type == 'N'
                                      ? 'Natural'
                                      : item?.skuOrderItems?.secondAccentDiamondId?.diamond_type == 'L'
                                        ? 'Lab'
                                        : item?.skuOrderItems?.secondAccentDiamondId?.diamond_type == 'NG'
                                          ? 'Natural Gems Stone'
                                          : 'Lab Gems Stone'}
                                  </div>
                                </div>
                                <div className="flex sm:text-[14px]">
                                  <div className="w-[40%] lg:w-[43%]">Size Type</div>
                                  <div className="w-[60%] lg:w-[57%]">: {item?.skuOrderItems?.secondAccentDiamondId?.size}</div>
                                </div>
                                <div className="flex sm:text-[14px]">
                                  <div className="w-[40%] lg:w-[43%]">Color</div>
                                  <div className="w-[60%] lg:w-[57%]">
                                    :{' '}
                                    {`${
                                      data.find((ele: any) => ele.id == item?.skuOrderItems?.secondAccentDiamondId?.color)?.name
                                        ? `${data.find((ele: any) => ele.id == item?.skuOrderItems?.secondAccentDiamondId?.color)?.name}`
                                        : '-'
                                    }`}
                                  </div>
                                </div>
                                {/* <div className="flex sm:text-[14px]">
                                  <div className="w-[40%] lg:w-[43%]">Price</div>
                                  <div className="w-[60%] lg:w-[57%]">: {formatCurrency(item?.skuOrderItems?.secondAccentDiamondId?.rate)}</div>
                                </div> */}
                                <div className="flex sm:text-[14px]">
                                  <div className="w-[40%] lg:w-[43%]">count</div>
                                  <div className="w-[60%] lg:w-[57%]">: {item?.skuOrderItems?.second_accent_diamond_count}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          !loading && (
            <>
              <Table
                columns={columns}
                dataSource={dataList}
                loading={{ indicator: <LuLoader className="h-10 w-10 animate-spin" />, spinning: loading }}
                className="sm:hidden block"
              />
              <div className="hidden sm:flex flex-col gap-2 my-3 h-fit">
                {dataList?.slice((currentPage - 1) * pageSize, currentPage * pageSize)?.map((orderItem: any, i: number) => {
                  const firstProductImage = orderItem?.orderDetails?.[0]?.skuOrderItems?.carat_images?.[0] ?? null;
                  return (
                    <div
                      key={i}
                      className="w-full border-b pb-3 last:border-b-transparent border-b-gray-200 min-h-[20px] grid grid-cols-4 gap-3 p-1"
                      onClick={() => {
                        setDataDetails(orderItem);
                        router.push(`/profile/purchases?order=${orderItem?.order_id}`);
                      }}
                    >
                      <div className="col-span-1 bg-[#f0f0f0] aspect-square">
                        <Image
                          src={firstProductImage}
                          fallback="/images/no_images.svg"
                          alt={`order-${i}-image`}
                          preview={false}
                          className="mix-blend-multiply aspect-square"
                        />
                      </div>
                      <div className="col-span-3 flex flex-col gap-2">
                        <p className="text-[12px]">Order Date : {dayjs(orderItem?.createdAt).format('D MMM, YYYY')}</p>
                        <p className="text-[12px]">Order Id : {orderItem?.order_id}</p>
                        <p className="text-[12px] flex items-center">
                          Status :
                          <span
                            className={`px-2 ml-2 flex text-[10px] items-center justify-center h-[22px] w-[80px] text-center rounded ${
                              orderItem?.order_status === 0
                                ? 'bg-amber-100 text-amber-600'
                                : orderItem?.order_status === 1
                                  ? 'bg-amber-100 text-amber-600'
                                  : orderItem?.order_status === 2
                                    ? 'bg-blue-100 text-blue-600'
                                    : orderItem?.order_status === 3
                                      ? 'bg-purple-100 text-purple-600'
                                      : orderItem?.order_status === 4
                                        ? 'bg-green-100 text-green-600'
                                        : 'bg-red-100 text-red-600'
                            }`}
                          >
                            {orderItem?.order_status == 0
                              ? 'Processing'
                              : orderItem?.order_status == 1
                                ? ' Confirmed'
                                : orderItem?.order_status == 2
                                  ? 'Manufacturing'
                                  : orderItem?.order_status == 3
                                    ? 'Out for Delivery'
                                    : orderItem?.order_status >= 5
                                      ? // 6 = Rejected, 7 = Payment Cancelled internally; the customer only ever sees "Cancelled".
                                        'Cancelled'
                                      : orderItem?.order_status == 4
                                        ? ' Delivered'
                                        : ''}
                          </span>
                        </p>
                        {openRequestLabel(orderItem) && <p className="text-[12px] text-amber-600">{openRequestLabel(orderItem)}</p>}
                      </div>
                    </div>
                  );
                })}
                <div className="flex justify-center mt-2">
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={dataList?.length}
                    onChange={(page: number) => {
                      setCurrentPage(page);
                    }}
                    showSizeChanger={false}
                  />
                </div>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
};

export default OrderList;
