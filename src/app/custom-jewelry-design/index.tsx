'use client';
import React, { useEffect, useRef, useState } from 'react';

import { UploadOutlined } from '@ant-design/icons';
import { ConfigProvider, Form, Input, Select, Button, Upload, Image, notification } from 'antd';
import _ from 'lodash';
import Link from 'next/link';
import { FaRegUser } from 'react-icons/fa6';
import { GiBigDiamondRing, GiCutDiamond } from 'react-icons/gi';
import { LuUpload } from 'react-icons/lu';

import { checkoutTheme, FORM_LABELS, PRIMARY_BTN } from '@/app/checkout/checkoutTheme';
import CloudflareTurnstile, { CloudflareTurnstileHandle } from '@/components/common/CloudflareTurnstile';
import { IsRingSizeType } from '@/constants/Header';
import { useHoneypot } from '@/hook/useHoneypot';
import { apiRequestCustomJewelry } from '@/services/orderService';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCountries } from '@/store/slices/Address/addressSlice';
import { isDisposableDomain, isValidEmailFormat } from '@/utils/emailValidation';
import { encrypt } from '@/utils/enc-decy';
import { formatMobile, getMobileRule, unmaskMobile } from '@/utils/mobileValidation';

const KICKER = 'text-[10.5px] font-medium uppercase tracking-[0.22em] text-gilt';
const CARD = 'relative flex w-full min-w-0 flex-col border border-line bg-paper';
const CARD_HEAD = 'flex items-center gap-4 border-b border-line px-6 py-5 sm:px-5';
const CARD_ICON = 'grid h-10 w-10 flex-none place-items-center rounded-full border border-line-strong p-2.5 text-ink';
const CARD_TITLE = 'm-0 font-cormorant text-[24px] font-medium leading-[1.1] text-ink';
const CARD_BODY = 'flex min-h-[200px] flex-col gap-5 px-6 py-6 sm:px-5';
const STEP_LABEL = 'text-[10.5px] uppercase tracking-[0.16em] text-ink-soft';
const UPLOAD_BTN =
  '!flex !h-12 !w-full !items-center !justify-center !rounded-none !border-dashed !border-line-strong !bg-transparent !text-[12.5px] !text-ink hover:!border-ink';
const INFO_H2 = 'm-0 mb-4 font-cormorant text-[clamp(26px,2.4vw,34px)] font-medium leading-[1.1] text-ink';
const INFO_P = 'm-0 text-[14px] leading-[1.75] text-ink-soft';
const INFO_LINK = 'text-ink capitalize underline underline-offset-4 hover:text-gilt';

