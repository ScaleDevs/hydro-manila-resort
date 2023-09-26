import fetch from 'node-fetch';
import { constants } from '../constants';
import { IBooking } from '@/utils/types';
import { GetVars } from '@/appspecs/vars';

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
  recipientEmail: string[];
  reference_number: string;
  guest_name: string;
  checkin: string;
  checkout: string;
  booking_type: string;
  num_pax: number;
  booking_rate: string;
  product_price: string;
  elements: { name: string; price: string; qty: string; summary: string }[];
  total_payment: string;
};

export const sendBookingSuccessEmail = async (params: SendBookingEmailInput) => {
  const { recipientEmail, ...rest } = params;

  for (const email of recipientEmail)
    await sendTemplateEmail({
      templateId: GetVars.CalendarTemplates.bookingConfirmationId,
      recipientEmail: email,
      variables: {
        ...rest,
      },
      subject: constants.general.companyName + ' ' + 'Customer Booking Confirmation',
    });
};

type SendRefundEmailSuccessInput = {
  recipientEmail: string;
  customer_name: string;
  ref_no: string;
};

export const sendRefundEmailSuccess = async ({ recipientEmail, customer_name, ref_no }: SendRefundEmailSuccessInput) => {
  await sendTemplateEmail({
    templateId: GetVars.CalendarTemplates.reuseableId,
    recipientEmail,
    variables: {
      title_of_message: 'Booking Refund Confirmation',
      greetings: 'Hi ' + customer_name + ',',
      message_body: `We received your request for a refund. Your booking of reference #${ref_no} has been successfuly refunded. You should have the refund reflected in your account within the day for eWallets, and within 30 days`,
    },
    subject: constants.general.companyName + ' ' + 'Customer Refund Confirmation',
  });

  await sendTemplateEmail({
    templateId: GetVars.CalendarTemplates.reuseableId,
    recipientEmail: constants.mailerSend.supportEmail,
    variables: {
      title_of_message: 'Booking Refund Processed (Automatic)',
      greetings: 'Hi Support Team,',
      message_body: `Customer ${customer_name} refunded his/her booking of reference #${ref_no} has been successfuly refunded.`,
    },
    subject: constants.general.companyName + ' ' + 'Customer Refund Confirmation',
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
    templateId: GetVars.CalendarTemplates.reuseableId,
    recipientEmail,
    variables: {
      title_of_message: 'Booking Refund Request',
      greetings: 'Hi ' + customer_name + ',',
      message_body: `Your request for a refund on your booking with reference #${ref_no} is now being process. Please give our team time to process your refund this will take 3-4 weeks of processing thank you.`,
    },
    subject: constants.general.companyName + ' ' + 'Customer Refund Request',
  });

  await sendTemplateEmail({
    templateId: GetVars.CalendarTemplates.reuseableId,
    recipientEmail: constants.mailerSend.supportEmail,
    variables: {
      title_of_message: 'Booking Refund Request (Requires Manual Processing)',
      greetings: 'Hi Support Team,',
      message_body: `A customer named ${customer_name} has requested for a refund with booking reference "${ref_no}" with the amount of ₱${amount} and currently your paymongo upcoming payouts is insufficient to pay for the refund so this refund request will go through manual processing.`,
    },
    subject: constants.general.companyName + ' ' + 'Customer Refund Request',
  });
};

type SendRefundEmailConflictBookingInput = {
  recipientEmail: string;
  customer_name: string;
  payment_id: string;
  isHostawayConflict?: boolean;
};

export const sendRefundEmailConflictBooking = async ({
  recipientEmail,
  customer_name,
  payment_id,
  isHostawayConflict,
}: SendRefundEmailConflictBookingInput) => {
  await sendTemplateEmail({
    templateId: GetVars.CalendarTemplates.reuseableId,
    recipientEmail: constants.mailerSend.supportEmail,
    variables: {
      title_of_message: 'Booking Failed due to conflict of schedules (Kindly Review)',
      greetings: 'Hi Support Team,',
      message_body: `The booking for customer ${customer_name} has failed due to booking schedule already being filled${
        isHostawayConflict ? ' on the hostaway calendar' : ''
      }. Kindly process his/her refund or help resched booking by contacting the customer.`,
    },
    subject: constants.general.companyName + ' ' + 'Customer Booking Failed',
  });

  await sendTemplateEmail({
    templateId: GetVars.CalendarTemplates.reuseableId,
    recipientEmail,
    variables: {
      title_of_message: 'Booking Failed due to conflict of schedules',
      greetings: 'Hi ' + customer_name + ',',
      message_body: `Your booking request has failed due to another booking and we have already notified our team to process the refund or contact you if you want to reschedule your booking. For the processing of your refund, this may take 3-4 weeks. Kindly Take Note of your payment ID of "${payment_id}". Kindly reach our team with the contact details below if you have questions`,
    },
    subject: constants.general.companyName + ' ' + 'Customer Booking Failed',
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
    templateId: GetVars.CalendarTemplates.reuseableId,
    recipientEmail: constants.mailerSend.supportEmail,
    variables: {
      title_of_message: 'Booking Record Failed to be added in database',
      greetings: 'Hi Support Team,',
      message_body: `The booking for customer ${customer_name} with booking reference ${ref_no} has been paid with payment_id ${payment_id} has not been added to your records so kindly add the schedule manually on your end. The schedule to be added is ${startSession} - ${endSession}`,
    },
    subject: constants.general.companyName + ' ' + 'Booking Record Not Added',
  });
};

