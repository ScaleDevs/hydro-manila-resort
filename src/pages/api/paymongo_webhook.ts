import { NextApiRequest, NextApiResponse } from 'next';
import { PayMongoWebHookResponse } from '@/utils/types';
import { PaymentService } from '@/server/services/payment.service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('==========PAYMONGO WEBHOOK API INVOKED========');

  const response = (req.body as PayMongoWebHookResponse) ?? '{}';

  const eventType = response.data?.attributes?.type;

  const paymentIntentId = response.data?.attributes?.data?.attributes?.payment_intent_id;

  if (eventType === 'payment.paid') await PaymentService.handlePaymentPaidEvent(paymentIntentId);

  if (eventType === 'payment.refunded')
    await PaymentService.handleRefundPaymentEvent(paymentIntentId, response.data?.attributes.data.attributes.refunds[0].id);

  res.end();
}
