import React from 'react';

import { Form, Input, Button, Select } from 'antd';

import { Text } from '@/components';

const { Option } = Select;

const AddressForm = ({ setAddress, title }: { setAddress: React.Dispatch<React.SetStateAction<boolean>>; title: string }) => {
  const [form] = Form.useForm();

  const handleCountryChange = async (countryId: string) => {
    form.setFieldsValue({
      state: null,
      city: null,
      zipCode: '',
    });
    // Add dispatch for states if needed
  };

  const handleStateChange = async (stateId: string) => {
    form.setFieldsValue({
      city: null,
      zipCode: '',
    });
    // Add dispatch for cities if needed
  };

  return (
    <div className="billing-address-form">
      <Text as="p" size="text3xl" className="text-black-900 text-[24px] mb-8 font-medium uppercase md:text-[22px]">
        {title} address
      </Text>
      <Form form={form} name="billingAddress" layout="vertical">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
          {/* First Name */}
          <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'Please enter your first name!' }]}>
            <Input placeholder="First Name" />
          </Form.Item>

          {/* Last Name */}
          <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: 'Please enter your last name!' }]}>
            <Input placeholder="Last Name" />
          </Form.Item>
        </div>

        {/* Address 1 */}
        <Form.Item
          name="address1"
          label="Address 1"
          rules={[
            { required: true, message: 'Please enter your address!' },
            { max: 60, message: 'Address 1 cannot be more than 60 characters!' },
          ]}
        >
          <Input placeholder="Address 1" />
        </Form.Item>

        {/* Address 2 */}
        <Form.Item name="address2" label="Address 2" rules={[{ max: 60, message: 'Address 2 cannot be more than 60 characters!' }]}>
          <Input placeholder="Address 2" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
          {/* Country */}
          <Form.Item name="country" label="Country" rules={[{ required: true, message: 'Please select your country!' }]}>
            <Select placeholder="Select Country" onChange={handleCountryChange}>
              <Option value="India">India</Option>
              {/* Add more countries as needed */}
            </Select>
          </Form.Item>

          {/* State/Territory */}
          <Form.Item name="state" label="State/Territory" rules={[{ required: true, message: 'Please select your state!' }]}>
            <Select placeholder="Select State" onChange={handleStateChange}>
              <Option value="Gujarat">Gujarat</Option>
              {/* Add more states as needed */}
            </Select>
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
          {/* City */}
          <Form.Item name="city" label="City">
            <Select allowClear placeholder="Select city" onChange={() => form.setFieldsValue({ zipCode: '' })}>
              {/* Add more cities */}
              <Option value="Ahmedabad">Ahmedabad</Option>
            </Select>
          </Form.Item>

          {/* Zip Code */}
          <Form.Item name="zipCode" label="Zip Code" rules={[{ required: true, message: 'Please enter your zip code!' }]}>
            <Input placeholder="Zip Code" inputMode="numeric" />
          </Form.Item>
        </div>

        {/* Email */}
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please enter your email!' },
            { type: 'email', message: 'Please enter a valid email!' },
          ]}
        >
          <Input placeholder="Email" />
        </Form.Item>

        {/* Mobile Number */}
        <Form.Item
          name="mobile"
          label="Mobile Number"
          rules={[
            { required: true, message: 'Please enter your mobile number!' },
            {
              pattern: /^[0-9]+$/,
              message: 'Please enter a valid mobile number!',
            },
          ]}
        >
          <Input placeholder="Mobile Number" inputMode="numeric" />
        </Form.Item>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Form.Item className="col-span-1">
            <Button
              type="default"
              htmlType="submit"
              className="!text-text_w !bg-secondary w-full !h-[45px] tracking-[1.50px] 2xl:text-[16px] xl:text-[16px] lg:text-[14px] lg:!h-[37px] uppercase"
            >
              Update
            </Button>
          </Form.Item>

          <Form.Item className="col-span-1">
            <Button
              type="default"
              htmlType="button"
              className="w-full  !h-[45px] tracking-[1.50px] 2xl:text-[16px] xl:text-[16px] lg:text-[14px] lg:!h-[37px] uppercase"
              onClick={() => setAddress(false)}
            >
              Cancel
            </Button>
          </Form.Item>
        </div>
      </Form>
    </div>
  );
};

export default AddressForm;
