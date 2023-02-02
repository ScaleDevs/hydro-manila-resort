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
  customer_name: string;
  product_type: string;
  booking_date: string;
  ref_no: string;
};

export const sendBookingSuccessEmail = async ({
  recipientEmail,
  customer_name,
  product_type,
  booking_date,
  ref_no,
}: SendBookingEmailInput) => {
  await sendTemplateEmail({
    templateId: constants.mailerSend.bookingTempId,
    recipientEmail,
    variables: {
      customer_name,
      product_type,
      booking_date,
      ref_no,
    },
    subject: 'Hydro Resort Manila Customer Booking Confirmation',
  });
};

type SendRefundEmailInput = {
  recipientEmail: string;
  customer_name: string;
  ref_no: string;
};

export const sendRefundEmail = async ({ recipientEmail, customer_name, ref_no }: SendRefundEmailInput) => {
  await sendTemplateEmail({
    templateId: constants.mailerSend.refundTempId,
    recipientEmail,
    variables: {
      customer_name,
      ref_no,
    },
    subject: 'Hydro Resort Manila Customer Refund Confirmation',
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
        template_id: constants.mailerSend.userInviteTempId,
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
