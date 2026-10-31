/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState, Dispatch } from 'react';

import { CloseCircleFilled } from '@ant-design/icons';
import { AutoComplete, Button, Form, Input, Select } from 'antd';

import { CheckBox } from '@/components';
import * as ga4 from '@/lib/analytics';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchAddDeliveryAddress, fetchCities, fetchCountries, fetchEditDeliveryAddress, fetchStates } from '@/store/slices/Address/addressSlice';
import { getUpdateUser } from '@/store/slices/auth/authSlice';
import { setGuestDetails } from '@/store/slices/Cart/cartSlice';
import { findExactOptionByName, formatAddressDisplayLine } from '@/utils/common';
import { formatMobile, getMobileRule, unmaskMobile } from '@/utils/mobileValidation';

import AddressDetalis from './AddressDetalis';
import { PRIMARY_BTN } from './checkoutTheme';
import SectionTitle from './SectionTitle';

type Props = {
  formState?: boolean;
  setShipping?: Dispatch<React.SetStateAction<boolean>>;
  setIsEditDeliveryAddress?: Dispatch<React.SetStateAction<boolean>>;
  setCurrentStep?: Dispatch<React.SetStateAction<number>>;
  onContinue?: () => void;
  isActive?: boolean;
};
const DeliveryAddress = ({ formState, setShipping, setIsEditDeliveryAddress, setCurrentStep, onContinue, isActive = true }: Props) => {
  const { countries, states, cities } = useAppSelector((state) => state.address);
  const { user } = useAppSelector((state) => state.auth.auth);
  const dispatch = useAppDispatch();
  const [isEdit, setIsEdit] = useState(false);
  // In checkout page: if delivery already exists, show the summary by default.
  // When editing, `isEditOpen` will switch to true.
  const [isEditOpen, setIsEditOpen] = useState(formState ?? false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [selectedCountry, setSelectedCountry] = useState<any | null>(null);
  const [isSameAsBilling, setIsSameAsBilling] = useState(false);
  const deliveryAddress = user?.delivery_address;
  const { guestDetails, cartProducts } = useAppSelector((state) => state?.cart);
  const shippingInfoTracked = useRef(false);
  const guestEmail = guestDetails?.email || user?.email || '';
  const billingAddress = guestDetails?.billingAddress ? guestDetails?.billingAddress : user?.billing_address;

  const sourceAddress = guestDetails?.deliveryAddress || deliveryAddress || null;
  const didAutoAdvanceRef = useRef(false);
  const wasEditOpenRef = useRef(isEditOpen);

  // City is either a Cities-master FK or, for towns missing from that master, free text the
  // buyer typed at checkout. Prefer the association the server sends, then the loaded master,
  // then the free-text value.
  const cityNameFor = (addr: any): string =>
    addr?.cityDetails?.name || cities?.find((el: any) => el.id === addr?.city_id)?.name || addr?.city_text || '';

  // If delivery is already available and we are showing the summary view,
  // advance to promo step automatically (logged-in and guest — same as checkout flow).
  useEffect(() => {
    if (!setCurrentStep) {
      return;
    }
    if (!sourceAddress) {
      return;
    }
    if (loading) {
      return;
    }
    if (isEditOpen) {
      return;
    }
    if (didAutoAdvanceRef.current) {
      return;
    }
    didAutoAdvanceRef.current = true;
    setCurrentStep((prev) => Math.max(prev, 3));
  }, [sourceAddress, loading, isEditOpen, setCurrentStep]);

  // When the delivery form collapses, scroll to the payment section.
  useEffect(() => {
    if (wasEditOpenRef.current && !isEditOpen) {
      setTimeout(() => {
        const el = document.getElementById('checkout-payment-section');
        if (el) {
          const offset = window.innerWidth < 640 ? 120 : 140;
          const top = el.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 100);
    }
    wasEditOpenRef.current = isEditOpen;
  }, [isEditOpen]);

  const handleFinish = async (values: any) => {
    // A billing address saved before city became required would copy an empty city through to
    // delivery and be rejected by the server. Reveal the form instead, so the city error lands
    // on a field the buyer can actually see and fix.
    if (isSameAsBilling && billingAddress && !billingAddress?.city_id && !`${billingAddress?.city_text ?? ''}`.trim()) {
      hasUserToggledCheckboxRef.current = true;
      setIsSameAsBilling(false);
      setTimeout(() => {
        form.validateFields(['city']).catch(() => {
          form.scrollToField('city', { behavior: 'smooth', block: 'center', focus: true });
        });
      }, 0);
      return;
    }
    setLoading(true);
    // The city field holds a name, not an id. Match it back to the Cities master when we can;
    // anything the master doesn't know goes through as free text so rural addresses still save.
    const typedCity = String(values?.city ?? '').trim();
    const matchedCity = cities?.find((el: any) => el.name?.toLowerCase() === typedCity.toLowerCase());
    const payload =
      isSameAsBilling && billingAddress
        ? {
            first_name: billingAddress?.first_name,
            last_name: billingAddress?.last_name,
            mobile: billingAddress?.mobile,
            email: billingAddress?.email,
            address1: billingAddress?.address1,
            address2: billingAddress?.address2,
            city_id: billingAddress?.city_id ?? null,
            city_text: billingAddress?.city_text ?? null,
            state_id: billingAddress?.state_id,
            country_id: billingAddress?.country_id,
            postal_code: billingAddress?.postal_code,
            type: 1, // Because it's Delivery Address.
          }
        : {
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
            // Unmatched text is kept verbatim. Affirm is disabled at payment for these, because
            // its address check rejects a city that is not a real USPS locality.
            city_text: matchedCity ? null : typedCity || null,
            state_id: values?.state,
            country_id: values?.country,
            postal_code: values?.zipCode,
            type: 1, // Because it's Delivery Address.
          };

    const response: any = await dispatch(
      isEdit ? fetchEditDeliveryAddress({ id: sourceAddress?.id, data: payload }) : fetchAddDeliveryAddress({ data: payload }),
    );
    if (response?.payload?.status === 200 || response?.payload?.status === 201) {
      if (!user || user?.is_guest) {
        const savedDeliveryAddress = response?.payload?.data?.id
          ? response?.payload?.data
          : response?.payload?.data?.data?.id
            ? response?.payload?.data?.data
            : response?.payload?.data?.address?.id
              ? response?.payload?.data?.address
              : payload;
        dispatch(
          setGuestDetails({
            ...(guestDetails || {}),
            deliveryAddress: savedDeliveryAddress,
            email: payload?.email || guestDetails?.email || '',
          }),
        );
      }
      // GA4 add_shipping_info (fire once per checkout session)
      if (!shippingInfoTracked.current) {
        shippingInfoTracked.current = true;
        ga4.addShippingInfo(ga4.mapCartItemsToGA4(cartProducts));
      }
      if (setShipping) {
        setShipping(true);
      }
      setIsEditOpen(false);
      if (setCurrentStep) {
        setCurrentStep((prev) => Math.max(prev, 3));
        onContinue?.();
      }
      if (setIsEditDeliveryAddress) {
        setIsEditDeliveryAddress(false);
      }
      setIsEdit(true);
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
    const country = countries.find((item: any) => item.id === countryId);
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
    }
    await dispatch(fetchStates(countryId));
  };

  const handleStateChange = async (stateId: string) => {
    form.setFieldsValue({
      city: '',
      zipCode: '',
    });
    await dispatch(fetchCities(stateId));
  };

  const hasUserToggledCheckboxRef = React.useRef(false);

  const prefillFromBilling = () => {
    if (!billingAddress) {
      return;
    }
    const sourceCountry = countries.find((item: any) => item.id === billingAddress?.country_id);
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
    form.setFieldsValue({
      firstName: billingAddress.first_name,
      lastName: billingAddress.last_name,
      address1: billingAddress.address1,
      address2: billingAddress.address2,
      city: cityNameFor(billingAddress),
      state: billingAddress.state_id,
      country: billingAddress.country_id,
      zipCode: billingAddress.postal_code,
      email: billingAddress.email || guestEmail || '',
      countryCode: countryCodeDigits,
      mobileNumber: formatMobile(mobileWithoutCode, mobileRule.mask),
    });
    setTimeout(() => form.validateFields(['mobileNumber']).catch(() => {}), 0);

    if (billingAddress?.country_id) {
      dispatch(fetchStates(billingAddress?.country_id));
    }
    if (billingAddress?.state_id) {
      dispatch(fetchCities(billingAddress?.state_id));
    }
  };

  const prefillFromSourceAddress = (addr: any) => {
    if (!addr) {
      return;
    }
    const sourceCountry = countries.find((item: any) => item.id === addr?.country_id);
    if (sourceCountry) {
      setSelectedCountry(sourceCountry);
    }

    const rawMobile = addr?.mobile || '';
    const countryCodeDigits = sourceCountry?.phone_code ? String(sourceCountry.phone_code).replace(/\D/g, '') : '';
    let mobileWithoutCode = rawMobile.replace(/^\+?/, '');
    if (countryCodeDigits && mobileWithoutCode.startsWith(countryCodeDigits)) {
      mobileWithoutCode = mobileWithoutCode.slice(countryCodeDigits.length);
    }

    const mobileRule = getMobileRule(countryCodeDigits);
    form.setFieldsValue({
      firstName: addr?.first_name || '',
      lastName: addr?.last_name || '',
      address1: addr?.address1 || '',
      address2: addr?.address2 || '',
      country: addr?.country_id || undefined,
      state: addr?.state_id || undefined,
      city: cityNameFor(addr),
      zipCode: addr?.postal_code || '',
      email: addr?.email || guestEmail || '',
      countryCode: countryCodeDigits,
      mobileNumber: formatMobile(mobileWithoutCode, mobileRule.mask),
    });
    setTimeout(() => form.validateFields(['mobileNumber']).catch(() => {}), 0);

    if (addr?.country_id) {
      dispatch(fetchStates(addr?.country_id));
    }
    if (addr?.state_id) {
      dispatch(fetchCities(addr?.state_id));
    }
  };

  const handleAsBillingAddress = (checked: boolean) => {
    hasUserToggledCheckboxRef.current = true;
    setIsSameAsBilling(checked);
    if (checked) {
      // When user checks, prefill from billing.
      prefillFromBilling();
    }
  };
  useEffect(() => {
    if (countries.length === 0) {
      dispatch(fetchCountries());
    }
  }, []);
  // Default behavior:
  // - When billing exists and delivery is being edited/entered: start with "Same as billing address" checked and prefill from billing.
  // - Otherwise prefill from the saved delivery address (if any).
  useEffect(() => {
    if (!billingAddress && !sourceAddress) {
      return;
    }
    if (hasUserToggledCheckboxRef.current) {
      return;
    }

    const hasExistingDelivery = Boolean(sourceAddress && Object.keys(sourceAddress).length > 0);
    setIsEdit(hasExistingDelivery);

    if (billingAddress) {
      setIsSameAsBilling(true);
      prefillFromBilling();
    } else {
      setIsSameAsBilling(false);
      prefillFromSourceAddress(sourceAddress);
    }
  }, [billingAddress, sourceAddress, countries]);

  // If delivery address details are not available yet, still prefill the email
  // from SignIn so the user doesn't have to type again.
  useEffect(() => {
    if (!guestEmail) {
      return;
    }
    // If the user toggled "Same as billing" we don't auto-fill email anymore;
    // they should enter it as part of the full delivery form.
    if (hasUserToggledCheckboxRef.current) {
      return;
    }
    const currentEmail = form.getFieldValue('email');
    if (!currentEmail) {
      form.setFieldsValue({ email: guestEmail });
    }
  }, [guestEmail, form]);

  const handleEditDelivery = () => {
    if (setCurrentStep) {
      setCurrentStep(2);
    }
    onContinue?.();
  };

  return (
    <div className="flex w-full flex-col items-stretch gap-6 self-stretch">
      {!isActive && !isEditOpen ? (
        sourceAddress ? (
          <AddressDetalis
            title={'delivery'}
            userName={`${sourceAddress?.first_name} ${sourceAddress?.last_name}`}
            userEmail={sourceAddress?.email || guestEmail}
            userAddress={formatAddressDisplayLine({
              address1: sourceAddress?.address1,
              cityName: cityNameFor(sourceAddress),
              stateName: states.find((el: any) => el.id === sourceAddress?.state_id)?.name,
              countryName: countries.find((el: any) => el.id === sourceAddress?.country_id)?.name,
              postalCode: sourceAddress?.postal_code,
            })}
            userPhone={sourceAddress?.mobile}
            editButton="edit"
            setIsEditOpen={setIsEditOpen}
            onEditClick={handleEditDelivery}
          />
        ) : (
          <SectionTitle muted>Delivery address</SectionTitle>
        )
      ) : sourceAddress && !loading && !isEditOpen ? (
        <AddressDetalis
          title={'delivery'}
          userName={`${sourceAddress?.first_name} ${sourceAddress?.last_name}`}
          userEmail={sourceAddress?.email || guestEmail}
          userAddress={formatAddressDisplayLine({
            address1: sourceAddress?.address1,
            cityName: cityNameFor(sourceAddress),
            stateName: states.find((el: any) => el.id === sourceAddress?.state_id)?.name,
            countryName: countries.find((el: any) => el.id === sourceAddress?.country_id)?.name,
            postalCode: sourceAddress?.postal_code,
          })}
          userPhone={sourceAddress?.mobile}
          editButton="edit"
          setIsEditOpen={setIsEditOpen}
          onEditClick={handleEditDelivery}
        />
      ) : (
        <>
          <SectionTitle>Delivery address</SectionTitle>
          {billingAddress ? (
            <div className="w-full self-stretch">
              <CheckBox
                required
                checked={isSameAsBilling}
                onChange={(e: any) => handleAsBillingAddress(e)}
                size="xs"
                label="Same as billing address"
                id="delivery-same-as-billing"
                className="w-full justify-start gap-3 text-left text-[13.5px] text-ink"
              />
            </div>
          ) : null}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            className="flex flex-col self-stretch sm:[&_.ant-form-item]:!mb-4 sm:[&_.ant-form-item-label]:!pb-1"
          >
            <div className={isSameAsBilling ? 'hidden' : ''}>
              <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-1">
                <Form.Item name="firstName" label="First name" rules={[{ required: true, message: 'Please enter your first name!' }]}>
                  <Input disabled={isSameAsBilling} />
                </Form.Item>
                <Form.Item name="lastName" label="Last name" rules={[{ required: true, message: 'Please enter your last name!' }]}>
                  <Input disabled={isSameAsBilling} />
                </Form.Item>
              </div>
              <Form.Item
                name="address1"
                label="Address"
                rules={[
                  { required: true, message: 'Please enter your address!' },
                  { max: 60, message: 'Address cannot be more than 60 characters!' },
                ]}
              >
                <Input placeholder="Street and house number" disabled={isSameAsBilling} />
              </Form.Item>
              <Form.Item
                name="address2"
                label="Apartment, suite, building (optional)"
                rules={[{ max: 60, message: 'Address 2 cannot be more than 60 characters!' }]}
              >
                <Input disabled={isSameAsBilling} />
              </Form.Item>
              <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-1">
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
                    placeholder="Select"
                    disabled={isSameAsBilling}
                  />
                </Form.Item>
                <Form.Item name="state" label="State / region" rules={[{ required: true, message: 'Please select your state!' }]}>
                  <Select
                    showSearch
                    // Nothing is pre-highlighted, so Tab/Enter on partial text ("Califor") cannot commit
                    // California. An exact match still auto-selects via onSearch below.
                    defaultActiveFirstOption={false}
                    options={states?.map((option: any) => ({
                      label: option.name,
                      value: option.id,
                    }))}
                    filterOption={(input, option: any) => option?.label?.toLowerCase()?.includes(input.toLowerCase())}
                    placeholder="Select"
                    onChange={handleStateChange}
                    onSearch={(text) => {
                      const match = findExactOptionByName(states, text);
                      if (match) {
                        form.setFieldsValue({ state: match.id });
                        handleStateChange(match.id);
                      }
                    }}
                    disabled={isSameAsBilling}
                  />
                </Form.Item>
              </div>
              <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-1">
                <Form.Item
                  name="city"
                  label="City"
                  extra="Not in the list? Type your city name."
                  // Skipped while "same as billing" hides this block — the payload takes the city
                  // straight off the billing address then, so validating the hidden copy would
                  // only produce an error the buyer cannot see or reach.
                  rules={[{ required: !isSameAsBilling, whitespace: true, message: 'Please enter your city!' }]}
                >
                  <AutoComplete
                    // rc-select wires the clear (×) to onMouseDown only, and mobile browsers do
                    // not reliably synthesize that from a tap — so the icon looked dead on phones.
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
                    disabled={isSameAsBilling}
                  />
                </Form.Item>
                <Form.Item name="zipCode" label="ZIP / postal code" rules={[{ required: true, message: 'Please enter your zip code!' }]}>
                  <Input
                    inputMode="numeric"
                    onKeyPress={(event) => {
                      if (!/[0-9]/.test(event.key)) {
                        event.preventDefault(); // Block non-numeric input
                      }
                    }}
                    maxLength={7}
                    disabled={isSameAsBilling}
                  />
                </Form.Item>
              </div>
              <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-1">
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
                  <Input disabled={isSameAsBilling} />
                </Form.Item>
                <Form.Item label="Phone" required className="!mb-0">
                  <div className="flex gap-2 items-stretch">
                    <div className="flex items-center gap-1 border border-line px-0 bg-paper w-[88px] !h-12 shrink-0 overflow-hidden">
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
                          prefix={selectedCountry ? <span className="text-ink-soft text-xs leading-none">+</span> : null}
                          className="!border-none !shadow-none !text-xs !h-full !px-2"
                          disabled={isSameAsBilling}
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
                        placeholder="Phone number"
                        type="text"
                        inputMode="numeric"
                        className="!h-12"
                        maxLength={getMobileRule(form.getFieldValue('countryCode'))?.maxLength}
                        disabled={isSameAsBilling}
                      />
                    </Form.Item>
                  </div>
                </Form.Item>
              </div>
            </div>
            <Form.Item className={isSameAsBilling ? '!mb-0 !mt-2 md:!mt-2 sm:!mt-2' : '!mb-0 !mt-6 md:!mt-4 sm:!mt-3'}>
              <div className="w-full flex justify-end sm:justify-center">
                <Button
                  type="default"
                  htmlType="submit"
                  loading={loading}
                  className={`${PRIMARY_BTN} min-w-[130px] max-w-[360px] w-full sm:max-w-none`}
                >
                  Continue to payment
                </Button>
              </div>
            </Form.Item>
          </Form>
        </>
      )}
    </div>
  );
};

export default DeliveryAddress;
