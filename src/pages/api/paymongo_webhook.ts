import { NextApiRequest, NextApiResponse } from 'next';
import { PayMongoWebHookResponse } from '@/utils/types';
import { PaymentEventsHandler } from '@/server/handlers/payment_events.handler';
import { constants } from '@/server/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('==========PAYMONGO WEBHOOK API INVOKED========');

  const response = (req.body as PayMongoWebHookResponse) ?? '{}';

  const eventType = response.data?.attributes?.type;

  const paymentIntentId = response.data?.attributes?.data?.attributes?.payment_intent_id;

  const targetApplication = response.data.attributes.data.attributes.metadata.application;
  console.log('CHECKING IF TARGET APPLICATION ...', targetApplication);
  if (targetApplication === constants.general.appName) {
    console.log('TARGET APP matches', eventType);
    if (eventType === 'payment.paid') {
      // update booking
      if (!!response.data.attributes.data.attributes.metadata.bookingUpdateParams) {
        await PaymentEventsHandler.handleUpdateBookingPayment(paymentIntentId, response.data.attributes.data.attributes.amount);
        return res.end();
      }

      // create booking
      console.log('Inserting Booking ...');
      await PaymentEventsHandler.handlePaymentPaidEvent(paymentIntentId);
    }

    if (eventType === 'payment.refunded')
      await PaymentEventsHandler.handleRefundPaymentEvent(
        paymentIntentId,
        response.data?.attributes.data.attributes.refunds[0].id,
      );
  } else console.log('TARGET APP does not match');

  return res.end();
}
