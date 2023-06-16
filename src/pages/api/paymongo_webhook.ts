import { NextApiRequest, NextApiResponse } from 'next';
import { PayMongoWebHookResponse } from '@/utils/types';
import { PaymentEventsHandler } from '@/server/handlers/payment_events.handler';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('==========PAYMONGO WEBHOOK API INVOKED========');

  const response = (req.body as PayMongoWebHookResponse) ?? '{}';

  const eventType = response.data?.attributes?.type;

  const paymentIntentId = response.data?.attributes?.data?.attributes?.payment_intent_id;

  if (eventType === 'payment.paid') {
    // update booking
    if (!!response.data.attributes.data.attributes.metadata.bookingUpdateParams) {
      await PaymentEventsHandler.handleUpdateBookingPayment(paymentIntentId, response.data.attributes.data.attributes.amount);
      return res.end();
    }

    // create booking
    const paymentType = response.data?.attributes?.data?.attributes?.source.type;
    await PaymentEventsHandler.handlePaymentPaidEvent(paymentIntentId, paymentType);
  }

  if (eventType === 'payment.refunded')
    await PaymentEventsHandler.handleRefundPaymentEvent(paymentIntentId, response.data?.attributes.data.attributes.refunds[0].id);

  res.end();
}
