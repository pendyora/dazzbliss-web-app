import React from 'react';

import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { Form, Input, Button, notification } from 'antd';

import { apiUpdatePassword } from '@/services/profileService';

const ChangePasswordForm = ({ setProfile }: { setProfile: React.Dispatch<React.SetStateAction<boolean>> }) => {
  const [form] = Form.useForm();
  const passwordRules = [
    { required: true, message: 'Please input your password!' },
    { min: 6, message: 'Password must be at least 8 characters!' },
  ];
  const onFinish = async (values: any) => {
    try {
      const data = {
        password: values.password,
        old_password: values.old_password,
      };

      const response: any = await apiUpdatePassword(data);
      setProfile(false);

      notification.success({ message: response?.data?.message ?? 'Password updated successfully!' });
    } catch (error) {
      console.error('Failed to update password:', error);

      notification.error({ message: 'Failed to update password. Please try again.' });
    }
  };

  // const onFinishFailed = (errorInfo: any) => {
  //   console.log('Failed:', errorInfo);
  // };

  return (
    <div className="change-password-form">
      <Form form={form} name="changePassword" layout="vertical" onFinish={onFinish}>
        <Form.Item name="old_password" label="Current Password" rules={[{ required: true, message: 'Please enter your current password!' }]}>
          <Input.Password placeholder="Current Password" iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)} />
        </Form.Item>
        <Form.Item name="newPassword" label="New Password" rules={passwordRules}>
          <Input.Password placeholder="New Password" iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)} />
        </Form.Item>
        <Form.Item
          name="password"
          label="Confirm New Password"
          dependencies={['newPassword']}
          rules={[
            {
              required: true,
              message: 'Please confirm your new password!',
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('The Passwords entered do not match!'));
              },
            }),
          ]}
        >
          <Input.Password placeholder="Confirm New Password" iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)} />
        </Form.Item>
        <div className="grid grid-cols-2 gap-4">
          <Form.Item className="col-span-1">
            <Button
              type="default"
              htmlType="submit"
              className="w-full !text-text_w !bg-secondary !h-[45px] tracking-[1.50px] 2xl:text-[16px] xl:text-[16px] lg:text-[14px] lg:!h-[37px] uppercase"
            >
              Change Password
            </Button>
          </Form.Item>
          <Form.Item className="col-span-1">
            <Button
              type="default"
              htmlType="button"
              className="w-full  !h-[45px] tracking-[1.50px] 2xl:text-[16px] xl:text-[16px] lg:text-[14px] lg:!h-[37px] uppercase"
              onClick={() => setProfile(false)}
            >
              Cancel
            </Button>
          </Form.Item>
        </div>
      </Form>
    </div>
  );
};

export default ChangePasswordForm;
