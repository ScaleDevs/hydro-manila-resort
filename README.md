This is a Dashboard template built with Next.js fullstack setup (Helpful for small to medium size apps)

## Stacks

- Next.js
- typescript
- chakraUI
- trpc
- zustand
- prisma
- cognito
- mailersend

## Note

- files with **\_un\_\_** means it is not used but retained incase for future use

## ENV VARS

- DATABASE_URL = pirsma connection to database (mongodb, planetscale, mysql)
- GENERAL_APP_NAME={app name}
- GENERAL_COMPANY_NAME={company name that uses this app}

- AWS\*CONFIG_CLIENT_REGION={aws region} \*\*\*(currently not used)\_\*\*
- AWS\*CONFIG_ACCESS_KEY_ID={aws user account accesssKeyId (create a specific user for this and make sure to apply least privilege)} \*\*\*(currently not used)\_\*\*
- AWS\*CONFIG_SECRET_KEY={aws user account secret key (create a specific user for this and make sure to apply least privilege)} \*\*\*(currently not used)\_\*\*
- AWS\*CONFIG_CLIENT_APP_CLIENT_ID={cognito user pool app client id} \*\*\*(currently not used)\_\*\*
- AWS\*CONFIG_CLIENT_APP_SECRET={cognito user pool app client secret} \*\*\*(currently not used)\_\*\*
- COGNITO\*USER_POOL_ID={aws cognito user pool id} \*\*\*(currently not used)\_\*\*

- MAILER\*SEND_TEMPLATE_ID={mailer send template id} \*\*\*(currently not used)\_\*\*
- MAILER\*SEND_FROM_EMAIL={mailer send from email} \*\*\*(currently not used)\_\*\*
- MAILER\*SEND_FROM_NAME={mailer send from name} \*\*\*(currently not used)\_\*\*
- MAILER\*SEND_API_KEY={api key of your mailer send account domain} \*\*\*(currently not used)\_\*\*

## prio

- add product extra
- apply api integration to booking

## later

- add side nav when mobile
- add update feature for product & product extra
