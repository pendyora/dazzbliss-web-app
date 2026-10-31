'use client';
import { useState, useEffect } from 'react';

import { Tooltip } from 'antd';

import { Text } from '../Text';

const ProductName = ({ productName }: { productName: string }) => {
  const [maxLength, setMaxLength] = useState(100); // Default for larger screens

  useEffect(() => {
    const updateMaxLength = () => {
      if (typeof window !== 'undefined') {
        if (window?.innerWidth > 350 && window?.innerWidth < 400) {
          setMaxLength(43);
        } else if (window?.innerWidth > 400 && window?.innerWidth < 450) {
          setMaxLength(38);
        } else if (window?.innerWidth > 450 && window?.innerWidth < 500) {
          setMaxLength(45);
        } else if (window?.innerWidth > 500 && window?.innerWidth < 600) {
          setMaxLength(30);
        } else if (window?.innerWidth > 600 && window?.innerWidth < 800) {
          setMaxLength(45);
        } else if (window?.innerWidth > 800 && window?.innerWidth < 900) {
          setMaxLength(32);
        } else if (window?.innerWidth > 900 && window?.innerWidth < 1000) {
          setMaxLength(38);
        } else if (window?.innerWidth > 1000 && window?.innerWidth < 1100) {
          setMaxLength(43);
        } else if (window?.innerWidth > 1100 && window?.innerWidth < 1200) {
          setMaxLength(48);
        } else if (window?.innerWidth > 1200 && window?.innerWidth < 1300) {
          setMaxLength(53);
        } else if (window?.innerWidth > 1300 && window?.innerWidth < 1400) {
          setMaxLength(59);
        } else {
          setMaxLength(75);
        }
      }
    };

    updateMaxLength(); // Call once on mount
    if (typeof window !== 'undefined') {
      window?.addEventListener('resize', updateMaxLength); // Listen for screen size changes
      return () => window?.removeEventListener('resize', updateMaxLength); // Cleanup
    }
  }, []);

  return (
    <Text size="textlg" as="p" className="tracking-[0.7px] !text-[14px] sm:!text-[12px]">
      {productName && typeof productName === 'string' && (
        <Tooltip title={productName}>{productName.length > maxLength ? productName.substring(0, maxLength) + '...' : productName}</Tooltip>
      )}
    </Text>
  );
};

export default ProductName;
