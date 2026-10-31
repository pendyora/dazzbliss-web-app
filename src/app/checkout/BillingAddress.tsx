/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';

import { CloseCircleFilled } from '@ant-design/icons';
import { AutoComplete, Button, Checkbox, Form, Input, Select } from 'antd';

import { Text } from '@/components';
import { varifyEmailApi } from '@/services/cartService';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchAddBillingAddress, fetchCities, fetchCountries, fetchEditBillingAddress, fetchStates } from '@/store/slices/Address/addressSlice';
import { getUpdateUser } from '@/store/slices/auth/authSlice';
import { setGuestDetails } from '@/store/slices/Cart/cartSlice';
import { findExactOptionByName, formatAddressDisplayLine } from '@/utils/common';
import { formatMobile, getMobileRule, unmaskMobile } from '@/utils/mobileValidation';

import AddressDetalis from './AddressDetalis';

const NO_STATES: any[] = [];

type Props = {
  formState?: boolean;
  setPayment?: React.Dispatch<React.SetStateAction<boolean>>;
  setBillingAddress?: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentStep?: React.Dispatch<React.SetStateAction<number>>;
  onAccountPasswordChange?: (password: string | null) => void;
  onContinue?: () => void;
  /** Called when user opens billing edit from a later step; parent can restore this step on Cancel. */
  onBillingEditStart?: () => void;
  /** Called when user cancels billing edit; parent restores checkout step (e.g. back to delivery on mobile). */
  onBillingEditCancel?: () => void;
  /** Called after billing save succeeds so parent can clear remembered step. */
  onBillingSaveSuccess?: () => void;
  isActive?: boolean;
};
const BillingAddress = ({
  formState,
  setPayment,
  setBillingAddress,
  setCurrentStep,
  onAccountPasswordChange,
  onContinue,
  onBillingEditStart,
  onBillingEditCancel,
  onBillingSaveSuccess,
  isActive = true,
}: Props) => {
  const { countries, states, statesByCountry, cities } = useAppSelector((state) => state.address);
  const { user } = useAppSelector((state) => state.auth.auth);
  const [isEditOpen, setIsEditOpen] = useState(formState ?? false);
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const [form] = Form.useForm();
  const selectedCountryId = Form.useWatch('country', form);
  // Read the list for *this* form's country — the shared `states` can belong to another country
  // (Delivery form, saved address) if its request finished last.
  const countryStates = (selectedCountryId != null && statesByCountry?.[String(selectedCountryId)]) || NO_STATES;
  // Browser autofill types the state name before that country's states have loaded; keep it and
  // apply it once they arrive.
  const pendingStateNameRef = useRef('');
  const [selectedCountry, setSelectedCountry] = useState<any | null>(null);
  const { guestDetails } = useAppSelector((state) => state?.cart);
  const billingAddress = guestDetails?.billingAddress ? guestDetails?.billingAddress : user?.billing_address;
  const deliveryAddress = guestDetails?.deliveryAddress ? guestDetails?.deliveryAddress : user?.delivery_address;

  // City is either a Cities-master FK or, for towns missing from that master, free text the
  // buyer typed at checkout. Prefer the association the server sends, then the loaded master,
  // then the free-text value.
  const cityNameFor = (addr: any): string =>
    addr?.cityDetails?.name || cities?.find((el: any) => el.id === addr?.city_id)?.name || addr?.city_text || '';
  const guestEmail = guestDetails?.email || user?.email || '';
  const showCreateAccountOption = Boolean(guestDetails?.token && !guestDetails?.is_exists);
  const didAutoAdvanceRef = useRef(false);
  const wasEditOpenRef = useRef(isEditOpen);

  const [wantAccount, setWantAccount] = useState(false);
  const [existingAccountNotice, setExistingAccountNotice] = useState<string | null>(null);

  // If billing is already available and we are showing the summary view,
  // advance to the delivery step automatically (so user isn't stuck).
  useEffect(() => {
    if (!setCurrentStep) {
      return;
    }
    if (!user || user?.is_guest) {
      return;
    }
    if (!billingAddress) {
      return;
    }
    if (isEditOpen) {
      return;
    }
    if (didAutoAdvanceRef.current) {
      return;
    }
    didAutoAdvanceRef.current = true;
    setCurrentStep(2);
  }, [billingAddress, isEditOpen, setCurrentStep]);

  // The form is visible when editing an existing address OR when it's the
  // active step and no billing address exists yet (first-time guest).
  const isFormVisible = isEditOpen || (isActive && !billingAddress);

  // When the billing form collapses on mobile, scroll to the delivery section.
  useEffect(() => {
    if (wasEditOpenRef.current && !isFormVisible && window.innerWidth < 640) {
      setTimeout(() => {
        const el = document.getElementById('checkout-delivery-section');
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 120;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 100);
    }
    wasEditOpenRef.current = isFormVisible;
  }, [isFormVisible]);

  const handleFinish = async (values: any) => {
    setLoading(true);

    // The city field holds a name, not an id. Match it back to the Cities master when we can;
    // anything the master doesn't know goes through as free text so rural addresses still save.
    const typedCity = String(values?.city ?? '').trim();
    const matchedCity = cities?.find((el: any) => el.name?.toLowerCase() === typedCity.toLowerCase());

    const payload = {
      first_name: values?.firstName,
      last_name: values?.lastName,
      mobile:
        values?.countryCode && values?.mobileNumber
          ? `${values?.countryCode?.startsWith('+') ? values?.countryCode : `+${values?.countryCode}`} ${values?.mobileNumber}`
          : values?.mobileNumber || '',
      email: values?.email,
      address1: values?.address1,
      address2: values?.address2,
      city_id: matchedCity?.id ?? null,
      // Unmatched text is kept verbatim. Affirm is disabled at payment for these, because its
      // address check rejects a city that is not a real USPS locality.
      city_text: matchedCity ? null : typedCity || null,
      state_id: values?.state,
      country_id: values?.country,
      postal_code: values?.zipCode,
      type: 2,
    };

    const response: any = await dispatch(
      billingAddress?.id ? fetchEditBillingAddress({ id: billingAddress?.id, data: payload }) : fetchAddBillingAddress({ data: payload }),
    );

    if (response?.payload?.status === 200 || response?.payload?.status === 201) {
      if (!user || user?.is_guest) {
        const savedBillingAddress = response?.payload?.data?.id
          ? response?.payload?.data
          : response?.payload?.data?.data?.id
            ? response?.payload?.data?.data
            : response?.payload?.data?.address?.id
              ? response?.payload?.data?.address
              : payload;
        dispatch(
          setGuestDetails({
            ...(guestDetails || {}),
            billingAddress: savedBillingAddress,
            email: payload?.email || guestDetails?.email || '',
          }),
        );
      }
      // Pass password up to parent so it can be sent in place order API
      if (wantAccount && values?.password) {
        onAccountPasswordChange?.(values.password);
      }

      if (setPayment) {
        setPayment(true);
      }
      setIsEditOpen(false);

      if (setCurrentStep) {
        setCurrentStep((prev) => Math.max(prev, 2));
      }
      onContinue?.();
      onBillingSaveSuccess?.();
      if (setBillingAddress) {
        setBillingAddress(false);
      }
      if (user && !user?.is_guest) {
        dispatch(getUpdateUser());
      }
    }
    setLoading(false);
  };

  const handleCountryChange = async (countryId: string) => {
    form.setFieldsValue({
      state: null,
      city: '',
      zipCode: '',
    });
    const country = countries.find((item: any) => String(item.id) === String(countryId));
    if (country) {
      setSelectedCountry(country);
      const newCode = country.phone_code ? String(country.phone_code).replace(/\D/g, '') : '';
      form.setFieldsValue({ countryCode: newCode });

      // Reformat existing mobile number with new country mask
      const currentMobile = form.getFieldValue('mobileNumber');
      if (currentMobile) {
        const digits = unmaskMobile(currentMobile);
        const rule = getMobileRule(newCode);
        form.setFieldsValue({ mobileNumber: formatMobile(digits, rule.mask) });
      }
      // Re-validate mobile field
      form.validateFields(['mobileNumber']).catch(() => {});
    } else {
      setSelectedCountry(null);
      form.setFieldsValue({ countryCode: '' });
    }
    await dispatch(fetchStates(countryId));
  };

  const handleStateChange = async (stateId: string) => {
    pendingStateNameRef.current = '';
    form.setFieldsValue({
      city: '',
      zipCode: '',
    });
    await dispatch(fetchCities(stateId));
  };

  useEffect(() => {
    if (countries.length === 0) {
      dispatch(fetchCountries());
    }
  }, []);

  useEffect(() => {
    const pendingName = pendingStateNameRef.current;
    if (!pendingName || form.getFieldValue('state')) {
      return;
    }
    const match = findExactOptionByName(countryStates, pendingName);
    if (match) {
      form.setFieldsValue({ state: match.id });
      handleStateChange(match.id);
    }
  }, [countryStates]);

  useEffect(() => {
    if (billingAddress) {
      const sourceCountry = countries.find((item: any) => String(item.id) === String(billingAddress?.country_id));
      if (sourceCountry) {
        setSelectedCountry(sourceCountry);
      }
      const rawMobile = billingAddress?.mobile || '';
      const countryCodeDigits = sourceCountry?.phone_code ? String(sourceCountry.phone_code).replace(/\D/g, '') : '';
      let mobileWithoutCode = rawMobile.replace(/^\+?/, '');
      if (countryCodeDigits && mobileWithoutCode.startsWith(countryCodeDigits)) {
        mobileWithoutCode = mobileWithoutCode.slice(countryCodeDigits.length);
      }

      const mobileRule = getMobileRule(countryCodeDigits);
      const initialValues = {
        firstName: billingAddress.first_name,
        lastName: billingAddress.last_name,
        address1: billingAddress.address1,
        address2: billingAddress.address2,
        city: cityNameFor(billingAddress),
        state: billingAddress.state_id,
        country: billingAddress.country_id,
        zipCode: billingAddress.postal_code,
        email: billingAddress.email,
        countryCode: countryCodeDigits,
        mobileNumber: formatMobile(mobileWithoutCode, mobileRule.mask),
      };
      form.setFieldsValue(initialValues);
      // Clear any stale validation errors after prefill
      setTimeout(() => form.validateFields(['mobileNumber']).catch(() => {}), 0);
      if (setPayment) {
        setPayment(true);
      }
    }
  }, [billingAddress, deliveryAddress, form, countries]);

  // If billing address details are not available yet, still prefill the email
  // from SignIn so the user doesn't have to type again.
  useEffect(() => {
    if (!guestEmail) {
      return;
    }
    const currentEmail = form.getFieldValue('email');
    if (!currentEmail) {
      form.setFieldsValue({ email: guestEmail });
    }
  }, [guestEmail, form]);
  useEffect(() => {
    if (billingAddress?.country_id) {
      dispatch(fetchStates(billingAddress?.country_id));
    }
    if (billingAddress?.state_id) {
      dispatch(fetchCities(billingAddress?.state_id));
    }
  }, [billingAddress]);

  const handleEditBilling = () => {
    onBillingEditStart?.();
    if (setCurrentStep) {
      setCurrentStep(1);
    }
    onContinue?.();
  };
  return (
    <div className=" flex flex-col items-start gap-[28px] sm:gap-[29px]">
      {!isActive && !isEditOpen ? (
        billingAddress ? (
          <AddressDetalis
            title="Billing"
            userName={`${billingAddress?.first_name} ${billingAddress?.last_name}`}
            userEmail={billingAddress?.email || guestEmail}
            userAddress={formatAddressDisplayLine({
              address1: billingAddress?.address1,
              cityName: cityNameFor(billingAddress),
              stateName: states.find((el: any) => el.id === billingAddress?.state_id)?.name,
              countryName: countries.find((el: any) => el.id === billingAddress?.country_id)?.name,
              postalCode: billingAddress?.postal_code,
            })}
            userPhone={billingAddress?.mobile}
            editButton="edit"
            setIsEditOpen={setIsEditOpen}
            onEditClick={handleEditBilling}
          />
        ) : (
          <Text as="p" size="text5xl" className="text-black-900_7f font-normal uppercase opacity-30 lg:text-[34px] md:!text-[20px]">
            billing address
          </Text>
        )
      ) : billingAddress && !isEditOpen ? (
        <AddressDetalis
          title="Billing"
          userName={`${billingAddress?.first_name} ${billingAddress?.last_name}`}
          userEmail={billingAddress?.email || guestEmail}
          userAddress={formatAddressDisplayLine({
            address1: billingAddress?.address1,
            cityName: cityNameFor(billingAddress),
            stateName: states.find((el: any) => el.id === billingAddress?.state_id)?.name,
            countryName: countries.find((el: any) => el.id === billingAddress?.country_id)?.name,
            postalCode: billingAddress?.postal_code,
          })}
          userPhone={billingAddress?.mobile}
          editButton="edit"
          setIsEditOpen={setIsEditOpen}
          onEditClick={handleEditBilling}
        />
      ) : (
        <>
          <Text as="p" size="text5xl" className="text-black-900_7f font-normal uppercase md:-mb-3 lg:text-[22px] md:!text-[20px] sm:text-[32px]">
            Billing Address
          </Text>
          <Form form={form} layout="vertical" onFinish={handleFinish} className="flex flex-col self-stretch">
            <div className="grid gap-8 grid-cols-2 md:gap-4 sm:grid-cols-1 sm:gap-0">
              <Form.Item name="firstName" label="First name" rules={[{ required: true, message: 'Please enter your first name!' }]}>
                <Input placeholder="First Name Enter" />
              </Form.Item>
              <Form.Item name="lastName" label="Last name" rules={[{ required: true, message: 'Please enter your last name!' }]}>
                <Input placeholder="Last Name Enter" />
              </Form.Item>
            </div>
            <Form.Item
              name="address1"
              label="Address 1"
              rules={[
                { required: true, message: 'Please enter your address!' },
                { max: 60, message: 'Address 1 cannot be more than 60 characters!' },
              ]}
            >
              <Input placeholder="Address 1 Enter" />
            </Form.Item>
            <Form.Item name="address2" label="Address 2" rules={[{ max: 60, message: 'Address 2 cannot be more than 60 characters!' }]}>
              <Input placeholder="Address 2 Enter" />
            </Form.Item>
            <div className="grid gap-8 grid-cols-2 md:gap-4 sm:grid-cols-1 sm:gap-0">
              <Form.Item name="country" label="Country" rules={[{ required: true, message: 'Please select your country!' }]}>
                <Select
                  showSearch
                  // Nothing is pre-highlighted, so Tab/Enter on partial text ("Califor") cannot commit
                  // California. An exact match still auto-selects via onSearch below.
                  defaultActiveFirstOption={false}
                  options={countries?.map((option: any) => ({
                    label: option.name,
                    value: option.id,
                  }))}
                  filterOption={(input, option: any) => option?.label?.toLowerCase()?.includes(input.toLowerCase())}
                  onChange={handleCountryChange}
                  // Typing the full name commits it — no click needed. `handleCountryChange`
                  // must be called by hand because setFieldsValue does not fire `onChange`.
                  onSearch={(text) => {
                    const match = findExactOptionByName(countries, text);
                    if (match) {
                      form.setFieldsValue({ country: match.id });
                      handleCountryChange(match.id);
                    }
                  }}
                  placeholder="Select Country"
                />
              </Form.Item>
              <Form.Item name="state" label="State/Territory" rules={[{ required: true, message: 'Please select your state!' }]}>
                <Select
                  showSearch
                  // Nothing is pre-highlighted, so Tab/Enter on partial text ("Califor") cannot commit
                  // California. An exact match still auto-selects via onSearch below.
                  defaultActiveFirstOption={false}
                  options={countryStates.map((option: any) => ({
                    label: option.name,
                    value: option.id,
                  }))}
                  filterOption={(input, option: any) => option?.label?.toLowerCase()?.includes(input.toLowerCase())}
                  placeholder="Select State"
                  onChange={handleStateChange}
                  onSearch={(text) => {
                    const match = findExactOptionByName(countryStates, text);
                    if (match) {
                      form.setFieldsValue({ state: match.id });
                      handleStateChange(match.id);
                    } else if (text.trim()) {
                      pendingStateNameRef.current = text;
                    }
                  }}
                />
              </Form.Item>
            </div>
            <div className="grid gap-8 grid-cols-2 md:gap-4 sm:grid-cols-1 sm:gap-0 ">
              <Form.Item
                name="city"
                label="City"
                extra="Not in the list? Type your city name."
                rules={[{ required: true, whitespace: true, message: 'Please enter your city!' }]}
              >
                <AutoComplete
                  // rc-select wires the clear (×) to onMouseDown only, and mobile browsers do not
                  // reliably synthesize that from a tap — so the icon looked dead on phones.
                  // The touch handler is purely additive: desktop still clears via mousedown.
                  allowClear={{
                    clearIcon: <CloseCircleFilled onTouchEnd={() => form.setFieldsValue({ city: '' })} />,
                  }}
                  options={cities?.map((option: any) => ({
                    label: option.name,
                    value: option.name,
                  }))}
                  filterOption={(input, option: any) => option?.label?.toLowerCase()?.includes(input.toLowerCase())}
                  placeholder="Select or type your city"
                  onSelect={() => form.setFieldsValue({ zipCode: '' })}
                  onClear={() => form.setFieldsValue({ city: '' })}
                />
              </Form.Item>
              <Form.Item name="zipCode" label="Zip Code" rules={[{ required: true, message: 'Please enter your zip code!' }]}>
                <Input
                  placeholder="ZipCode Enter"
                  inputMode="numeric"
                  onKeyPress={(event) => {
                    if (!/[0-9]/.test(event.key)) {
                      event.preventDefault(); // Block non-numeric input
                    }
                  }}
                  maxLength={7}
                />
              </Form.Item>
            </div>
            <div className="grid gap-8 grid-cols-2 md:gap-4 sm:grid-cols-1 sm:gap-0">
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  {
                    required: true,
                    type: 'email',
                    message: 'Please enter a valid email!',
                  },
                ]}
              >
                <Input placeholder="Email Enter" />
              </Form.Item>
              <Form.Item label="Mobile Number" required className="!mb-0">
                <div className="flex gap-2 items-stretch">
                  <div className="flex items-center gap-1 border border-gray-300 rounded-md px-0 bg-white w-[72px] !h-[40px] shrink-0 overflow-hidden">
                    {selectedCountry?.flag && (
                      <img src={selectedCountry.flag} alt={selectedCountry.name} className="w-4 h-3 object-cover rounded-sm" />
                    )}
                    <Form.Item name="countryCode" noStyle>
                      <Input
                        placeholder={selectedCountry?.phone_code ? String(selectedCountry.phone_code).replace(/\D/g, '') : 'Code'}
                        inputMode="numeric"
                        onChange={(e) => {
                          const digitsOnly = e.target.value.replace(/\D/g, '');
                          form.setFieldsValue({ countryCode: digitsOnly });
                        }}
                        prefix={selectedCountry ? <span className="text-black/70 text-xs leading-none">+</span> : null}
                        className="!border-none !shadow-none !text-xs !h-full !px-2"
                      />
                    </Form.Item>
                  </div>
                  <Form.Item
                    name="mobileNumber"
                    noStyle
                    rules={[
                      {
                        required: true,
                        message: 'Please enter your mobile number!',
                      },
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
            </div>
            {showCreateAccountOption && (
              <div className="flex flex-col gap-4 mb-4 sm:mb-1 sm:mt-4">
                <Form.Item name="wantAccount" valuePropName="checked" noStyle>
                  <Checkbox
                    checked={wantAccount}
                    onChange={async (e) => {
                      const checked = e.target.checked;
                      setExistingAccountNotice(null);
                      if (checked) {
                        const email = form.getFieldValue('email');
                        if (email) {
                          try {
                            const res: any = await varifyEmailApi({ email });
                            const isExists = res?.data?.data?.is_exists || res?.data?.is_exists || res?.is_exists;
                            if (isExists) {
                              setWantAccount(false);
                              form.setFieldsValue({ password: undefined, confirmPassword: undefined });
                              onAccountPasswordChange?.(null);
                              setExistingAccountNotice(
                                res?.data?.message ||
                                  res?.message ||
                                  'An account already exists with this email. You can login to the account or can place an order as guest user.',
                              );
                              return;
                            }
                          } catch {
                            // ignore API error, allow to proceed
                          }
                        }
                        setWantAccount(true);
                      } else {
                        setWantAccount(false);
                        form.setFieldsValue({ password: undefined, confirmPassword: undefined });
                        onAccountPasswordChange?.(null);
                      }
                    }}
                  >
                    <Text as="span" size="textlg" className="text-black-900 text-[16px] font-normal sm:text-[14px]">
                      I want to create an account
                    </Text>
                  </Checkbox>
                </Form.Item>
                {existingAccountNotice && (
                  <div className="w-full flex flex-col gap-2 rounded-sm border border-amber-200 bg-amber-50 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-[2px] flex h-[18px] w-[18px] items-center justify-center rounded-full bg-amber-200 text-[12px] font-sans text-amber-700">
                        i
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="font-sans text-[13px] leading-[18px] text-[#5b5b5b]">{existingAccountNotice}</p>
                      </div>
                    </div>
                  </div>
                )}
                {wantAccount && !existingAccountNotice && (
                  <div className="grid grid-cols-2 gap-8 md:gap-4 sm:grid-cols-1 sm:gap-0">
                    <Form.Item
                      name="password"
                      label="Password"
                      rules={[
                        { required: true, message: 'Please enter your password!' },
                        { min: 8, message: 'Password must be at least 8 characters' },
                      ]}
                    >
                      <Input.Password placeholder="Password" />
                    </Form.Item>
                    <Form.Item
                      name="confirmPassword"
                      label="Confirm Password"
                      dependencies={['password']}
                      rules={[
                        { required: true, message: 'Please confirm your password!' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('Passwords do not match!'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password placeholder="Confirm Password" />
                    </Form.Item>
                  </div>
                )}
              </div>
            )}
            <Form.Item>
              <div className={`w-full flex gap-4 justify-end ${showCreateAccountOption ? 'sm:!mt-2' : 'sm:!mt-6'}`}>
                <Button
                  type="default"
                  // loading={loading}
                  htmlType="button"
                  disabled={billingAddress === null}
                  onClick={() => {
                    if (setPayment) {
                      setPayment(true);
                    }
                    if (setBillingAddress) {
                      setBillingAddress(false);
                    }
                    setIsEditOpen(false);
                    onBillingEditCancel?.();
                  }}
                  className="min-w-[130px] max-w-[360px] w-full px-6 md:!h-[35px] flex flex-row items-center justify-center text-center uppercase tracking-[2.00px] sm:w-full sm:min-w-0 sm:mx-auto"
                >
                  {' Cancel '}
                </Button>
                <Button
                  type="default"
                  loading={loading}
                  htmlType="submit"
                  className="!text-text_w !bg-secondary min-w-[130px] max-w-[360px] w-full px-6 md:!h-[35px] flex flex-row items-center justify-center text-center uppercase tracking-[2.00px] sm:w-full sm:min-w-0 sm:mx-auto"
                >
                  {' Continue '}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </>
      )}
    </div>
  );
};

export default BillingAddress;
