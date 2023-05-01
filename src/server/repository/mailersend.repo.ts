import fetch from 'node-fetch';
import { constants } from '../constants';
import { IBooking } from '@/utils/types';

type SendTemplateEmailInput = {
  templateId: string;
  recipientEmail: string;
  variables: any;
  subject: string;
};

export const sendTemplateEmail = async ({ templateId, recipientEmail, variables, subject }: SendTemplateEmailInput) => {
  const recipients = {
    from: {
      email: constants.mailerSend.fromEmail,
      name: constants.mailerSend.fromName,
    },
    to: [{ email: recipientEmail }],
  };

  const personalization = [
    {
      email: recipientEmail,
      data: {
        ...variables,
      },
    },
  ];

  try {
    await fetch('https://api.mailersend.com/v1/email', {
      method: 'post',
      body: JSON.stringify({
        ...recipients,
        subject,
        personalization,
        template_id: templateId,
      }),
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: 'Bearer ' + constants.mailerSend.apiKey,
      },
    });
  } catch (err) {
    console.log('ERROR AT SENDING EMAIL');
    console.log(err);
    return false;
  }
};

type SendBookingEmailInput = {
  recipientEmail: string;
  guest_name: string;
  reference_number: string;
  booking_type: string;
  number_of_rooms: number;
  number_of_guest: number;
  room_type: string;
  checkin_datetime: string;
  booking_type_rate: string;
  checkout_datetime: string;
  product_price: string;
  extra_person_rate: string;
  extra_person_qty: number;
  extra_person_total: string;
  room2_rate: string;
  room2_qty: number;
  room2_total: string;
  room1_rate: string;
  room1_qty: number;
  room1_total: string;
  addon_total: string;
  type_payment: string;
  total_payment: string;
};

export const sendBookingSuccessEmail = async (params: SendBookingEmailInput) => {
  const { recipientEmail, ...rest } = params;

  await sendTemplateEmail({
    templateId: constants.mailerSend.bookingConfirmationTempId,
    recipientEmail,
    variables: {
      ...rest,
    },
    subject: 'Hydro Resort Manila Customer Booking Confirmation',
  });
};

type SendRefundEmailSuccessInput = {
  recipientEmail: string;
  customer_name: string;
  ref_no: string;
};

export const sendRefundEmailSuccess = async ({ recipientEmail, customer_name, ref_no }: SendRefundEmailSuccessInput) => {
  await sendTemplateEmail({
    templateId: constants.mailerSend.reusableTempId,
    recipientEmail,
    variables: {
      title_of_message: 'Booking Refund Confirmation',
      greetings: 'Hi ' + customer_name + ',',
      message_body: `We received your request for a refund. Your booking of reference #${ref_no} has been successfuly refunded. You should have the refund reflected in your account within the day for eWallets, and within 30 days`,
    },
    subject: 'Hydro Resort Manila Customer Refund Confirmation',
  });

  await sendTemplateEmail({
    templateId: constants.mailerSend.reusableTempId,
    recipientEmail: constants.mailerSend.supportEmail,
    variables: {
      title_of_message: 'Booking Refund Processed (Automatic)',
      greetings: 'Hi Hydro Support,',
      message_body: `Customer ${customer_name} refunded his/her booking of reference #${ref_no} has been successfuly refunded.`,
    },
    subject: 'Hydro Resort Manila Customer Refund Confirmation',
  });
};

type SendRefundEmailProcessingInput = {
  recipientEmail: string;
  customer_name: string;
  ref_no: string;
  amount: number;
};

export const sendRefundEmailProcessing = async ({
  recipientEmail,
  customer_name,
  ref_no,
  amount,
}: SendRefundEmailProcessingInput) => {
  await sendTemplateEmail({
    templateId: constants.mailerSend.reusableTempId,
    recipientEmail,
    variables: {
      title_of_message: 'Booking Refund Request',
      greetings: 'Hi ' + customer_name + ',',
      message_body: `Your request for a refund on your booking with reference #${ref_no} is now being process. Please give our team time to process your refund this will take 3-4 weeks of processing thank you.`,
    },
    subject: 'Hydro Resort Manila Customer Refund Request',
  });

  await sendTemplateEmail({
    templateId: constants.mailerSend.reusableTempId,
    recipientEmail: constants.mailerSend.supportEmail,
    variables: {
      title_of_message: 'Booking Refund Request (Requires Manual Processing)',
      greetings: 'Hi Hydro Support,',
      message_body: `A customer named ${customer_name} has requested for a refund with booking reference "${ref_no}" with the amount of ₱${amount} and currently your paymongo upcoming payouts is insufficient to pay for the refund so this refund request will go through manual processing.`,
    },
    subject: 'Hydro Resort Manila Customer Refund Request',
  });
};

