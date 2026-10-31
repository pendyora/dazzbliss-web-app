'use client';
import React from 'react';

import { Collapse, Typography } from 'antd';

const { Title, Paragraph } = Typography;
// const { Panel } = Collapse;

const TermsAndConditions = () => {
  return (
    <div className="max-w-7xl mx-auto p-5 mt-5 bg-white shadow-lg rounded-2xl">
      <Title level={2} className="text-center">
        Terms and Conditions
      </Title>

      <Paragraph>
        We reserve the right to update or modify these terms and conditions at any time without prior notice. Your use of Ashclair Web site following
        any such change constitutes your agreement to follow and be bound by the terms and conditions as changed. For this reason, we encourage you to
        review these terms and conditions each time you use this Web site.
      </Paragraph>
      <Paragraph>
        Pricing errors may occur on the Ashclair Site from time to time. Ashclair attempts to correct all pricing errors as soon as they are
        discovered, or as soon as Ashclair receives notice of an error. Ashclair reserves the right to cancel any orders containing pricing errors,
        with no further obligations to you, even after your receipt of an order confirmation. Any payments you make to Ashclair for orders that are
        cancelled due to pricing errors will be refunded.
      </Paragraph>
      <Paragraph>
        The goods will be imported on behalf of the consignee/buyer. The consignee authorizes Ashclair to import the goods on his behalf. Further, the
        consignee/buyer agrees Ashclair may delegate the obligation to import the goods on his behalf to a subcontractor (e.g. customs broker). The
        consignee will pay the taxes & duties in addition with the purchase price of the goods.
      </Paragraph>

      <Title level={4}>Custom Orders</Title>

      <Paragraph>
        Customized and Custom Made items cannot be returned. These are orders by which the customer had modified including Upgraded Stones,
        Modifications and New Designs.
      </Paragraph>
      <Title level={4}>Layaway</Title>

      <Paragraph>
        Try our convenient layaway plan! We have an interest-free layaway plan that runs from 3-24 month from the initial date of deposit. Simply make
        a deposit on your item and we will keep your jewelry aside for you until it is paid in full. Once you have paid for your purchase in full, we
        will ship your item directly to you. The advantage of our jewelry layaway program is that if the price of a jewelry item increases over time,
        your price will still remain unchanged. It will be locked in at your original purchase price. This also affords you the flexibility of paying
        for your jewelry over time.
      </Paragraph>

      <Title level={4}>How does layaway works?</Title>
      <ul className="list-disc pl-6 text-gray-700">
        <li>
          <Paragraph>Select an item from our collection (Item must be $200 minimum)</Paragraph>
        </li>
        <li>
          <Paragraph>Select amount of months for the Layaway Plan that best suits you</Paragraph>
        </li>
        <li>
          <Paragraph>
            Full amount of item will be split in 3 to 24 months of equal amounts to be paid off in the 3-24 months depending on plan you have chosen
          </Paragraph>
        </li>
        <li>
          <Paragraph>As soon as first payment is made we will then put aside your item till it is paid in full</Paragraph>
        </li>
        <li>
          <Paragraph>
            As soon as the item is paid for in full, we will ship item to you within 7-12 business days (Expedited Shipping Additional Fee)
          </Paragraph>
        </li>
      </ul>
      <Title level={4}>Notes</Title>
      <Paragraph>
        Until item is paid in full it will remain <a href="ashclair.com">ashclair.com</a> property. In the event an item is not paid in full or
        canceled, a restocking fee of 20% of the total will be kept due to the item being made after the order is placed
      </Paragraph>
      <Paragraph>
        If you have any further questions please feel free to contact <a href="ashclair.com">ashclair.com</a> Sales Department at{' '}
        <span className="font-semibold">(213) 622-3264</span> or email at <a href="mailto:service@ashclair.com">service@ashclair.com</a>
      </Paragraph>
    </div>
  );
};

export default TermsAndConditions;
