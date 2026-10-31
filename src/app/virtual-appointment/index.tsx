'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Button, Card, DatePicker, Form, Image, Input, Modal, notification, Select, Steps, Typography } from 'antd';
import dayjs from 'dayjs';
import moment from 'moment-timezone';

import CloudflareTurnstile, { CloudflareTurnstileHandle } from '@/components/common/CloudflareTurnstile';
import { JEWELRY_TYPE } from '@/constants/master.constant';
import { useHoneypot } from '@/hook/useHoneypot';
import { apiAppointment } from '@/services/authService';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCountries } from '@/store/slices/Address/addressSlice';
import { isDisposableDomain, isValidEmailFormat } from '@/utils/emailValidation';
import { formatMobile, getMobileRule, unmaskMobile } from '@/utils/mobileValidation';

const { Step } = Steps;
const { Title, Text } = Typography;

const dateFormat = 'DD/MM/YYYY';
const isoFormat = 'YYYY-MM-DD';

// Appointments are always scheduled against Pacific time, no matter where the visitor is.
const BUSINESS_TIME_ZONE = 'America/Los_Angeles';
const BUSINESS_START_HOUR = 9; // first slot starts at 9:00 AM PT
const BUSINESS_END_HOUR = 17; // business closes at 5:00 PM PT, so the last slot starts at 4:00 PM PT
const SLOT_DURATION_MINUTES = 50;

// Earliest Pacific business slot that has not started yet.
const getFirstBookableInstant = () => {
  const now = moment.tz(BUSINESS_TIME_ZONE);
  for (let offset = 0; offset <= 1; offset++) {
    const dayStart = now.clone().add(offset, 'day').startOf('day');
    for (let hour = BUSINESS_START_HOUR; hour < BUSINESS_END_HOUR; hour++) {
      const start = dayStart.clone().hour(hour);
      if (start.isAfter(now)) {
        return start;
      }
    }
  }
  return now;
};

// Slots for one calendar day *as the visitor sees it* in `timeZone`. The 9 AM - 5 PM Pacific window can
// straddle midnight elsewhere, so the neighbouring Pacific days are scanned too and only the instants
// that actually land on the requested local day are kept.
const generateTimeSlots = (localDate: any, timeZone: any) => {
  const target = moment.tz(localDate, dateFormat, timeZone);
  if (!target.isValid()) {
    return [];
  }
  const targetKey = target.format(isoFormat);

  const slots = [];
  for (let offset = -1; offset <= 1; offset++) {
    const dayStart = moment.tz(targetKey, isoFormat, BUSINESS_TIME_ZONE).add(offset, 'day').startOf('day');

    for (let hour = BUSINESS_START_HOUR; hour < BUSINESS_END_HOUR; hour++) {
      const start = dayStart.clone().hour(hour);
      const localStart = start.clone().tz(timeZone);
      if (localStart.format(isoFormat) !== targetKey) {
        continue;
      }
      const end = start.clone().add(SLOT_DURATION_MINUTES, 'minutes');

      slots.push({
        // The instant itself is the identity — it stays valid across time zone switches.
        value: start.valueOf(),
        startAt: start.valueOf(),
        label: `${localStart.format('h:mm A')} - ${end.clone().tz(timeZone).format('h:mm A')}`,
        time: localStart.format('h:mm A'),
        localDate: localStart.format(isoFormat),
        localDateShort: localStart.format('MMMM Do YYYY'),
        // What the backend receives: always the Pacific date and wall clock.
        server_time: `${start.format('h:mm A')} - ${end.format('h:mm A')}`,
        businessDate: start.format(isoFormat),
      });
    }
  }
  return slots.sort((a, b) => a.startAt - b.startAt);
};

