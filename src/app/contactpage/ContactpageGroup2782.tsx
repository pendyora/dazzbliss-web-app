'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Button, ConfigProvider, Form, Select, notification } from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import { LuGem, LuInfo, LuMail, LuMessageSquare, LuPencil, LuPhone, LuRotateCcw, LuShoppingBag, LuVideo } from 'react-icons/lu';

import { FloatInput, FloatTextArea } from '@/components/Auth/AuthFields';
import { AUTH, authTheme } from '@/components/Auth/authUi';
import { CARE, SHELL } from '@/components/ClientCare/careInfo';
import { Breadcrumb } from '@/components/ClientCare/CareLayout';
import CloudflareTurnstile, { CloudflareTurnstileHandle } from '@/components/common/CloudflareTurnstile';
import { useHoneypot } from '@/hook/useHoneypot';
import { submitContactPageData } from '@/services/authService';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCountries } from '@/store/slices/Address/addressSlice';
import { isDisposableDomain, isValidEmailFormat } from '@/utils/emailValidation';
import { trackContact } from '@/utils/metaPixel';
import { formatMobile, getMobileRule, unmaskMobile } from '@/utils/mobileValidation';

// Topic buttons replace the free-text subject; the chosen label is sent as `subject` (same API as before).
const TOPICS = [
  {
    key: 'piece',
    label: "A piece I'm considering",
    Icon: LuGem,
    tip: 'Tell us which piece. We can send close-up photos and a short video in natural light.',
    ask: 'Which piece, and what would you like to know?',
  },
  {
    key: 'size',
    label: 'Sizing & resizing',
    Icon: LuGem,
    tip: 'Sizing is quickest on a short video call, where we measure with you.',
    ask: 'Your current size (if known) and the piece',
  },
  {
    key: 'order',
    label: 'An existing order',
    Icon: LuShoppingBag,
    tip: 'Your order number is in your confirmation email.',
    ask: 'What do you need help with?',
  },
  {
    key: 'custom',
    label: 'A custom design',
    Icon: LuPencil,
    tip: 'Describe your idea, budget and timing. We reply with a first sketch and a price range.',
    ask: 'Your idea, budget and when you need it',
  },
  {
    key: 'returns',
    label: 'Returns & repairs',
    Icon: LuRotateCcw,
    tip: 'For a return, include your order number. For a repair, tell us what happened.',
    ask: 'Order number and what happened',
  },
  {
    key: 'other',
    label: 'Something else',
    Icon: LuMessageSquare,
    tip: "Tell us a little about it and we'll pass it to the right person.",
    ask: 'Your message',
  },
];

const QUICK = [
  { q: 'Where is my order?', a: 'Your tracking link is in your shipping email. Signed-in customers can also see every order in their account.' },
  {
    q: 'Can I return or exchange a piece?',
    a: 'Yes, within 30 days from the date of shipment, in the condition you received it. Custom pieces are final sale.',
  },
  { q: 'How do I find my ring size?', a: 'Book a short video call and we will measure with you, or ask us for a sizing guide.' },
  { q: 'Do you make custom pieces?', a: 'Yes. Share an idea or a photo and we will come back with a sketch and a price range.' },
];

/** Open Mon–Fri, 9am–5pm Pacific (matches CARE.hours). */
function isOpenNow() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', weekday: 'short', hour: 'numeric', hour12: false }).formatToParts(
    new Date(),
  );
  const day = parts.find((p) => p.type === 'weekday')?.value;
  const hour = Number(parts.find((p) => p.type === 'hour')?.value);
  return !!day && !['Sat', 'Sun'].includes(day) && hour >= 9 && hour < 17;
}

