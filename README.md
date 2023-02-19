# Hydro Resort Manila

Booking app for hydro resort manila with admin dashboard to manage bookings, events, and schedules of product.

## Resources used

- AWS cognito
- Mailersend
- Vercel
- MongoDB
- NameCheap (where domain was bought)
- paymongo

## References

- Domain: hydroresortmnl.com
- Email: hydroresort.manila@gmail.com

## Stacks

- Next.js
- typescript
- chakraUI
- trpc
- zustand
- prisma
- cognito
- mailersend
- mongodb

## ENV VARS

- check in notion or contact scaledevs@gmail.com

## For testing locally

- make sure to have ngrok running and create paymongo webhook using that endpoint (http://localhost:3000/api/paymongo_webhook)

## How to Run Locally

Prereq:

- install mongodb compass
- mailer send account and token
- paymongo account and tokens
- aws account and cognito tokens
- ngrok account and running on your local

1. clone repo
2. add .env file and get it from the notion or contact scaledevs@gmail.com
3. run `npm i`
4. carefully check env vars and identify what values are for local
5. open mongodb compass to manage the development with the database (either connect to mongodb cloud or local)
6. run `npx prisma db push` to initialize tables`
7. check mailer send if it has correct env values and token to make sure sending of email works
8. run ngrok on you local machine to point to the port your local app is running in.
9. go to paymongo API references create webhook(https://developers.paymongo.com/reference/create-a-webhook)

- from there add/update a webhook using your test paymongo secret key
- get your ngrok endpoint running on your machine and apply it when creating/updating a webhook in test mode `(purpose for this is to make sure paymongo webhook invokes the endpoint /api/paymongo_webhook of your app running. this endpoint will handle confirming booking payments and refunds which paymongo webhooks will invoke)`

10. once all done run `npm run dev`
11. it should work

## Deployment

1. its basically deployed in vercel
2. you just need to make sure the env vars are all correct and again refer to the notion or contact scaledevs@gmail.com
3. every push to the github repo of this project will trigger the ci/cd of this project by vercel to deploy to vercel (deployed under account of ScaleDevs Team)
