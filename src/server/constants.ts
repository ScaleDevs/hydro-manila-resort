export const constants = {
  UserPoolId: process.env.COGNITO_USER_POOL_ID,
  Region: process.env.AWS_CONFIG_CLIENT_REGION,
  AccessKeyId: process.env.AWS_CONFIG_ACCESS_KEY_ID,
  SecretAccessKey: process.env.AWS_CONFIG_SECRET_KEY,
  appClientId: process.env.AWS_CONFIG_CLIENT_APP_CLIENT_ID,
  appClientSecret: process.env.AWS_CONFIG_CLIENT_APP_SECRET,

  general: {
    appName: process.env.GENERAL_APP_NAME,
    companyName: process.env.GENERAL_COMPANY_NAME,
    timezone: process.env.GENERAL_TIMEZONE || 'Asia/Manila',
  },

  mailerSend: {
    reusableTempId: process.env.MAILER_SEND_REUSALBE_TEMPLATE_ID || '',
    bookingConfirmationTempId: process.env.MAILER_SEND_BOOKING_CONFIRMATION_TEMPLATE_ID || '',
    supportEmail: process.env.MAILER_SEND_HYDRO_SUPPORT_EMAIL || 'hydroresort.manila@gmail.com',
    fromEmail: process.env.MAILER_SEND_FROM_EMAIL,
    fromName: process.env.MAILER_SEND_FROM_NAME,
    apiKey: process.env.MAILER_SEND_API_KEY,
  },

  paymongo: {
    pubKey: process.env.PAYMONGO_PUBLIC_KEY,
    secretKey: process.env.PAYMONGO_SECRET_KEY,
  },
};
