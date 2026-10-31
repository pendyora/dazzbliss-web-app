'use client';
import { useEffect, useRef, useState } from 'react';

import { useAppSelector } from '@/store';
function IframeBlock() {
  const { iframeSrc } = useAppSelector((s) => s.products);
  // const [currentSrc, setCurrentSrc] = useState<string>('');
  // const prevSrcRef = useRef<string | null>(iframeSrc);

  // useEffect(() => {
  //   // Only update if the new src is different from the previous one
  //   if (iframeSrc && iframeSrc !== prevSrcRef.current) {
  //     console.log('Source changed from:', prevSrcRef.current, 'to:', iframeSrc);
  //     setCurrentSrc(iframeSrc);
  //     prevSrcRef.current = iframeSrc;
  //   }
  // }, [iframeSrc]);
  return (
    <>
      <iframe
        title="scene"
        frameBorder="0"
        allowFullScreen={true}
        allow="autoplay; fullscreen; xr-spatial-tracking; web-share"
        className="w-full border-none"
        style={{
          aspectRatio: '1 / 1',
        }}
        // src={iframeSrc ?? ''}
        src={iframeSrc ?? ''}
        // src="https://d2xnejqesyh20p.cloudfront.net/product_images/11105/CV11105/Y-1.jpg"
      />
    </>
  );
}

export default IframeBlock;
