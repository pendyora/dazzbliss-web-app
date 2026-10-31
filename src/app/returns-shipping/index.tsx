'use client';
import React from 'react';

import { Typography, Divider } from 'antd';

const { Title, Paragraph } = Typography;

const ReturnsShipping = () => {
  return (
    <div className=" max-w-7xl mx-auto p-5 mt-5 bg-white shadow-md rounded-lg">
      <Title level={2} className="text-center mb-6">
        Returns & Shipping
      </Title>

      {/* US Shipping */}
      <div className="mb-6">
        <Title level={3}>US Shipping</Title>
        <Paragraph>
          <strong>For our U.S. Customers we ship:</strong>
        </Paragraph>
        <Paragraph>
          USPS (United States Postal Service) - <span className="font-semibold">FREE</span> for orders over $100
        </Paragraph>
        <Paragraph>
          <strong>UPS:</strong>
          <br /> Second Day Air - <span className="font-semibold">$25</span> <br /> Over Night - <span className="font-semibold">$35</span>
        </Paragraph>
        <Paragraph>
          All packages above $80 require Signature Confirmation.
          <br />
          <span className="text-red-500 font-semibold">(Mandatory for Insurance Policy)</span>
        </Paragraph>
      </div>
      <Divider />

      {/* Holiday Shipping */}
      <div className="mb-6">
        <Title level={3}>Holiday Shipping</Title>
        <Paragraph className="italic text-gray-600">
          (FedEx/UPS packages may be delayed a day or two due to the large volume of packages for the holidays)
        </Paragraph>
      </div>
      <Divider />

      {/* US Return */}
      <div className="mb-6">
        <Title level={3}>US Return</Title>
        <Paragraph>
          Ashclair wishes you to be satisfied with every purchase, but we know that sometimes this is not the case. If you are not completely
          satisfied, you can return any order for a refund or exchange within 30 days from the date of shipment.
        </Paragraph>
        <Paragraph>
          Items must be returned in the same condition as you received them. Please do not remove the tag unless the item is being kept. If the tag is
          removed or shows signs of being worn, there will be a <span className="font-semibold">10% restocking fee</span> applied.
        </Paragraph>
        <Paragraph className="text-gray-600">
          Any custom making fees (sizing, metal upgrade, stone change, etc.) and shipping charges are not refundable.
        </Paragraph>
      </div>
      <Divider />

      {/* International Shipping & Returns */}
      <div className="mb-6">
        <Title level={3}>International Shipping & Returns</Title>
        <Paragraph>
          Ashclair wishes you to be satisfied with every purchase but we know that sometimes this is not the case. If you are not completely
          satisfied, you can return any order for refund or exchange within 30 days from the date of shipment. Items must be returned in same
          condition as you received. Please do not remove tag unless item is being kept, so leave the tag on until you are sure you love it. If tag is
          removed there will be a 10% restocking fee applied.
        </Paragraph>
        <Paragraph>Any custom making fees (sizing, metal upgrade, stone change etc.) and shipping charges are not refundable.</Paragraph>
      </div>
      <Divider />

      {/* How to Return an Order */}
      <div className="mb-6">
        <Title level={3}>How to Return an Order</Title>
        <Paragraph>
          <strong>How to Package Your Return:</strong> Package all your items securely so it is one unified package ready for delivery. Include a copy
          of your invoice.
        </Paragraph>
        <Paragraph>
          <strong>Shipment and Insurance:</strong> We strongly suggest that you take insurance and a signature confirmation for the package. Make sure
          you can track your package for a quick return process.
        </Paragraph>
        <Paragraph>
          <Paragraph>All Return Packages should be Mailed to:</Paragraph>
          <strong>Return Address:</strong>
          <br />
          1142 S Diamond Bar Blvd, Unit 503 Diamond Bar, CA 91765, United States
          <br />
          <span className="font-semibold">Ashclair</span>
        </Paragraph>
      </div>
      <Divider />

      {/* Return Process */}
      <div className="mb-6">
        <Title level={3}>Return Process</Title>
        <Paragraph>
          A certified jeweler will inspect and verify the condition. Ashclair will process the return within{' '}
          <span className="font-semibold">1-3 business days</span> from receiving the item. If you have any further questions please feel free to ask
          or contact us at <span className="font-semibold">(213) 622-3264</span> or email us at{' '}
          <a href="mailto:service@ashclair.com" className="text-blue-500">
            service@ashclair.com
          </a>
          .
        </Paragraph>
      </div>
    </div>
  );
};

export default ReturnsShipping;
