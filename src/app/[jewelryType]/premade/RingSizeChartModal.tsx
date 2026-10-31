'use client';

import React, { useEffect, useState } from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Modal } from 'antd';

import { RING_SIZE_CHART_COLUMNS, RING_SIZE_CHART_ROWS } from '@/constants/ringSizeChart';

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
          borderRadius: isMobile ? 0 : undefined,
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
      <div className="!font-sans flex min-h-0 flex-1 flex-col">
        {/* Sticky title bar */}
        <div className="flex items-center justify-between gap-4 border-b border-[#ececec] px-5 py-4 sm:px-8 sm:py-5">
          <span className="!font-light text-[17px] sm:text-[20px] tracking-wide text-[#1a1a1a]">Ring Size Chart</span>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d9d9d9] text-[#555] transition-colors hover:border-[#1a1a1a] hover:text-[#1a1a1a]"
          >
            <CloseOutlined className="text-[13px]" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
          {/* Intro */}
          <h2 className="!font-light text-[26px] sm:text-[34px] leading-tight text-[#1a1a1a]">Ring Size Conversion Chart</h2>
          <p className="mt-3 max-w-[720px] text-[14px] sm:text-[15px] leading-relaxed text-[#6b6b6b]">
            Determining your ring size can be tricky without the proper tools. Use our{' '}
            <span className="font-semibold text-[#1a1a1a]">Ring Size Conversion</span> chart below to find your ring size in different countries.
          </p>

          {/* Table */}
          <div className="mt-7 w-full overflow-x-auto rounded-xl border border-[#ececec] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <table className="w-full min-w-[520px] table-fixed border-collapse text-left text-[13px] sm:text-[14px]">
              <thead>
                <tr>
                  {RING_SIZE_CHART_COLUMNS.map((col, colIndex) => (
                    <th
                      key={col}
                      className={`sticky top-0 z-20 bg-[#f4f2ec] px-2 py-3 align-bottom text-[10px] sm:text-[11px] font-semibold uppercase leading-snug tracking-[0.02em] text-[#3a3a3a] ${
                        colIndex === 0 ? 'w-[22%] border-r border-[#e3e0d8]' : ''
                      }`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RING_SIZE_CHART_ROWS.map((row, rowIndex) => (
                  <tr key={rowIndex} className={`group transition-colors ${rowIndex % 2 === 1 ? 'bg-[#faf9f7]' : 'bg-white'} hover:!bg-[#f4f2ec]`}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className={`whitespace-nowrap border-t border-[#f0efec] px-2 py-3 sm:px-3 ${
                          cellIndex === 0 ? 'border-r border-[#eeece5] font-medium text-[#1a1a1a]' : 'text-[#4a4a4a]'
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
  );
};

export default RingSizeChartModal;
