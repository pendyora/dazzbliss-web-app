'use client';

import React, { useEffect, useRef, useState } from 'react';

import { Button, Image, Input, notification } from 'antd';
import dayjs from 'dayjs';
import Link from 'next/link';
import { FaFacebookF, FaInstagram, FaLock, FaPhone, FaPinterestP, FaRegClock, FaRegEnvelope } from 'react-icons/fa6';
import { LiaShippingFastSolid } from 'react-icons/lia';

import BuyWithConfidence from '@/app/homepage/BuywithConfidence';
import CloudflareTurnstile, { CloudflareTurnstileHandle } from '@/components/common/CloudflareTurnstile';
import YotpoBadge from '@/components/YotpoBadge';
import useCookieConsent from '@/hook/useCookieConsent';
import { useHoneypot } from '@/hook/useHoneypot';
import { addSubmitSignUp, getCouponData } from '@/services/cartService';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchIntroPopUpFilter } from '@/store/slices/IntroPopup/IntroPopupSlice';
import { isDisposableDomain, isValidEmailFormat } from '@/utils/emailValidation';

interface Props {
  className?: string;
}

// Accepted payment methods for the Secure Payment block. The cells scale with the column, so all six
// stay on one line at any width.
// `cell` sets each badge's width in proportion to its own artwork, so every logo fills
// its cell edge to edge. That is what makes the gaps between badges visually equal — equal-width
// cells would pad the narrow logos and leave wider gaps around them. Each ratio is the source file's
// aspect: if an image is swapped for one with a different shape, update its ratio to match.
const PAYMENT_METHODS = [
  { src: '/images/img_television_white_a700_01_16x26.svg', alt: 'Visa', cell: 'grow-[1.588] aspect-[1.588]' },
  { src: '/images/img_close_white_a700_01.svg', alt: 'Mastercard', cell: 'grow-[1.588] aspect-[1.588]' },
  { src: '/images/img_television_white_a700_01.svg', alt: 'PayPal', cell: 'grow-[1.588] aspect-[1.588]' },
  { src: '/images/Apple-Pay.png', alt: 'Apple Pay', cell: 'grow-[1.895] aspect-[1.895]' },
  // Google Pay must be the official acceptance mark, unmodified, no smaller than the other brands
  // here, and surrounded by clear space of at least half the height of its capital G — which measures
  // 171.29 of the mark's 400 units, so 0.214x the rendered badge height on every side.
  // See https://developers.google.com/pay/api/web/guides/brand-guidelines#logo-mark.
  // The badges scale with their row, so that requirement scales too: a row's gap must stay above
  // 0.214x the badge height it produces. If you change a gap or a row's max-width, re-check both rows.
  // The 1.88 ratio is the mark's own 752x400, so it fills its cell without distortion.
  { src: '/images/google-pay-mark.svg', alt: 'Google Pay', cell: 'grow-[1.88] aspect-[1.88]' },
  { src: '/images/Amarican_express.png', alt: 'American Express', cell: 'grow-[1.653] aspect-[1.653]' },
];

// The image fills its cell's width (not max-width, which can only shrink and would leave the small
// card SVGs at their intrinsic 27x17). Width-driven sizing is what keeps the artwork inside the cell:
// height-driven sizing made an image whose real aspect was a hair wider than its cell ratio spill
// sideways, and the cell then sliced the border drawn along the edge of the badge artwork. For the
// same reason the cell no longer clips — sub-pixel rounding must not eat a border. antd wraps the img
// in its own element, so that wrapper has to fill the cell for the sizing to resolve.
const PAYMENT_CELL = 'flex basis-0 items-center justify-center';
const PAYMENT_IMG_WRAP = '!flex !h-full !w-full !items-center !justify-center';
const PAYMENT_IMG = '!w-full !h-auto !max-w-none !max-h-none object-contain';

