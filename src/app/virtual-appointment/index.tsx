'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Button, ConfigProvider, Form, Input, Select, notification } from 'antd';
import moment from 'moment-timezone';
import Link from 'next/link';
import { LuCalendarDays, LuCheck, LuClock3, LuGem, LuPhone, LuShieldCheck, LuUser, LuVideo } from 'react-icons/lu';

import { FORM_LABELS, PRIMARY_BTN, checkoutTheme } from '@/app/checkout/checkoutTheme';
import CloudflareTurnstile, { CloudflareTurnstileHandle } from '@/components/common/CloudflareTurnstile';
import { JEWELRY_TYPE } from '@/constants/master.constant';
import { useHoneypot } from '@/hook/useHoneypot';
import { apiAppointment } from '@/services/authService';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCountries } from '@/store/slices/Address/addressSlice';
import { isDisposableDomain, isValidEmailFormat } from '@/utils/emailValidation';
import { formatMobile, getMobileRule, unmaskMobile } from '@/utils/mobileValidation';

// Virtual appointment (design-mockups/appointment): one page, four numbered sections all visible — topic, day, time,
// details — and a summary card with the Book button. Same /appointment payload as before.

const SHELL = 'mx-auto w-full max-w-[1440px] px-[clamp(16px,3.2vw,48px)]';
const ISO = 'YYYY-MM-DD';
// Appointments are always scheduled against Pacific time, no matter where the visitor is.
const BUSINESS_TZ = 'America/Los_Angeles';
const BUSINESS_START_HOUR = 9; // first slot starts at 9:00 AM PT
const BUSINESS_END_HOUR = 17; // business closes at 5:00 PM PT, so the last slot starts at 4:00 PM PT
const SLOT_MINUTES = 50;
const DAYS_AHEAD = 14;
const TIME_ZONES = [
  { value: 'America/Los_Angeles', label: 'Pacific (PT)', short: 'PT' },
  { value: 'America/Denver', label: 'Mountain (MT)', short: 'MT' },
  { value: 'America/Chicago', label: 'Central (CT)', short: 'CT' },
  { value: 'America/New_York', label: 'Eastern (ET)', short: 'ET' },
  { value: 'UTC', label: 'UTC', short: 'UTC' },
  { value: 'Asia/Kolkata', label: 'India (IST)', short: 'IST' },
];

interface Slot {
  /** The slot's start instant (ms). It is the slot's identity and stays valid across time zone switches. */
  startAt: number;
  /** Start time as the visitor sees it, e.g. "2:00 pm". */
  label: string;
  /** Full range as the visitor sees it, e.g. "2:00 PM - 2:50 PM" (sent as `customer_time`). */
  range: string;
  /** Visitor-local date, YYYY-MM-DD (sent as `customer_date`). */
  localDate: string;
  /** What the backend receives as `date` / `time`: always the Pacific date and wall clock. */
  businessDate: string;
  serverTime: string;
  past: boolean;
}

// Earliest Pacific business slot that has not started yet at `nowTs`.
const firstBookableInstant = (nowTs: number) => {
  const now = moment.tz(nowTs, BUSINESS_TZ);
  for (let offset = 0; offset <= 1; offset++) {
    const dayStart = now.clone().add(offset, 'day').startOf('day');
    for (let h = BUSINESS_START_HOUR; h < BUSINESS_END_HOUR; h++) {
      const start = dayStart.clone().hour(h);
      if (start.isAfter(now)) {
        return start;
      }
    }
  }
  return now;
};

// Slots for one calendar day *as the visitor sees it* in `tz`. The 9 AM - 5 PM Pacific window can straddle
// midnight elsewhere, so the neighbouring Pacific days are scanned too and only the instants that actually
// land on the requested local day are kept.
function slotsFor(localDay: string, tz: string, nowTs: number): Slot[] {
  const slots: Slot[] = [];
  for (let offset = -1; offset <= 1; offset++) {
    const dayStart = moment.tz(localDay, ISO, BUSINESS_TZ).add(offset, 'day').startOf('day');
    for (let h = BUSINESS_START_HOUR; h < BUSINESS_END_HOUR; h++) {
      const start = dayStart.clone().hour(h);
      const localStart = start.clone().tz(tz);
      if (localStart.format(ISO) !== localDay) {
        continue;
      }
      const end = start.clone().add(SLOT_MINUTES, 'minutes');
      slots.push({
        startAt: start.valueOf(),
        label: localStart.format('h:mm a'),
        range: `${localStart.format('h:mm A')} - ${end.clone().tz(tz).format('h:mm A')}`,
        localDate: localStart.format(ISO),
        businessDate: start.format(ISO),
        serverTime: `${start.format('h:mm A')} - ${end.format('h:mm A')}`,
        // Only slots that have not started yet are bookable.
        past: start.valueOf() <= nowTs,
      });
    }
  }
  return slots.sort((a, b) => a.startAt - b.startAt);
}

