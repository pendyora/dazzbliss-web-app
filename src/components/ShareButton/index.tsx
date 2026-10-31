'use client';
import React, { useEffect, useRef, useState } from 'react';

import { FiCheck, FiLink, FiShare } from 'react-icons/fi';

interface Props {
  className?: string;
  /** Link to share. Defaults to the current page URL (keeps the selected variation). */
  url?: string;
  label?: string;
}

async function copyToClipboard(value: string) {
  if (navigator?.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  // Fallback for browsers / non-https contexts without the async clipboard API.
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

export default function ShareButton({ className = '', url, label = 'Share' }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) {
        clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

  const handleCopyLink = async () => {
    try {
      await copyToClipboard(url || window.location.href);
      setCopied(true);
      if (copiedTimerRef.current) {
        clearTimeout(copiedTimerRef.current);
      }
      copiedTimerRef.current = setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 text-[#757575] cursor-pointer select-none"
      >
        <FiShare className="w-[17px] h-[17px] md:w-4 md:h-4" strokeWidth={2} />
        <span className="text-[15px] font-medium lg:text-[14px] md:text-[13px]">{label}</span>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-20 mt-2 min-w-[180px] rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            role="menuitem"
            onClick={handleCopyLink}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] text-[#757575] hover:bg-gray-50"
          >
            {copied ? <FiCheck className="w-4 h-4" /> : <FiLink className="w-4 h-4" />}
            {copied ? 'Link copied' : 'Copy Link'}
          </button>
        </div>
      )}
    </div>
  );
}
