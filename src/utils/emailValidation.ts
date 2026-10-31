import { DISPOSABLE_EMAIL_DOMAINS } from '@/constants/disposableDomains';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const isValidEmailFormat = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return EMAIL_REGEX.test(email.trim());
};

export const isDisposableDomain = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex === -1 || atIndex === trimmed.length - 1) {
    return false;
  }
  const domain = trimmed.slice(atIndex + 1);
  return DISPOSABLE_EMAIL_DOMAINS.includes(domain);
};