/** One numbered section; kept outside the page so its fields don't remount on every render. */
function Sec({ n, title, sub, err, errText, sref, children }: any) {
  return (
    <section
      ref={sref}
      className="mb-[30px] scroll-mt-[calc(var(--header-height,108px)+24px)] border-b border-line pb-[30px] last:mb-0 last:border-0"
    >
      <h2 className={`m-0 mb-1 flex items-baseline gap-3 font-cormorant text-[28px] font-medium leading-[1.1] ${err ? 'text-danger' : ''}`}>
        <span className="min-w-6 text-[20px] italic text-teal">{n}</span>
        {title}
      </h2>
      {sub && <p className="m-0 mb-4 ml-9 text-[13.5px] text-ink-soft md:ml-0">{sub}</p>}
      <div className="ml-9 md:ml-0">{children}</div>
      {err && <p className="m-0 ml-9 mt-2.5 text-[12.5px] text-danger md:ml-0">{errText}</p>}
    </section>
  );
}

export default function VirtualAppointment() {
  const dispatch = useAppDispatch();
  const [form] = Form.useForm();
  const { user } = useAppSelector((state) => state.auth.auth);
  const { countries } = useAppSelector((state) => state.address);
  const { HoneypotField, isHoneypotClean } = useHoneypot('appointment_website_confirm');

  const [service, setService] = useState<string | null>(null);
  const [mode, setMode] = useState<'Video call' | 'Phone call'>('Video call');
  const [week, setWeek] = useState(0);
  const [day, setDay] = useState<string | null>(null); // YYYY-MM-DD, in the visitor's chosen time zone
  const [slotAt, setSlotAt] = useState<number | null>(null); // start instant of the chosen slot
  const [tz, setTz] = useState(BUSINESS_TZ);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<CloudflareTurnstileHandle>(null);
  // Keeps the "already started" check fresh while the page stays open.
  const [nowTs, setNowTs] = useState<number>(() => Date.now());
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);
  const [booked, setBooked] = useState<{ name: string; email: string; when: string } | null>(null);
  const refs = { service: useRef<HTMLElement>(null), day: useRef<HTMLElement>(null), time: useRef<HTMLElement>(null) };

  useEffect(() => {
    if (countries.length === 0) {
      dispatch(fetchCountries());
    }
  }, [countries.length, dispatch]);

  useEffect(() => {
    const interval = setInterval(() => setNowTs(Date.now()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      // Prefill the phone too: `user.phone` is stored as "+<code> <number>" (bare digits are assumed +1).
      const raw = String(user.phone || '').trim();
      let countryCode = '1';
      let digits = '';
      if (raw.startsWith('+')) {
        const [codePart, ...rest] = raw.slice(1).split(/\s+/);
        countryCode = (codePart || '').replace(/\D/g, '') || '1';
        digits = unmaskMobile(rest.join(' '));
      } else {
        digits = unmaskMobile(raw);
      }
      form.setFieldsValue({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        ...(digits ? { countryCode, phone: formatMobile(digits, getMobileRule(countryCode).mask) } : {}),
      });
    }
  }, [user, form]);

  const countryCodes = useMemo(
    () =>
      Array.from(
        new Map(
          countries.map((c: any) => {
            const code = String(c.phone_code).replace(/\D/g, '');
            return [code, { value: code, label: `+${code}` }];
          }),
        ).values(),
      ),
    [countries],
  );

  // Days are listed in the visitor's time zone, starting from the first day that still has a bookable slot there.
  const days = useMemo(() => {
    const first = moment.tz(firstBookableInstant(nowTs).tz(tz).format(ISO), ISO, tz);
    return Array.from({ length: DAYS_AHEAD }, (_, i) => first.clone().add(i, 'day'));
  }, [tz, nowTs]);
  const weekDays = days.slice(week * 7, week * 7 + 7);
  const selectedDay = day ? moment.tz(day, ISO, tz) : null;
  const slots = useMemo(() => (day ? slotsFor(day, tz, nowTs) : []), [day, tz, nowTs]);
  const freeCount = slots.filter((s) => !s.past).length;
  const tzShort = TIME_ZONES.find((z) => z.value === tz)?.short ?? '';
  const tzLabel = useMemo(() => moment.tz(nowTs, tz).format('z'), [tz, nowTs]);
  const businessTzLabel = useMemo(() => moment.tz(nowTs, BUSINESS_TZ).format('z'), [nowTs]);
  const chosenSlot = slots.find((s) => s.startAt === slotAt && !s.past);
  const whenText = selectedDay ? `${selectedDay.format('dddd D MMM')}${chosenSlot ? `, ${chosenSlot.label} ${tzShort}` : ''}` : null;

  // Drop a chosen slot once it is no longer offered (it started while the page was open).
  useEffect(() => {
    if (slotAt != null && day && !slots.some((s) => s.startAt === slotAt && !s.past)) {
      setSlotAt(null);
    }
  }, [slots, slotAt, day]);

  const pickDay = (d: moment.Moment) => {
    setDay(d.format(ISO));
    setSlotAt(null);
    setErrors((e) => ({ ...e, day: false }));
  };

  // Switching time zones keeps the picked slot: it is a fixed instant, so only the local day it lands on changes.
  const changeTz = (value: string) => {
    setTz(value);
    if (slotAt != null) {
      setDay(moment(slotAt).tz(value).format(ISO));
    } else if (day && moment.tz(day, ISO, value).isBefore(moment.tz(firstBookableInstant(Date.now()).tz(value).format(ISO), ISO, value), 'day')) {
      // Never leave the picker on a day that is already fully in the past there.
      setDay(null);
    }
  };

  const submit = async (values: any) => {
    const missing = { service: !service, day: !day, time: !chosenSlot };
    setErrors(missing);
    const first = (['service', 'day', 'time'] as const).find((k) => missing[k]);
    if (first) {
      refs[first].current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!isHoneypotClean()) {
      return;
    }
    const name = `${values.first_name} ${values.last_name}`.trim();
    const phone = `+${values.countryCode || ''} ${unmaskMobile(values.phone || '')}`.trim();
    const message = [mode === 'Phone call' ? '[Prefers a phone call]' : '', values.message || ''].filter(Boolean).join(' ');
    setSending(true);
    try {
      const slot = chosenSlot as Slot;
      const res: any = await apiAppointment({
        locations: 'Virtual Appointment',
        service,
        jewelry_type: service,
        // The visitor picks a day in their own zone; the backend is always given the Pacific date and time.
        date: slot.businessDate,
        time: slot.serverTime,
        // The same slot as the visitor saw it, stored alongside the Pacific values so the confirmation
        // email and the admin list can both show the time they actually picked.
        customer_date: slot.localDate,
        customer_time: slot.range,
        customer_time_zone: tz,
        customer_time_zone_label: tzLabel,
        name,
        email: values.email.trim(),
        phone_numbers: phone,
        message,
        password: '',
        cloudflareTurnstileToken: turnstileToken,
      });
      setBooked({ name: values.first_name, email: values.email.trim(), when: whenText ?? '' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (res?.data?.message) {
        notification.success({ message: res.data.message });
      }
    } catch (error: any) {
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      notification.error({ message: error?.response?.data?.message || 'We could not book that time. Please try another slot.' });
    } finally {
      setSending(false);
    }
  };

  if (booked) {
    return (
      <div className={`${SHELL} grid justify-items-center gap-3.5 bg-paper pb-24 pt-[clamp(40px,6vw,80px)] text-center font-libre text-ink`}>
        <span className="grid h-[72px] w-[72px] place-items-center rounded-full border border-teal text-teal">
          <LuCheck className="h-7 w-7" strokeWidth={1.3} />
        </span>
        <h1 className="m-0 font-cormorant text-[clamp(34px,3.6vw,48px)] font-normal">You&apos;re booked, {booked.name}</h1>
        <div className="grid gap-1 border border-line px-7 py-[18px]">
          <b className="font-cormorant text-[26px] font-medium">{booked.when}</b>
          <span className="text-[14px] text-ink-soft">
            {service} · {mode} · 50 minutes
          </span>
        </div>
        <p className="m-0 max-w-[52ch] text-ink-soft">
          We&apos;ve emailed the details to {booked.email}. Need to change it? Just reply to that email.
        </p>
        <Link
          href="/all"
          className="mt-1.5 inline-flex h-[50px] items-center border border-ink px-6 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink hover:bg-ink hover:text-paper"
        >
          Browse pieces
        </Link>
      </div>
    );
  }

  const tile = (on: boolean) => (on ? 'border-ink bg-ink text-paper' : 'border-line-strong text-ink hover:border-ink');

  return (
    <ConfigProvider theme={checkoutTheme}>
      <div className="bg-paper font-libre text-[14px] leading-[1.55] text-ink antialiased">
        <section className="border-b border-line bg-haze">
          <div className={`${SHELL} flex flex-wrap items-end justify-between gap-6 py-[clamp(28px,3.5vw,44px)]`}>
            <div>
              <nav aria-label="Breadcrumb" className="mb-2.5 flex gap-2 text-[12px] text-ink-soft">
                <Link href="/" className="text-ink-soft hover:text-ink">
                  Home
                </Link>
                <span aria-hidden className="text-line-strong">
                  /
                </span>
                <span aria-current="page">Virtual appointment</span>
              </nav>
              <h1 className="m-0 font-cormorant text-[clamp(36px,4vw,54px)] font-normal leading-none">
                Book a <em className="italic">virtual appointment</em>
              </h1>
              <p className="m-0 mt-2.5 max-w-[52ch] text-[15px] text-ink-soft">
                See pieces live with a Pendyora jeweler, compare stones and get sized, from home.
              </p>
            </div>
            <div className="flex flex-wrap gap-[22px] text-[13px] text-ink-soft">
              <span className="inline-flex items-center gap-2">
                <LuClock3 className="h-4 w-4 text-navy" strokeWidth={1.3} />
                50 minutes
              </span>
              <span className="inline-flex items-center gap-2">
                <LuShieldCheck className="h-4 w-4 text-navy" strokeWidth={1.3} />
                Free, no obligation
              </span>
              <span className="inline-flex items-center gap-2">
                <LuVideo className="h-4 w-4 text-navy" strokeWidth={1.3} />
                Video or phone
              </span>
            </div>
          </div>
        </section>

        <Form form={form} onFinish={submit} layout="vertical" requiredMark={false} initialValues={{ countryCode: '1' }} className={FORM_LABELS}>
          <div
            className={`${SHELL} grid grid-cols-[minmax(0,1fr)_minmax(300px,380px)] items-start gap-[clamp(32px,5vw,80px)] pb-20 pt-[clamp(32px,4vw,56px)] lg:grid-cols-1`}
          >
            <div>
              <Sec
                n="01"
                title="What would you like to see?"
                sub="Pick one. We'll match you with the right jeweler."
                err={errors.service}
                errText="Please choose what you'd like to see."
                sref={refs.service}
              >
                <div className="grid grid-cols-3 gap-2.5 xls:grid-cols-2 md:grid-cols-1">
                  {JEWELRY_TYPE.map((s: any) => (
                    <button
                      key={s.title}
                      type="button"
                      aria-pressed={service === s.title}
                      onClick={() => {
                        setService(s.title);
                        setErrors((e) => ({ ...e, service: false }));
                      }}
                      className={`grid grid-cols-[48px_1fr] items-center gap-3 border p-2.5 text-left transition-colors ${
                        service === s.title ? 'border-ink bg-haze shadow-[inset_0_0_0_1px] shadow-ink' : 'border-line-strong hover:border-ink'
                      }`}
                    >
                      <img src={s.image} alt="" className="h-12 w-12 bg-stone object-cover" />
                      <span>
                        <b className="block text-[14px] font-medium leading-[1.3]">{s.title}</b>
                        <small className="line-clamp-1 text-[12px] text-ink-soft">{s.description}</small>
                      </span>
                    </button>
                  ))}
                </div>
                <div role="radiogroup" aria-label="Call type" className="mt-3.5 flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-[13px] text-ink-soft">Talk by</span>
                  {(
                    [
                      ['Video call', LuVideo, 'Video'],
                      ['Phone call', LuPhone, 'Phone'],
                    ] as const
                  ).map(([v, Icon, l]) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={mode === v}
                      onClick={() => setMode(v)}
                      className={`inline-flex h-10 items-center gap-2 border px-4 text-[13.5px] ${tile(mode === v)}`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.3} />
                      {l}
                    </button>
                  ))}
                </div>
              </Sec>

              <Sec
                n="02"
                title="Choose a day"
                sub={`We're available every day, 9:00 am - 5:00 pm ${businessTzLabel}.`}
                err={errors.day}
                errText="Please choose a day."
                sref={refs.day}
              >
                <div className="grid grid-cols-7 gap-2 md:grid-cols-4">
                  {weekDays.map((d) => {
                    const free = slotsFor(d.format(ISO), tz, nowTs).some((s) => !s.past);
                    const on = day === d.format(ISO);
                    return (
                      <button
                        key={d.format(ISO)}
                        type="button"
                        disabled={!free}
                        aria-pressed={on}
                        onClick={() => pickDay(d)}
                        className={`grid justify-items-center gap-px border py-2.5 text-[12px] disabled:cursor-not-allowed disabled:border-dashed disabled:opacity-40 ${
                          on ? 'border-ink bg-ink text-paper' : 'border-line-strong text-ink-soft hover:border-ink'
                        }`}
                      >
                        <span>{d.format('ddd')}</span>
                        <b className={`text-[20px] font-medium leading-[1.3] tabular-nums ${on ? 'text-paper' : 'text-ink'}`}>{d.format('D')}</b>
                        <span>{d.format('MMM')}</span>
                      </button>
                    );
                  })}
                </div>
                <button type="button" onClick={() => setWeek(week ? 0 : 1)} className="mt-2.5 text-[13px] text-teal underline underline-offset-[3px]">
                  {week ? 'Show this week' : 'Show the next week'}
                </button>
              </Sec>

              <Sec
                n="03"
                title="Choose a time"
                sub={selectedDay ? `Free times on ${selectedDay.format('dddd D MMM')}.` : 'Pick a day first.'}
                err={errors.time}
                errText="Please choose a time."
                sref={refs.time}
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-[13px] text-ink-soft">
                  <span>{selectedDay ? `${freeCount} ${freeCount === 1 ? 'time' : 'times'} free` : ''}</span>
                  <label className="flex items-center gap-2">
                    Time zone
                    <Select value={tz} onChange={changeTz} options={TIME_ZONES} popupMatchSelectWidth={false} className="!h-[38px] min-w-[170px]" />
                  </label>
                </div>
                {selectedDay ? (
                  <div className="grid grid-cols-5 gap-2 md:grid-cols-3">
                    {slots.map((s) => (
                      <button
                        key={s.startAt}
                        type="button"
                        disabled={s.past}
                        aria-pressed={slotAt === s.startAt}
                        onClick={() => {
                          setSlotAt(s.startAt);
                          setErrors((e) => ({ ...e, time: false }));
                        }}
                        className={`h-[46px] border text-[14px] tabular-nums disabled:cursor-not-allowed disabled:border-dashed disabled:text-line-strong disabled:line-through ${tile(slotAt === s.startAt)}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="m-0 py-3.5 text-[13.5px] text-ink-faint">Choose a day above to see the free times.</p>
                )}
              </Sec>

              <Sec n="04" title="Your details" sub="So we can send you the link, and call if the video drops.">
                <HoneypotField />
                <div className="grid max-w-[680px] grid-cols-2 gap-x-3.5 md:grid-cols-1">
                  <Form.Item name="first_name" label="First name" rules={[{ required: true, message: 'Enter your first name' }]}>
                    <Input autoComplete="given-name" />
                  </Form.Item>
                  <Form.Item name="last_name" label="Last name" rules={[{ required: true, message: 'Enter your last name' }]}>
                    <Input autoComplete="family-name" />
                  </Form.Item>
                  <Form.Item
                    name="email"
                    label="Email"
                    validateTrigger="onBlur"
                    rules={[
                      { required: true, message: 'Enter your email address' },
                      {
                        validator: (_, v) =>
                          !v || (isValidEmailFormat(v) && !isDisposableDomain(v))
                            ? Promise.resolve()
                            : Promise.reject(new Error('Enter a valid, permanent email address')),
                      },
                    ]}
                  >
                    <Input type="email" autoComplete="email" />
                  </Form.Item>
                  <Form.Item label="Phone" required>
                    <div className="grid grid-cols-[96px_1fr] gap-2">
                      <Form.Item name="countryCode" noStyle>
                        <Select showSearch aria-label="Country code" options={countryCodes as any} optionFilterProp="label" />
                      </Form.Item>
                      <Form.Item
                        name="phone"
                        noStyle
                        rules={[
                          { required: true, message: 'Enter a phone number' },
                          {
                            validator: (_, v) => {
                              if (!v) {
                                return Promise.resolve();
                              }
                              const rule = getMobileRule(form.getFieldValue('countryCode'));
                              return rule.regex.test(unmaskMobile(v)) ? Promise.resolve() : Promise.reject(new Error(rule.message));
                            },
                          },
                        ]}
                        normalize={(v) => (v ? formatMobile(v.replace(/\D/g, ''), getMobileRule(form.getFieldValue('countryCode')).mask) : '')}
                      >
                        <Input type="tel" inputMode="numeric" autoComplete="tel-national" />
                      </Form.Item>
                    </div>
                  </Form.Item>
                  <Form.Item name="message" label="Anything we should prepare? (optional)" className="col-span-2 md:col-span-1">
                    <Input.TextArea rows={4} placeholder="e.g. a piece you liked, your budget, a date you need it by" />
                  </Form.Item>
                </div>
              </Sec>
            </div>

            <aside aria-label="Your appointment" className="sticky top-[calc(var(--header-height,108px)+24px)] grid gap-4 lg:static">
              <div className="grid gap-4 border border-line bg-mist px-6 py-[26px]">
                <span className="font-cormorant text-[15px] font-medium tracking-[0.3em] text-navy">PENDYORA</span>
                <h3 className="m-0 font-cormorant text-[26px] font-medium leading-[1.1]">Your appointment</h3>
                <dl className="m-0 grid gap-3 border-t border-line pt-3.5 text-[14px]">
                  {(
                    [
                      [LuGem, service, 'Choose what to see'],
                      [LuCalendarDays, chosenSlot ? whenText : null, 'Choose a day and time'],
                      [mode === 'Video call' ? LuVideo : LuPhone, `${mode} · 50 minutes`, ''],
                      [LuUser, 'With a Pendyora jeweler', ''],
                    ] as const
                  ).map(([Icon, v, empty], i) => (
                    <div key={i} className="grid grid-cols-[22px_1fr] items-start gap-2.5">
                      <dt>
                        <Icon className="mt-px h-[18px] w-[18px] text-navy" strokeWidth={1.3} />
                      </dt>
                      <dd className={`m-0 ${v ? '' : 'italic text-ink-faint'}`}>{v || empty}</dd>
                    </div>
                  ))}
                </dl>
                <CloudflareTurnstile
                  ref={turnstileRef}
                  onVerify={setTurnstileToken}
                  onExpire={() => setTurnstileToken(null)}
                  onError={() => setTurnstileToken(null)}
                  className="w-full"
                />
                <Button htmlType="submit" loading={sending} className={`${PRIMARY_BTN} !h-14 !w-full`}>
                  Book appointment
                </Button>
                <p className="m-0 text-center text-[12px] text-ink-faint">Free. You&apos;ll get a confirmation email with the details.</p>
              </div>
              <div className="grid gap-2.5 border border-line px-5 py-[18px] text-[13.5px] text-ink-soft">
                <b className="text-[14px] font-medium text-ink">On the call</b>
                <ul className="m-0 grid gap-1 pl-[18px]">
                  <li>See pieces on the hand, in daylight</li>
                  <li>Compare stones side by side</li>
                  <li>Get your ring size right</li>
                </ul>
              </div>
            </aside>
          </div>
        </Form>
      </div>
    </ConfigProvider>
  );
}
