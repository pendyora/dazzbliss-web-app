'use client';

import React, { useEffect, useRef, useState } from 'react';

import { UploadOutlined } from '@ant-design/icons';
import { Modal, Form, Input, Button, Upload, Select, Image, notification } from 'antd';

import CloudflareTurnstile, { CloudflareTurnstileHandle } from '@/components/common/CloudflareTurnstile';
import { apiRequestCustomJewelry } from '@/services/orderService';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCountries } from '@/store/slices/Address/addressSlice';
import { formatMobile, getMobileRule, unmaskMobile } from '@/utils/mobileValidation';

interface CustomRequestFormProps {
  open: boolean;
  onClose: () => void;
  data: {
    [key: string]: any;
  };
  // onFinish: (values: any) => void;
}

const { Option } = Select;

const CustomRequestForm: React.FC<CustomRequestFormProps> = ({ open, onClose, data }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<CloudflareTurnstileHandle>(null);
  const dispatch = useAppDispatch();
  const { countries } = useAppSelector((state) => state.address);
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
    if (typeof window === 'undefined') {
      return;
    }
    const checkViewport = () => setIsMobile(window.innerWidth < 640);
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined' || !open) {
      return;
    }
    const scrollY = window.scrollY;
    const { body } = document;
    const previous = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    return () => {
      body.style.overflow = previous.overflow;
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const { countryCode, mobileNumber, ...rest } = values || {};
      const phone =
        countryCode && mobileNumber ? `${String(countryCode).startsWith('+') ? countryCode : `+${countryCode}`} ${mobileNumber}` : mobileNumber || '';
      const res = await apiRequestCustomJewelry({ ...rest, phone, sku_id: data?.sku_id, cloudflareTurnstileToken: turnstileToken });
      if (res?.status === 200) {
        form.resetFields();
        setLoading(false);
        onClose();
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
    <Modal
      centered={!isMobile}
      open={open}
      destroyOnClose
      maskClosable
      zIndex={10050}
      // Mobile: fixed top + internal scroll for full form usability.
      width={isMobile ? '100vw' : { md: '85%', lg: '60%', xl: '50%', xxl: '40%' }}
      rootClassName={`custom-request-modal ${isMobile ? '' : '[&_.ant-modal-content]:!min-w-[410px]'}`}
      className="[&_.ant-modal-content]:!p-0"
      style={isMobile ? { top: 0, maxWidth: '100vw', margin: 0, paddingBottom: 0 } : undefined}
      styles={{
        content: {
          margin: isMobile ? 0 : '0 auto',
          padding: 0,
          borderRadius: isMobile ? 0 : undefined,
          minHeight: isMobile ? '100dvh' : undefined,
        },
        body: {
          maxHeight: isMobile ? '100dvh' : 'min(85dvh, calc(100vh - 48px))',
          minHeight: isMobile ? '100dvh' : undefined,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: isMobile ? '16px' : '24px',
        },
      }}
      getContainer={typeof document !== 'undefined' ? () => document.body : undefined}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      footer={null}
    >
      <div className="pb-6 sm:px-2 sm:pb-2">
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-3xl sm:text-2xl font-castoro text-primary text-center break-words">Custom Request Form</h2>
          <p className="text-gray-600 text-[12px] mb-6 text-center px-1 sm:px-2">
            Most items can be customized and made in other metals, with different measurements, and with other gemstones, or a mix of different
            gemstones
          </p>
          <div className="flex justify-between gap-4 mt-2 my-5 items-center w-full">
            <div className="shrink-0 w-[100px] bg-[#f9f9f9]">
              <Image
                src={data?.image || '/images/ashclair_pdp_logo_image.svg'} // Fallback image if data.image is not available
                alt={data?.image || 'Custom Request Image'}
                preview={false}
                fallback="/images/ashclair_pdp_logo_image.svg"
                width={100}
                height={100}
                className="w-full h-auto object-cover mix-blend-multiply"
              />
            </div>
            <div className="flex-1 min-w-0 px-2">
              <p className="font-medium text-primary text-[16px] sm:text-[14px] tracking-[0.5px] mb-2 break-words">{data?.title}</p>
              <p className="break-words">
                ITEM CODE: <span className="font-semibold">{data?.sku_code}</span>
              </p>
            </div>
          </div>
        </div>
        <Form form={form} layout="vertical" onFinish={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-1 gap-4">
            <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter your name' }]}>
              <Input placeholder="John Doe" />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Invalid email format' },
              ]}
            >
              <Input placeholder="john@example.com" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-1 gap-4">
            <Form.Item label="Phone" required className="!mb-0">
              <div className="flex gap-2 items-stretch">
                <Form.Item name="countryCode" noStyle initialValue="1" rules={[{ required: true, message: 'Please select country code!' }]}>
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
                    { required: true, message: 'Please enter your phone number' },
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
                    placeholder="Enter Mobile Number"
                    type="text"
                    inputMode="numeric"
                    className="!h-[40px]"
                    maxLength={getMobileRule(form.getFieldValue('countryCode'))?.maxLength}
                  />
                </Form.Item>
              </div>
            </Form.Item>
            <Form.Item
              label="Image (optional)"
              name="image_1"
              valuePropName="fileList"
              getValueFromEvent={(e) => (Array.isArray(e?.fileList) ? e.fileList.slice(-1) : [])}
            >
              <Upload
                accept="image/*"
                listType="text"
                beforeUpload={() => false}
                // style={{ border: '1px solid black', background: 'none', width: '200px' }}
                fileList={Form.useWatch('image_1', form) || []}
              >
                {(Form.useWatch('image_1', form) || [])?.length >= 1 ? null : (
                  <Button icon={<UploadOutlined />} style={{ background: 'none', width: '200px', height: '39px' }}>
                    Choose File
                  </Button>
                )}
              </Upload>
            </Form.Item>
          </div>

          <Form.Item label="Where did you hear about us?" name="reference" rules={[{ required: true, message: 'Please select at least one option' }]}>
            <Select placeholder="Select one or more options" allowClear>
              <Option value="Google">Google</Option>
              <Option value="Friend">Friend</Option>
              <Option value="Social Media">Social Media</Option>
              <Option value="Advertisement">Advertisement</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Detail" name="special_notes" rules={[{ required: true, message: 'Please enter detail' }]}>
            <Input.TextArea placeholder="Enter more details..." rows={3} />
          </Form.Item>

          <CloudflareTurnstile
            ref={turnstileRef}
            onVerify={setTurnstileToken}
            onExpire={() => setTurnstileToken(null)}
            onError={() => setTurnstileToken(null)}
            className="my-3"
          />
          <Form.Item>
            <Button
              // type="primary"
              // htmlType="submit"
              // className="w-full"
              type="default"
              loading={loading}
              htmlType="submit"
              size="large"
              className="!bg-secondary min-w-[250px] !text-white px-6 py-2 !h-[45px] !w-full"
            >
              Submit
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default CustomRequestForm;
