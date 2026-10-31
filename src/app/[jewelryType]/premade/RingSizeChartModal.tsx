'use client';

import React, { useEffect, useState } from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { ConfigProvider, Modal } from 'antd';

import { RING_SIZE_CHART_COLUMNS, RING_SIZE_CHART_ROWS } from '@/constants/ringSizeChart';

import { pdpTheme } from './pdp/pdpTheme';

interface RingSizeChartModalProps {
  open: boolean;
  onClose: () => void;
}

const RingSizeChartModal: React.FC<RingSizeChartModalProps> = ({ open, onClose }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const checkViewport = () => setIsMobile(window.innerWidth < 640);
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  return (
    <ConfigProvider theme={pdpTheme}>
      <Modal
        centered={!isMobile}
        open={open}
        onCancel={onClose}
        footer={null}
        title={null}
        closeIcon={null}
        destroyOnClose
        maskClosable
        zIndex={10050}
        width={isMobile ? '100vw' : 620}
        rootClassName="ring-size-chart-modal"
        style={isMobile ? { top: 0, maxWidth: '100vw', margin: 0, paddingBottom: 0 } : { maxWidth: 'calc(100vw - 32px)' }}
        styles={{
          content: {
            margin: isMobile ? 0 : '0 auto',
            padding: 0,
            borderRadius: 0,
            boxShadow: 'none',
            minHeight: isMobile ? '100dvh' : undefined,
            overflow: 'hidden',
          },
          body: {
            maxHeight: isMobile ? '100dvh' : 'min(82dvh, calc(100vh - 96px))',
            minHeight: isMobile ? '100dvh' : undefined,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col font-libre">
          {/* Sticky title bar */}
          <div className="flex items-center justify-between gap-4 border-b border-line px-8 py-5 sm:px-5 sm:py-4">
            <span className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-gilt">Ring size chart</span>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center border border-line bg-paper text-ink transition-colors hover:border-ink"
            >
              <CloseOutlined className="text-[13px]" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="min-h-0 flex-1 overflow-y-auto px-8 py-8 sm:px-5 sm:py-6">
            {/* Intro */}
            <h2 className="m-0 font-cormorant text-[clamp(28px,3vw,38px)] font-medium leading-none text-ink">
              Ring size <em className="text-gilt">conversion</em>
            </h2>
            <p className="m-0 mt-3 max-w-[720px] text-[14px] leading-[1.65] text-ink-soft">
              Determining your ring size can be tricky without the proper tools. Use our{' '}
              <span className="font-medium text-ink">Ring Size Conversion</span> chart below to find your ring size in different countries.
            </p>

            {/* Table */}
            <div className="mt-7 w-full overflow-x-auto border border-line">
              <table className="w-full min-w-[520px] table-fixed border-collapse text-left text-[14px] sm:text-[13px]">
                <thead>
                  <tr>
                    {RING_SIZE_CHART_COLUMNS.map((col, colIndex) => (
                      <th
                        key={col}
                        className={`sticky top-0 z-20 border-b border-ink bg-paper px-2 py-3 align-bottom text-[10.5px] font-medium uppercase leading-snug tracking-[0.14em] text-ink-soft sm:text-[10px] sm:tracking-[0.06em] ${
                          colIndex === 0 ? 'w-[22%] border-r border-r-line' : ''
                        }`}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RING_SIZE_CHART_ROWS.map((row, rowIndex) => (
                    <tr key={rowIndex} className={`group transition-colors ${rowIndex % 2 === 1 ? 'bg-haze' : 'bg-paper'} hover:!bg-mist`}>
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className={`whitespace-nowrap border-t border-line px-3 py-3 tabular-nums sm:px-2 ${
                            cellIndex === 0 ? 'border-r font-medium text-ink' : 'text-ink-soft'
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>
    </ConfigProvider>
  );
};

export default RingSizeChartModal;