export default function Footer({ ...props }: Props) {
  const { openPreferences } = useCookieConsent();
  const dispatch = useAppDispatch();
  const { introPopUpList } = useAppSelector((state) => state.introPopUpSlice);

  const [email, setEmail] = useState<any>();
  const [discountText, setDiscountText] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [emailError, setEmailError] = useState<string>('');
  const [consentError, setConsentError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const desktopErrorRef = useRef<HTMLDivElement>(null);
  const mobileErrorRef = useRef<HTMLDivElement>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileTokenMobile, setTurnstileTokenMobile] = useState<string | null>(null);
  const turnstileRef = useRef<CloudflareTurnstileHandle>(null);
  const turnstileRefMobile = useRef<CloudflareTurnstileHandle>(null);
  const { HoneypotField, isHoneypotClean } = useHoneypot('footer_website_confirm');

  const scrollErrorIntoView = () => {
    requestAnimationFrame(() => {
      const target =
        desktopErrorRef.current && desktopErrorRef.current.offsetParent !== null
          ? desktopErrorRef.current
          : mobileErrorRef.current && mobileErrorRef.current.offsetParent !== null
            ? mobileErrorRef.current
            : null;
      const rect = target?.getBoundingClientRect();
      if (rect && (rect.bottom > window.innerHeight || rect.top < 0)) {
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  };

  const validateEmail = (email: string): boolean => isValidEmailFormat(email);

  const runLiveEmailValidation = (value: string) => {
    if (!value) {
      setEmailError('');
      return;
    }
    if (!isValidEmailFormat(value)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    if (isDisposableDomain(value)) {
      setEmailError('Please enter a valid permanent email address');
      return;
    }
    setEmailError('');
  };

  const fetchCoupan = async (id: any) => {
    if (!id) {
      return;
    }
    try {
      const res = await getCouponData(id);

      if (res.status == 200) {
        const record = res.data.data;

        const test = `GET ${record?.discount_value}${record?.discount_type == 2 ? '%' : record?.discount_type == 1 ? '$' : ''} OFF`;
        setDiscountText(test);
      }
    } catch (error) {
      console.log(error);
    }
  };
  // The header's OfferModel is the other place that loads the popups, but it is not mounted once the
  // offer has been dismissed or the shopper has logged in — load them here so the footer offer still shows.
  useEffect(() => {
    if (!introPopUpList?.length) {
      dispatch(fetchIntroPopUpFilter());
    }
  }, []);

  useEffect(() => {
    if (introPopUpList?.length > 0) {
      const currentDate = new Date();
      const validPopups = introPopUpList.filter((popup: any) => {
        return popup?.expiry_date ? new Date(popup?.expiry_date) > currentDate : true;
      });

      if (validPopups.length > 0) {
        if (introPopUpList?.length > 0) {
          if (introPopUpList[0]?.type == 'signup') {
            fetchCoupan(introPopUpList[0]?.coupon);
          } else {
            fetchCoupan(introPopUpList[1]?.coupon);
          }
        }
      }
    }
  }, [introPopUpList]);

  const handleFooterSubmit = async () => {
    if (!isHoneypotClean()) {
      return;
    }

    if (!isChecked) {
      setConsentError('Please accept the terms to continue');
      scrollErrorIntoView();
      return;
    }

    if (!email || !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      scrollErrorIntoView();
      return;
    }

    if (isDisposableDomain(email)) {
      setEmailError('Please enter a valid permanent email address');
      scrollErrorIntoView();
      return;
    }

    try {
      setLoading(true);
      setEmailError('');
      setConsentError('');
      const signupPopup = introPopUpList?.find((popup: any) => popup?.type === 'signup');
      const response = await addSubmitSignUp({
        email,
        coupon_id: signupPopup?.coupon || null,
        cloudflareTurnstileToken: turnstileToken ?? turnstileTokenMobile,
      });

      if (response?.status === 201) {
        notification.success({
          message: 'Subscription Successful',
          description: 'Thanks! We have sent the offer details to your email address.',
        });
        setEmail('');
        setIsChecked(false);
      }
    } catch (error: any) {
      turnstileRef.current?.reset();
      turnstileRefMobile.current?.reset();
      setTurnstileToken(null);
      setTurnstileTokenMobile(null);
      setEmailError(error?.response?.data?.message || 'Unable to submit right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer {...props} className={`${props.className} flex flex-col gap-[0px] sm:gap-[0px] lg:gap-[0px]`}>
      <HoneypotField />
      <BuyWithConfidence />
      <div className="mt-0 flex justify-center self-stretch sm:hidden [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:hidden">
        <div className="container-xs flex items-center justify-center 2xl:px-[50px] xl:px-[50px] lg:px-[20px] md:flex-col md:px-5 w-full">
          {/* Turnstile renders at size="flexible", which Cloudflare gives a 300px minimum
              width. The newsletter column resolves to 236-263px from 551px all the way to
              ~1365px, so the widget is cut off at the column edge — pinning that column to
              minmax(300px,1fr) across the band is what keeps it whole. The 1365px ceiling
              is deliberate: iPad Air (1180) and iPad Pro 11 (1194) landscape both sit above
              the usual 1024 tablet line, and at 1366+ the column already clears 300px. */}
          <div className="grid w-full grid-cols-[minmax(230px,1.6fr)_1px_2.6fr_1px_1.5fr] items-stretch gap-x-10 py-10 xl:gap-x-8 xls:grid-cols-[minmax(0,1.6fr)_1px_minmax(0,2.6fr)_1px_minmax(0,1.5fr)] [@media(min-width:551px)_and_(max-width:1365px)]:grid-cols-[minmax(0,1.4fr)_1px_minmax(0,2.2fr)_1px_minmax(300px,1fr)] xls:gap-x-5 lg:gap-x-4">
            {/* Section 1 — Shipping, payment & contact details */}
            <div className="flex flex-col gap-6 lg:gap-5">
              <div className="flex flex-col items-start gap-3.5">
                <p className="tracking-[1.40px] flex flex-row gap-2 items-center text-[12px]">
                  <LiaShippingFastSolid className="text-[18px]" />
                  <span>WORLDWIDE SHIPPING</span>
                </p>
                <div className="h-px w-full bg-[#2f2f2f]" />
                <p className="tracking-[1.40px] flex flex-row gap-2 items-center text-[14px] uppercase lg:text-[12px]">
                  <FaLock className="text-[14px]" />
                  <span>Secure payment</span>
                </p>
                {/* All six on one row at every width. The cells are proportional to the column, so on a
                    narrower tablet column they simply scale down together rather than wrapping. */}
                <div className="flex flex-nowrap items-center gap-x-2 w-full max-w-[380px]">
                  {PAYMENT_METHODS.map((method) => (
                    <span
                      key={method.alt}
                      title={method.alt}
                      className={`payment-options ${PAYMENT_CELL} ${method.cell} opacity-90 transition-all duration-200 ease-in-out hover:scale-110 hover:opacity-100`}
                    >
                      <Image src={method.src} alt={method.alt} preview={false} wrapperClassName={PAYMENT_IMG_WRAP} className={PAYMENT_IMG} />
                    </span>
                  ))}
                </div>
              </div>

              <div className="h-px w-full bg-[#2f2f2f]" />

              {/* Icons carry the meaning here, so each row keeps an accessible label for screen readers. */}
              <div className="flex flex-col items-start gap-4">
                <a className="flex items-center gap-3 text-[14px] lg:text-[12px]" href="mailto:service@ashclair.com" aria-label="Email us">
                  <FaRegEnvelope className="shrink-0 text-[16px]" aria-hidden="true" />
                  <span>service@ashclair.com</span>
                </a>
                <a className="flex items-center gap-3 text-[14px] lg:text-[12px]" href="tel:2136223264" aria-label="Call us">
                  <FaPhone className="shrink-0 text-[16px]" aria-hidden="true" />
                  <span>213-622-3264</span>
                </a>
                <p className="flex items-center gap-3 text-[14px] lg:text-[12px]">
                  <FaRegClock className="shrink-0 text-[16px]" aria-hidden="true" />
                  <span className="uppercase">9am - 5pm PST Mon - Fri</span>
                  <span className="sr-only">service hours</span>
                </p>
              </div>
            </div>

            <div className="w-px bg-[#c9c9c9]" />

            {/* Section 2 — Navigation links (unchanged three-column grouping) */}
            {/* On tablet the three link columns stay side by side (the ULs' own md:w-full would
                otherwise stack them into one very long list); the gap tightens to keep them fitting. */}
            <div className="flex items-start justify-between gap-5 md:gap-3 md:[&>ul]:w-auto">
              <ul className="flex w-1/3 flex-col items-start gap-3 md:w-full xl:w-fit 2xl:w-fit">
                <li>
                  <Link href="/faqs" rel="noreferrer">
                    <p className="tracking-[1.40px] text-[14px] lg:text-[12px]">FAQs</p>
                  </Link>
                </li>
                <li>
                  <Link href="/returns-shipping">
                    <p className="tracking-[1.40px] text-[14px] lg:text-[12px]">SHIPPING & RETURNS</p>
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy">
                    <p className="tracking-[1.40px] text-[14px] lg:text-[12px]">PRIVACY POLICY</p>
                  </Link>
                </li>
                <li>
                  <Link href="/terms-and-conditions">
                    <p className="tracking-[1.40px] text-[14px] uppercase lg:text-[12px]">Terms and Conditions</p>
                  </Link>
                </li>
                <li>
                  {/* Withdrawing consent must be as easy as granting it — this reopens the same modal as the banner. */}
                  <button type="button" onClick={openPreferences} className="cursor-pointer text-left">
                    <p className="tracking-[1.40px] text-[14px] uppercase lg:text-[12px]">Cookie Preferences</p>
                  </button>
                </li>
                <li>
                  <Link href="/custom-jewelry-design">
                    <p className="tracking-[1.40px] text-[14px] uppercase lg:text-[12px]">Custom Jewelry Design</p>
                  </Link>
                </li>
                <li>
                  <Link href="/design-your-ring-stack">
                    <p className="tracking-[1.40px] text-[14px] uppercase lg:text-[12px]">Design Your Ring Stack</p>
                  </Link>
                </li>
              </ul>
              <ul className="flex w-1/3 flex-col items-start gap-3 md:w-full xl:w-fit 2xl:w-fit">
                <li>
                  <Link href="/design-your-own">
                    <p className="tracking-[1.40px] text-[14px] lg:text-[12px]">CUSTOM JEWELRY</p>
                  </Link>
                </li>
                <li>
                  <Link href="/wedding-bands" rel="noreferrer">
                    <p className="tracking-[1.40px] text-[14px] lg:text-[12px]">WEDDING</p>
                  </Link>
                </li>
                <li>
                  <Link href="/engagement-rings" rel="noreferrer">
                    <p className="tracking-[1.40px] text-[14px] lg:text-[12px]">ENGAGEMENT</p>
                  </Link>
                </li>
                <li>
                  <Link href="/giftguide">
                    <p className="tracking-[1.40px] text-[14px] lg:text-[12px]">GIFT GUIDE</p>
                  </Link>
                </li>
              </ul>
              <ul className="flex w-1/4 flex-col items-start gap-3 self-start md:w-full xl:w-fit 2xl:w-fit">
                <li>
                  <Link href="/jewelry-care">
                    <p className="tracking-[1.40px] text-[14px] lg:text-[12px]">JEWELRY CARE</p>
                  </Link>
                </li>
                <li>
                  <Link href="/about-us">
                    <p className="tracking-[1.40px] text-[14px] lg:text-[12px]">ABOUT US</p>
                  </Link>
                </li>
                <li>
                  <Link href="/contactpage">
                    <p className="tracking-[1.40px] text-[14px] lg:text-[12px]">CONTACT US</p>
                  </Link>
                </li>

                <li>
                  <Link href="/blog">
                    <p className="tracking-[1.40px] text-[14px] lg:text-[12px]">OUR BLOG</p>
                  </Link>
                </li>
                <li>
                  <Link href="/education">
                    <p className="tracking-[1.40px] text-[14px] lg:text-[12px]">EDUCATION</p>
                  </Link>
                </li>
              </ul>
            </div>

            <div className="w-px bg-[#c9c9c9]" />

            {/* Section 3 — Newsletter & social */}
            <div className="flex flex-col gap-6 lg:gap-5">
              <div className="flex flex-col items-start gap-3">
                <p className="tracking-[1.40px] text-[14px]">{discountText}</p>
                <div className="flex flex-row lg:flex-col gap-2 w-full">
                  <Input
                    placeholder="Enter Email"
                    value={email}
                    size="small"
                    onChange={(e: any) => {
                      const v = e.target.value;
                      setEmail(v);
                      runLiveEmailValidation(v);
                      if (consentError) {
                        setConsentError('');
                      }
                    }}
                    className={`w-full !text-black ${emailError ? '!border-red-500' : ''}`}
                  />
                  <Button
                    onClick={handleFooterSubmit}
                    loading={loading}
                    className="self-stretch w-fit uppercase tracking-[2.00px] lg:w-full !h-[28px] !bg-secondary !text-text_w"
                  >
                    Submit
                  </Button>
                </div>
                <CloudflareTurnstile
                  ref={turnstileRef}
                  onVerify={setTurnstileToken}
                  onExpire={() => setTurnstileToken(null)}
                  onError={() => setTurnstileToken(null)}
                  className="w-full"
                />
                {emailError && <span className="text-red-500 text-sm">{emailError}</span>}
                <div className={' flex items-start gap-[10px] !cursor-pointer'}>
                  <input
                    className={`!text-secondary`}
                    // ref={ref}
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      setIsChecked(e.target.checked);
                      if (e.target.checked) {
                        setConsentError('');
                      }
                    }}
                    // name={name}
                    // onChange={handleChange}
                    id="footerCondition"
                    // {...restProps}
                  />
                  <label htmlFor="footerCondition" className="!text-[12px] !font-sans font-extralight tracking-[1.80px] sm:!text-[12px]">
                    By checking this box, you agree to receive automated personalized text messages from ASHCLAIR. Consent is not a condition of any
                    purchase. Reply HELP for help and STOP to cancel.{' '}
                    <Link className="underline !cursor-pointer" href="/terms-and-conditions">
                      View Terms & Privacy
                    </Link>
                    .
                  </label>
                </div>
                {consentError && (
                  <div ref={desktopErrorRef}>
                    <span className="text-red-500 text-sm">{consentError}</span>
                  </div>
                )}
              </div>

              {/* `mt-auto` drops this to the foot of the column so it lines up with the bottom of the taller
                  links column, and the rule separates it from the newsletter block above. */}
              <div className="mt-auto flex flex-col gap-5">
                <div className="h-px w-full bg-[#2f2f2f]" />
                <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                  <div className="flex items-center gap-5">
                    <p className="tracking-[1.0px] text-[14px] lg:text-[12px]">Follow Us:</p>
                    <div className="flex items-center gap-4">
                      <a href="https://www.facebook.com/ashclairjewelry" target="_blank" rel="noopener noreferrer">
                        <FaFacebookF className="h-5 w-5" />
                      </a>
                      <a href="https://www.instagram.com/ashclairjewelry/" target="_blank" rel="noopener noreferrer">
                        <FaInstagram className="h-5 w-5" />
                      </a>
                      <a href="https://www.pinterest.com/ashclairjewelry/" target="_blank" rel="noopener noreferrer">
                        <FaPinterestP className="h-5 w-5" />
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 border-l border-black pl-4">
                    <YotpoBadge width={48} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* mobile devices */}
      <div className="mt-3 sm:flex [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:flex justify-center self-stretch hidden py-3 px-3">
        <div className="container-xs flex flex-col items-center justify-center w-full">
          <div className="flex flex-col w-full gap-3">
            <div className="flex flex-col gap-2.5 ">
              <div className="flex flex-col items-start gap-[18px]">
                <div className="flex gap-3.5 flex-col self-stretch">
                  <p className="tracking-[1.40px] flex flex-row w-full gap-2 items-center text-[12px]">
                    <LiaShippingFastSolid className="text-[14px]" />
                    WORLDWIDE SHIPPING
                  </p>

                  <div className="flex flex-col gap-3">
                    <p className="tracking-[1.40px] text-[12px] uppercase">Secure payment</p>
                    {/* Badges share the full row width, each cell sized to its own logo so the gaps stay equal.
                        This row is uncapped, so on a 550px screen the badges reach ~46px tall — the gaps here
                        (12px across, and the column's gap-3 above) are what keep the Google Pay mark's required
                        clear space, which is 0.214x its own height on every side. See PAYMENT_METHODS. */}
                    {/* Portrait tablets reuse this mobile footer; capped at the 550px row width so the
                        badges stop at their largest mobile size instead of growing to ~110px. */}
                    <div className="flex w-full items-center gap-x-3 [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:max-w-[526px]">
                      {PAYMENT_METHODS.map((method) => (
                        <span key={method.alt} className={`${PAYMENT_CELL} ${method.cell}`}>
                          <Image src={method.src} alt={method.alt} preview={false} wrapperClassName={PAYMENT_IMG_WRAP} className={PAYMENT_IMG} />
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* <div className="  h-px bg-[#2f2f2f] " /> */}

            <div className="flex flex-col my-2 items-start gap-3">
              <p className="tracking-[1.40px] text-[12px]">{discountText}</p>
              <div className="flex flex-row gap-2 w-full">
                <Input
                  placeholder="Enter Email"
                  size="small"
                  value={email}
                  onChange={(e: any) => {
                    const v = e.target.value;
                    setEmail(v);
                    runLiveEmailValidation(v);
                    if (consentError) {
                      setConsentError('');
                    }
                  }}
                  className={`w-full !text-black ${emailError ? '!border-red-500' : ''}`}
                />
                <Button
                  onClick={handleFooterSubmit}
                  loading={loading}
                  className="self-stretch w-fit text-[12px] uppercase tracking-[2.00px] !h-[28px] !bg-secondary !text-text_w"
                >
                  Submit
                </Button>
              </div>
              <CloudflareTurnstile
                ref={turnstileRefMobile}
                onVerify={setTurnstileTokenMobile}
                onExpire={() => setTurnstileTokenMobile(null)}
                onError={() => setTurnstileTokenMobile(null)}
                className="w-full"
              />
              {emailError && <span className="text-red-500 text-sm">{emailError}</span>}
              <div className="flex items-start gap-[10px] !cursor-pointer">
                <input
                  className={`!text-secondary`}
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    setIsChecked(e.target.checked);
                    if (e.target.checked) {
                      setConsentError('');
                    }
                  }}
                  id="footerConditionMobile"
                />
                <label htmlFor="footerConditionMobile" className="!text-[12px] !font-sans font-extralight tracking-[1.80px]">
                  By checking this box, you agree to receive automated personalized text messages from ASHCLAIR. Consent is not a condition of any
                  purchase. Reply HELP for help and STOP to cancel.{' '}
                  <Link className="underline !cursor-pointer" href="/terms-and-conditions">
                    View Terms & Privacy
                  </Link>
                  .
                </label>
              </div>
              {consentError && (
                <div ref={mobileErrorRef}>
                  <span className="text-red-500 text-sm">{consentError}</span>
                </div>
              )}
            </div>

            <div className=" w-[100%] flex mt-2 flex-wrap gap-3 justify-between box-border gap-y-[20px]">
              <ul className="flex w-[48%] flex-col items-start gap-3">
                <li>
                  <Link href="/faqs" rel="noreferrer">
                    <p className="tracking-[1.2px] uppercase text-[11px]">FAQs</p>
                  </Link>
                </li>
                <li>
                  <Link href="/returns-shipping">
                    <p className="tracking-[1.2px] uppercase text-[11px]">SHIPPING & RETURNS</p>
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy">
                    <p className="tracking-[1.2px] uppercase text-[11px]">PRIVACY POLICY</p>
                  </Link>
                </li>
                <li>
                  <Link href="terms-and-conditions">
                    <p className="tracking-[1.2px] uppercase text-[11px]">Terms and Conditions</p>
                  </Link>
                </li>
                <li>
                  <button type="button" onClick={openPreferences} className="cursor-pointer text-left">
                    <p className="tracking-[1.2px] uppercase text-[11px]">Cookie Preferences</p>
                  </button>
                </li>
                <li>
                  <Link href="/custom-jewelry-design">
                    <p className="tracking-[1.2px] uppercase text-[11px]">Custom Jewelry Design</p>
                  </Link>
                </li>
                <li>
                  <Link href="/design-your-ring-stack">
                    <p className="tracking-[1.2px] uppercase text-[11px]">Design Your Ring Stack</p>
                  </Link>
                </li>
                <li>
                  <Link href="/design-your-own">
                    <p className="tracking-[1.2px] text-[11px]">CUSTOM JEWELRY</p>
                  </Link>
                </li>
                <li>
                  <Link href="/engagement-rings">
                    <p className="tracking-[1.2px] text-[11px]">ENGAGEMENT</p>
                  </Link>
                </li>
              </ul>
              <ul className="flex w-[48%] flex-col items-start gap-3">
                <li>
                  <Link href="/jewelry-care" rel="noreferrer">
                    <p className="tracking-[1.2px] text-[11px]">JEWELRY CARE</p>
                  </Link>
                </li>
                <li>
                  <Link href="/about-us">
                    <p className="tracking-[1.2px] text-[11px]">ABOUT US</p>
                  </Link>
                </li>
                <li>
                  <Link href="/contactpage">
                    <p className="tracking-[1.2px] text-[11px]">CONTACT US</p>
                  </Link>
                </li>

                <li>
                  <Link href="/blog">
                    <p className="tracking-[1.2px] text-[11px]">OUR BLOG</p>
                  </Link>
                </li>
                <li>
                  <Link href="/wedding-bands" rel="noreferrer">
                    <p className="tracking-[1.2px] text-[11px]">WEDDING</p>
                  </Link>
                </li>
                <li>
                  <Link href="/giftguide">
                    <p className="tracking-[1.2px] text-[11px]">GIFT GUIDE</p>
                  </Link>
                </li>
                <li>
                  <Link href="/education">
                    <p className="tracking-[1.40px] text-[14px] lg:text-[12px]">OUR EDUCATION</p>
                  </Link>
                </li>
              </ul>
            </div>

            <div className="h-px bg-[#2f2f2f] " />

            {/* Details on the left, Yotpo badge alongside them on the right rather than on its own row. */}
            <div className="flex w-[100%] items-center justify-between gap-3 box-border">
              <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-2">
                  <p className="text-[12px]">Contact Us:</p>
                  <p className="text-[12px]">service@ashclair.com</p>
                </div>
                <div className="flex flex-row gap-2 items-center">
                  <p className="text-[12px] ">Follow Us:</p>
                  <div className="flex justify-start gap-3">
                    <a href="https://www.facebook.com/ashclairjewelry" target="_blank" rel="noopener noreferrer">
                      <FaFacebookF className="h-5 w-5" />
                    </a>
                    <a href="https://www.instagram.com/ashclairjewelry/" target="_blank" rel="noopener noreferrer">
                      <FaInstagram className="h-5 w-5" />
                    </a>
                    <a href="https://www.pinterest.com/ashclairjewelry/" target="_blank" rel="noopener noreferrer">
                      <FaPinterestP className="h-5 w-5" />
                    </a>
                  </div>
                </div>
                <div className="flex flex-wrap justify-start gap-2">
                  <p className="tracking-[0.0px] text-[12px]">Service Hours:</p>
                  <p className="text-[12px] uppercase">9am - 5pm PST Mon - Fri</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center">
                <YotpoBadge width={48} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-center self-stretch bg-[#eceded] py-3">
        <Link href="/privacy-policy">
          <div className="container-xs flex justify-center gap-6 px-14 lg:px-20 md:px-5">
            <p className="uppercase tracking-[1.00px] text-[12px]">Privacy policy</p>
            <div className="h-[12px] w-px border border-solid border-[#707070] bg-[#ffffff]" />
            <p className="tracking-[1.00px] text-[12px]">© {dayjs().year()} ASHCLAIR</p>
          </div>
        </Link>
      </div>
    </footer>
  );
}
