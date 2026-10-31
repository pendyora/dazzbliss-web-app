'use client';

import React, { useEffect, useState } from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Drawer, Modal } from 'antd';

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
    <div className="!font-sans px-8 py-8 sm:px-4 sm:pt-5 sm:pb-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="!font-castoro text-[32px] sm:text-[24px] leading-tight text-[#1a1a1a]">Compare metals</h2>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center text-[#1a1a1a] hover:opacity-70 cursor-pointer"
        >
          <CloseOutlined className="text-[18px]" />
        </button>
      </div>

      {/* The table is fixed-layout so all five columns fit the sheet width on mobile without sideways scroll. */}
      <table className="mt-5 sm:mt-3 w-full table-fixed border-collapse text-left text-[16px] sm:text-[12px] sm:leading-snug">
        <thead>
          <tr>
            {COMPARE_METALS_COLUMNS.map((col) => (
              <th
                key={col.title}
                style={{ width: col.width }}
                className="border-b border-[#1a1a1a] px-2 sm:px-1 py-3 sm:py-2 align-bottom text-[12px] sm:text-[9px] font-semibold uppercase tracking-[0.12em] sm:tracking-[0.04em] text-[#555]"
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARE_METALS_ROWS.map((row) => (
            <tr key={row.cells[0]} className={row.solidGold ? 'bg-[#f8f6ea]' : 'bg-white'}>
              {row.cells.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={`border-b border-[#e3e0d8] px-2 sm:px-1 py-5 sm:py-3 text-[#1a1a1a] ${cellIndex === 0 ? 'font-semibold' : ''}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-5 sm:mt-4 text-[15px] sm:text-[13px] leading-relaxed text-[#3a3a3a]">
        <span className="font-semibold text-[#1a1a1a]">What does karat mean?</span> Karat is parts of pure gold out of 24. 10K means 10 of 24 parts
        are gold. Every solid gold piece is stamped with its karat inside the band.
      </p>
    </div>
  );

  // Mobile: a bottom sheet flush with the left, right and bottom edges. Desktop: a centered modal.
  if (isMobile) {
    return (
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
          content: { borderRadius: '16px 16px 0 0', overflow: 'hidden' },
          body: { padding: 0, maxHeight: '88dvh', overflowY: 'auto', paddingBottom: 'env(safe-area-inset-bottom)' },
        }}
      >
        {content}
      </Drawer>
    );
  }

  return (
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
      styles={{ content: { padding: 0, borderRadius: 14, overflow: 'hidden' } }}
    >
      {content}
    </Modal>
  );
};

export default CompareMetalsModal;
