/** Mirrors the backend `ORDER_REQUEST_*` constants. Website orders only. */
export const ORDER_REQUEST_TYPE = {
  CANCEL: 1,
  RETURN: 2,
} as const;

export const ORDER_REQUEST_STATUS = {
  PENDING: 1,
  APPROVED: 2,
  COMPLETED: 3,
  REJECTED: 4,
  WITHDRAWN: 5,
  RECEIVED: 7,
} as const;

export const OPEN_REQUEST_STATUSES: number[] = [ORDER_REQUEST_STATUS.PENDING, ORDER_REQUEST_STATUS.APPROVED, ORDER_REQUEST_STATUS.RECEIVED];

export const REQUEST_TYPE_LABEL: Record<number, string> = {
  [ORDER_REQUEST_TYPE.CANCEL]: 'Cancellation',
  [ORDER_REQUEST_TYPE.RETURN]: 'Return',
};

/** Customer-facing wording and colour for each status. */
export const REQUEST_STATUS_META: Record<number, { label: string; className: string }> = {
  [ORDER_REQUEST_STATUS.PENDING]: { label: 'Under Review', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  [ORDER_REQUEST_STATUS.APPROVED]: { label: 'Approved · Ship Your Item', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  [ORDER_REQUEST_STATUS.RECEIVED]: { label: 'Received · Inspecting', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  [ORDER_REQUEST_STATUS.COMPLETED]: { label: 'Refunded', className: 'bg-green-50 text-green-700 border-green-200' },
  [ORDER_REQUEST_STATUS.REJECTED]: { label: 'Declined', className: 'bg-red-50 text-red-700 border-red-200' },
  [ORDER_REQUEST_STATUS.WITHDRAWN]: { label: 'Withdrawn', className: 'bg-gray-50 text-gray-600 border-gray-200' },
};

/** Short, retailer-style reason lists. The backend accepts exactly these strings. */
export const CANCEL_REASONS = [
  'Ordered by mistake',
  'Want to change size, metal or stone',
  'Found a better price elsewhere',
  'Delivery will take too long',
  'Need to change address',
  'Other',
];

export const RETURN_REASONS = [
  "Doesn't fit (size or length)",
  'Looks different from the photos',
  'Quality not as expected',
  'Arrived damaged or defective',
  'Received the wrong item',
  'Changed my mind',
  'Other',
];

export const RETURN_CARRIERS = ['FedEx', 'UPS', 'USPS', 'DHL', 'Other'];

export const RETURN_ADDRESS = 'Ashclair, 1142 S Diamond Bar Blvd, Unit 503, Diamond Bar, CA 91765, United States';

export const SUPPORT = { phone: '(213) 622-3264', email: 'service@ashclair.com' };

/** Refunds are made in USD, whatever currency the storefront is showing. */
export const formatUsd = (value: any) => `$${Number(value || 0).toFixed(2)}`;

/** `field` is the request timestamp that dates the step. */
type TimelineStep = { key: string; title: string; field: string };

/** The steps a request moves through, in order, for the progress tracker. */
export const timelineSteps = (type: number): TimelineStep[] =>
  type === ORDER_REQUEST_TYPE.CANCEL
    ? [
        { key: 'submitted', title: 'Submitted', field: 'createdAt' },
        { key: 'review', title: 'Reviewed', field: 'approved_at' },
        { key: 'refunded', title: 'Refunded', field: 'completed_at' },
      ]
    : [
        { key: 'submitted', title: 'Submitted', field: 'createdAt' },
        { key: 'approved', title: 'Approved', field: 'approved_at' },
        { key: 'received', title: 'Received', field: 'received_at' },
        { key: 'refunded', title: 'Refunded', field: 'completed_at' },
      ];

/** How far along the tracker a status is (index of the last finished step). */
export const timelineIndex = (type: number, status: number) => {
  if (type === ORDER_REQUEST_TYPE.CANCEL) {
    return status === ORDER_REQUEST_STATUS.COMPLETED ? 2 : 0;
  }
  return (
    {
      [ORDER_REQUEST_STATUS.PENDING]: 0,
      [ORDER_REQUEST_STATUS.APPROVED]: 1,
      [ORDER_REQUEST_STATUS.RECEIVED]: 2,
      [ORDER_REQUEST_STATUS.COMPLETED]: 3,
    }[status] ?? 0
  );
};
