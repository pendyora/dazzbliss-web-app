'use client';
import React from 'react';

import { Typography, Divider } from 'antd';

const { Title, Paragraph } = Typography;

const PrivacyPolicy = () => {
  return (
    <div className="max-w-7xl my-5 mx-auto p-6 bg-white shadow-md rounded-lg">
      <Title level={2} className="text-center mb-6">
        Privacy Policy
      </Title>

      <div className="mb-6">
        <Title level={3}>Introduction</Title>

        <Paragraph>
          Welcome to <span className="font-semibold">Ashclair</span>. We are an online retailer and wholesaler of diamond jewelry. Choosing an
          engagement ring doesn't have to be complicated. Diamonds can be simple to understand. Making the right choice can be easy, whether you're in
          search of something classic, contemporary. <span className="font-semibold">Ashclair</span> is your source of beautifully designed jewelry
          for every occasion. This Privacy Policy will inform you as to the information we gather, as well as how we use and protect it. By visiting
          our site you are agreeing with our Privacy Policy. If you do not agree, please do not access the site.
        </Paragraph>
      </div>
      <Divider />

      <div className="mb-6">
        <Title level={3}>1. What We Do with Your Information?</Title>
        <Paragraph>
          When you purchase something from our store, as part of the buying and selling process, we collect the personal information you give us such
          as your name, address and email address. We do not save any of your card info as a safety measure against fraud.
        </Paragraph>
        <Paragraph>
          When you browse our store, we also automatically receive your computer's internet protocol (IP) address in order to provide us with
          information that helps us learn about your browser and operating system.
        </Paragraph>
        <Paragraph>Email: With your permission, we will send you emails about your orders and ship dates and once it has been shipped.</Paragraph>
      </div>
      <Divider />

      {/* Section 2: Consent */}
      <div className="mb-6">
        <Title level={3}>2. Consent</Title>
        <Paragraph>
          <strong>How do you get my consent?</strong>
          <br />
          When you provide us with personal information to complete a transaction, verify your credit card, place an order, arrange for a delivery or
          return a purchase, we imply that you consent to our collecting it and using it for that specific reason only.
        </Paragraph>
        <Paragraph>
          <strong>How can I withdraw my consent?</strong>
          <br />
          If after you opt-in, you change your mind, you may withdraw your consent for us to contact you, for the continued collection, use or
          disclosure of your information, at anytime, by contacting us at
          <a href="mailto:service@ashclair.com" className="text-blue-500">
            service@ashclair.com
          </a>
        </Paragraph>
      </div>
      <Divider />

      {/* Section 3: Disclosure */}
      <div className="mb-6">
        <Title level={3}>3. Disclosure</Title>
        <Paragraph>We may disclose your personal information if we are required by law to do so or if you violate our Terms of Service.</Paragraph>
      </div>
      <Divider />

      {/* Section 4: Third-Party Services */}
      <div className="mb-6">
        <Title level={3}>4. Third-Party Services</Title>

        <Paragraph>
          The third-party providers used by us will only collect, use and disclose your information to the extent necessary to allow them to perform
          the services they provide to us.
        </Paragraph>
        <Paragraph>
          In particular, remember that certain providers may be located in or have facilities that are located a different jurisdiction than either
          you or us. So if you elect to proceed with a transaction that involves the services of a third-party service provider, then your information
          may become subject to the laws of the jurisdiction.
        </Paragraph>
        <Paragraph>
          As an example, if you are located in Canada and your transaction is processed by a payment gateway located in the United States, your
          personal information used in completing the transaction may be subject to disclosure under United States legislation, including the Patriot
          Act.
        </Paragraph>
        <Paragraph>
          Once you leave our store's website or are redirected to a third-party website or application, you are no longer governed by this Privacy
          Policy or our website's Terms of Service.
        </Paragraph>
      </div>
      <Divider />

      {/* Section 5: Security */}
      <div className="mb-6">
        <Title level={3}>5. Security</Title>
        <Paragraph>
          To protect your personal information, we take reasonable precautions and follow industry best practices to make sure it is not
          inappropriately misused, accessed, disclosed, altered or destroyed.
        </Paragraph>
      </div>
      <Divider />

      {/* Section 6: Cookies */}
      <div className="mb-6">
        <Title level={3}>6. Cookies</Title>
        <Paragraph>
          A cookie is a string of information that a website stores on a user's computer, and that the user's browser provides to the website each
          time the user returns. The Site uses cookies to help identify and track users, patterns of usage and access preferences. If you do not want
          to have cookies placed on your computer you can set your browser to refuse cookies before using the Site, with a drawback that certain
          features of the Site may not function properly without the aid of cookies.
        </Paragraph>
      </div>
      <Divider />

      {/* Section 7: Age of Consent */}
      <div className="mb-6">
        <Title level={3}>7. Age of Consent</Title>

        <Paragraph>
          By using this site, you represent that you are at least the age of majority in your state or province of residence, or that you are the age
          of majority in your state or province of residence and you have given us your consent to allow any of your minor dependents to use this
          site.
        </Paragraph>
      </div>
      <Divider />

      {/* Section 8: Changes to the Policy */}
      <div className="mb-6">
        <Title level={3}>8. Changes to the Privacy Policy</Title>

        <Paragraph>
          We reserve the right to modify this privacy policy at any time, so please review it frequently. Changes and clarifications will take effect
          immediately upon their posting on the website. If we make material changes to this policy, we will notify you here that it has been updated,
          so that you are aware of what information we collect, how we use it, and under what circumstances, if any, we use and/or disclose it.
        </Paragraph>
      </div>
      <Divider />

      {/* Contact Information */}
      <div className="mb-6">
        <Title level={3}>Questions & Contact Information</Title>

        <Paragraph>
          If you have any questions about this policy, please contact us at:{' '}
          <a href="mailto:service@ashclair.com" className="text-blue-500">
            service@ashclair.com
          </a>
        </Paragraph>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
