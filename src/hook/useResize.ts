import { useCallback, useEffect, useState } from 'react';

export default function useIsResize() {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isTablet, setIsTablet] = useState<boolean>(false);

  const handleResize = useCallback(() => {
    setIsMobile(window.innerWidth < 600);
    setIsTablet(window.innerWidth < 900 && window.innerWidth > 600);
  }, []);

  useEffect(() => {
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  return { isMobile, isTablet };
}
