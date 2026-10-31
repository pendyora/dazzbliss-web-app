'use client';
import { useCallback, useEffect, useState } from 'react';

import { apiGetOrders } from '@/services/orderService';

/**
 * Eligibility of one order for a cancel / return request, read from the order detail API
 * (`request_eligibility`). Comes back unsupported for non-website orders.
 */
export default function useOrderRequests(orderNumber?: string) {
  const [eligibility, setEligibility] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!orderNumber) {
      return;
    }
    setLoading(true);
    try {
      const res = await apiGetOrders(orderNumber);
      setEligibility(res?.data?.data?.request_eligibility ?? null);
    } catch {
      setEligibility(null);
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    load();
  }, [load]);

  return { eligibility, loading };
}
