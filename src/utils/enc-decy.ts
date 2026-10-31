/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/no-named-as-default-member */
import { Buffer } from 'buffer';
import CryptoJS from 'crypto-js';
import pako from 'pako';

const CHIPER = process.env.NEXT_PUBLIC_CHIPER;
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_TERIFF;
const CHIPER_IV = process.env.NEXT_PUBLIC_PLAN;

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export const universalBtoa = (str: any) => {
  return Buffer.from(str).toString('base64');
};
export const universalAtob = (str: any) => {
  return Buffer.from(str, 'base64').toString();
};
const generateString = (length: number) => {
  let result = ' ';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i += 1) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
export const getUrlEncodedData = (data: any) => {
  let formData: any = [];
  Object.keys(data).forEach((item) => {
    const encodedKey = encodeURIComponent(item);
    const encodedValue = encodeURIComponent(data[item]);
    formData.push(`${encodedKey}=${encodedValue}`);
  });
  formData = formData.join('&');
  return formData;
};
const bufferToBase64 = (buf: any) => {
  const binstr = Array.prototype.map.call(buf, (ch) => String.fromCharCode(ch)).join('');
  return universalBtoa(binstr);
};
const base64ToBuffer = (base64: any) => {
  const binstr = universalAtob(base64);
  const buf = new Uint8Array(binstr.length);
  Array.prototype.forEach.call(binstr, (ch, i) => {
    buf[i] = ch.charCodeAt(0);
  });
  return buf;
};
const compressData = (str: any) => {
  const utfData = new TextEncoder().encode(str);
  let compressedData: any = pako.gzip(utfData);
  compressedData = bufferToBase64(compressedData);
  return generateString(16).trim() + compressedData;
};
const decompressData = (str: any) => {
  str = str.substr(16);
  const test = base64ToBuffer(str);
  const decryptedData = pako.ungzip(test);
  const decompressed = new TextDecoder('utf-8').decode(decryptedData);
  // decryptedData = bufferToBase64(decryptedData);
  // decryptedData = atob(decryptedData);
  return decompressed;
};

export function encryptRequest(data: any) {
  const phrase = JSON.stringify(data);
  const compressedData = compressData(phrase);
  if (CHIPER && ENCRYPTION_KEY && CHIPER_IV) {
    const encrypted = CryptoJS.AES.encrypt(compressedData, CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY), {
      iv: CryptoJS.enc.Utf8.parse(CHIPER_IV),
    }).toString();
    return encrypted;
  }
  return null;
}

export function encrypt(data: any, isFormData = false) {
  const phrase = JSON.stringify(data);
  const compressedData = compressData(phrase);
  if (CHIPER && ENCRYPTION_KEY && CHIPER_IV) {
    const encrypted = CryptoJS.AES.encrypt(compressedData, CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY), {
      iv: CryptoJS.enc.Utf8.parse(CHIPER_IV),
    }).toString();
    return isFormData ? encrypted : getUrlEncodedData({ data: encrypted });
  }
  return null;
}
export function encryptFile(data: any, isFormData = false) {
  const phrase = JSON.stringify(data);
  const compressedData = compressData(phrase);
  if (CHIPER && ENCRYPTION_KEY && CHIPER_IV) {
    const encrypted = CryptoJS.AES.encrypt(compressedData, CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY), {
      iv: CryptoJS.enc.Utf8.parse(CHIPER_IV),
    }).toString();
    return encrypted;
  }
  return null;
}

export function decrypt(data: any) {
  if (CHIPER && ENCRYPTION_KEY && CHIPER_IV) {
    const decrypted = CryptoJS.AES.decrypt(data, CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY), {
      iv: CryptoJS.enc.Utf8.parse(CHIPER_IV),
    });
    const deCpmoressed = decompressData(decrypted.toString(CryptoJS.enc.Utf8));
    if (deCpmoressed === '') {
      return null;
    }
    return JSON.parse(deCpmoressed);
  }
  return null;
}

export function decryptData(data: any) {
  if (CHIPER && ENCRYPTION_KEY && CHIPER_IV) {
    const decrypted = CryptoJS.AES.decrypt(data, CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY), {
      iv: CryptoJS.enc.Utf8.parse(CHIPER_IV),
    });
    const deCpmoressed = decompressData(decrypted.toString(CryptoJS.enc.Utf8));
    if (deCpmoressed === '') {
      return null;
    }
    return JSON.parse(deCpmoressed);
  }
  return null;
}