type SendRefundEmailConflictBookingInput = {
  recipientEmail: string;
  customer_name: string;
  payment_id: string;
};

export const sendRefundEmailConflictBooking = async ({
  recipientEmail,
  customer_name,
  payment_id,
}: SendRefundEmailConflictBookingInput) => {
  await sendTemplateEmail({
    templateId: constants.mailerSend.reusableTempId,
    recipientEmail: constants.mailerSend.supportEmail,
    variables: {
      title_of_message: 'Booking Failed due to conflict of schedules (Kindly Review)',
      greetings: 'Hi Hydro Support,',
      message_body: `The booking for customer ${customer_name} has failed due to booking schedule already being filled. Kindly process his/her refund or help resched booking by contacting the customer.`,
    },
    subject: 'Hydro Resort Manila Customer Booking Failed',
  });

  await sendTemplateEmail({
    templateId: constants.mailerSend.reusableTempId,
    recipientEmail,
    variables: {
      title_of_message: 'Booking Failed due to conflict of schedules',
      greetings: 'Hi ' + customer_name + ',',
      message_body: `Your booking request has failed due to another booking and we have already notified our team to process the refund or contact you if you want to reschedule your booking. For the processing of your refund, this may take 3-4 weeks. Kindly Take Note of your payment ID of "${payment_id}". Kindly reach our team with the contact details below if you have questions`,
    },
    subject: 'Hydro Resort Manila Customer Booking Failed',
  });
};

type NotifyAdminDbInsertionErrorInput = {
  customer_name: string;
  payment_id: string;
  ref_no: string;
  startSession: string;
  endSession: string;
};

export const notifyAdminDbInsertionError = async ({
  customer_name,
  payment_id,
  ref_no,
  startSession,
  endSession,
}: NotifyAdminDbInsertionErrorInput) => {
  await sendTemplateEmail({
    templateId: constants.mailerSend.reusableTempId,
    recipientEmail: constants.mailerSend.supportEmail,
    variables: {
      title_of_message: 'Booking Record Failed to be added in database',
      greetings: 'Hi Hydro Support,',
      message_body: `The booking for customer ${customer_name} with booking reference ${ref_no} has been paid with payment_id ${payment_id} has not been added to your records so kindly add the schedule manually on your end. The schedule to be added is ${startSession} - ${endSession}`,
    },
    subject: 'Hydro Resort Manila Booking Record Not Added',
  });
};

export const updateBookingPartialRefundEmail = async (
  bookingRecord: IBooking,
  partialRefund: string,
  variables: {
    room: string;
    guests: string;
    booking_type: string;
    reference_no: string;
    check_in_date: string;
    check_out_date: string;
    transaction: {
      name: string;
      value: string;
    }[];
    modification: {
      name: string;
      value: string;
    }[];
  },
) => {
  await sendTemplateEmail({
    templateId: constants.mailerSend.bookingUpdateTempId,
    recipientEmail: constants.mailerSend.supportEmail,
    variables: variables,
    subject: 'Hydro Resort Manila Customer Booking Update Request',
  });

  await sendTemplateEmail({
    templateId: constants.mailerSend.reusableTempId,
    recipientEmail: bookingRecord.email,
    variables: {
      title_of_message: 'Booking Update Request',
      greetings: 'Hi ' + bookingRecord.name + ',',
      message_body: `Your request to update your details regarding your booking is now in progressed. You will receive an email confirmation once your booking details are updated and will also receive a partial refund of ${partialRefund}. Kindly reach our team with the contact details below if you have questions`,
    },
    subject: 'Hydro Resort Manila Customer Booking Failed',
  });
};
