import dayjs from 'dayjs';
import { z } from 'zod';

import { BookingSettingRepository } from '@/repo/bookingsetting.repo';
import { ProductRepository } from '@/repo/product.repo';
import { RoomRepository } from '@/repo/room.repo';
import { BookingRepository } from '@/repo/booking.repo';
import { BookingAttemptRepository } from '@/repo/bookingattempt.repo';
import { GoogleCalendarRepository } from '@/repo/googlecalender.repo';
import {
  notifyAdminDbInsertionError,
  sendBookingSuccessEmail,
  sendRefundEmailConflictBooking,
  sendRefundEmailSuccess,
  updateBookingConfirmation,
} from '@/repo/mailersend.repo';
import { ScheduledEventRepository } from '@/repo/scheduledevent.repo';
import { getPaymentIntentSession, getRefundDetails } from '@/repo/payment.repo';
import { BookingRefundRepository } from '@/repo/bookingrefund.repo';
import { BookingService } from '@/svc/booking.service';
import { PHpeso } from '@/utils/helper';
import { constants } from '@/server/constants';
import { BookingStatusDisplay } from '@/utils/types';
import { TransactionLog } from '@prisma/client';

export * as PaymentEventsHandler from './payment_events.handler';

const receiptSchema = z.object({
  productPrice: z.number(),
  roomPrice: z.number(),
  additionalHeadsPrice: z.number(),
  bookingFee: z.number(),
  total: z.number(),
});

const bookingDataSchema = z.object({
  ref_no: z.string(),
  name: z.string(),
  email: z.string().email(),
  phoneNumber: z.string(),
  startSession: z.string(),
  endSession: z.string(),
  guests: z.number(),
  rooms: z.array(z.string().min(1)),
  productId: z.string(),
  receipt: receiptSchema,
});

const bookingUpdatesSchema = z.object({
  guests: z.number().optional(),
  bookingDate: z.string().optional(),
  productId: z.string().optional(),
  rooms: z.array(z.string()).optional(),
});

type FormSchemaType = z.infer<typeof bookingDataSchema>;

