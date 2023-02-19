import fetch from 'node-fetch';
import { constants } from '../constants';

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
  ref_no: string;
  date: string;
  guest_name: string;
  guest_phone: string;
  checkin_date: string;
  checkin_time: string;
  checkout_date: string;
  checkout_time: string;
  number_of_guests: string;
  type_of_schedule: string;
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
  amount: number;
};

export const sendRefundEmailSuccess = async ({ recipientEmail, customer_name, ref_no, amount }: SendRefundEmailSuccessInput) => {
  await sendTemplateEmail({
    templateId: constants.mailerSend.reusableTempId,
    recipientEmail,
    variables: {
      title_of_message: 'Booking Refund Confirmation',
      greetings: 'Hi ' + customer_name + ',',
      message_body: `We received your request for a refund. Your booking of reference #${ref_no} with the amount of ₱${amount} has been successfuly refunded.`,
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
      message_body: `Your request for a refund on your booking with reference #${ref_no} with the amount of ₱${amount} is now being process. Please give our team time to process your refund this will take 2-3 weeks of processing and atmost a month thank you.`,
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
  amount: number;
};

export const sendRefundEmailConflictBooking = async ({
  recipientEmail,
  customer_name,
  payment_id,
  amount,
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
      message_body: `Your booking request has failed due to another booking and we have already notified our team to process the refund or contact you if you want to reschedule your booking. For the processing of your refund with the amount of ₱${amount}, this may take 2-3 weeks and atmost a month. Kindly Take Note of your payment ID of "${payment_id}". Kindly reach our team with the contact details below if you have questions`,
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

export const sendUserInvite = async (recipientEmail: string, temporaryPassword: string) => {
  const recipients = {
    from: {
      email: constants.mailerSend.fromEmail,
    },
    to: [{ email: recipientEmail }],
  };

  const personalization = [
    {
      email: recipientEmail,
      data: {
        user: recipientEmail.split('@')[0],
        app_name: constants.general.appName,
        company_name: constants.general.companyName,
        temporary_password: temporaryPassword,
      },
    },
  ];

  try {
    await fetch('https://api.mailersend.com/v1/email', {
      method: 'post',
      body: JSON.stringify({
        ...recipients,
        subject: `${constants.general.companyName} Employee Registration`,
        personalization,
        template_id: constants.mailerSend.reusableTempId,
      }),
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: 'Bearer ' + constants.mailerSend.apiKey,
      },
    });
  } catch (err) {
    console.log('ERROR AT SEND USER INVITE');
    return false;
  }
};