const CustomJewelryDesign = () => {
  const masterData = useAppSelector((state) => state.master.data);
  const { countries } = useAppSelector((state) => state.address);
  const dispatch = useAppDispatch();
  const [form] = Form.useForm();
  const [masterOptions, setMasterOptions] = useState<
    { label: any; title: string; options: { label: any; labelText: string; value: string; name: string; code: string; image: string }[] }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<CloudflareTurnstileHandle>(null);
  const { HoneypotField, isHoneypotClean } = useHoneypot('custom_jewelry_website_confirm');
  const selectedProductType = Form.useWatch('product_type', form);

  // Product type, stone shape and ring size all live in the Masters table, which
  // `get-all-master` already returns in full, so they come out of the same `masterData`
  // the center stone options are built from.
  // Masters carry an admin-controlled `sorting_sequence`; every list below follows it so the
  // form shows the same order as the rest of the site.
  const bySortingSequence = (items: any[]) => _.sortBy(items, (item: any) => item?.sorting_sequence ?? Number.MAX_SAFE_INTEGER);

  const productTypeOptions = bySortingSequence(_.filter(masterData, (item: any) => item.parent_code === 'JEWELRY_TYPE' && item.is_web_visible)).map(
    (item: any) => ({
      label: item?.name,
      value: item?.id,
      name: item?.name,
    }),
  );

  const stoneShapeOptions = bySortingSequence(_.filter(masterData, (item: any) => item.parent_code === 'SHAPE' && item.is_web_visible)).map(
    (item: any) => ({
      label: (
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 flex justify-center items-center">
            <Image
              className="!w-full !h-full object-cover"
              src={item?.image?.[0] ? item.image[0] : '/images/no_images.jpg'}
              alt="Shape Master"
              preview={false}
              fallback="/images/no_images.jpg"
            />
          </div>
          {`${item?.name}`}
        </div>
      ),
      labelText: `${item?.name}`,
      value: item?.id,
      name: item?.name,
    }),
  );

  const ringSizeOptions = bySortingSequence(_.filter(masterData, (item: any) => item.parent_code === 'RING_SIZE' && item.is_web_visible)).map(
    (item: any) => ({
      label: item?.name,
      value: item?.id,
      name: item?.name,
    }),
  );

  // Only rings take a size, so the selector is hidden for every other product type.
  const isRingProductType = IsRingSizeType.includes(productTypeOptions.find((option) => option.value === selectedProductType)?.name ?? '');

  const uniqueCountryCodes = Array.from(
    new Map(
      countries.map((c: any) => {
        const code = String(c.phone_code).replace(/\D/g, '');
        return [code, { value: code, label: `+${code}` }];
      }),
    ).values(),
  );

  useEffect(() => {
    if (countries.length === 0) {
      dispatch(fetchCountries());
    }
  }, [countries.length, dispatch]);

  useEffect(() => {
    if (masterData.length > 0) {
      const DiamondColorNG = _.filter(masterData, (item: any) => item.parent_code === 'NG');
      const DiamondColorLG = _.filter(masterData, (item: any) => item.parent_code === 'LG');

      const uniqueCategories = [
        {
          label: 'Natural Diamonds',
          title: 'natural_diamonds',
          options: [..._.uniqBy(DiamondColorNG, 'code')]?.map((item: any) => ({
            label: (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 flex justify-center items-center">
                  <Image
                    className="!w-full !h-full object-cover"
                    src={item?.image[0] ? item?.image[0] : '/images/no_images.jpg'}
                    alt="Diamond Master"
                    preview={false}
                    fallback="/images/no_images.jpg"
                  />
                </div>
                {`${item?.name}`}
              </div>
            ),
            labelText: `${item?.name}`,
            value: item?.id,
            name: item?.name,
            code: item?.code,
            image: item?.image[0] ? item?.image[0] : '/images/no_images.jpg',
          })),
        },
        {
          label: 'Lab Grawn Diamonds',
          title: 'lab_grown_diamonds',
          options: [..._.uniqBy(DiamondColorLG, 'code')]?.map((item: any) => ({
            label: (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 flex justify-center items-center">
                  <Image
                    className="!w-full !h-full object-cover"
                    src={item?.image[0] ? item?.image[0] : '/images/no_images.jpg'}
                    alt="Diamond Master"
                    preview={false}
                    fallback="/images/no_images.jpg"
                  />
                </div>
                {`${item?.name}`}
              </div>
            ),
            labelText: `${item?.name}`,
            value: item?.id,
            name: item?.name,
            code: item?.code,
            image: item?.image[0] ? item?.image[0] : '/images/no_images.jpg',
          })),
        },
      ];
      if (uniqueCategories?.length > 0) {
        setMasterOptions(uniqueCategories);
      }
    }
  }, [masterData]);

  const onFinish = async (values: any) => {
    if (!isHoneypotClean()) {
      return;
    }
    setLoading(true);
    try {
      const { countryCode, mobileNumber, ...rest } = values || {};
      const phone =
        countryCode && mobileNumber ? `${String(countryCode).startsWith('+') ? countryCode : `+${countryCode}`} ${mobileNumber}` : mobileNumber || '';
      const res = await apiRequestCustomJewelry({ ...rest, phone, cloudflareTurnstileToken: turnstileToken });
      if (res?.status === 200) {
        form.resetFields();
        setLoading(false);
        // Optionally, you can show a success message or redirect the user
        notification.success({
          message: 'Request Submitted',
          description: 'Your custom jewelry request was submitted successfully!',
          placement: 'top',
        });
      } else {
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        setLoading(false);
        alert('Failed to submit custom jewelry request. Please try again.');
      }
    } catch (err) {
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      setLoading(false);
      console.error('❌ Error submitting form:', err);
    }
  };

  return (
    <ConfigProvider theme={checkoutTheme}>
      <div className="min-h-screen bg-paper font-libre">
        {/* Header Section */}
        <header className="bg-paper px-[clamp(16px,3.2vw,56px)] pb-12 pt-[clamp(48px,6vw,88px)] text-center md:pb-8">
          <div className="mx-auto max-w-[1100px]">
            <span className={KICKER}>Bespoke</span>
            <h1 className="m-0 mb-6 mt-3 font-cormorant text-[clamp(34px,4vw,60px)] font-medium leading-none text-ink">
              Custom jewelry <em className="italic text-gilt">design</em>
            </h1>
            <p className="mx-auto mb-12 max-w-[680px] text-[15px] leading-[1.75] text-ink-soft">
              If you are looking for an engagement ring or matching band or anything that is not listed on our website, we can custom make it to your
              exact specifications. This allows you to get the designer look for a fraction of the price.
            </p>
            <ol className="m-0 mb-12 grid w-full list-none grid-cols-3 gap-4 p-0 sm:grid-cols-1 sm:gap-3">
              <li className="flex flex-col items-center gap-3 bg-stone px-5 pb-6 pt-7 text-center sm:flex-row sm:py-5 sm:text-left">
                <span className="grid h-7 w-7 flex-none place-items-center rounded-full border border-ink text-[11px] tabular-nums text-ink">1</span>
                <p className="m-0 text-[14px] font-medium text-ink">Submit Drawings, Sketches Or Pictures</p>
                <Image
                  src="/images/custom-design/customstep1.png"
                  preview={false}
                  alt="Step 1"
                  className="mx-auto mt-2 w-[174px] mix-blend-multiply md:hidden"
                />
              </li>
              <li className="flex flex-col items-center gap-3 bg-stone px-5 pb-6 pt-7 text-center sm:flex-row sm:py-5 sm:text-left">
                <span className="grid h-7 w-7 flex-none place-items-center rounded-full border border-ink text-[11px] tabular-nums text-ink">2</span>
                <p className="m-0 text-[14px] font-medium text-ink">Receive Our Rendering for Approval</p>
                <Image
                  src="/images/custom-design/customstep2.webp"
                  preview={false}
                  alt="Step 2"
                  className="mx-auto mt-2 w-[174px] mix-blend-multiply md:hidden"
                />
              </li>
              <li className="flex flex-col items-center gap-3 bg-stone px-5 pb-6 pt-7 text-center sm:flex-row sm:py-5 sm:text-left">
                <span className="grid h-7 w-7 flex-none place-items-center rounded-full border border-ink text-[11px] tabular-nums text-ink">3</span>
                <p className="m-0 text-[14px] font-medium text-ink">Jewelry is Cast, Polished and Completed</p>
                <Image
                  src="/images/custom-design/customstep3.webp"
                  preview={false}
                  alt="Step 3"
                  className="mx-auto mt-2 w-[174px] mix-blend-multiply md:hidden"
                />
              </li>
            </ol>
            {/* <a href="#custom-jewelry-form"> */}
            <Button
              type="default"
              onClick={() => {
                const el = document.getElementById('custom-jewelry-form');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              size="large"
              className={`min-w-[250px] ${PRIMARY_BTN}`}
            >
              START NOW
            </Button>
            {/* </a> */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto mt-10 h-6 w-6 animate-bounce text-ink-soft"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.3} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </header>

        {/* Form Section */}
        <div className="border-y border-line bg-haze">
          <section className="mx-auto max-w-[1440px] px-[clamp(16px,3.2vw,56px)] py-[clamp(48px,6vw,88px)]" id="custom-jewelry-form">
            <div className="mx-auto max-w-[1280px]">
              <div className="mb-6 grid justify-items-center gap-3 text-center">
                <span className={KICKER}>Request a design</span>
                <h2 className="m-0 font-cormorant text-[clamp(30px,3.2vw,48px)] font-medium leading-none text-ink">
                  Tell us about your <em className="italic text-gilt">piece</em>
                </h2>
              </div>
              <p className="mx-auto mb-12 max-w-[680px] text-center text-[14px] leading-[1.65] text-ink-soft md:mb-8">
                To get started on your custom engagement ring, please submit this form and a representative will contact you within 1-2 business days.
              </p>
              <Form form={form} onFinish={onFinish} layout="vertical" className={`space-y-6 ${FORM_LABELS}`}>
                <HoneypotField />
                <div className="grid w-full grid-cols-4 gap-4 xls:grid-cols-2 sm:grid-cols-1">
                  {/* Contact Information */}
                  <div className={CARD}>
                    <div className={CARD_HEAD}>
                      <span className={CARD_ICON}>
                        <FaRegUser className="h-full w-full" />
                      </span>
                      <div className="grid gap-1">
                        <span className={STEP_LABEL}>STEP 1</span>
                        <h3 className={CARD_TITLE}>Contact Information</h3>
                      </div>
                    </div>
                    <div className={CARD_BODY}>
                      <Form.Item
                        style={{ marginBottom: '0px' }}
                        label="Name"
                        name="name"
                        rules={[{ required: true, message: 'Please enter your name!' }]}
                      >
                        <Input placeholder="Enter Your Name" className="w-full" />
                      </Form.Item>
                      <Form.Item
                        label="Email"
                        name="email"
                        style={{ marginBottom: '0px' }}
                        validateTrigger="onChange"
                        rules={[
                          { required: true, message: 'Please enter your email!' },
                          {
                            validator: (_, value) => {
                              if (!value) {
                                return Promise.resolve();
                              }
                              if (!isValidEmailFormat(value)) {
                                return Promise.reject(new Error('Please enter a valid email!'));
                              }
                              if (isDisposableDomain(value)) {
                                return Promise.reject(new Error('Please enter a valid permanent email address'));
                              }
                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <Input placeholder="Enter Your Email" className="w-full" />
                      </Form.Item>
                      <Form.Item style={{ marginBottom: '0px' }} label="Phone" required>
                        <div className="flex gap-1.5 items-stretch">
                          <Form.Item name="countryCode" noStyle initialValue="1" rules={[{ required: true, message: 'Please select country code!' }]}>
                            <Select
                              showSearch
                              placeholder="Code"
                              className="!h-12 !w-[86px] shrink-0 [&_.ant-select-selector]:!px-2 [&_.ant-select-arrow]:!right-1.5"
                              options={uniqueCountryCodes as any}
                              optionFilterProp="label"
                              filterOption={(input, option) =>
                                String(option?.label ?? '')
                                  .toLowerCase()
                                  .includes(input.toLowerCase())
                              }
                              onChange={(code) => {
                                const currentMobile = form.getFieldValue('mobileNumber');
                                if (currentMobile) {
                                  const digits = unmaskMobile(currentMobile);
                                  const rule = getMobileRule(code);
                                  form.setFieldsValue({ mobileNumber: formatMobile(digits, rule.mask) });
                                }
                                form.validateFields(['mobileNumber']).catch(() => {});
                              }}
                            />
                          </Form.Item>
                          <Form.Item
                            name="mobileNumber"
                            noStyle
                            rules={[
                              { required: true, message: 'Please enter your phone number!' },
                              {
                                validator: (_, value) => {
                                  if (!value) {
                                    return Promise.resolve();
                                  }
                                  const digits = unmaskMobile(value);
                                  const code = form.getFieldValue('countryCode');
                                  const rule = getMobileRule(code);
                                  if (!rule.regex.test(digits)) {
                                    return Promise.reject(new Error(rule.message));
                                  }
                                  return Promise.resolve();
                                },
                              },
                            ]}
                            normalize={(val) => {
                              if (!val) {
                                return '';
                              }
                              const digits = val.replace(/\D/g, '');
                              const code = form.getFieldValue('countryCode');
                              const rule = getMobileRule(code);
                              return formatMobile(digits, rule.mask);
                            }}
                          >
                            <Input
                              placeholder="Enter Your Number"
                              type="text"
                              inputMode="numeric"
                              className="!h-12 !min-w-0 !flex-1 !px-3"
                              maxLength={getMobileRule(form.getFieldValue('countryCode'))?.maxLength}
                            />
                          </Form.Item>
                        </div>
                      </Form.Item>
                    </div>
                  </div>

                  {/* Product Information */}
                  <div className={CARD}>
                    <div className={CARD_HEAD}>
                      <span className={CARD_ICON}>
                        <GiBigDiamondRing className="h-full w-full" />
                      </span>
                      <div className="grid gap-1">
                        <span className={STEP_LABEL}>STEP 2</span>
                        <h3 className={CARD_TITLE}>Product Information</h3>
                      </div>
                    </div>
                    <div className={CARD_BODY}>
                      <Form.Item
                        style={{ marginBottom: '0px' }}
                        label="Product Type"
                        name="product_type"
                        rules={[{ required: true, message: 'Please select a product type!' }]}
                      >
                        <Select
                          placeholder="Select Product Type"
                          className="w-full"
                          options={productTypeOptions}
                          popupMatchSelectWidth={false}
                          onChange={() => {
                            // A size only means something for rings; drop whatever was picked before
                            // so a disabled field can never be submitted with a stale value.
                            form.setFieldValue('ring_size', undefined);
                          }}
                        />
                      </Form.Item>
                      {/* Always on show so the card keeps its shape, but only a ring product type
                        can actually be sized — anything else leaves it greyed out. */}
                      <Form.Item
                        style={{ marginBottom: '0px' }}
                        label="Ring Size"
                        name="ring_size"
                        rules={isRingProductType ? [{ required: true, message: 'Please select a ring size!' }] : []}
                        required={isRingProductType}
                      >
                        <Select
                          placeholder={isRingProductType ? 'Select Ring Size' : 'Not applicable'}
                          className="w-full"
                          options={ringSizeOptions}
                          disabled={!isRingProductType}
                          showSearch
                          popupMatchSelectWidth={false}
                        />
                      </Form.Item>
                      <Form.Item
                        style={{ marginBottom: '0px' }}
                        label="Preferred Metal"
                        name="preferred_metal"
                        rules={[{ required: true, message: 'Please select a metal!' }]}
                      >
                        <Select placeholder="Select Metal" className="w-full" popupMatchSelectWidth={false}>
                          <Select.Option value="10k Rose Gold">10k Rose Gold</Select.Option>
                          <Select.Option value="10k White Gold">10k White Gold</Select.Option>
                          <Select.Option value="10k Yellow Gold">10k Yellow Gold</Select.Option>
                          <Select.Option value="14k Rose Gold">14k Rose Gold</Select.Option>
                          <Select.Option value="14k White Gold">14k White Gold</Select.Option>
                          <Select.Option value="14k Yellow Gold">14k Yellow Gold</Select.Option>
                          <Select.Option value="18k Rose Gold">18k Rose Gold</Select.Option>
                          <Select.Option value="18k White Gold">18k White Gold</Select.Option>
                          <Select.Option value="18k Yellow Gold">18k Yellow Gold</Select.Option>
                          <Select.Option value="Black Plated 10k Gold">Black Plated 10k Gold</Select.Option>
                          <Select.Option value="Black Plated 14k Gold">Black Plated 14k Gold</Select.Option>
                          <Select.Option value="Black Plated 18k Gold">Black Plated 18k Gold</Select.Option>
                          <Select.Option value="Platinum">Platinum</Select.Option>
                          <Select.Option value="Sterling Silver">Sterling Silver</Select.Option>
                          <Select.Option value="Yellow Plated Silver">Yellow Plated Silver</Select.Option>
                        </Select>
                      </Form.Item>
                    </div>
                  </div>

                  {/* Stone & Budget */}
                  <div className={CARD}>
                    <div className={CARD_HEAD}>
                      <span className={CARD_ICON}>
                        <GiCutDiamond className="h-full w-full" />
                      </span>
                      <div className="grid gap-1">
                        <span className={STEP_LABEL}>STEP 3</span>
                        <h3 className={CARD_TITLE}>Stone &amp; Budget</h3>
                      </div>
                    </div>
                    <div className={CARD_BODY}>
                      <Form.Item
                        style={{ marginBottom: '0px' }}
                        label="Center Stone"
                        name="center_stone"
                        rules={[{ required: true, message: 'Please select a center stone!' }]}
                      >
                        <Select
                          placeholder="Select Gems"
                          className="w-full"
                          options={masterOptions.map((group) => ({
                            ...group,
                            options: group?.options?.map((option) => ({
                              ...option,
                              label: (
                                <div className="flex items-center gap-2">
                                  <div className={`w-5 h-5 flex justify-center items-center`}>
                                    <Image
                                      className="!w-full !h-full object-cover"
                                      src={option.image ? option.image : '/images/no_images.jpg'}
                                      alt="Diamond Master"
                                      preview={false}
                                      fallback="/images/no_images.jpg"
                                    />
                                  </div>
                                  {`${option?.name}`}
                                </div>
                              ),
                              // disabled: getDisabledOptions(record).includes(option.value),
                            })),
                          }))}
                          showSearch
                          optionFilterProp="option?.labelText"
                          // status={getValidationStatus(record.key, 'master_id')}
                          filterOption={(input, option) => {
                            const opt = option as unknown as { labelText?: string };
                            return (opt.labelText ?? '').toLowerCase().includes(input.toLowerCase());
                          }}
                          // onBlur={() => validateField(text, 'master_id', record.key)}
                        ></Select>
                      </Form.Item>
                      <Form.Item style={{ marginBottom: '0px' }} label="Stone Shape" name="stone_shape">
                        <Select
                          placeholder="Select Stone Shape"
                          className="w-full"
                          options={stoneShapeOptions}
                          allowClear
                          showSearch
                          popupMatchSelectWidth={false}
                          filterOption={(input, option) => {
                            const opt = option as unknown as { labelText?: string };
                            return (opt.labelText ?? '').toLowerCase().includes(input.toLowerCase());
                          }}
                        />
                      </Form.Item>
                      <Form.Item
                        style={{ marginBottom: '0px' }}
                        label="Price Range"
                        name="price_range"
                        rules={[{ required: true, message: 'Please select a price range!' }]}
                      >
                        <Select placeholder="Select Price Range" className="w-full">
                          <Select.Option value="under $100">Under $100</Select.Option>
                          <Select.Option value="$100-$200">$100-$200</Select.Option>
                          <Select.Option value="$200-$500">$200-$500</Select.Option>
                          <Select.Option value="$500-$1000">$500-$1000</Select.Option>
                          <Select.Option value="$1000-$2500">$1000-$2500</Select.Option>
                          <Select.Option value="More Than 2500">More Than $2500</Select.Option>
                        </Select>
                      </Form.Item>
                    </div>
                  </div>

                  {/* Upload Images */}
                  <div className={CARD}>
                    <div className={CARD_HEAD}>
                      <span className={CARD_ICON}>
                        <LuUpload className="h-full w-full" />
                      </span>
                      <div className="grid gap-1">
                        <span className={STEP_LABEL}>STEP 4</span>
                        <h3 className={CARD_TITLE}>Upload Images</h3>
                      </div>
                    </div>
                    <div className={CARD_BODY}>
                      {/* Image 1 */}
                      <Form.Item
                        label="Image 1"
                        name="image_1"
                        style={{ marginBottom: '0px' }}
                        valuePropName="fileList"
                        getValueFromEvent={(e) => (Array.isArray(e?.fileList) ? e.fileList.slice(-1) : [])}
                      >
                        <Upload
                          accept="image/*"
                          listType="text"
                          beforeUpload={() => false}
                          // style={{ border: '1px solid black', background: 'none', width: '200px' }}
                          fileList={Form.useWatch('image_1', form) || []}
                          className="w-full"
                          style={{ width: '100%' }}
                        >
                          {(Form.useWatch('image_1', form) || []).length >= 1 ? null : (
                            <Button icon={<UploadOutlined />} className={UPLOAD_BTN} style={{ width: '100%' }}>
                              Choose File
                            </Button>
                          )}
                        </Upload>
                      </Form.Item>

                      {/* Image 2 */}
                      <Form.Item
                        label="Image 2"
                        name="image_2"
                        valuePropName="fileList"
                        style={{ marginBottom: '0px' }}
                        getValueFromEvent={(e) => (Array.isArray(e?.fileList) ? e.fileList.slice(-1) : [])}
                      >
                        <Upload
                          accept="image/*"
                          listType="text"
                          beforeUpload={() => false}
                          fileList={Form.useWatch('image_2', form) || []}
                          className="w-full"
                          style={{ width: '100%' }}
                        >
                          {(Form.useWatch('image_2', form) || []).length >= 1 ? null : (
                            <Button icon={<UploadOutlined />} className={UPLOAD_BTN} style={{ width: '100%' }}>
                              Choose File
                            </Button>
                          )}
                        </Upload>
                      </Form.Item>

                      {/* Image 3 */}
                      <Form.Item
                        label="Image 3"
                        name="image_3"
                        valuePropName="fileList"
                        style={{ marginBottom: '0px' }}
                        getValueFromEvent={(e) => (Array.isArray(e?.fileList) ? e.fileList.slice(-1) : [])}
                      >
                        <Upload
                          accept="image/*"
                          listType="text"
                          beforeUpload={() => false}
                          fileList={Form.useWatch('image_3', form) || []}
                          className="w-full"
                          style={{ width: '100%' }}
                        >
                          {(Form.useWatch('image_3', form) || []).length >= 1 ? null : (
                            <Button icon={<UploadOutlined />} className={UPLOAD_BTN} style={{ width: '100%' }}>
                              Choose File
                            </Button>
                          )}
                        </Upload>
                      </Form.Item>
                    </div>
                  </div>
                </div>

                {/* Special Notes */}
                <Form.Item label="Special Notes" name="special_notes" rules={[{ required: true, message: 'Please provide special notes!' }]}>
                  <Input.TextArea rows={4} placeholder="Enter your special notes here" className="w-full" />
                </Form.Item>

                {/* Submit Button */}
                <CloudflareTurnstile
                  ref={turnstileRef}
                  onVerify={setTurnstileToken}
                  onExpire={() => setTurnstileToken(null)}
                  onError={() => setTurnstileToken(null)}
                  className="my-3"
                />
                <div className="flex w-full justify-center pt-2">
                  <Button type="default" loading={loading} htmlType="submit" size="large" className={`min-w-[280px] sm:w-full ${PRIMARY_BTN}`}>
                    Submit
                  </Button>
                </div>
              </Form>
            </div>
          </section>
        </div>

        {/* Additional Information Section */}
        <div className="bg-paper">
          <section className="mx-auto max-w-[1440px] px-[clamp(16px,3.2vw,56px)] py-[clamp(48px,6vw,96px)]">
            <div className="mx-auto grid max-w-[1100px] grid-cols-2 gap-x-[clamp(32px,5vw,96px)] gap-y-12 md:grid-cols-1 md:gap-y-10 [&>div]:border-t [&>div]:border-line [&>div]:pt-8">
              <div>
                <h2 className={INFO_H2}>DESIGN YOUR OWN JEWELRY IN 3 SIMPLE STEPS</h2>
                <p className={INFO_P}>
                  Buying the right type of jewelry for a special occasion is a daunting task but at Ashclair, we now have a convenient solution. It is
                  now possible to design your own jewelry by collaborating with our highly talented team of designers and craftsmen. Whether you are
                  looking for the ideal{' '}
                  <Link href="/engagement-rings" className={INFO_LINK}>
                    engagement ring
                  </Link>{' '}
                  ,{' '}
                  <Link href="/wedding-bands" className={INFO_LINK}>
                    wedding bands
                  </Link>{' '}
                  , or any other kind of ring, we got you covered.
                </p>
              </div>
              <div>
                <h2 className={INFO_H2}>WHY CUSTOM JEWELRY DESIGN</h2>
                <p className={INFO_P}>
                  Our team at Ashclair is committed to bringing your ring design idea to life at the most affordable price. Through our long
                  experience in the industry and our commitment to quality jewelry, we have consistently exceeded the expectations of clients. We
                  invite you to design your jewelry with us to save time and money.
                </p>
              </div>
              <div>
                <h2 className={INFO_H2}>LARGE COLLECTION OF RINGS</h2>
                <p className={INFO_P}>
                  No more hopping from one jewel store to the other; we have everything you need in one place. Whether you need a 10k, 14k, 18k gold
                  wedding band or a sterling silver engagement ring, we have these and many more. Our team is highly experienced working with the most
                  popular metals such as gold, diamond, sterling silver, platinum, brass, cobalt, tungsten, stainless steel among others. We also have
                  in our collection high quality gemstones to accentuate your ring including black, green, red and blue diamond, blue sapphire, ruby,
                  Tanzanite, Amethyst, blue topaz, quartz among others. With this wide range of rings and center stones in our store, there is no
                  reason for you to buy stock jewelry.
                </p>
              </div>
              <div>
                <h2 className={INFO_H2}>PERSONALIZED JEWELRY MADE EASIER</h2>
                <p className={INFO_P}>
                  This versatile collection makes jewelry customization easier and more affordable. You can now make your dream ring a reality through
                  these easy steps:
                </p>
                <ol className="mt-4 list-decimal space-y-2 pl-5 text-[14px] leading-[1.7] text-ink-soft marker:text-ink-faint">
                  <li>Contact us: We require a few details including name, email and phone number for ease of communication.</li>
                  <li>
                    Submit ring design/sketch: Provide our designers with the ring you have in mind. This also includes the preferred metal, center
                    stone and price range. You can upload images of the ring design if you have any.
                  </li>
                  <li>
                    Presentation of rendering: Our team provides a rendering of the ring based on your requirements. At this stage, you can give a
                    go-ahead or request some modification.
                  </li>
                </ol>
                <p className={`${INFO_P} mt-4`}>
                  Once you have given us the approval, our team goes to work to handcraft the best piece for you. We promise 100% satisfaction and we
                  do this by delivering high quality craftsmanship. You will have another chance to look at the finished piece before delivery. When
                  you design your own jewelry with us, it saves you time and money and you enjoy peace of mind knowing the customized piece reflects
                  your needs.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default CustomJewelryDesign;
