'use client';

import React, { useEffect, useState } from 'react';

import { IoIosArrowUp } from 'react-icons/io';

const ScrollArrow: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;

      // Show button only after scrolling past 10% of the page
      if (scrollTop / docHeight > 0.1) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-[88px] right-[38px] z-[50] flex h-11 w-11 items-center justify-center border border-line bg-paper text-[22px] text-ink transition-[opacity,border-color] duration-300 ease-in-out hover:border-ink sm:bottom-[82px] sm:right-[25px] sm:h-9 sm:w-9 sm:text-[18px] ${
        isVisible ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
      }`}
      aria-label="Scroll to top"
    >
      <IoIosArrowUp />
    </button>
  );
};

export default ScrollArrow;
