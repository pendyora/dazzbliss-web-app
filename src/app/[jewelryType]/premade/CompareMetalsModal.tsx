'use client';

import React, { useEffect, useState } from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { ConfigProvider, Drawer, Modal } from 'antd';

import { pdpTheme } from './pdp/pdpTheme';

interface CompareMetalsModalProps {
  open: boolean;
  onClose: () => void;
}

const COMPARE_METALS_COLUMNS = [
  { title: 'Metal', width: '21%' },
  { title: 'Gold Content', width: '22%' },
  { title: 'Plated?', width: '17%' },
  { title: 'Color Over Time', width: '26%' },
  { title: 'Stamp', width: '14%' },
];

const COMPARE_METALS_ROWS = [
  { cells: ['Sterling Silver', 'None (92.5% silver)', 'Yes, rhodium', 'Plating can wear; can be re-plated', '925'], solidGold: false },
  { cells: ['10K Solid Gold', '41.7% gold', 'No', 'Never wears off', '10K'], solidGold: true },
  { cells: ['14K Solid Gold', '58.3% gold', 'No', 'Never wears off', '14K'], solidGold: true },
  { cells: ['18K Solid Gold', '75.0% gold', 'No', 'Never wears off', '18K'], solidGold: true },
];

const CompareMetalsModal: React.FC<CompareMetalsModalProps> = ({ open, onClose }) => {
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

  const content = (
    <div className="px-9 py-8 font-libre sm:px-4 sm:pb-6 sm:pt-5">
      <div className="flex items-start justify-between gap-4 border-b border-line pb-5 sm:pb-4">
        <div>
          <span className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-gilt">Metal guide</span>
          <h2 className="m-0 mt-2 font-cormorant text-[clamp(28px,3vw,38px)] font-medium leading-none text-ink">
            Compare <em className="text-gilt">metals</em>
          </h2>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center border border-line bg-paper text-ink transition-colors hover:border-ink"
        >
          <CloseOutlined className="text-[13px]" />
        </button>
      </div>

      {/* The table is fixed-layout so all five columns fit the sheet width on mobile without sideways scroll. */}
      <table className="mt-5 w-full table-fixed border-collapse text-left text-[14px] sm:mt-3 sm:text-[12px] sm:leading-snug">
        <thead>
          <tr>
            {COMPARE_METALS_COLUMNS.map((col) => (
              <th
                key={col.title}
                style={{ width: col.width }}
                className="border-b border-ink px-2 py-3 align-bottom text-[10.5px] font-medium uppercase tracking-[0.16em] text-ink-soft sm:px-1 sm:py-2 sm:text-[9px] sm:tracking-[0.04em]"
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARE_METALS_ROWS.map((row) => (
            <tr key={row.cells[0]} className={row.solidGold ? 'bg-mist' : 'bg-paper'}>
              {row.cells.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={`border-b border-line px-2 py-4 sm:px-1 sm:py-3 ${cellIndex === 0 ? 'font-medium text-ink' : 'text-ink-soft'}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="m-0 mt-5 text-[14px] leading-[1.65] text-ink-soft sm:mt-4 sm:text-[13px]">
        <span className="font-medium text-ink">What does karat mean?</span> Karat is parts of pure gold out of 24. 10K means 10 of 24 parts are gold.
        Every solid gold piece is stamped with its karat inside the band.
      </p>
    </div>
  );

  // Mobile: a bottom sheet flush with the left, right and bottom edges. Desktop: a centered modal.
  if (isMobile) {
    return (
      <ConfigProvider theme={pdpTheme}>
        <Drawer
          placement="bottom"
          open={open}
          onClose={onClose}
          closable={false}
          title={null}
          height="auto"
          destroyOnClose
          maskClosable
          zIndex={10050}
          styles={{
            content: { borderRadius: 0, overflow: 'hidden' },
            body: { padding: 0, maxHeight: '88dvh', overflowY: 'auto', paddingBottom: 'env(safe-area-inset-bottom)' },
          }}
        >
          {content}
        </Drawer>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider theme={pdpTheme}>
      <Modal
        centered
        open={open}
        onCancel={onClose}
        footer={null}
        title={null}
        closeIcon={null}
        destroyOnClose
        maskClosable
        zIndex={10050}
        width={760}
        rootClassName="custom-modal"
        style={{ maxWidth: 'calc(100vw - 32px)' }}
        styles={{ content: { padding: 0, borderRadius: 0, boxShadow: 'none', overflow: 'hidden' } }}
      >
        {content}
      </Modal>
    </ConfigProvider>
  );
};

export default CompareMetalsModal;
