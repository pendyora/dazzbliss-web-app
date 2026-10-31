'use client';
import React from 'react';

import { Button, Collapse, Result, Typography } from 'antd';
import { useRouter } from 'next/navigation';

import { Text } from '@/components';

const { Panel } = Collapse;

const { Title } = Typography;

const Faqs = ({ content, variant }: any) => {
  const route = useRouter();

  // PDP variant: contained, card-styled accordion used on the product page.
  if (variant === 'pdp') {
    if (!content || content.length === 0) {
      return null;
    }
    return (
      <div className="w-full">
        <div className="container-xs flex flex-col items-center 2xl:px-[160px] xl:px-28 lg:px-20 md:px-5 sm:px-3">
          <Text size="text5xl" as="p" className="uppercase text-center tracking-[2.20px] mb-10 sm:mb-6">
            Frequently Asked Questions
          </Text>

          <div className="w-full max-w-[860px]">
            <Collapse accordion bordered={false} expandIconPosition="end" className="faq-collapse !bg-transparent">
              {content.map((ele: any, index: number) => (
                <Panel
                  header={<span className="text-[16px] sm:text-[14px] font-medium !text-[#1d1d1d] !font-sans pr-3">{ele.question}</span>}
                  className="!mb-3 !rounded-xl !border !border-solid !border-[#e6e6e6] !bg-white overflow-hidden transition-shadow duration-300 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
                  key={index}
                >
                  <div
                    className="ql-editor faq-answer !p-0 text-[14px] sm:text-[13px] leading-7 !font-light !text-[#5f5f5f] text-justify"
                    dangerouslySetInnerHTML={{ __html: ele?.answer }}
                  />
                </Panel>
              ))}
            </Collapse>
          </div>
        </div>
      </div>
    );
  }

  // Default: standalone /faqs page (unchanged).
  return (
    <div className="w-full">
      <Title level={2} className="w-full" style={{ textAlign: 'center' }}>
        Frequently Asked Questions
      </Title>
      <div className=" w-full flex flex-col justify-center items-center gap-20  py-10 sm:py-2 border-solid border-[#3b3b3b] 2xl:gap-16 xl:gap-12 lg:gap-8 md:gap-[60px] sm:gap-5 md:px-10 sm:px-5 lg:px-20 ">
        {content && content.length > 0 ? (
          <>
            <Collapse className="w-full">
              {content.map((ele: any, index: number) => {
                return (
                  <Panel header={ele.question} className="w-full" key={index}>
                    <div className="flex sm:flex-col-reverse items-center m-auto about-us-css-setup">
                      <div className="ql-editor" dangerouslySetInnerHTML={{ __html: ele?.answer }} />
                    </div>
                  </Panel>
                );
              })}
            </Collapse>
          </>
        ) : (
          <>
            {' '}
            <Result
              status="404"
              title="404"
              subTitle="Sorry, the page you visited does not exist."
              extra={
                <Button
                  type="primary"
                  onClick={() => {
                    route.push('/');
                  }}
                >
                  Back Home
                </Button>
              }
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Faqs;
