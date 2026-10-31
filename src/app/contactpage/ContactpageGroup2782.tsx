'use client';

import React, { useEffect, useRef, useState } from 'react';

import { Form, Input, Button, Select, Typography, notification } from 'antd';
import { useRouter } from 'next/navigation';

import CloudflareTurnstile, { CloudflareTurnstileHandle } from '@/components/common/CloudflareTurnstile';
import { useHoneypot } from '@/hook/useHoneypot';
import { submitContactPageData } from '@/services/authService';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCountries } from '@/store/slices/Address/addressSlice';
import { isDisposableDomain, isValidEmailFormat } from '@/utils/emailValidation';
import { trackContact } from '@/utils/metaPixel';
import { formatMobile, getMobileRule, unmaskMobile } from '@/utils/mobileValidation';

const { Paragraph, Title } = Typography;
export default function ContactpageGroup2782() {
  const [form] = Form.useForm();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { countries } = useAppSelector((state) => state.address);
  const { HoneypotField, isHoneypotClean } = useHoneypot('contact_website_confirm');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<CloudflareTurnstileHandle>(null);
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
  }, []);

  const getPhoneCodeFromCountryId = (code: any) => {
    return code || '';
  };

  const handleSubmit = async (values: any) => {
    if (!isHoneypotClean()) {
      return;
    }
    const phoneCode = getPhoneCodeFromCountryId(values.countryCode);
    const rawPhone = values.mobileNumber ? unmaskMobile(values.mobileNumber) : '';
    const phone = `+${phoneCode} ${rawPhone}`;

    try {
      const res: any = await submitContactPageData({
        email: values.email,
        fullName: values.fullName,
        phone,
        subject: values.subject,
        message: values.message,
        cloudflareTurnstileToken: turnstileToken,
      });
      if (res.status == 201) {
        trackContact();
        notification.success({
          message: res.data.message,
        });
        router.push('/');
      }
    } catch (error: any) {
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      notification.error({
        message: error.response.data.message,
      });
    }
  };

  return (
    <div className="flex justify-center">
      <div className="container-xs flex justify-center">
        <div className="flex w-[80%] flex-col items-center justify-center md:mx-10  sm:mx-5 bg-[#ffffff] md:w-full ">
          <div className="flex flex-col w-full p-10 sm:p-5 max-w-[600px] md:px-20px">
            <div className="flex flex-col items-center ">
              <Title level={4} style={{ textAlign: 'center' }}>
                WE’RE HAPPY TO HELP YOU!
              </Title>

              <div className="flex flex-col items-center text-center self-stretch ">
                <Paragraph className=" text-center !m-0 font-extralight"> Our Customer Care team are available for support</Paragraph>
                <Paragraph className=" text-center !m-0 font-extralight">Monday - Friday from 9am to 5pm PST.</Paragraph>
                <Paragraph className="text-center !m-0  font-extralight">Please note response times are up to</Paragraph>
                <Paragraph className="text-center !m-0  font-extralight">48 hours in this busy period.</Paragraph>
              </div>
            </div>
            <Form className="w-full" form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item
                name="email"
                label="Email"
                validateTrigger="onChange"
                rules={[
                  { required: true, message: 'Please enter your email!' },
                  {
                    validator: (_, value) => {
                      if (!value) {
                        return Promise.resolve();
                      }
                      if (!isValidEmailFormat(value)) {
                        return Promise.reject(new Error('Invalid email address'));
                      }
                      if (isDisposableDomain(value)) {
                        return Promise.reject(new Error('Please enter a valid permanent email address'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input placeholder="Enter Email" />
              </Form.Item>
              <HoneypotField />
              <Form.Item name="fullName" label="Full Name" rules={[{ required: true, message: 'Please enter your full name!' }]}>
                <Input placeholder="Enter Full Name" />
              </Form.Item>
              <Form.Item label="Phone" required className="!mb-4">
                <div className="flex gap-2 items-stretch">
                  <Form.Item name="countryCode" noStyle rules={[{ required: true, message: 'Please select country code!' }]}>
                    <Select
                      showSearch
                      placeholder="Code"
                      className="!h-[40px] !w-[80px] shrink-0"
                      options={uniqueCountryCodes as any}
                      optionFilterProp="label"
                      filterOption={(input, option) =>
                        String(option?.label ?? '')
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      onChange={(countryId) => {
                        const code = getPhoneCodeFromCountryId(countryId);

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
                          const code = getPhoneCodeFromCountryId(form.getFieldValue('countryCode'));
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
                      const code = getPhoneCodeFromCountryId(form.getFieldValue('countryCode'));
                      const rule = getMobileRule(code);
                      return formatMobile(digits, rule.mask);
                    }}
                  >
                    <Input
                      placeholder="Enter Phone Number"
                      type="text"
                      inputMode="numeric"
                      className="!h-[40px]"
                      maxLength={getMobileRule(getPhoneCodeFromCountryId(form.getFieldValue('countryCode')))?.maxLength}
                    />
                  </Form.Item>
                </div>
              </Form.Item>
              <Form.Item name="subject" label="Subject" rules={[{ required: true, message: 'Please enter a subject!' }]}>
                <Input placeholder="Enter Subject" />
              </Form.Item>
              <Form.Item name="message" label="Your Message" rules={[{ required: true, message: 'Please enter your message!' }]}>
                <Input.TextArea placeholder="Enter Your Message" rows={4} />
              </Form.Item>
              <CloudflareTurnstile
                ref={turnstileRef}
                onVerify={setTurnstileToken}
                onExpire={() => setTurnstileToken(null)}
                onError={() => setTurnstileToken(null)}
                className="my-3"
              />
              <Form.Item>
                <Button type="default" htmlType="submit" className="w-full self-stretch mt-6 tracking-[2.00px] !text-text_w !bg-secondary">
                  SEND
                </Button>
              </Form.Item>
            </Form>
            <Paragraph className="text-center !font-extralight !m-0  !font-sans">At Ashclair, we put pride in ourselves on excellent</Paragraph>
            <Paragraph className="text-center !font-extralight !m-0 !font-sans">customer service on the Web.</Paragraph>
            <Paragraph className="text-center !font-extralight !m-0 !font-sans">We look forward to responding to your email. </Paragraph>
            <Paragraph className="text-center !font-extralight !m-0 !font-sans">If you prefer, call us.</Paragraph>
            <Paragraph className="text-center !font-extralight !m-0 !font-sans">Phone: 213-622-3264</Paragraph>
            <Paragraph className="text-center !font-extralight !m-0 b-4 !font-sans">Email: service@ashclair.com</Paragraph>
          </div>
        </div>
      </div>
    </div>
  );
}
