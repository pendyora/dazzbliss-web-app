'use client';

import React, { useState, useRef } from 'react';

import { Form, Input, Button } from 'antd';
import { useRouter } from 'next/navigation';

import CloudflareTurnstile, { CloudflareTurnstileHandle } from '@/components/common/CloudflareTurnstile';
import { useAppDispatch, useAppSelector } from '@/store';
import { forgotPassword } from '@/store/slices/auth/authSlice';
import { isValidEmailFormat } from '@/utils/emailValidation';

import { Text } from '../../components';

export default function ForgotPassword() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading } = useAppSelector((state) => state.auth.auth);
  const [errorMessage, setErrorMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<CloudflareTurnstileHandle>(null);

  const handleForgotPassword = async (values: any) => {
    try {
      const result: any = await dispatch(forgotPassword({ ...values, cloudflareTurnstileToken: turnstileToken }));
      if (result.meta.requestStatus === 'fulfilled') {
        router.push('/');
      } else {
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        setErrorMessage(result?.payload?.message);
        setTimeout(() => {
          setErrorMessage('');
        }, 5000);
      }
    } catch (error: any) {
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      setErrorMessage(error.message);
      setTimeout(() => {
        setErrorMessage('');
      }, 5000);
    }
  };

  return (
    <div>
      <div className="flex flex-col items-center justify-center border-b border-solid border-[#3b3b3b] py-[76px] 2xl:py-16 lg:py-8 md:py-5 sm:py-5">
        <div className="container-xs flex flex-col items-center gap-9 sm:gap-3 2xl:px-[160px] xl:px-28 lg:px-20 md:px-5">
          <div className="flex flex-col items-center self-stretch px-14 md:px-5 sm:px-4 mb-8 lg:mb-0 sm:mb-6">
            <Text size="text5xl" as="p" className="uppercase text-center">
              Forgot Password
            </Text>
          </div>
          <div className="flex w-[550px] sm:w-full sm:gap-3 flex-col gap-9">
            <Form name="forgotPassword" onFinish={handleForgotPassword} layout="vertical" initialValues={{ email: '' }}>
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
                        return Promise.reject(new Error('Invalid email address'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input placeholder="Enter Email" />
              </Form.Item>
              {errorMessage && (
                <Text as="p" size="textlg" className="text-red-500 font-sans pl-2 -my-4">
                  {errorMessage}
                </Text>
              )}
              <CloudflareTurnstile
                ref={turnstileRef}
                onVerify={setTurnstileToken}
                onExpire={() => setTurnstileToken(null)}
                onError={() => setTurnstileToken(null)}
                className="my-3"
              />
              <Form.Item>
                <div className="flex flex-col gap-5">
                  <Button
                    type="default"
                    htmlType="submit"
                    loading={loading}
                    disabled={loading}
                    className="self-stretch tracking-[2.00px] !text-text_w !bg-secondary"
                  >
                    {loading ? 'Processing...' : 'SUBMIT'}
                  </Button>
                  <Button
                    type="default"
                    onClick={() => {
                      router.back();
                    }}
                    className="self-stretch tracking-[2.00px]"
                  >
                    Cancel
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
