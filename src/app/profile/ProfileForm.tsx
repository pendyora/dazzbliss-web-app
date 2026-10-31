/* eslint-disable import/no-named-as-default-member */
'use client';
import React, { useEffect } from 'react';

import { Form, Input, Button, DatePicker, Select, notification } from 'antd';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { FORM_LABELS, PRIMARY_BTN, SECONDARY_BTN } from '@/app/checkout/checkoutTheme';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCountries } from '@/store/slices/Address/addressSlice';
import { updateProfile } from '@/store/slices/auth/authSlice';
import { isValidEmailFormat } from '@/utils/emailValidation';
import { formatMobile, getMobileRule, unmaskMobile } from '@/utils/mobileValidation';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.tz.setDefault('Asia/Kolkata');
const { Option } = Select;

const ProfileForm = ({ setProfile }: { setProfile?: React.Dispatch<React.SetStateAction<boolean>> }) => {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth.auth);
  const { countries } = useAppSelector((state) => state.address);

  useEffect(() => {
    if (countries.length === 0) {
      dispatch(fetchCountries());
    }
  }, []);

  useEffect(() => {
    if (countries.length > 0 && !form.getFieldValue('countryCode')) {
      const phoneStr = user?.phone ? String(user.phone) : '';
      // 1. Explicit "+<code>" prefix
      if (phoneStr.startsWith('+')) {
        const matchedCountry = countries.find((c: any) => {
          const code = String(c.phone_code).replace(/\D/g, '');
          return phoneStr.startsWith(`+${code}`);
        });
        if (matchedCountry) {
          const code = String(matchedCountry.phone_code).replace(/\D/g, '');
          const rawPhone = phoneStr.slice(code.length + 1).replace(/\D/g, '');
          const mobileRule = getMobileRule(code);
          form.setFieldsValue({
            countryCode: code,
            phone: formatMobile(rawPhone, mobileRule.mask),
          });
          return;
        }
      }
      // 2. Legacy phone without "+": detect a known country-code prefix (longest first)
      const digits = phoneStr.replace(/\D/g, '');
      if (digits) {
        const knownCodes = Array.from(new Set(countries.map((c: any) => String(c.phone_code || '').replace(/\D/g, '')).filter(Boolean) as string[]))
          .filter((code) => getMobileRule(code).mask.length > 0)
          .sort((a, b) => b.length - a.length);
        for (const code of knownCodes) {
          if (digits.length > code.length && digits.startsWith(code)) {
            const rest = digits.slice(code.length);
            const mobileRule = getMobileRule(code);
            form.setFieldsValue({
              countryCode: code,
              phone: formatMobile(rest, mobileRule.mask),
            });
            return;
          }
        }
      }
      // 3. No phone, or no known prefix matched: default to US
      const mobileRule = getMobileRule('1');
      form.setFieldsValue({
        countryCode: '1',
        phone: digits ? formatMobile(digits, mobileRule.mask) : '',
      });
    }
  }, [countries]);

  const disableFutureDates = (current: any) => {
    const today = new Date();
    return current && current > today;
  };

  const disableUnder18Years = (current: any) => {
    const today = new Date();
    const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    return (current && current > today) || current > eighteenYearsAgo;
  };

  const uniqueCountryCodes = Array.from(
    new Map(
      countries.map((c: any) => {
        const code = String(c.phone_code).replace(/\D/g, '');
        return [code, { value: code, label: `+${code}` }];
      }),
    ).values(),
  );

  const getPhoneCodeFromCountryId = (code: any) => {
    return code || '';
  };

  const onFinish = async (values: any) => {
    try {
      const phoneCode = getPhoneCodeFromCountryId(values.countryCode);
      const rawPhone = values.phone ? unmaskMobile(values.phone) : '';
      const phone = rawPhone.length > 0 ? `+${phoneCode} ${rawPhone}` : null;

      const data = {
        ...values,
        dob: values.dob ? values.dob.format('YYYY-MM-DD') : null,
        doa: values.doa ? values.doa.format('YYYY-MM-DD') : null,
        phone,
      };
      delete data.countryCode;

      // Dispatch the updateProfile action
      const response: any = await dispatch(updateProfile(data));

      setProfile?.(false);
      notification.success({
        message: response?.payload?.message ?? 'Profile updated successfully!',
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      notification.error({
        message: 'Failed to update profile. Please try again.',
      });
    }
  };

  return (
    <div className={`profile-form-container ${FORM_LABELS}`}>
      <Form
        form={form}
        name="profileForm"
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          first_name: user?.first_name,
          last_name: user?.last_name,
          email: user?.email,
          phone: user?.phone,
          gender: user?.gender,
          dob: user?.dob ? dayjs(user.dob) : null,
          doa: user?.doa ? dayjs(user.doa) : null,
        }}
      >
        <div className="grid grid-cols-2 gap-4 sm:gap-0 sm:grid-cols-1">
          <Form.Item
            name="first_name"
            label="First Name"
            rules={[
              { required: true, message: 'Please enter your first name!' },
              { max: 20, message: 'First name cannot exceed 20 characters!' },
            ]}
          >
            <Input placeholder="First Name" />
          </Form.Item>
          <Form.Item
            name="last_name"
            label="Last Name"
            rules={[
              { required: true, message: 'Please enter your last name!' },
              { max: 20, message: 'Last name cannot exceed 20 characters!' },
            ]}
          >
            <Input placeholder="Last Name" />
          </Form.Item>
        </div>
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
                  return Promise.reject(new Error('Please enter a valid email!'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input placeholder="Email" disabled />
        </Form.Item>
        <div className="grid grid-cols-2 gap-4 sm:gap-0 sm:grid-cols-1">
          <Form.Item label="Mobile Number" required className="!mb-4">
            <div className="flex gap-2 items-stretch">
              <Form.Item name="countryCode" noStyle rules={[{ required: true, message: 'Please select country code!' }]}>
                <Select
                  showSearch
                  placeholder="Code"
                  className="!h-[40px] !w-[80px] shrink-0"
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    String(option?.label ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={uniqueCountryCodes as any}
                  onChange={(countryId) => {
                    const code = getPhoneCodeFromCountryId(countryId);
                    // Reformat existing mobile number with new country mask
                    const currentMobile = form.getFieldValue('phone');
                    if (currentMobile) {
                      const digits = unmaskMobile(currentMobile);
                      const rule = getMobileRule(code);
                      form.setFieldsValue({ phone: formatMobile(digits, rule.mask) });
                    }
                    form.validateFields(['phone']).catch(() => {});
                  }}
                  // optionRender={(option) => {
                  //   const country = countries.find((c: any) => c.id === option.value);
                  //   return (
                  //     <div className="flex items-center gap-2">
                  //       {country?.flag && <img src={country.flag} alt={country.name} className="w-4 h-3 object-cover rounded-sm" />}
                  //       <span>
                  //         {country?.name} (+{String(country?.phone_code).replace(/\D/g, '')})
                  //       </span>
                  //     </div>
                  //   );
                  // }}
                />
              </Form.Item>
              <Form.Item
                name="phone"
                noStyle
                dependencies={['countryCode']}
                rules={[
                  { required: true, message: 'Please enter your phone number' },
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
                  placeholder="Mobile Number"
                  type="text"
                  inputMode="numeric"
                  className="!h-[40px]"
                  maxLength={getMobileRule(getPhoneCodeFromCountryId(form.getFieldValue('countryCode')))?.maxLength}
                />
              </Form.Item>
            </div>
          </Form.Item>
          <Form.Item name="gender" label="Gender" rules={[{ required: false, message: 'Please select your gender!' }]}>
            <Select placeholder="Select Gender">
              <Option value="male">Male</Option>
              <Option value="female">Female</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:gap-0 sm:grid-cols-1">
          <Form.Item name="dob" label="Date of Birth" rules={[{ required: false, message: 'Please select your date of birth!' }]}>
            <DatePicker
              placeholder="Select Date of Birth"
              style={{ width: '100%' }}
              format="Do MMMM YYYY"
              disabledDate={(current) => disableFutureDates(current)}
            />
          </Form.Item>
          <Form.Item name="doa" label="Date of Anniversary">
            <DatePicker
              placeholder="Select Date of Anniversary"
              style={{ width: '100%' }}
              format="Do MMMM YYYY"
              disabledDate={(current) => disableFutureDates(current)}
            />
          </Form.Item>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button htmlType="submit" className={PRIMARY_BTN}>
            Save details
          </Button>
          {setProfile && (
            <Button onClick={() => setProfile(false)} className={SECONDARY_BTN}>
              Cancel
            </Button>
          )}
        </div>
      </Form>
    </div>
  );
};

export default ProfileForm;
