import { NextApiRequest, NextApiResponse } from 'next';
import { PayMongoWebHookResponse } from '@/utils/types';
import { PaymentEventsHandler } from '@/server/handlers/payment_events.handler';
import { constants } from '@/server/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('/api/paymongo_webhook :: invoked');

  const response = (req.body as PayMongoWebHookResponse) ?? '{}';

  const eventType = response.data?.attributes?.type;

  const paymentIntentId = response.data?.attributes?.data?.attributes?.payment_intent_id;

  const targetApplication = response.data.attributes.data.attributes.metadata?.application;

  console.log('/api/paymongo_webhook :: targetApplication', targetApplication);
  console.log('/api/paymongo_webhook :: eventType', eventType);

  if (eventType === 'payment.failed') {
    console.log('/api/paymongo_webhook :: failed payment');
    await PaymentEventsHandler.handleFailedBooking(paymentIntentId);
  } else if (targetApplication === constants.general.appName) {
    console.log('/api/paymongo_webhook :: target application matches');

    if (eventType === 'payment.paid') {
      if (!!response.data.attributes.data.attributes.metadata.bookingUpdateParams) {
        await PaymentEventsHandler.handleUpdateBookingPayment(paymentIntentId, response.data.attributes.data.attributes.amount);
        return res.end();
      }

      console.log('/api/paymongo_webhook :: Inserting Booking ...');
      await PaymentEventsHandler.handlePaymentPaidEvent(paymentIntentId);
    }

    if (eventType === 'payment.refunded')
      await PaymentEventsHandler.handleRefundPaymentEvent(
        paymentIntentId,
        response.data?.attributes.data.attributes.refunds[0].id,
      );
  } else console.log('/api/paymongo_webhook :: target application does not match. ignoring request ...');

  return res.end();
}
