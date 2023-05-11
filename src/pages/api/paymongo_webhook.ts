import { NextApiRequest, NextApiResponse } from 'next';
import { PayMongoWebHookResponse } from '@/utils/types';
import { PaymentService } from '@/server/services/payment.service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('==========PAYMONGO WEBHOOK API INVOKED========');

  const response = (req.body as PayMongoWebHookResponse) ?? '{}';

  const eventType = response.data?.attributes?.type;

  const paymentIntentId = response.data?.attributes?.data?.attributes?.payment_intent_id;

  if (eventType === 'payment.paid') {
    // update booking
    if (!!response.data.attributes.data.attributes.metadata.bookingUpdateParams) {
      await PaymentService.handleUpdateBookingPayment(paymentIntentId, response.data.attributes.data.attributes.amount);
      return res.end();
    }

    // create booking
    const paymentType = response.data?.attributes?.data?.attributes?.source.type;
    await PaymentService.handlePaymentPaidEvent(paymentIntentId, paymentType);
  }

  if (eventType === 'payment.refunded')
    await PaymentService.handleRefundPaymentEvent(paymentIntentId, response.data?.attributes.data.attributes.refunds[0].id);

  res.end();
}
