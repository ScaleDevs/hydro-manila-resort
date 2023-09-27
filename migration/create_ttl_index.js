// eslint-disable-next-line @typescript-eslint/no-var-requires
const mongoose = require('mongoose');
const { Schema } = mongoose;

const bookingAttempt = new Schema(
  {
    expiresAt: { type: Date, expires: 600 },
  },
  { strict: false, collection: 'BookingAttempt' },
);

async function main() {
  console.log('RUNNING SCRIPT ...');

  await mongoose.connect('mongodb+srv://MyScaleDevsAdmin123:zS5qkJN438X5DTAa@scaledevs.5zsdyi2.mongodb.net/devdb');

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
