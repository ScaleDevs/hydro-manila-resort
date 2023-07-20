const GC_PRIVATE_KEY = {
  development: process.env.GC_PRIVATE_KEY ?? '',
  production: !!process.env.GC_PRIVATE_KEY ? process.env.GC_PRIVATE_KEY.split(String.raw`\n`).join('\n') : '',
};

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
    timezone: process.env.GENERAL_TIMEZONE ?? 'Asia/Manila',
  },

  mailerSend: {
    supportEmail: process.env.MAILER_SEND_SUPPORT_EMAIL ?? 'scaledevs@gmail.com',
    fromEmail: process.env.MAILER_SEND_FROM_EMAIL,
    fromName: process.env.MAILER_SEND_FROM_NAME ?? 'ScaleDevs Team',
    apiKey: process.env.MAILER_SEND_API_KEY,
  },

  googleCalendar: {
    privateKey: GC_PRIVATE_KEY[process.env.NODE_ENV as keyof typeof GC_PRIVATE_KEY],
    clientEmail: process.env.GC_CLIENT_EMAIL ?? '',
    calendarId: process.env.GC_CALENDAR_ID ?? '',
  },

  paymongo: {
    pubKey: process.env.PAYMONGO_PUBLIC_KEY,
    secretKey: process.env.PAYMONGO_SECRET_KEY,
  },
};
