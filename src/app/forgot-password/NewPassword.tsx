'use client';

import React, { useState, useCallback, useRef } from 'react';

import { Form, Input, Button } from 'antd';
import { debounce } from 'lodash';
import { useRouter, useSearchParams } from 'next/navigation';
import { LuEye, LuEyeOff } from 'react-icons/lu';

import CloudflareTurnstile, { CloudflareTurnstileHandle } from '@/components/common/CloudflareTurnstile';
import { useAppDispatch, useAppSelector } from '@/store';
import { forgotPassword, resetPassword } from '@/store/slices/auth/authSlice';
import { encrypt } from '@/utils/enc-decy';

import { Text } from '../../components';

export default function NewPassword() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading } = useAppSelector((state) => state.auth.auth);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<CloudflareTurnstileHandle>(null);

  const token = searchParams?.get('token');

  const handleAuthAction = useCallback(
    debounce(async (values: { email?: string; password?: string }) => {
      try {
        let result: any;
        if (token && values.password) {
          result = await dispatch(
            resetPassword({
              password: values.password,
              authHeader: encrypt({ token }, true),
              cloudflareTurnstileToken: turnstileToken,
            }),
          );
        } else if (values.email) {
          result = await dispatch(forgotPassword({ email: values.email, cloudflareTurnstileToken: turnstileToken }));
        }
        if (result?.payload?.status === 200) {
          if (token && values.password) {
            router.push('/');
          } else {
            setSuccessMessage('We have sent you an email!');
            setTimeout(() => setSuccessMessage(''), 5000);
          }
        } else {
          turnstileRef.current?.reset();
          setTurnstileToken(null);
          setErrorMessage(result?.payload?.message);
          setTimeout(() => setErrorMessage(''), 5000);
        }
      } catch (error: any) {
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        setErrorMessage(error.message);
        setTimeout(() => setErrorMessage(''), 5000);
      }
    }, 1000),
    [token, turnstileToken],
  );

  return (
    <div>
      <div className="flex flex-col items-center justify-center border-b border-solid border-[#3b3b3b] py-[76px] 2xl:py-16 lg:py-8 md:py-5 sm:py-5">
        <div className="container-xs flex flex-col items-center gap-9 sm:gap-3 2xl:px-[160px] xl:px-28 lg:px-20 md:px-5 sm:px-3">
          <div className="flex flex-col items-center self-stretch px-14 md:px-5 sm:px-4 mb-8 lg:mb-0 sm:mb-3">
            <Text size="text5xl" as="p" className="uppercase text-center sm:!text-[18px]">
              {token ? 'Create a New Password' : 'Forgot Password'}
            </Text>
          </div>
          <div className="flex w-[550px] sm:w-full sm:gap-3 flex-col gap-9">
            <Form
              name={token ? 'resetPassword' : 'forgotPassword'}
              layout="vertical"
              initialValues={token ? { password: '', confirm_password: '' } : { email: '' }}
              onFinish={handleAuthAction}
            >
              {token ? (
                <>
                  <Form.Item
                    name="password"
                    label="Password"
                    rules={[
                      {
                        required: true,
                        message: 'Please enter your password!',
                      },
                      {
                        min: 8,
                        message: 'Password must be at least 8 characters',
                      },
                    ]}
                  >
                    <Input.Password
                      placeholder="Enter Password"
                      iconRender={(visible) => (visible ? <LuEye /> : <LuEyeOff />)}
                      visibilityToggle={{
                        visible: showPassword,
                        onVisibleChange: setShowPassword,
                      }}
                    />
                  </Form.Item>
                  <Form.Item
                    name="confirm_password"
                    label="Confirm Password"
                    dependencies={['password']}
                    rules={[
                      {
                        required: true,
                        message: 'Please confirm your password!',
                      },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Passwords must match!'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      placeholder="Re-enter Password"
                      iconRender={(visible) => (visible ? <LuEye /> : <LuEyeOff />)}
                      visibilityToggle={{
                        visible: showConfirmPassword,
                        onVisibleChange: setShowConfirmPassword,
                      }}
                    />
                  </Form.Item>
                </>
              ) : (
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Please enter your email!' },
                    { type: 'email', message: 'Invalid email address' },
                  ]}
                >
                  <Input placeholder="Enter Email" />
                </Form.Item>
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
                    className="self-stretch tracking-[2.00px] !text-text_w !bg-secondary sm:!text-[12px]"
                  >
                    {token ? 'Save' : successMessage ? 'Submit' : 'Submit'}
                  </Button>
                  <Button type="default" onClick={() => router.back()} className="self-stretch tracking-[2.00px] sm:!text-[12px]">
                    Cancel
                  </Button>
                </div>
              </Form.Item>
              <div className="w-full relative h-10">
                {errorMessage && (
                  <Text as="p" size="textlg" className="top-0 absolute text-red-500 font-sans pl-2 ">
                    {errorMessage}
                  </Text>
                )}
                {successMessage && (
                  <Text as="p" size="textlg" className="top-0 absolute text-green-500 font-sans pl-2  text-center">
                    {successMessage}
                  </Text>
                )}
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
