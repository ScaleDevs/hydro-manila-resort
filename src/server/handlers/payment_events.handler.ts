import dayjs from 'dayjs';
import { z } from 'zod';

import { ProductRepository } from '@/repo/product.repo';
import { RoomRepository } from '@/repo/room.repo';
import { BookingRepository } from '@/repo/booking.repo';
import { GoogleCalendarRepository } from '@/repo/googlecalender.repo';
import {
  notificationUpdateFailed,
  notifyAdminDbInsertionError,
  notifyFailedHostawayDeletion,
  sendBookingSuccessEmail,
  sendRefundEmailConflictBooking,
  sendRefundEmailSuccess,
  updateBookingConfirmation,
} from '@/repo/mailersend.repo';
import { getPaymentIntentSession, getRefundDetails } from '@/repo/payment.repo';
import { BookingRefundRepository } from '@/repo/bookingrefund.repo';
import { createReservation, cancelReservation, updateReservation } from '@/repo/hostaway.repo';
import { BookingService } from '@/svc/booking.service';
import { PHpeso, getExtraHeads, getExtraHeadsTotal } from '@/utils/helper';
import { constants } from '@/server/constants';
import { BookingStatusDisplay } from '@/utils/types';
import { ProcessType, TransactionLog } from '@prisma/client';
import { createGuestsSummary } from '../util';

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
  guests: z.object({
    overNightGuests: z.number(),
    nonOverNightGuests: z.number(),
  }),
  rooms: z.array(z.string().min(1)),
  productId: z.string(),
  receipt: receiptSchema,
});

const bookingUpdatesSchema = z.object({
  guests: z
    .object({
      overNightGuests: z.number(),
      nonOverNightGuests: z.number(),
    })
    .optional(),
  bookingDate: z.string().optional(),
  productId: z.string().optional(),
  rooms: z.array(z.string()).optional(),
});

type FormSchemaType = z.infer<typeof bookingDataSchema>;

