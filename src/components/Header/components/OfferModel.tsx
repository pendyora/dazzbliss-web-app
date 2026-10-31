/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';

import { Button, ConfigProvider, Image, Input, Modal, notification, Typography } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IoMdClose } from 'react-icons/io';

import { checkoutTheme, PRIMARY_BTN } from '@/app/checkout/checkoutTheme';
import CloudflareTurnstile, { CloudflareTurnstileHandle } from '@/components/common/CloudflareTurnstile';
import { useHoneypot } from '@/hook/useHoneypot';
import { addSubmitSignUp, getCouponData } from '@/services/cartService';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchIntroPopUpFilter } from '@/store/slices/IntroPopup/IntroPopupSlice';
import themeColors from '@/styles/theme-colors';
import { isDisposableDomain, isValidEmailFormat } from '@/utils/emailValidation';
import { trackSubscribe } from '@/utils/metaPixel';

const { Paragraph, Title } = Typography;

// Design class sets (Atlantic palette, square corners, hairlines).
const POPUP = {
  title: '!m-0 !mb-3 !font-cormorant !text-[clamp(28px,2.6vw,36px)] !font-normal !leading-[1.05] !tracking-[-0.01em] !text-ink',
  lede: '!m-0 !mb-6 !font-libre !text-[14px] !leading-[1.65] !text-ink-soft',
  input: '!h-12 !rounded-none !border-line-strong !shadow-none !font-libre !text-[14px] hover:!border-ink-soft focus:!border-ink',
  error: 'm-0 mt-1.5 font-libre text-[12px] leading-[1.4] text-danger',
  checkbox: 'mt-[2px] h-4 w-4 shrink-0 cursor-pointer rounded-none border-line-strong text-ink focus:ring-1 focus:ring-ink focus:ring-offset-1',
  consent: 'cursor-pointer font-libre text-[11.5px] leading-[1.6] text-ink-soft',
  consentLink: 'text-ink underline underline-offset-[3px] hover:text-ink-hover',
  submit: `${PRIMARY_BTN} !mt-5 !w-full`,
  dismiss:
    'mt-4 block w-full cursor-pointer border-none bg-transparent text-center font-libre text-[10.5px] uppercase tracking-[0.16em] text-ink-soft underline underline-offset-4 transition-colors hover:text-ink',
};
const OfferModel = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { introPopUpList } = useAppSelector((state) => state.introPopUpSlice);

  const [loading, setLoading] = useState(false);
  const [api, contextHolder] = notification.useNotification({ bottom: 0 });
  const [modeOpen, setModeOpen] = useState(false);
  const [introSignUpPopUp, setIntroSignUpPopUp] = useState<any>(null);
  const [error, setError] = useState('');
  const [consentError, setConsentError] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<CloudflareTurnstileHandle>(null);
  const { HoneypotField, isHoneypotClean } = useHoneypot('offer_website_confirm');

  useEffect(() => {
    setWindowWidth(window.innerWidth);

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  const fetchData = async () => {
    await dispatch(fetchIntroPopUpFilter());
  };

  const openNotification = (record: any) => {
    notification.destroy();

    api.open({
      message: (
        <div
          onClick={() => setModeOpen(true)}
          className="!w-fit !text-nowrap font-libre text-[11px] font-medium uppercase tracking-[0.18em] sm:text-[10.5px]"
        >
          GET {record?.discount_value} {record?.discount_type == 2 ? '%' : record?.discount_type == 1 ? '$' : ''} OFF
        </div>
      ),
      key: 'offer',
      className: `custom-class ${windowWidth <= 450 ? '!w-[146px]' : '!w-fit'}`,
      duration: 0,
      placement: 'bottomLeft',
      closable: windowWidth <= 450 ? true : false,
      style: {
        cursor: 'pointer',
        padding: '10px',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: themeColors.navy.DEFAULT,
        boxShadow: 'none',
        color: themeColors.noir.on,
        borderRadius: 0,
      },
    });
    setTimeout(() => {
      document.querySelectorAll('.custom-class').forEach((child: any) => {
        child.parentElement.classList.add('highlight');
      });
    }, 100);
  };

  const fetchCoupan = async (id: any) => {
    if (!id) {
      return;
    }
    try {
      const res = await getCouponData(id);

      if (res.status == 200) {
        const record = res.data.data;

        openNotification(record);
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    if (introPopUpList?.length > 0) {
      const currentDate = new Date();
      const validPopups = introPopUpList.filter((popup: any) => {
        return popup?.expiry_date ? new Date(popup?.expiry_date) > currentDate : true;
      });

      if (validPopups.length > 0) {
        // Show the first popup that has not expired (was introPopUpList[0], which could be an expired one).
        const popup = validPopups[0];
        setIntroSignUpPopUp(popup);
        const introPopupOpen = localStorage.getItem('IntroPopupOpen');
        setTimeout(() => {
          if (introPopupOpen !== 'true') {
            setModeOpen(true);
            localStorage.setItem('IntroPopupOpen', 'true');
          }
          if (popup?.coupon) {
            fetchCoupan(popup?.coupon);
          }
        }, 10000);
      }
    }
  }, [introPopUpList]);

  const handleChange = (e: any) => {
    const value = e.target.value;
    setEmail(value);
    if (!value) {
      setError('');
      return;
    }
    if (!isValidEmailFormat(value)) {
      setError('Please enter a valid email address');
      return;
    }
    if (isDisposableDomain(value)) {
      setError('Please enter a valid permanent email address');
      return;
    }
    setError('');
  };

  const resetFormState = () => {
    setEmail('');
    setError('');
    setConsentError('');
    setIsChecked(false);
    setLoading(false);
  };

  const handleCancel = () => {
    resetFormState();
    setModeOpen(false);
  };

  useEffect(() => {
    if (modeOpen) {
      resetFormState();
    }
  }, [modeOpen]);

  const onSubmit = async () => {
    if (!isHoneypotClean()) {
      return;
    }
    try {
      setLoading(true);

      if (!isChecked) {
        setConsentError('Please accept the terms to continue');
        setLoading(false);
        return;
      }

      if (!email.trim()) {
        setError('Email is required');
        setLoading(false);
        return;
      }
      if (!isValidEmailFormat(email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }
      if (isDisposableDomain(email)) {
        setError('Please enter a valid permanent email address');
        setLoading(false);
        return;
      }
      setError('');
      setConsentError('');
      const res = await addSubmitSignUp({
        email,
        coupon_id: introSignUpPopUp?.coupon || null,
        cloudflareTurnstileToken: turnstileToken,
      });
      if (res.status === 201) {
        trackSubscribe();
        api.destroy();
        notification.destroy();
        setLoading(false);
        setEmail('');
        setModeOpen(false);
        localStorage.setItem('OfferModelSubscribe', 'true');
        notification.success({
          message: 'success',
          description: res.data.message,
        });
      }
    } catch (error: any) {
      console.log(error);
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      setLoading(false);
      setError(error.response?.data?.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <ConfigProvider theme={checkoutTheme}>
      <HoneypotField />
      {introSignUpPopUp && (
        <Modal
          className="intro-model sm:!w-[92%]"
          // Always closable (X button, Esc, click outside). Before, a popup with a title had no close
          // button and could only be dismissed through the optional CMS "button2", so with that field
          // empty visitors were stuck.
          closeIcon={
            <div className="flex h-9 w-9 items-center justify-center bg-paper/90 text-ink" aria-label="Close">
              <IoMdClose />
            </div>
          }
          width={introSignUpPopUp?.title ? (windowWidth >= 768 ? 720 : Math.min(420, windowWidth - 32)) : '800px'}
          maskClosable
          centered
          closable
          wrapClassName="custom-modal"
          open={modeOpen}
          onCancel={handleCancel}
          footer={null}
        >
          {/* Image-only popup (no title set) — kept as before */}
          {!introSignUpPopUp?.title && (
            <div className="sm:overflow-hidden !w-full !h-[400px] md:!h-auto sm:!h-[460px] overflow-hidden bg-stone">
              <div className="md:w-full md:hidden !h-full">
                <Image
                  className="object-cover !w-full md:hidden"
                  preview={false}
                  onClick={() => {
                    if (introSignUpPopUp?.link) {
                      router.replace(introSignUpPopUp?.link);
                    }
                  }}
                  src={introSignUpPopUp?.image}
                />
              </div>
              <div className="hidden w-full md:block sm:hidden sm:!h-0 !h-[300px]">
                <Image
                  className="object-cover !w-full hidden md:block sm:hidden"
                  width={'100%'}
                  height={300}
                  preview={false}
                  onClick={() => {
                    if (introSignUpPopUp?.link) {
                      router.replace(introSignUpPopUp?.link);
                    }
                  }}
                  src={introSignUpPopUp?.image}
                />
              </div>
            </div>
          )}

          {/* Signup form popup — Option A (web/tablet) split, Option B (mobile) stacked.
              Uses JS windowWidth check (not Tailwind responsive classes) to guarantee
              the right layout renders inside the antd Modal portal. */}
          {introSignUpPopUp?.title && windowWidth >= 768 && (
            <>
              {/* ============= WEB / TABLET — Option A (split) ============= */}
              <div className="grid w-full grid-cols-[42%_1fr] overflow-hidden bg-paper">
                {/* Image column — uses absolute-positioned image so the column height
                    follows the form column (no white space when both errors are visible).
                    min-h preserves a sensible 4:5-ish ratio when the form is short. */}
                <div className="relative min-h-[460px] w-full overflow-hidden bg-stone">
                  <Image
                    className="!w-full !h-full object-cover"
                    wrapperClassName="!absolute !inset-0 !block !w-full !h-full"
                    preview={false}
                    src={introSignUpPopUp?.image}
                  />
                </div>
                <div className="flex flex-col justify-center px-10 py-10 lg:px-8">
                  <Title level={3} className={POPUP.title}>
                    {introSignUpPopUp?.title}
                  </Title>
                  {introSignUpPopUp?.content && <Paragraph className={POPUP.lede}>{introSignUpPopUp?.content}</Paragraph>}
                  <Input
                    className={POPUP.input}
                    placeholder="Enter your email"
                    type="email"
                    value={email}
                    onChange={handleChange}
                    status={error ? 'error' : undefined}
                  />
                  {error && <p className={POPUP.error}>{error}</p>}
                  <div className="flex items-start gap-2 mt-4">
                    <input
                      type="checkbox"
                      id="offerModelConsentDesktop"
                      className={POPUP.checkbox}
                      checked={isChecked}
                      onChange={(e) => {
                        setIsChecked(e.target.checked);
                        if (e.target.checked) {
                          setConsentError('');
                        }
                      }}
                    />
                    <label htmlFor="offerModelConsentDesktop" className={POPUP.consent}>
                      By checking this box, you agree to receive automated personalized text messages from ASHCLAIR. Reply HELP for help and STOP to
                      cancel.{' '}
                      <Link className={POPUP.consentLink} href="/terms-and-conditions" onClick={handleCancel}>
                        View Terms &amp; Privacy
                      </Link>
                      .
                    </label>
                  </div>
                  <CloudflareTurnstile
                    ref={turnstileRef}
                    onVerify={setTurnstileToken}
                    onExpire={() => setTurnstileToken(null)}
                    onError={() => setTurnstileToken(null)}
                    className="my-3"
                  />
                  <Button className={POPUP.submit} onClick={onSubmit} loading={loading}>
                    {introSignUpPopUp?.button1}
                  </Button>
                  {consentError && <p className={`${POPUP.error} mt-2`}>{consentError}</p>}
                  {introSignUpPopUp?.button2 && introSignUpPopUp?.button2 !== '' && (
                    <button type="button" onClick={handleCancel} className={POPUP.dismiss}>
                      {introSignUpPopUp?.button2}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ============= MOBILE — Option B (stacked) ============= */}
          {introSignUpPopUp?.title && windowWidth < 768 && windowWidth > 0 && (
            <>
              <div className="w-full overflow-hidden bg-paper">
                <div className="aspect-[5/3] w-full overflow-hidden bg-stone">
                  <Image
                    className="!w-full !h-full object-cover"
                    wrapperClassName="!w-full !h-full !block"
                    preview={false}
                    src={introSignUpPopUp?.image}
                  />
                </div>
                <div className="px-6 py-7 text-center">
                  <Title level={3} className={POPUP.title}>
                    {introSignUpPopUp?.title}
                  </Title>
                  {introSignUpPopUp?.content && <Paragraph className={POPUP.lede}>{introSignUpPopUp?.content}</Paragraph>}
                  <Input
                    className={`${POPUP.input} !text-center`}
                    placeholder="Enter your email"
                    type="email"
                    value={email}
                    onChange={handleChange}
                    status={error ? 'error' : undefined}
                  />
                  {error && <p className={`${POPUP.error} text-left`}>{error}</p>}
                  <div className="flex items-start gap-2 mt-4 text-left">
                    <input
                      type="checkbox"
                      id="offerModelConsentMobile"
                      className={POPUP.checkbox}
                      checked={isChecked}
                      onChange={(e) => {
                        setIsChecked(e.target.checked);
                        if (e.target.checked) {
                          setConsentError('');
                        }
                      }}
                    />
                    <label htmlFor="offerModelConsentMobile" className={POPUP.consent}>
                      By checking this box, you agree to receive automated personalized text messages from ASHCLAIR. Reply HELP for help and STOP to
                      cancel.{' '}
                      <Link className={POPUP.consentLink} href="/terms-and-conditions" onClick={handleCancel}>
                        View Terms &amp; Privacy
                      </Link>
                      .
                    </label>
                  </div>
                  <CloudflareTurnstile
                    ref={turnstileRef}
                    onVerify={setTurnstileToken}
                    onExpire={() => setTurnstileToken(null)}
                    onError={() => setTurnstileToken(null)}
                    className="my-3"
                  />
                  <Button className={POPUP.submit} onClick={onSubmit} loading={loading}>
                    {introSignUpPopUp?.button1}
                  </Button>
                  {consentError && <p className={`${POPUP.error} mt-2 text-left`}>{consentError}</p>}
                  {introSignUpPopUp?.button2 && introSignUpPopUp?.button2 !== '' && (
                    <button type="button" onClick={handleCancel} className={POPUP.dismiss}>
                      {introSignUpPopUp?.button2}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </Modal>
      )}
      {contextHolder}
    </ConfigProvider>
  );
};

export default OfferModel;