export default function VirtualAppointment() {
  const { data } = useAppSelector((state) => state.master);
  const { user } = useAppSelector((state) => state.auth.auth);
  const { countries } = useAppSelector((state) => state.address);
  const dispatch = useAppDispatch();
  const [form] = Form.useForm();
  const [timeSlots, setTimeSlots] = useState<any>([]);

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

  const parseUserPhone = (raw: string) => {
    const value = (raw || '').trim();
    let code = '1';
    let digits = '';
    if (value.startsWith('+')) {
      const [codePart, ...rest] = value.slice(1).split(/\s+/);
      code = (codePart || '').replace(/\D/g, '') || '1';
      digits = unmaskMobile(rest.join(' '));
    } else {
      digits = unmaskMobile(value);
    }
    const rule = getMobileRule(code);
    return { countryCode: code, mobileNumber: formatMobile(digits, rule.mask) };
  };
  const [timeZone, setTimeZone] = useState(BUSINESS_TIME_ZONE);
  const [AppointmentData, setAppointmentData] = useState<any>(() => ({
    locations: 'Virtual Appointment',
    date: getFirstBookableInstant().tz(BUSINESS_TIME_ZONE).format(dateFormat),
    time: '',
    service: '',
    name: '',
    email: '',
    phone_numbers: '',
    message: '',
    password: '',
  }));

  useEffect(() => {
    if (user) {
      setAppointmentData((prev: any) => ({
        ...prev,
        name: `${user.first_name} ${user.last_name}` || prev.name,
        email: user.email || prev.email,
        phone_numbers: user.phone || prev.phone_numbers,
      }));
    }
  }, [user]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [emailError, setEmailError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<CloudflareTurnstileHandle>(null);
  const { HoneypotField, isHoneypotClean } = useHoneypot('appointment_website_confirm');

  const showModal = () => {
    setCurrentStep(0);
    setIsModalVisible(true);
    setTimeZone(BUSINESS_TIME_ZONE);
    setAppointmentData((prev: any) => ({ ...prev, date: getFirstBookableInstant().tz(BUSINESS_TIME_ZONE).format(dateFormat), time: '' }));
  };

  useEffect(() => {
    setTimeSlots(generateTimeSlots(AppointmentData.date, timeZone));
  }, [AppointmentData.date, timeZone]);

  // Keeps the "already passed" check fresh while the modal stays open.
  const [nowTs, setNowTs] = useState<number>(() => Date.now());
  useEffect(() => {
    if (!isModalVisible) {
      return;
    }
    setNowTs(Date.now());
    const interval = setInterval(() => setNowTs(Date.now()), 60 * 1000);
    return () => clearInterval(interval);
  }, [isModalVisible]);

  // Only slots inside the Pacific business hours that have not started yet are bookable.
  const availableSlots = useMemo(() => timeSlots.filter((slot: any) => slot.startAt > nowTs), [timeSlots, nowTs]);

  const selectedSlot = useMemo(() => timeSlots.find((slot: any) => slot.value === AppointmentData.time), [timeSlots, AppointmentData.time]);

  // `nowTs` / `timeZone` are intentional deps: these all depend on the current clock or the display zone.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const businessTimeZoneLabel = useMemo(() => moment.tz(BUSINESS_TIME_ZONE).format('z'), [nowTs]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const localTimeZoneLabel = useMemo(() => moment.tz(timeZone).format('z'), [timeZone, nowTs]);
  // First day the visitor can pick, expressed in their own time zone.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const firstBookableDate = useMemo(() => dayjs(getFirstBookableInstant().tz(timeZone).format(isoFormat)), [timeZone, nowTs]);

  // Drop a selected slot once it is no longer offered (date changed, or the slot start time passed).
  useEffect(() => {
    if (AppointmentData.time === '') {
      return;
    }
    if (!availableSlots.some((slot: any) => slot.value === AppointmentData.time)) {
      setAppointmentData((prev: any) => ({ ...prev, time: '' }));
    }
  }, [availableSlots, AppointmentData.time]);

  // Switching time zones must never leave the picker on a day that is already fully in the past there.
  useEffect(() => {
    const picked = dayjs(AppointmentData.date, dateFormat);
    if (picked.isValid() && picked.isBefore(firstBookableDate, 'day')) {
      setAppointmentData((prev: any) => ({ ...prev, date: firstBookableDate.format(dateFormat) }));
    }
  }, [firstBookableDate, AppointmentData.date]);

  const handleCancel = () => {
    setIsModalVisible(false);
    setCurrentStep(0);
    setAppointmentData({
      locations: 'Virtual Appointment',
      date: getFirstBookableInstant().tz(BUSINESS_TIME_ZONE).format(dateFormat),
      time: '',
      service: '',
      name: '',
      email: '',
      phone_numbers: '',
      message: '',
      password: '',
    });
    setTimeZone(BUSINESS_TIME_ZONE);
  };

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const onChange = (key: any, value: any) => {
    setAppointmentData((prev: any) => {
      return { ...prev, [key]: value };
    });
  };

  const onSubmit = async () => {
    if (!isHoneypotClean()) {
      return;
    }
    const emailValue = (AppointmentData?.email || '').trim();
    if (!emailValue || !isValidEmailFormat(emailValue)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    if (isDisposableDomain(emailValue)) {
      setEmailError('Please enter a valid permanent email address');
      return;
    }
    setEmailError('');
    try {
      const bookedSlot = availableSlots.find((item: any) => item.value === AppointmentData.time);
      if (!bookedSlot?.server_time) {
        notification.error({ message: `Please select a valid time slot between 9:00 AM and 5:00 PM ${businessTimeZoneLabel}.` });
        return;
      }
      const res: any = await apiAppointment({
        ...AppointmentData,
        jewelry_type: AppointmentData.service,
        // The visitor picks a day in their own zone; the backend is always given the Pacific date and time.
        date: bookedSlot.businessDate,
        time: bookedSlot.server_time,
        // The same slot as the visitor saw it, stored alongside the Pacific values so the confirmation
        // email and the admin list can both show the time they actually picked.
        customer_date: bookedSlot.localDate,
        customer_time: bookedSlot.label,
        customer_time_zone: timeZone,
        customer_time_zone_label: localTimeZoneLabel,
        cloudflareTurnstileToken: turnstileToken,
      });

      notification.success({
        message: res?.data?.message,
      });
      handleCancel();
    } catch (error: any) {
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      notification.error({
        message: error.response.data.message,
      });
    }
  };
  return (
    <div className="w-full h-full">
      <div className="p-10 bg-[#f9f9f9] flex justify-center sm:p-0 ">
        <div className="p-4 w-[90%] sm:w-full ">
          <div className="flex w-full  gap-10 sm:gap-4 flex-row md:flex-col">
            <div className="w-[45%] md:w-full">
              <Image
                src="/images/virtual-appointment.webp" // Replace with your image path
                alt="Virtual Appointment"
                // width={600}
                preview={false}
                // height={400}
                style={{ borderRadius: '8px' }}
              />
            </div>
            <div className="w-[48%] md:w-full">
              <Title level={2} style={{ marginBottom: '20px' }} className="sm:!text-[18px]">
                Virtual Appointment
              </Title>
              <Text style={{ fontSize: '16px', lineHeight: '1.8' }} className="sm:!text-[12px]">
                Book a virtual appointment with one of our jewelry specialists and experience a personalized video consultation where you can explore
                engagement rings, wedding bands, loose gemstones, fine jewelry, and more.
              </Text>
              <div style={{ marginTop: '30px' }} className="sm:!mt-3 ">
                <Text style={{ display: 'block', marginBottom: '10px' }} className="sm:!text-[12px]">
                  From the comfort of your own home
                </Text>
                <Text className="sm:!text-[12px]">Daily: 9:00 am - 5:00 pm {businessTimeZoneLabel}</Text>
              </div>
              <Button
                className="!bg-secondary !text-text_w sm:!mt-3 sm:!text-[12px] sm:w-full sm:!h-[35px]"
                size="large"
                onClick={showModal}
                style={{ marginTop: '30px' }}
              >
                Book Appointment
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Modal
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        title="Virtual Appointment"
        destroyOnClose
        maskClosable={false}
        className=" !w-[55%] 2xl:!w-[65%]  xl:!w-[75%] lg:!w-[79%]  md:!w-[90%] sm:!w-[90%]"
        styles={{
          body: { maxHeight: 'min(90dvh, calc(100vh - 120px))', overflowY: 'auto', overflowX: 'visible' },
        }}
      >
        <div className="w-full p-5 sm:p-0">
          <Steps
            className="force-horizontal-steps"
            current={currentStep}
            direction="horizontal"
            progressDot={true}
            onChange={(step) => setCurrentStep(step)}
            style={{ marginBottom: '10px' }}
          >
            <Step
              title="Service"
              description={AppointmentData.service != '' ? AppointmentData?.service : 'Select a Service'}
              className="sm:!text-[10px]"
            />
            <Step
              title="Date & Time"
              disabled={AppointmentData.service === ''}
              description={
                AppointmentData.date != ''
                  ? selectedSlot
                    ? `${selectedSlot.localDateShort} - ${selectedSlot.label}`
                    : dayjs(AppointmentData.date, dateFormat).format('MMMM Do YYYY')
                  : 'Select a Date & Time'
              }
            />
            <Step
              title="Confirm"
              disabled={AppointmentData.date === '' && AppointmentData.time === '' && AppointmentData.service === ''}
              description="Confirm Your Appointment"
            />
          </Steps>
          {currentStep === 0 && (
            <div className="flex flex-col h-full">
              <Title level={4} className="sm:!text-[16px]">
                Select a Service
              </Title>
              <div className="flex gap-3 flex-wrap">
                {JEWELRY_TYPE.map((service: any, index: number) => (
                  <Card
                    hoverable
                    key={index}
                    className={`w-[49%] md:w-full h-fit ${service.title === AppointmentData?.service ? 'border border-primary' : 'border border-[#f0f0f0]'}`}
                    onClick={() => onChange('service', service.title)}
                    style={{
                      border: service.title === AppointmentData?.service ? '1px solid #17381d' : '1px solid #f0f0f0',
                    }}
                  >
                    <div className="flex sm:grid sm:grid-cols-5">
                      <div className="sm:col-span-1 sm:flex sm:items-center ">
                        <Image
                          src={service.image}
                          preview={false}
                          width={'100%'}
                          alt={service.title}
                          className="sm:w-full sm:!aspect-square sm:h-full object-cover"
                        />
                      </div>
                      <div className="flex  flex-col p-5 sm:col-span-4 sm:p-2 sm:pt-0">
                        <Title level={5} className="!m-0 sm:!text-[14px]">
                          {service.title}
                        </Title>
                        {/* <Text>{service.duration}</Text> */}
                        <Text className="leading sm:!text-[12px] sm:!leading-3">{service.description}</Text>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <div style={{ marginTop: '20px', textAlign: 'right' }} className="sm:w-full sm:flex sm:gap-2 sm:justify-between">
                <Button
                  style={{ marginRight: '8px' }}
                  disabled={currentStep == 0}
                  onClick={handlePrevious}
                  className="sm:!h-[35px] sm:!w-1/2 sm:!text-[12px]"
                >
                  Previous
                </Button>
                <Button
                  className="!bg-secondary !text-text_w sm:!w-1/2 sm:!h-[35px] sm:!text-[12px]"
                  disabled={AppointmentData.service == ''}
                  onClick={handleNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div>
              <Title level={4} className="!mb-3 sm:!text-[16px]">
                Select a Date &amp; Time ({businessTimeZoneLabel})
              </Title>
              <div className="flex gap-4 flex-row lg:flex-col">
                <div className="w-[300px] sm:w-full ">
                  <Text type="secondary" className="block !mb-1 sm:!text-[12px]">
                    Appointment date ({localTimeZoneLabel})
                  </Text>
                  <DatePicker
                    className="w-[300px] sm:w-full"
                    format={dateFormat}
                    size="small"
                    value={AppointmentData.date ? dayjs(AppointmentData.date, dateFormat) : null}
                    getPopupContainer={(trigger) => trigger.closest('.ant-modal-content') || trigger.parentElement || document.body}
                    disabledDate={(current) => {
                      return current && current.isBefore(firstBookableDate, 'day');
                    }}
                    onChange={(date, dateString) => {
                      if (date && date.isValid()) {
                        onChange('date', dateString);
                      } else {
                        console.error('Invalid date selected');
                      }
                    }}
                  />
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    {/* Same label markup as the date field so both controls sit on one row. */}
                    <Text type="secondary" className="block !mb-1 sm:!text-[12px]">
                      Time zone
                    </Text>
                    <Select
                      className="w-[300px] sm:w-full"
                      value={timeZone}
                      size="small"
                      getPopupContainer={(trigger) => trigger.closest('.ant-modal-content') || trigger.parentElement || document.body}
                      popupMatchSelectWidth={false}
                      listHeight={256}
                      onChange={(value) => {
                        setTimeZone(value);
                        // Keep the already-picked slot: it is a fixed instant, so only the day it lands on changes.
                        setAppointmentData((prev: any) =>
                          prev.time === '' ? prev : { ...prev, date: moment(prev.time).tz(value).format(dateFormat) },
                        );
                      }}
                    >
                      <Select.Option value="America/Los_Angeles">Pacific Time (PT)</Select.Option>
                      <Select.Option value="America/Denver">Mountain Time (MT)</Select.Option>
                      <Select.Option value="America/Chicago">Central Time (CT)</Select.Option>
                      <Select.Option value="America/New_York">Eastern Time (ET)</Select.Option>
                      <Select.Option value="UTC">UTC (Coordinated Universal Time)</Select.Option>
                      <Select.Option value="Asia/Kolkata">Indian Standard Time (IST)</Select.Option>
                    </Select>
                  </div>

                  <div className="w-fit flex  gap-2 flex-wrap sm:grid sm:grid-cols-2 sm:w-full">
                    {availableSlots.length > 0 ? (
                      availableSlots.map((slot: any) => (
                        <div
                          className={`w-[200px] sm:w-full sm:!h-[30px] sm:flex sm:items-center sm:justify-center px-2 py-4 text-center border border-gray-300 cursor-pointer${
                            AppointmentData.time === slot.value ? ' bg-secondary text-text_w' : ''
                          }`}
                          key={slot.value}
                          onClick={() => {
                            onChange('time', slot.value);
                          }}
                        >
                          {slot.label}
                        </div>
                      ))
                    ) : (
                      <Text type="secondary" className="sm:!text-[12px]">
                        No slots left for this date. Please choose another day.
                      </Text>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '20px', textAlign: 'right' }} className="sm:w-full sm:flex sm:gap-2 sm:justify-between">
                <Button style={{ marginRight: '8px' }} onClick={handlePrevious} className="sm:!h-[35px] sm:!w-1/2 sm:!text-[12px]">
                  Previous
                </Button>
                <Button
                  className="!bg-secondary !text-text_w sm:!w-1/2 sm:!h-[35px] sm:!text-[12px]"
                  disabled={AppointmentData.time === '' || AppointmentData.date === ''}
                  onClick={handleNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <div className="flex w-full justify-center">
                <Title level={4} className="sm:!text-[16px]">
                  Confirm Details
                </Title>
              </div>
              <div className="flex gap-4 w-full flex-row md:flex-col">
                <Card className="w-[48%] md:w-full">
                  <Form
                    form={form}
                    size="small"
                    layout="vertical"
                    autoComplete="off"
                    onFinish={onSubmit}
                    initialValues={{
                      name: AppointmentData.name,
                      email: AppointmentData.email,
                      countryCode: parseUserPhone(AppointmentData.phone_numbers).countryCode,
                      mobileNumber: parseUserPhone(AppointmentData.phone_numbers).mobileNumber,
                      message: AppointmentData.message,
                    }}
                    onValuesChange={(changedValues, allValues) => {
                      if (Object.prototype.hasOwnProperty.call(changedValues, 'email')) {
                        setEmailError('');
                      }
                      const { countryCode, mobileNumber, ...rest } = allValues;
                      const phone_numbers =
                        countryCode && mobileNumber
                          ? `${String(countryCode).startsWith('+') ? countryCode : `+${countryCode}`} ${mobileNumber}`
                          : mobileNumber || '';
                      setAppointmentData((prev: any) => ({
                        ...prev,
                        ...rest,
                        phone_numbers,
                      }));
                    }}
                  >
                    <HoneypotField />
                    <div className="flex flex-col sm:mt-4">
                      <Form.Item
                        label="Full Name"
                        name="name"
                        rules={[
                          {
                            required: true,
                            message: 'Please enter your full name',
                          },
                        ]}
                      >
                        <Input placeholder="Full Name" />
                      </Form.Item>
                      <Form.Item
                        label="Email"
                        name="email"
                        validateTrigger="onChange"
                        validateStatus={emailError ? 'error' : undefined}
                        help={emailError || undefined}
                        rules={[
                          {
                            required: true,
                            message: 'Please enter your email address',
                          },
                          {
                            validator: (_, value) => {
                              if (!value) {
                                return Promise.resolve();
                              }
                              if (!isValidEmailFormat(value)) {
                                return Promise.reject(new Error('Please enter a valid email address'));
                              }
                              if (isDisposableDomain(value)) {
                                return Promise.reject(new Error('Please enter a valid permanent email address'));
                              }
                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <Input placeholder="Email Address" />
                      </Form.Item>

                      <Form.Item label="Phone" required>
                        <div className="flex gap-2 items-stretch">
                          <Form.Item name="countryCode" noStyle initialValue="1" rules={[{ required: true, message: 'Please select country code!' }]}>
                            <Select
                              showSearch
                              placeholder="Code"
                              className="!w-[80px] shrink-0"
                              options={uniqueCountryCodes as any}
                              optionFilterProp="label"
                              filterOption={(input, option) =>
                                String(option?.label ?? '')
                                  .toLowerCase()
                                  .includes(input.toLowerCase())
                              }
                              getPopupContainer={(trigger) => trigger.closest('.ant-modal-content') || trigger.parentElement || document.body}
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
                              placeholder="Phone Number"
                              type="text"
                              inputMode="numeric"
                              className="w-full"
                              maxLength={getMobileRule(form.getFieldValue('countryCode'))?.maxLength}
                            />
                          </Form.Item>
                        </div>
                      </Form.Item>
                      <Form.Item
                        label="Message"
                        name="message"
                        rules={[
                          {
                            required: true,
                            message: 'Please enter your message',
                          },
                        ]}
                      >
                        <Input.TextArea placeholder="Message" />
                      </Form.Item>
                    </div>
                  </Form>
                </Card>

                <Card className="w-[48%] md:w-full">
                  <div className=" flex flex-col gap-5 sm:gap-2">
                    <div className="">
                      <Title className="!m-0 sm:!text-[14px]" level={5}>
                        LOCATION
                      </Title>
                      <Text className="sm:!text-[12px]">{AppointmentData.locations}</Text>
                    </div>
                    {/* <br /> */}
                    <div>
                      <Title className="!m-0 sm:!text-[14px]" level={5}>
                        SERVICE
                      </Title>
                      <Text>{data.find((item) => item?.name === AppointmentData?.service)?.name}</Text>
                    </div>
                    {/* <br /> */}
                    <div>
                      <Title className="!m-0 sm:!text-[14px]" level={5}>
                        DATE & TIME
                      </Title>
                      <Text className="sm:!text-[12px]">{selectedSlot ? `${selectedSlot.localDateShort} - ${selectedSlot.label}` : ''}</Text>
                    </div>
                  </div>
                </Card>
              </div>

              <CloudflareTurnstile
                ref={turnstileRef}
                onVerify={setTurnstileToken}
                onExpire={() => setTurnstileToken(null)}
                onError={() => setTurnstileToken(null)}
                className="my-3"
              />
              <div style={{ marginTop: '20px', textAlign: 'right' }} className="sm:w-full sm:flex sm:gap-2 sm:justify-between">
                <Button style={{ marginRight: '8px' }} onClick={handlePrevious} className="sm:!h-[35px] sm:!w-1/2 sm:!text-[12px]">
                  Previous
                </Button>
                <Button
                  className="!bg-secondary !text-text_w sm:!w-1/2 sm:!h-[35px] sm:!text-[12px]"
                  disabled={
                    AppointmentData.first_name === '' ||
                    AppointmentData.last_name === '' ||
                    AppointmentData.email === '' ||
                    AppointmentData.phone_numbers === ''
                  }
                  onClick={onSubmit}
                >
                  Confirm
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