export const handlePaymentPaidEvent = async (paymentIntentId: string) => {
  if (!paymentIntentId) {
    console.log('No Payment Intent Id!');
    return;
  }

  const paymentIntentRecord = await getPaymentIntentSession(paymentIntentId);

  if (
    !paymentIntentRecord ||
    paymentIntentRecord.attributes.status !== 'succeeded' ||
    paymentIntentRecord.attributes.payments.length === 0 ||
    !paymentIntentRecord.attributes.metadata
  ) {
    console.log('Invalid Payment Intent!');
    return;
  }

  const bookingData: FormSchemaType = JSON.parse(paymentIntentRecord.attributes.metadata.bookingRecord);
  const parsed = bookingDataSchema.safeParse(bookingData);

  if (!parsed.success) {
    console.log('Invalid Booking Data!');
    console.log(parsed.error.message);
    return;
  }

  const bookingRecordCheck = await BookingRepository.findBookingByPaymentIntentId(paymentIntentRecord.id);

  if (bookingRecordCheck) {
    console.log('Booking Record already exist in DB!');
    return;
  }

  const isBookingDateTaken = await BookingRepository.findBookingConflicts({
    startDate: parsed.data.startSession,
    endDate: parsed.data.endSession,
  });

  const isEventSchedTaken = await ScheduledEventRepository.checkIfScheduleIsTaken({
    startDate: parsed.data.startSession,
    endDate: parsed.data.endSession,
  });

  if (isBookingDateTaken || isEventSchedTaken) {
    // SEND EMAIL REGARDING MANUAL PROCESSING OF Refund/Reschedule - due to conflict booking at the same time
    await sendRefundEmailConflictBooking({
      recipientEmail: parsed.data.email,
      customer_name: parsed.data.name,
      payment_id: paymentIntentRecord.attributes.payments[0].id,
    });
    return;
  }

  const bookingSettings = await BookingSettingRepository.findFirstBookingSetting();
  const product = await ProductRepository.findProductById(parsed.data.productId);
  const rooms = await RoomRepository.findRoomsByIds(parsed.data.rooms);
  const bookedDate = dayjs.utc(parsed.data.startSession);
  const checkOutDate = dayjs.utc(parsed.data.endSession);
  const { guests } = parsed.data;
  const additionalGuests = guests > bookingSettings.minPax ? (guests - bookingSettings.minPax) * bookingSettings.extraHeadFee : 0;
  let addonsTotal = additionalGuests;

  const googleCalendarRoomsArr: string[] = [];
  const emailAddonsTable: { name: string; price: string; qty: string; summary: string }[] = [
    {
      name: 'Additional Non-Overnight Guest',
      price: PHpeso.format(bookingSettings.extraHeadFee),
      qty: `${guests > bookingSettings.minPax ? guests - bookingSettings.minPax : 0}`,
      summary: PHpeso.format(additionalGuests),
    },
  ];
  rooms.forEach((info) => {
    const isNotAddOn = product.includedRooms.some((val) => val === info.roomId);
    addonsTotal += isNotAddOn ? 0 : info.price;
    googleCalendarRoomsArr.push(info.roomIdentityName);
    emailAddonsTable.push({
      name: info.roomIdentityName,
      price: PHpeso.format(info.price),
      qty: '1',
      summary: PHpeso.format(isNotAddOn ? 0 : info.price),
    });
  });
  emailAddonsTable.push({ name: '', price: '', qty: 'Total Extra', summary: PHpeso.format(addonsTotal) });

  const calendarEventId = await GoogleCalendarRepository.createEvent({
    summary: parsed.data.name,
    description: `${product?.name} / ${parsed.data.guests ?? 0} PAX / ${
      rooms.length > 0 ? googleCalendarRoomsArr.join(', ') : 'No Rooms'
    }`,
    start: {
      dateTime: bookedDate.format('YYYY-MM-DDTHH:mm:00.000') + 'Z',
      timeZone: constants.general.timezone,
    },
    end: {
      dateTime: checkOutDate.format('YYYY-MM-DDTHH:mm:00.000') + 'Z',
      timeZone: constants.general.timezone,
    },
  });

  const bookingRecord = await BookingRepository.createBooking({
    ...parsed.data,
    paymentIntentId: paymentIntentRecord.id,
    paymentId: paymentIntentRecord.attributes.payments[0].id || '',
    startSession: parsed.data.startSession,
    endSession: parsed.data.endSession,
    calendarEventId,
    refundId: null,
    updateLogs: [],
    transactionLogs: [],
  });

  if (!bookingRecord) {
    // notify hydro support if booking record was not added (so they can add manually on their end)
    await notifyAdminDbInsertionError({
      customer_name: parsed.data.name,
      payment_id: paymentIntentRecord.attributes.payments[0].id,
      ref_no: parsed.data.ref_no,
      startSession: dayjs(parsed.data.startSession).format('MMM DD, YYYY hh:mm:ss A'),
      endSession: dayjs(parsed.data.endSession).format('MMM DD, YYYY hh:mm:ss A'),
    });
  }

  console.log('SUCCESSFULLY ADDED BOOKING');

  await sendBookingSuccessEmail({
    recipientEmail: [parsed.data.email, constants.mailerSend.supportEmail],
    reference_number: parsed.data.ref_no,
    guest_name: parsed.data.name,
    num_pax: parsed.data.guests,
    checkin: bookedDate.tz(constants.general.timezone).format('MMM DD, YYYY / hh:mm A'),
    checkout: checkOutDate.tz(constants.general.timezone).format('MMM DD, YYYY / hh:mm A'),
    booking_type: product?.name || '',
    booking_rate: 'BEST AVAILABLE RATE',
    product_price: PHpeso.format(parsed.data.receipt.productPrice),
    elements: emailAddonsTable,
    total_payment: PHpeso.format(parsed.data.receipt.total),
  });

  console.log('EMAIL SUCCESSFULLY SENT');

  console.log('CLEANUP BOOKING ATTEMP RECORD ...');

  await BookingAttemptRepository.deleteBookingAttemptWithRefNo(parsed.data.ref_no);

  console.log('DONE');
};

export const handleRefundPaymentEvent = async (paymentIntentId: string, refundId: string) => {
  if (!paymentIntentId) {
    console.log('No Payment Intent Id!');
    return;
  }

  if (!refundId) {
    console.log('No Refund Id!');
    return;
  }

  const refundResource = await getRefundDetails(refundId);

  if (!refundResource) {
    console.log('Refund Resource does not exist');
    return;
  }

  if (refundResource.attributes.status === 'succeeded') {
    const bookingRecord = await BookingRepository.findBookingByPaymentIntentId(paymentIntentId);

    if (!bookingRecord) {
      console.log('Booking record does not exist');
      return;
    }

    if (bookingRecord.refundId) {
      const bookingRefundRecord = await BookingRefundRepository.findBookingRefundById(bookingRecord.refundId);

      if (!!bookingRefundRecord && bookingRefundRecord.status === 'PROCESSING' && bookingRefundRecord.type === 'MANUAL') {
        await BookingRefundRepository.updateBookinRefund(bookingRefundRecord.bookingRefundId, {
          paymongoRefundId: refundId,
          status: 'SUCCESS',
        });
        await sendRefundEmailSuccess({
          recipientEmail: bookingRecord.email,
          customer_name: bookingRecord.name,
          ref_no: bookingRecord.ref_no,
        });

        console.log('EMAIL SUCCESSFULLY SENT');
        return;
      } else if (!!bookingRefundRecord && bookingRefundRecord.status === 'SUCCESS') {
        console.log('Booking record already refunded');
        return;
      }
    }

    const refundRecord = await BookingRefundRepository.createBookingRefund({
      paymongoRefundId: refundId,
      type: 'AUTOMATIC',
      reason: refundResource.attributes.metadata.reason || '',
      status: 'SUCCESS',
    });

    await BookingRepository.updateBooking(bookingRecord.id, { refundId: refundRecord.bookingRefundId });

    await sendRefundEmailSuccess({
      recipientEmail: bookingRecord.email,
      customer_name: bookingRecord.name,
      ref_no: bookingRecord.ref_no,
    });

    console.log('EMAIL SUCCESSFULLY SENT');
  }
};