const logger = (funcName: string, message: string) => {
  console.log(`payment_event_handler.ts :: (${funcName}) :: ${message}`);
};

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
    logger('handlePaymentPaidEvent', 'Invalid Payment Intent!');
    return;
  }

  const bookingData: FormSchemaType = JSON.parse(paymentIntentRecord.attributes.metadata.bookingRecord);
  const parsed = bookingDataSchema.safeParse(bookingData);

  if (!parsed.success) {
    logger('handlePaymentPaidEvent', 'Invalid Booking Data!');
    logger('handlePaymentPaidEvent', parsed.error.message);
    return;
  }

  const bookingRecordCheck = await BookingRepository.findBookingByPaymentIntentId(paymentIntentRecord.id);

  if (!bookingRecordCheck) {
    logger('handlePaymentPaidEvent', 'Booking Record does not exist!');
    return;
  }

  const { guests } = parsed.data;
  const [product, rooms, bookedDate, checkOutDate] = await Promise.all([
    ProductRepository.findProductById(parsed.data.productId),
    RoomRepository.findRoomsByIds(parsed.data.rooms),
    dayjs.utc(parsed.data.startSession),
    dayjs.utc(parsed.data.endSession),
  ]);
  const { guestSetting } = product;
  const [extraOverNightGuestsTotal, extraNonOverNightGuestsTotal] = await Promise.all([
    getExtraHeadsTotal(guests.overNightGuests, guestSetting.minOverNightGuestPax, guestSetting.overNightGuestFee),
    getExtraHeadsTotal(guests.nonOverNightGuests, guestSetting.minNonOverNightGuestPax, guestSetting.nonOverNightGuestFee),
  ]);
  let addonsTotal = extraOverNightGuestsTotal + extraNonOverNightGuestsTotal;

  const googleCalendarRoomsArr: string[] = [];
  const emailAddonsTable: { name: string; price: string; qty: string; summary: string }[] = [];

  if (extraOverNightGuestsTotal > 0)
    emailAddonsTable.push({
      name: 'Additional Overnight Guests',
      price: PHpeso.format(guestSetting.overNightGuestFee),
      qty: `${getExtraHeads(guests.overNightGuests, guestSetting.minOverNightGuestPax)}`,
      summary: PHpeso.format(extraOverNightGuestsTotal),
    });

  if (extraNonOverNightGuestsTotal > 0)
    emailAddonsTable.push({
      name: product.isAllRooms ? 'Additional Non-Overnight Guests' : 'Additional Guests',
      price: PHpeso.format(guestSetting.nonOverNightGuestFee),
      qty: `${getExtraHeads(guests.nonOverNightGuests, guestSetting.minNonOverNightGuestPax)}`,
      summary: PHpeso.format(extraNonOverNightGuestsTotal),
    });

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

  let hostawayId: null | number = null;

  if (constants.general.appName === 'VillaLeonora') {
    logger('handlePaymentPaidEvent', 'creating hostaway reservation ...');
    const arrivalDateInstance = dayjs.utc(parsed.data.startSession).tz(constants.general.timezone);
    const departureDateInstance = dayjs.utc(parsed.data.endSession).tz(constants.general.timezone);

    const reservationResult = await createReservation({
      guestName: parsed.data.name,
      numberOfGuests: parsed.data.guests.nonOverNightGuests + parsed.data.guests.overNightGuests,
      arrivalDate: arrivalDateInstance.format('YYYY-MM-DD'),
      departureDate: departureDateInstance.format('YYYY-MM-DD'),
      checkInTime: arrivalDateInstance.hour(),
      checkOutTime: departureDateInstance.hour(),
      phone: '+63' + parsed.data.phoneNumber,
      totalPrice: parsed.data.receipt.total,
    });

    if ('conflict' in reservationResult && reservationResult.message === 'Requested date is not available') {
      await sendRefundEmailConflictBooking({
        recipientEmail: parsed.data.email,
        customer_name: parsed.data.name,
        payment_id: paymentIntentRecord.attributes.payments[0].id,
        isHostawayConflict: true,
      });

      logger('handlePaymentPaidEvent', 'hostaway reservation creation failed!');

      return;
    } else if ('conflict' in reservationResult) {
      await sendRefundEmailConflictBooking({
        recipientEmail: parsed.data.email,
        customer_name: parsed.data.name,
        payment_id: paymentIntentRecord.attributes.payments[0].id,
      });

      logger('handlePaymentPaidEvent', 'hostaway reservation creation failed!');

      return;
    } else if ('guestName' in reservationResult) {
      hostawayId = reservationResult.id;
      console.log('payment_event_handler.ts :: (handlePaymentPaidEvent) hostaway reservation created');
    }
  }

  logger('handlePaymentPaidEvent', 'creating google calendar event ...');

  const calendarEventId = await GoogleCalendarRepository.createEvent({
    summary: parsed.data.name,
    description: `${product?.name} / ${guests.nonOverNightGuests ?? 0} Non-Overnight Guests / ${
      guests.overNightGuests ?? 0
    } Overnight Guests / ${
      product.isAllRooms ? 'Whole Place' : rooms.length > 0 ? googleCalendarRoomsArr.join(', ') : 'No Rooms'
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

  const bookingRecord = await BookingRepository.updateBooking(bookingRecordCheck.id, {
    status: 'BOOKED',
    paymentId: paymentIntentRecord.attributes.payments[0].id || '',
    calendarEventId,
    hostawayId: hostawayId,
  });

  if (!bookingRecord)
    // notify hydro support if booking record was not added (so they can add manually on their end)
    await notifyAdminDbInsertionError({
      customer_name: parsed.data.name,
      payment_id: paymentIntentRecord.attributes.payments[0].id,
      ref_no: parsed.data.ref_no,
      startSession: dayjs(parsed.data.startSession).format('MMM DD, YYYY hh:mm:ss A'),
      endSession: dayjs(parsed.data.endSession).format('MMM DD, YYYY hh:mm:ss A'),
    });

  logger('handlePaymentPaidEvent', 'Updated booking status to "BOOKED"');

  await sendBookingSuccessEmail({
    recipientEmail: [parsed.data.email, constants.mailerSend.supportEmail],
    reference_number: parsed.data.ref_no,
    guest_name: parsed.data.name,
    num_pax: parsed.data.guests.overNightGuests + parsed.data.guests.nonOverNightGuests,
    checkin: bookedDate.tz(constants.general.timezone).format('MMM DD, YYYY / hh:mm A'),
    checkout: checkOutDate.tz(constants.general.timezone).format('MMM DD, YYYY / hh:mm A'),
    booking_type: product?.name || '',
    booking_rate: 'BEST AVAILABLE RATE',
    product_price: PHpeso.format(parsed.data.receipt.productPrice),
    elements: emailAddonsTable,
    total_payment: PHpeso.format(parsed.data.receipt.total),
  });

  logger('handlePaymentPaidEvent', 'Email successfuly sent');
  logger('handlePaymentPaidEvent', 'Operation done');
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
      referenceNo: null,
      type: 'AUTOMATIC',
      reason: refundResource.attributes.metadata.reason || '',
      status: 'SUCCESS',
      amount: bookingRecord.receipt.total,
      process: 'PAYMONGO',
      updatedBy: 'SYSTEM',
    });

    await BookingRepository.updateBooking(bookingRecord.id, { refundId: refundRecord.bookingRefundId });

    if (constants.general.appName === 'VillaLeonora' && !!bookingRecord.hostawayId) {
      const result = await cancelReservation(bookingRecord.hostawayId.toString(), 'guest');
      if ('conflict' in result)
        await notifyFailedHostawayDeletion({
          ref_no: bookingRecord.ref_no,
          hostaway_id: bookingRecord.hostawayId.toString(),
        });
    }

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
  const rooms = await RoomRepository.findRoomsByIds(parsedUpdates.data.rooms || bookingRecord.rooms || []);
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
      process: ProcessType.PAYMONGO,
      addedBy: 'SYSTEM',
      createdAt: dayjs().toDate(),
    },
  ];

  if (metadata.statusDisplay) {
    const statusDisplay = JSON.parse(metadata.statusDisplay) as BookingStatusDisplay;
    await updateBookingConfirmation(bookingRecord.email, {
      customer_name: statusDisplay.customerName,
      guests: createGuestsSummary({ guests: statusDisplay.guests, isAllRooms: product.isAllRooms }),
      booking_type: statusDisplay.scheduleType,
      reference_no: statusDisplay.ref_no,
      check_in_date: statusDisplay.bookedDate,
      check_out_date: statusDisplay.checkOutDate,
      room: statusDisplay.roomName || 'N/A',
      total_payment: PHpeso.format(paymentIntentRecord.attributes.amount / 100),
    });
  }

  if (constants.general.appName === 'VillaLeonora' && !!bookingRecord.hostawayId) {
    const { overNightGuests, nonOverNightGuests } = data.guests || bookingRecord.guests;
    const updateResult = await updateReservation(bookingRecord.hostawayId.toString(), {
      numberOfGuests: overNightGuests + nonOverNightGuests,
      arrivalDate: result.startSession.format('YYYY-MM-DD'),
      departureDate: result.endSession.format('YYYY-MM-DD'),
    });

    if ('conflict' in updateResult && updateResult.message === 'Requested date is not available') {
      await sendRefundEmailConflictBooking({
        recipientEmail: bookingRecord.email,
        customer_name: bookingRecord.name,
        payment_id: paymentIntentRecord.attributes.payments[0].id,
        isHostawayConflict: true,
      });

      return;
    } else if ('conflict' in updateResult) {
      await notificationUpdateFailed({
        customer_email: bookingRecord.email,
        customer_name: bookingRecord.name,
        payment_id: paymentIntentRecord.attributes.payments[0].id,
        ref_no: bookingRecord.ref_no,
      });

      return;
    }
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
