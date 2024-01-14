import { NextApiRequest, NextApiResponse } from 'next';
import { expiredBookingHandler } from '@/server/handlers/booking.handler';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('/api/fail_booking :: invoked');

  const response = (req.query ?? {}) as {
    ref_no?: string;
    sched_name?: string;
  };

  console.log('response params', response);

  if (response?.ref_no && response?.sched_name) expiredBookingHandler(response.ref_no, response.sched_name);

  return res.end();
}