export const notificationUpdateFailed = async ({
  customer_name,
  customer_email,
  payment_id,
  ref_no,
}: {
  customer_name: string;
  customer_email: string;
  payment_id?: string;
  ref_no: string;
}) => {
  console.log('payment here', payment_id);
  await sendTemplateEmail({
    templateId: GetVars.CalendarTemplates.reuseableId,
    recipientEmail: constants.mailerSend.supportEmail,
    variables: {
      title_of_message: 'Customer Booking Update Failed',
      greetings: 'Hi Support Team,',
      message_body: `The update booking request for customer ${customer_name} with booking reference ${ref_no} ${
        !!payment_id ? `has been paid with payment_id ${payment_id} and` : ''
      } has not been updated to your records so kindly handle the situation manually from here. You can contact the customer to know more about the details regarding the update or check the history of your emails for the update details by using the booking reference number.`,
    },
    subject: constants.general.companyName + ' ' + 'Booking Update Failed',
  });

  await sendTemplateEmail({
    templateId: GetVars.CalendarTemplates.reuseableId,
    recipientEmail: customer_email,
    variables: {
      title_of_message: 'Customer Booking Update Failed',
      greetings: 'Hi ' + customer_name + ',',
      message_body: `This is to notify that your request to update your booking details have failed but our team is already notified about this issue and will proceed with the update. Our team may contact you through your email if there are any news regarding this matter and we advice you to send a follow up email to the support team to make sure your updates are confirmed and is expected. Kindly reach our team with the contact details below if you have questions.`,
    },
    subject: constants.general.companyName + ' ' + 'Booking Update Failed',
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
    templateId: GetVars.CalendarTemplates.updateBookingRequestId,
    recipientEmail: constants.mailerSend.supportEmail,
    variables: variables,
    subject: constants.general.companyName + ' ' + 'Customer Booking Update Request',
  });

  await sendTemplateEmail({
    templateId: GetVars.CalendarTemplates.reuseableId,
    recipientEmail: bookingRecord.email,
    variables: {
      title_of_message: 'Booking Update Request',
      greetings: 'Hi ' + bookingRecord.name + ',',
      message_body: `Your request to update your details regarding your booking of reference ${bookingRecord.ref_no} is now in progressed. You will receive an email confirmation once your booking details are updated and will also receive a partial refund of ${partialRefund}. Kindly reach our team with the contact details below if you have questions`,
    },
    subject: constants.general.companyName + ' ' + 'Customer Booking Update Request',
  });
};

export const bookingUpdateNoAdditionalPaymentConfirmation = async (
  customerEmail: string,
  variables: {
    rooms: string;
    guests: string;
    booking_type: string;
    reference_no: string;
    check_in_date: string;
    customer_name: string;
    check_out_date: string;
  },
) => {
  for (const email of [customerEmail, constants.mailerSend.supportEmail]) {
    await sendTemplateEmail({
      templateId: GetVars.CalendarTemplates.updateBookingConfirmationV2Id,
      recipientEmail: email,
      variables: { ...variables },
      subject: constants.general.companyName + ' ' + 'Customer Booking Update Successful',
    });
  }
};

export const updateBookingConfirmation = async (
  customerEmail: string,
  variables: {
    room: string;
    guests: string;
    booking_type: string;
    reference_no: string;
    check_in_date: string;
    check_out_date: string;
    customer_name: string;
    total_payment: string;
  },
) => {
  await sendTemplateEmail({
    templateId: GetVars.CalendarTemplates.updateBookingConfirmationId,
    recipientEmail: customerEmail,
    variables,
    subject: constants.general.companyName + ' ' + 'Customer Booking Update Confirmation',
  });

  await sendTemplateEmail({
    templateId: GetVars.CalendarTemplates.updateBookingConfirmationId,
    recipientEmail: constants.mailerSend.supportEmail,
    variables,
    subject: constants.general.companyName + ' ' + 'Customer Booking Update Confirmation',
  });
};

export const notifyFailedHostawayDeletion = async ({ ref_no, hostaway_id }: { ref_no: string; hostaway_id: string }) => {
  await sendTemplateEmail({
    templateId: GetVars.CalendarTemplates.reuseableId,
    recipientEmail: constants.mailerSend.supportEmail,
    variables: {
      title_of_message: 'Deletion of customer booking at hostaway calendar failed!',
      greetings: 'Hi Support Team,',
      message_body: `Customer with booking reference ${ref_no} has refunded his/her booking but the system has failed to delete his/her reservation on hostaway calender with the reservationId of ${hostaway_id}. Please handle manually by deleting it directly on the hostaway calendar. Thank you.`,
    },
    subject: constants.general.companyName + ' ' + 'Deletion of Reservation Failed',
  });
};