export const handleUpdateBookingPayment = async (paymentIntentId: string, amountPaid: number) => {
  const paymentIntentRecord = await getPaymentIntentSession(paymentIntentId);

  if (
    !paymentIntentRecord ||
    paymentIntentRecord.attributes.status !== 'succeeded' ||
    paymentIntentRecord.attributes.payments.length === 0 ||
    !paymentIntentRecord.attributes.metadata
  ) {
    console.log('Invalid Payment Intent!');
    return;
  }

  const metadata = paymentIntentRecord.attributes.metadata;
  const bookingUpdateParams = JSON.parse(metadata.bookingUpdateParams);
  const bookingRecordId = bookingUpdateParams.bookingRecordId;

  if (!bookingRecordId) {
    console.log('No Booking Record Id provided');
    return;
  }

  const bookingRecord = await BookingRepository.findBookingById(bookingRecordId);

  if (!bookingRecord) {
    console.log('No Booking Record Found');
    return;
  }

  const bookingUpdates = bookingUpdateParams.updates;
  const parsedUpdates = bookingUpdatesSchema.safeParse(bookingUpdates);

  if (!parsedUpdates.success) {
    console.log('Invalid Booking Updates Data!');
    console.log(parsedUpdates.error.message);
    return;
  }

  const parsedReceipt = receiptSchema.safeParse(metadata.receipt ? JSON.parse(metadata.receipt) : '{}');

  if (!parsedReceipt.success) {
    console.log('Invalid Receipt!');
    console.log(parsedReceipt.error.message);
    return;
  }

  const { bookingDate, ...data } = parsedUpdates.data;
  const paymentId = paymentIntentRecord.attributes.payments[0].id;
  const product = await ProductRepository.findProductById(data.productId || bookingRecord.productId);
  const rooms = parsedUpdates.data.rooms ? await RoomRepository.findRoomsByIds(parsedUpdates.data.rooms) : [];
  const updateLogs = await BookingService.buildBookingDetailsUpdateLog(bookingRecord, data, 'CUSTOMER', paymentId);
  const result = await BookingService.buildScheduleAndUpdateLog({
    bookingRecord,
    updatedBookedDate: bookingDate,
    updatedProductId: data.productId,
    updatedBy: 'CUSTOMER',
    product,
    paymentId,
  });
  const transactionLogs: TransactionLog[] = [
    ...bookingRecord.transactionLogs,
    {
      refNo: paymentId,
      paymentIntentId: paymentIntentId,
      type: 'PAYMENT',
      amount: amountPaid,
    },
  ];

  if (metadata.statusDisplay) {
    const statusDisplay = JSON.parse(metadata.statusDisplay) as BookingStatusDisplay;

    if (!!metadata.bookedSchedule) await BookingAttemptRepository.deleteBookingAttemptWithRefNo(statusDisplay.ref_no);
    await updateBookingConfirmation(bookingRecord.email, {
      customer_name: statusDisplay.customerName,
      guests: `${statusDisplay.guests || 0}`,
      booking_type: statusDisplay.scheduleType,
      reference_no: statusDisplay.ref_no,
      check_in_date: statusDisplay.bookedDate,
      check_out_date: statusDisplay.checkOutDate,
      room: statusDisplay.roomName || 'N/A',
      total_payment: PHpeso.format(paymentIntentRecord.attributes.amount / 100),
    });
  }

  await BookingService.updateBooking({
    bookingId: bookingRecordId,
    product,
    rooms: rooms.map((info) => info.roomIdentityName),
    data: {
      ...data,
      startSession: result.startSessionISOString,
      endSession: result.endSessionISOString,
      receipt: { ...parsedReceipt.data },
      updateLogs: [...bookingRecord.updateLogs, ...updateLogs, ...result.updateLogs],
      transactionLogs,
    },
    paymentId,
  });

  console.log('done update!!');
};
