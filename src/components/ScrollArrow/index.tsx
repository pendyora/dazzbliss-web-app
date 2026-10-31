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
      className={`fixed right-[38px] sm:right-[25px] sm:w-9 sm:h-9 bottom-[88px] sm:bottom-[82px] z-[50] bg-white text-black rounded-full w-12 h-12 flex items-center justify-center shadow-md text-3xl transition-opacity duration-300 ease-in-out ${
        isVisible ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
      }`}
      aria-label="Scroll to top"
    >
      <IoIosArrowUp />
    </button>
  );
};

export default ScrollArrow;