export default function ContactpageGroup2782() {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const { countries } = useAppSelector((state) => state.address);
  const { HoneypotField, isHoneypotClean } = useHoneypot('contact_website_confirm');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<CloudflareTurnstileHandle>(null);
  const [topic, setTopic] = useState(TOPICS[0]);
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [open, setOpen] = useState<boolean | null>(null);

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

  useEffect(() => {
    if (countries.length === 0) {
      dispatch(fetchCountries());
    }
    setOpen(isOpenNow());
  }, [countries.length, dispatch]);

  const handleSubmit = async (values: any) => {
    if (!isHoneypotClean()) {
      return;
    }
    const phone = `+${values.countryCode || ''} ${values.mobileNumber ? unmaskMobile(values.mobileNumber) : ''}`;
    const subject = topic.key === 'order' && values.orderNumber ? `${topic.label} · ${values.orderNumber.trim()}` : topic.label;
    setSending(true);
    try {
      const res: any = await submitContactPageData({
        email: values.email,
        fullName: values.fullName,
        phone,
        subject,
        message: values.message,
        cloudflareTurnstileToken: turnstileToken,
      });
      if (res.status == 201) {
        trackContact();
        setSentTo(values.email);
        form.resetFields();
      }
    } catch (error: any) {
      notification.error({ message: error?.response?.data?.message || 'We could not send your message. Please try again.' });
    } finally {
      // Turnstile tokens are single-use: get a fresh one for a retry or another message.
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      setSending(false);
    }
  };

  const methods = [
    { href: '/virtual-appointment', Icon: LuVideo, title: 'Video appointment', text: 'See pieces live and get sized', cta: 'Book', primary: true },
    { href: `mailto:${CARE.email}`, Icon: LuMail, title: CARE.email, text: `Reply ${CARE.replyTime}`, cta: 'Email' },
    ...(CARE.phone ? [{ href: CARE.phoneHref, Icon: LuPhone, title: CARE.phone, text: CARE.hours[0].time, cta: 'Call' }] : []),
  ];

  const intro = (
    <div className="grid content-start gap-3 pt-1 [grid-area:intro]">
      <Breadcrumb crumb="Contact us" />
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-teal">Client care</span>
      <h1 className="m-0 font-cormorant text-[clamp(40px,4.2vw,58px)] font-medium leading-none tracking-[-0.01em]">Talk to a jeweler</h1>
      <p className="m-0 max-w-[40ch] text-[15px] leading-[1.7] text-ink-soft">
        Real people, not a call centre. Send a message, or choose another way to talk. We reply {CARE.replyTime}.
      </p>
      {open !== null && (
        <span className="inline-flex items-center gap-2 text-[13px] text-ink">
          <i className={`h-2 w-2 rounded-full ${open ? 'bg-ok shadow-[0_0_0_4px] shadow-ok/15' : 'bg-ink-faint'}`} />
          {open ? "We're online now" : "We're offline right now — leave a message and we'll reply soon"}
        </span>
      )}
    </div>
  );

  const ways = (
    <div className="grid content-start gap-3 [grid-area:ways]">
      <ul className="m-0 mt-2.5 list-none border-t border-line-strong p-0">
        {methods.map(({ href, Icon, title, text, cta, primary }) => (
          <li key={href}>
            <Link
              href={href}
              className={`grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3.5 border-b py-[18px] transition-[padding] duration-300 ease-luxe hover:pl-3 ${
                primary
                  ? 'border-navy bg-navy px-4 text-noir-on hover:text-noir-on hover:pl-[22px]'
                  : 'border-line-strong px-1 text-ink hover:text-ink'
              }`}
            >
              <span
                className={`grid h-10 w-10 place-items-center rounded-full border ${primary ? 'border-paper/20 text-teal-soft' : 'border-line bg-paper text-navy'}`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.3} />
              </span>
              <span className="min-w-0">
                <b className="block truncate text-[15px] font-medium">{title}</b>
                <small className={`text-[13px] ${primary ? 'text-noir-on/80' : 'text-ink-soft'}`}>{text}</small>
              </span>
              <span className={`whitespace-nowrap text-[12px] font-semibold uppercase tracking-[0.1em] ${primary ? 'text-paper' : 'text-teal'}`}>
                {cta} →
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <dl className="m-0 mt-1.5 grid grid-cols-[auto_1fr] gap-x-[18px] gap-y-1 text-[13px] text-ink-soft">
        {CARE.hours.map((h) => (
          <React.Fragment key={h.days}>
            <dt className="font-medium text-ink">{h.days}</dt>
            <dd className="m-0">{h.time}</dd>
          </React.Fragment>
        ))}
      </dl>
    </div>
  );

  const formCard = (
    <div className="grid gap-4 border border-line bg-paper p-[clamp(22px,2.6vw,36px)] shadow-[0_24px_60px_-40px_rgba(17,20,26,0.35)] [grid-area:form] md:-mx-[clamp(16px,3.2vw,48px)] md:border-x-0">
      <div>
        <h2 className="m-0 font-cormorant text-[30px] font-medium leading-none">Send us a message</h2>
        <p className="m-0 mt-2 text-[13.5px] text-ink-soft">Pick a topic and we&apos;ll ask only what we need.</p>
      </div>

      {sentTo ? (
        <div role="status" className="grid gap-1.5 bg-mist p-[22px]">
          <b className="font-cormorant text-[24px] font-medium">Thank you, we&apos;ve got it.</b>
          <span className="text-ink-soft">
            A jeweler will reply to {sentTo} {CARE.replyTime}.
          </span>
          <button
            type="button"
            onClick={() => setSentTo('')}
            className="justify-self-start pt-1 text-[13px] text-teal underline underline-offset-[3px]"
          >
            Send another message
          </button>
        </div>
      ) : (
        <>
          <div role="toolbar" aria-label="Topic" className="flex flex-wrap gap-2 md:flex-nowrap md:overflow-x-auto md:[scrollbar-width:none]">
            {TOPICS.map((t) => (
              <button
                key={t.key}
                type="button"
                aria-pressed={topic.key === t.key}
                onClick={() => setTopic(t)}
                className={`inline-flex h-9 flex-none items-center gap-2 border px-3.5 text-[13px] transition-colors ${
                  topic.key === t.key ? 'border-ink bg-ink text-paper' : 'border-line-strong text-ink hover:border-ink'
                }`}
              >
                <t.Icon className={`h-[15px] w-[15px] ${topic.key === t.key ? 'text-paper' : 'text-navy'}`} strokeWidth={1.3} />
                {t.label}
              </button>
            ))}
          </div>
          <p className="m-0 flex items-start gap-3.5 bg-mist px-[18px] py-4 text-[14px]">
            <LuInfo className="mt-0.5 h-5 w-5 flex-none text-navy" strokeWidth={1.3} />
            {topic.tip}
          </p>

          <Form
            form={form}
            onFinish={handleSubmit}
            requiredMark={false}
            initialValues={{ countryCode: '1' }}
            className={`${AUTH.formFix} [&_.ant-form-item]:!mb-3.5`}
          >
            <div className="grid grid-cols-2 gap-x-3 sm:grid-cols-1">
              <Form.Item name="fullName" rules={[{ required: true, message: 'Enter your name' }]}>
                <FloatInput label="Full name" autoComplete="name" />
              </Form.Item>
              <Form.Item
                name="email"
                validateTrigger="onBlur"
                rules={[
                  { required: true, message: 'Enter your email address' },
                  {
                    validator: (_, value) => {
                      if (!value) {
                        return Promise.resolve();
                      }
                      if (!isValidEmailFormat(value)) {
                        return Promise.reject(new Error('Enter a valid email address'));
                      }
                      if (isDisposableDomain(value)) {
                        return Promise.reject(new Error('Please enter a valid permanent email address'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <FloatInput label="Email" type="email" autoComplete="email" />
              </Form.Item>
            </div>
            <HoneypotField />
            <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-x-3">
              <Form.Item name="countryCode" rules={[{ required: true, message: 'Code' }]}>
                <Select
                  showSearch
                  aria-label="Country code"
                  options={countryCodes as any}
                  optionFilterProp="label"
                  className="!h-14 [&_.ant-select-selector]:!rounded-none"
                  onChange={(code) => {
                    const current = form.getFieldValue('mobileNumber');
                    if (current) {
                      form.setFieldsValue({ mobileNumber: formatMobile(unmaskMobile(current), getMobileRule(code).mask) });
                    }
                    form.validateFields(['mobileNumber']).catch(() => {});
                  }}
                />
              </Form.Item>
              <Form.Item
                name="mobileNumber"
                rules={[
                  { required: true, message: 'Enter your phone number' },
                  {
                    validator: (_, value) => {
                      if (!value) {
                        return Promise.resolve();
                      }
                      const rule = getMobileRule(form.getFieldValue('countryCode'));
                      return rule.regex.test(unmaskMobile(value)) ? Promise.resolve() : Promise.reject(new Error(rule.message));
                    },
                  },
                ]}
                normalize={(val) => (val ? formatMobile(val.replace(/\D/g, ''), getMobileRule(form.getFieldValue('countryCode')).mask) : '')}
              >
                <FloatInput label="Phone" type="tel" inputMode="numeric" autoComplete="tel-national" />
              </Form.Item>
            </div>
            {topic.key === 'order' && (
              <Form.Item name="orderNumber" rules={[{ required: true, message: 'Enter your order number' }]}>
                <FloatInput label="Order number" />
              </Form.Item>
            )}
            <Form.Item name="message" rules={[{ required: true, message: 'Write a short message' }]}>
              <FloatTextArea label={topic.ask} />
            </Form.Item>
            <CloudflareTurnstile
              ref={turnstileRef}
              onVerify={setTurnstileToken}
              onExpire={() => setTurnstileToken(null)}
              onError={() => setTurnstileToken(null)}
              className="mb-4"
            />
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Button htmlType="submit" loading={sending} className={`${AUTH.primaryBtn} !w-auto !px-10`}>
                Send message
              </Button>
              <p className="m-0 max-w-[34ch] text-[12.5px] text-ink-faint">
                We only use your details to reply. See our{' '}
                <Link href="/privacy-policy" className="underline">
                  privacy policy
                </Link>
                .
              </p>
            </div>
          </Form>
        </>
      )}
    </div>
  );

  return (
    <ConfigProvider theme={authTheme}>
      <section className="border-b border-line bg-haze">
        <div
          className={`${SHELL} grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] grid-rows-[auto_1fr] gap-x-[clamp(32px,5vw,80px)] gap-y-3.5 pb-[clamp(36px,4vw,56px)] pt-[clamp(28px,3.5vw,48px)] [grid-template-areas:'intro_form'_'ways_form'] lg:grid-cols-1 lg:gap-y-6 lg:[grid-template-areas:'intro'_'form'_'ways']`}
        >
          {intro}
          {formCard}
          {ways}
        </div>
      </section>

      <section
        className={`${SHELL} grid grid-cols-[minmax(0,1.25fr)_minmax(260px,0.75fr)] gap-[clamp(32px,5vw,88px)] py-[clamp(48px,6vw,80px)] lg:grid-cols-1`}
      >
        <div>
          <h2 className="m-0 mb-3 font-cormorant text-[30px] font-medium">Quick answers</h2>
          <div className="border-t border-line">
            {QUICK.map((item) => (
              <details key={item.q} className="group border-b border-line">
                <summary className="flex cursor-pointer list-none justify-between gap-4 py-4 text-[15px] font-medium [&::-webkit-details-marker]:hidden after:text-[20px] after:font-light after:text-ink-soft after:content-['+'] group-open:after:content-['–']">
                  {item.q}
                </summary>
                <p className="m-0 pb-4 text-[14.5px] text-ink-soft">{item.a}</p>
              </details>
            ))}
          </div>
          <Link href="/faqs" className="mt-4 inline-block border-b border-current text-[12px] font-semibold uppercase tracking-[0.12em] text-ink">
            All FAQs
          </Link>
        </div>
        <div className="grid content-start gap-4">
          <figure className="relative m-0 aspect-[4/3] overflow-hidden bg-stone">
            <Image
              src="/images/care/consultation.jpg"
              alt="A ring being shown during an appointment"
              fill
              sizes="(max-width: 1024px) 100vw, 30vw"
              className="object-cover"
            />
          </figure>
          <p className="m-0 text-[13px] text-ink-faint">
            Prefer to see it in person?{' '}
            <Link href="/virtual-appointment" className="text-teal underline underline-offset-[3px]">
              Book a video appointment
            </Link>{' '}
            and we&apos;ll show you pieces live.
          </p>
        </div>
      </section>
    </ConfigProvider>
  );
}
