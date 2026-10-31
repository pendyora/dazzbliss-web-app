/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';

import { Button, Image, Input, Modal, notification, Typography } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IoMdClose } from 'react-icons/io';

import CloudflareTurnstile, { CloudflareTurnstileHandle } from '@/components/common/CloudflareTurnstile';
import { useHoneypot } from '@/hook/useHoneypot';
import { addSubmitSignUp, getCouponData } from '@/services/cartService';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchIntroPopUpFilter } from '@/store/slices/IntroPopup/IntroPopupSlice';
import { isDisposableDomain, isValidEmailFormat } from '@/utils/emailValidation';
import { trackSubscribe } from '@/utils/metaPixel';

const { Paragraph, Title } = Typography;
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
        <div onClick={() => setModeOpen(true)} className="sm:text-[13px] !text-nowrap !w-fit">
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
        backgroundColor: '#18381d',
        boxShadow: 'none',
        color: '#ffffff',
        borderRadius: '10px',
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
        if (introPopUpList?.length > 0) {
          setIntroSignUpPopUp(introPopUpList[0]);
          const introPopupOpen = localStorage.getItem('IntroPopupOpen');
          setTimeout(() => {
            if (introPopupOpen !== 'true') {
              setModeOpen(true);
              localStorage.setItem('IntroPopupOpen', 'true');
            }
            if (introPopUpList[0]?.coupon) {
              fetchCoupan(introPopUpList[0]?.coupon);
            }
          }, 10000);
        }
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
    <div>
      <HoneypotField />
      {introSignUpPopUp && (
        <Modal
          className="intro-model sm:!w-[92%]"
          closeIcon={
            introSignUpPopUp?.title ? null : (
              <div className="bg-[#fcfcfcb7] p-2 rounded-lg">
                <IoMdClose />
              </div>
            )
          }
          width={introSignUpPopUp?.title ? (windowWidth >= 768 ? 720 : Math.min(420, windowWidth - 32)) : '800px'}
          maskClosable={false}
          centered
          closable={introSignUpPopUp?.title ? false : true}
          wrapClassName="custom-modal"
          open={modeOpen}
          onCancel={handleCancel}
          footer={null}
        >
          {/* Image-only popup (no title set) — kept as before */}
          {!introSignUpPopUp?.title && (
            <div className="sm:overflow-hidden !w-full !h-[400px] md:!h-auto sm:!h-[460px] rounded-lg overflow-hidden">
              <div className="md:w-full md:hidden !h-full">
                <Image
                  className="object-cover !w-full md:hidden rounded-lg"
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
                  className="object-cover !w-full hidden md:block sm:hidden rounded-lg"
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
              <div className="grid grid-cols-[42%_1fr] w-full rounded-lg overflow-hidden bg-white">
                {/* Image column — uses absolute-positioned image so the column height
                    follows the form column (no white space when both errors are visible).
                    min-h preserves a sensible 4:5-ish ratio when the form is short. */}
                <div className="relative w-full overflow-hidden bg-[#f5f0e3] min-h-[440px]">
                  <Image
                    className="!w-full !h-full object-cover"
                    wrapperClassName="!absolute !inset-0 !block !w-full !h-full"
                    preview={false}
                    src={introSignUpPopUp?.image}
                  />
                </div>
                <div className="flex flex-col justify-center px-8 py-8 lg:px-7">
                  <Title level={3} className="!font-serif !text-[24px] !font-normal !leading-[1.25] !mb-2.5 !text-[#1d1f1b]">
                    {introSignUpPopUp?.title}
                  </Title>
                  {introSignUpPopUp?.content && (
                    <Paragraph className="!text-[13px] !text-[#757575] !leading-[1.6] !mb-5 !font-sans">{introSignUpPopUp?.content}</Paragraph>
                  )}
                  <Input
                    className="!h-11 !rounded-none !border-[#3b3b3b] !shadow-none !font-sans"
                    placeholder="Enter your email"
                    type="email"
                    value={email}
                    onChange={handleChange}
                    status={error ? 'error' : undefined}
                  />
                  {error && (
                    <p className="text-[#c03b3b] text-[11.5px] mt-1.5 mb-0 flex items-center gap-1.5 !font-sans">
                      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#c03b3b] text-white text-[10px] font-bold leading-none">
                        !
                      </span>
                      {error}
                    </p>
                  )}
                  <div className="flex items-start gap-2 mt-4">
                    <input
                      type="checkbox"
                      id="offerModelConsentDesktop"
                      className="mt-[3px] accent-secondary cursor-pointer flex-shrink-0"
                      checked={isChecked}
                      onChange={(e) => {
                        setIsChecked(e.target.checked);
                        if (e.target.checked) {
                          setConsentError('');
                        }
                      }}
                    />
                    <label
                      htmlFor="offerModelConsentDesktop"
                      className="text-[10.5px] !font-sans font-extralight leading-[1.55] text-[#757575] cursor-pointer"
                    >
                      By checking this box, you agree to receive automated personalized text messages from ASHCLAIR. Reply HELP for help and STOP to
                      cancel.{' '}
                      <Link className="underline text-[#1d1f1b]" href="/terms-and-conditions" onClick={handleCancel}>
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
                  <Button
                    className="!mt-5 !w-full !h-[44px] !border-none !bg-secondary !text-text_w uppercase tracking-[2.5px] !text-[12px] !font-semibold"
                    onClick={onSubmit}
                    loading={loading}
                  >
                    {introSignUpPopUp?.button1}
                  </Button>
                  {consentError && (
                    <p className="text-[#c03b3b] text-[11.5px] mt-2 mb-0 flex items-center gap-1.5 !font-sans">
                      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#c03b3b] text-white text-[10px] font-bold leading-none">
                        !
                      </span>
                      {consentError}
                    </p>
                  )}
                  {introSignUpPopUp?.button2 && introSignUpPopUp?.button2 !== '' && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="block w-full text-center mt-3 text-[11px] tracking-[1px] text-[#757575] underline underline-offset-2 uppercase bg-transparent border-none cursor-pointer !font-sans hover:text-[#1d1f1b] transition-colors"
                    >
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
              <div className="w-full rounded-lg overflow-hidden bg-white">
                <div className="w-full aspect-[5/3] overflow-hidden bg-[#f5f0e3]">
                  <Image
                    className="!w-full !h-full object-cover"
                    wrapperClassName="!w-full !h-full !block"
                    preview={false}
                    src={introSignUpPopUp?.image}
                  />
                </div>
                <div className="px-5 py-6 text-center">
                  <Title level={3} className="!text-[20px] !font-medium !leading-[1.3] !mb-2 !text-[#1d1f1b]">
                    {introSignUpPopUp?.title}
                  </Title>
                  {introSignUpPopUp?.content && (
                    <Paragraph className="!text-[13px] !text-[#757575] !leading-[1.55] !mb-5 !font-sans">{introSignUpPopUp?.content}</Paragraph>
                  )}
                  <Input
                    className="!h-11 !rounded-none !border-[#3b3b3b] !shadow-none !text-center !font-sans"
                    placeholder="Enter your email"
                    type="email"
                    value={email}
                    onChange={handleChange}
                    status={error ? 'error' : undefined}
                  />
                  {error && <p className="text-[#c03b3b] text-[11.5px] mt-1.5 mb-0 text-left !font-sans">{error}</p>}
                  <div className="flex items-start gap-2 mt-4 text-left">
                    <input
                      type="checkbox"
                      id="offerModelConsentMobile"
                      className="mt-[3px] accent-secondary cursor-pointer flex-shrink-0"
                      checked={isChecked}
                      onChange={(e) => {
                        setIsChecked(e.target.checked);
                        if (e.target.checked) {
                          setConsentError('');
                        }
                      }}
                    />
                    <label
                      htmlFor="offerModelConsentMobile"
                      className="text-[10.5px] !font-sans font-extralight leading-[1.55] text-[#757575] cursor-pointer"
                    >
                      By checking this box, you agree to receive automated personalized text messages from ASHCLAIR. Reply HELP for help and STOP to
                      cancel.{' '}
                      <Link className="underline text-[#1d1f1b]" href="/terms-and-conditions" onClick={handleCancel}>
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
                  <Button
                    className="!mt-5 !w-full !h-[44px] !border-none !bg-secondary !text-text_w uppercase tracking-[2px] !text-[12px] !font-semibold"
                    onClick={onSubmit}
                    loading={loading}
                  >
                    {introSignUpPopUp?.button1}
                  </Button>
                  {consentError && <p className="text-[#c03b3b] text-[11.5px] mt-2 mb-0 text-left !font-sans">{consentError}</p>}
                  {introSignUpPopUp?.button2 && introSignUpPopUp?.button2 !== '' && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="block w-full text-center mt-3 text-[11px] tracking-[1px] text-[#757575] underline underline-offset-2 uppercase bg-transparent border-none cursor-pointer !font-sans"
                    >
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
    </div>
  );
};

export default OfferModel;
