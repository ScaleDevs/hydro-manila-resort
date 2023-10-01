// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mongoose = require('mongoose');
const { Schema } = mongoose;

const bookingAttempt = new Schema(
  {
    expireAt: { type: Date, expires: 600 },
  },
  { strict: false, collection: 'BookingAttempt' },
);

async function main() {
  console.log('RUNNING SCRIPT ...');

  await mongoose.connect(process.env.DATABASE_URL);

  console.log('CREATING INDEX TTL FOR BOOKING ATTEMPT COLLECTION ...');

  const bookingAttempModel = mongoose.model('BookingAttempt', bookingAttempt);
  try {
    await bookingAttempModel.ensureIndexes();
  } catch (err) {
    console.log('err', err);
  }

  console.log('OPERATION DONE');

  process.exit();
}

main();
