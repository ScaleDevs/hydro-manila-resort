import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import dayjs from 'dayjs';
import { PayMongoWebHookResponse } from '@/utils/types';
import { BookingService } from '@/svc/booking.service';
import { PaymentService } from '@/server/services/payment.service';
import { ProductService } from '@/svc/product.service';
import { sendBookingSuccessEmail } from '@/server/repository/mailersend.repo';

const inputSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phoneNumber: z.string(),
  startSession: z.string(),
  endSession: z.string(),
  guests: z.number(),
  roomId: z.string(),
  roomVersion: z.number(),
  productId: z.string(),
  productVersion: z.number(),
  receipt: z.object({
    productPrice: z.number(),
    roomPrice: z.number(),
    additionalHeadsPrice: z.number(),
    total: z.number(),
  }),
});

type FormSchemaType = z.infer<typeof inputSchema>;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('==========PAYMONGO WEBHOOK API INVOKED========');

  const response = (req.body as PayMongoWebHookResponse) ?? '{}';
  const paymentIntentId = response.data?.attributes?.data?.attributes?.payment_intent_id;

  if (!paymentIntentId) {
    console.log('No Payment Intent Id!');
    res.end();
    return;
  }

  const paymentIntentRecord = await PaymentService.getPaymentIntentSession(paymentIntentId);

  if (
    !paymentIntentRecord ||
    paymentIntentRecord.attributes.status !== 'succeeded' ||
    paymentIntentRecord.attributes.payments.length === 0 ||
    !paymentIntentRecord.attributes.metadata
  ) {
    console.log('Invalid Payment Intent!');
    res.end();
    return;
  }

  const bookingData: FormSchemaType = JSON.parse(paymentIntentRecord.attributes.metadata.bookingRecord);
  const parsed = inputSchema.safeParse(bookingData);

  if (!parsed.success) {
    console.log('Invalid Booking Data!');
    res.end();
    return;
  }

  const bookingRecordCheck = await BookingService.findBookingByPaymentIntentId(paymentIntentRecord.id);

  if (bookingRecordCheck) {
    console.log('Booking Record already exist in DB!');
    res.end();
    return;
  }

  const bookingResult = await BookingService.createBooking({
    ...bookingData,
    paymentIntentId: paymentIntentRecord.id,
    paymentId: paymentIntentRecord.attributes.payments[0].id || '',
    startSession: new Date(bookingData.startSession),
    endSession: new Date(bookingData.endSession),
  });

  if (!bookingResult) {
    console.log('send email to hydro regarding booking not stored on db but successful in payment');
  }

  console.log('SUCCESSFULLY ADDED BOOKING');

  const product = await ProductService.findProductById(bookingResult.productId);

  await sendBookingSuccessEmail({
    recipientEmail: bookingResult.email,
    customer_name: bookingResult.name,
    product_type: product?.name || '',
    booking_date: `${dayjs(bookingResult.startSession).format('MMM DD, YYYY hh:mm:ss A')} - ${dayjs(
      bookingResult.endSession,
    ).format('MMM DD, YYYY hh:mm:ss A')}`,
  });

  console.log('EMAIL SUCCESSFULLY SENT');
  res.end();
}
