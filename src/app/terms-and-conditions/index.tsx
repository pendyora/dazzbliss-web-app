'use client';
import React from 'react';

import CareLayout from '@/components/ClientCare/CareLayout';
import PolicyDoc, { Callout, CareContact, PolicySection, StepList } from '@/components/ClientCare/PolicyDoc';

const SECTIONS: PolicySection[] = [
  {
    id: 'using-this-site',
    title: 'Using this site',
    body: (
      <p>
        We reserve the right to update or modify these terms and conditions at any time without prior notice. Your use of the Pendyora website
        following any such change constitutes your agreement to follow and be bound by the terms and conditions as changed. For this reason, we
        encourage you to review these terms and conditions each time you use this website.
      </p>
    ),
  },
  {
    id: 'pricing-errors',
    title: 'Prices & pricing errors',
    body: (
      <>
        <p>
          Pricing errors may occur on the Pendyora site from time to time. Pendyora attempts to correct all pricing errors as soon as they are
          discovered, or as soon as we receive notice of an error.
        </p>
        <Callout>
          Pendyora reserves the right to cancel any order containing a pricing error, with no further obligation to you, even after you have received
          an order confirmation. Any payment you made for an order cancelled because of a pricing error will be refunded.
        </Callout>
      </>
    ),
  },
  {
    id: 'imports-duties',
    title: 'Imports, duties & taxes',
    body: (
      <p>
        Goods are imported on behalf of the consignee (the buyer). The consignee authorises Pendyora to import the goods on their behalf, and agrees
        that Pendyora may delegate this to a subcontractor such as a customs broker. The consignee pays taxes and duties in addition to the purchase
        price of the goods.
      </p>
    ),
  },
  {
    id: 'custom-orders',
    title: 'Custom orders',
    body: (
      <p>
        Customised and custom-made items cannot be returned. These are orders the customer has modified, including upgraded stones, modifications and
        new designs.
      </p>
    ),
  },
  {
    id: 'layaway',
    title: 'Layaway',
    body: (
      <>
        <p>
          Our interest-free layaway plan runs from <strong>3 to 24 months</strong> from the date of your deposit. Make a deposit and we keep your
          piece aside until it is paid in full, then ship it to you. If the price of the piece goes up in the meantime, your price stays locked at the
          original purchase price.
        </p>
        <h3>How layaway works</h3>
        <StepList
          steps={[
            { title: 'Choose your piece', text: 'Layaway is available on items of $200 or more.' },
            { title: 'Pick a plan', text: 'Choose between 3 and 24 months; the full amount is split into equal monthly payments.' },
            { title: 'We set it aside', text: 'As soon as your first payment is made, we put your piece aside until it is paid in full.' },
            {
              title: 'We ship it',
              text: 'Once paid in full, we ship within 7–12 business days (expedited shipping available for an additional fee).',
            },
          ]}
        />
        <h3>Good to know</h3>
        <ul>
          <li>Until it is paid in full, the piece remains the property of Pendyora.</li>
          <li>
            If a layaway is not paid in full or is cancelled, a restocking fee of 20% of the total is kept, because the piece is made after the order
            is placed.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'contact',
    title: 'Questions',
    body: (
      <p>
        Questions about these terms or layaway? <CareContact /> and our client care team will help.
      </p>
    ),
  },
];

export default function TermsAndConditions() {
  return (
    <CareLayout
      title="Terms & conditions"
      crumb="Terms"
      intro="The terms that apply when you use the Pendyora website and buy from us, including pricing, imports, custom orders and layaway."
    >
      <PolicyDoc sections={SECTIONS} help={{ title: 'Have a question?', text: 'Our client care team is happy to help.' }} />
    </CareLayout>
  );
}
