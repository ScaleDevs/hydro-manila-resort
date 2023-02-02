import fetch from 'node-fetch';
import { constants } from '../constants';

type SendBookingEmailInput = {
  recipientEmail: string;
  customer_name: string;
  product_type: string;
  booking_date: string;
};

export const sendBookingSuccessEmail = async ({
  recipientEmail,
  customer_name,
  product_type,
  booking_date,
}: SendBookingEmailInput) => {
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
        customer_name,
        product_type,
        booking_date,
      },
    },
  ];

  try {
    await fetch('https://api.mailersend.com/v1/email', {
      method: 'post',
      body: JSON.stringify({
        ...recipients,
        subject: `${constants.general.companyName} Customer Booking Confirmation`,
        personalization,
        template_id: constants.mailerSend.templateId,
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
        template_id: constants.mailerSend.templateId,
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
