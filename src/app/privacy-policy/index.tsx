'use client';
import React from 'react';

import { CARE } from '@/components/ClientCare/careInfo';
import CareLayout from '@/components/ClientCare/CareLayout';
import PolicyDoc, { PolicySection } from '@/components/ClientCare/PolicyDoc';

const mail = <a href={`mailto:${CARE.email}`}>{CARE.email}</a>;

const SECTIONS: PolicySection[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    body: (
      <p>
        Welcome to Pendyora, an online retailer of fine diamond jewelry. This policy explains the information we collect, and how we use and protect
        it. By visiting our site you agree to this Privacy Policy. If you do not agree, please do not use the site.
      </p>
    ),
  },
  {
    id: 'your-information',
    title: 'What we do with your information',
    body: (
      <>
        <p>
          When you buy from us, we collect the personal information you give us as part of the order, such as your name, address and email address.{' '}
          <strong>We do not save your card details</strong>, as a safety measure against fraud.
        </p>
        <p>
          When you browse our store, we also automatically receive your computer&apos;s internet protocol (IP) address, which tells us about your
          browser and operating system.
        </p>
        <p>With your permission, we email you about your orders, their ship dates and when they have shipped.</p>
      </>
    ),
  },
  {
    id: 'consent',
    title: 'Consent',
    body: (
      <>
        <h3>How do you get my consent?</h3>
        <p>
          When you give us personal information to complete a transaction, verify your card, place an order, arrange a delivery or return a purchase,
          you consent to us collecting and using it for that specific reason only.
        </p>
        <h3>How can I withdraw my consent?</h3>
        <p>
          If you change your mind after opting in, you can withdraw your consent for us to contact you, or to keep collecting, using or disclosing
          your information, at any time by emailing {mail}.
        </p>
      </>
    ),
  },
  {
    id: 'disclosure',
    title: 'Disclosure',
    body: <p>We may disclose your personal information if we are required by law to do so, or if you violate our Terms of Service.</p>,
  },
  {
    id: 'third-party',
    title: 'Third-party services',
    body: (
      <>
        <p>
          Our third-party providers only collect, use and disclose your information as far as they need to perform the services they provide to us.
        </p>
        <p>
          Some providers may be located in, or have facilities in, a different jurisdiction from you or us. If you go ahead with a transaction that
          uses one of them, your information may become subject to the laws of that jurisdiction. For example, if you are in Canada and your payment
          is processed by a gateway in the United States, your information may be subject to disclosure under United States law, including the Patriot
          Act.
        </p>
        <p>
          Once you leave our website or are redirected to a third-party website or app, you are no longer covered by this Privacy Policy or our Terms
          of Service.
        </p>
      </>
    ),
  },
  {
    id: 'security',
    title: 'Security',
    body: (
      <p>
        To protect your personal information, we take reasonable precautions and follow industry best practice to make sure it is not inappropriately
        misused, accessed, disclosed, altered or destroyed.
      </p>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies',
    body: (
      <p>
        A cookie is a small piece of information a website stores on your computer, which your browser sends back each time you return. We use cookies
        to identify and track visitors, usage patterns and preferences. You can set your browser to refuse cookies, but some features of the site may
        not work properly without them.
      </p>
    ),
  },
  {
    id: 'age-of-consent',
    title: 'Age of consent',
    body: (
      <p>
        By using this site, you confirm that you are at least the age of majority in your state or province of residence, or that you are the age of
        majority and have given us your consent to allow any of your minor dependents to use this site.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: (
      <p>
        We may change this privacy policy at any time, so please review it regularly. Changes take effect as soon as they are posted on the website.
        If we make material changes, we will say so here, so you know what information we collect, how we use it, and when, if ever, we use or
        disclose it.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Questions & contact',
    body: <p>If you have any questions about this policy, please contact us at {mail}.</p>,
  },
];

export default function PrivacyPolicy() {
  return (
    <CareLayout
      title="Privacy policy"
      crumb="Privacy"
      intro="What we collect, why we collect it, and the choices you have. We never store your card details."
    >
      <PolicyDoc sections={SECTIONS} help={{ title: 'Privacy questions?', text: 'Email our team and we will help.' }} />
    </CareLayout>
  );
}
