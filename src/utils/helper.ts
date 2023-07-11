import dayjs from 'dayjs';
import { IProduct } from './types';

export const PHpeso = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'PHP',
});

export const base64Encoding = (str: string) => {
  const bufferObj = Buffer.from(str, 'utf8');
  const result = bufferObj.toString('base64');
  return result;
};

export const dateToIsoString = (date: string | Date) => {
  return dayjs.tz(date, process.env.NEXT_PUBLIC_TIMEZONE).toISOString();
};

export const utcDateToTzDayInstance = (date: string | Date) => {
  return dayjs.utc(date).tz(process.env.NEXT_PUBLIC_TIMEZONE);
};

export const getISOFormatFromSchedule = (datetime: string) => {
  const strArr = datetime.split(' ');
  const date = strArr[0];
  const time = strArr[1].split(':');
  const a = strArr[2];
  let newTime = time[0];

  if (a === 'PM' && time[0] !== '12') newTime = `${parseInt(time[0], 10) + 12}`;
  else if (a === 'AM' && time[0] === '12') newTime = '00';
  else if (a === 'AM' && time[0].length === 1) newTime = '0' + time[0];

  return `${date}T${newTime}:${time[1]}`;
};

export const tzSchedToDayJsInsance = (bookingDate: string, schedule: string) => {
  return dayjs.tz(
    dayjs(getISOFormatFromSchedule(`${bookingDate} ${schedule}`)).format('YYYY-MM-DDTHH:mm'),
    process.env.NEXT_PUBLIC_TIMEZONE,
  );
};

export const buildGoogleCalendarDateTime = (utcDateTime: string | Date) => {
  return dayjs.utc(utcDateTime).format('YYYY-MM-DDTHH:mm:00.000') + 'Z';
};

// temporary helper
export const getProductPrice = (bookingDate: string, product: IProduct) => {
  const bookedDay = dayjs(bookingDate).day();
  if (bookedDay > 0 && bookedDay < 6) {
    if (product.name === 'DAY SWIMMING') return 7500;
    if (product.name === 'NIGHT SWIMMING') return 7500;
    if (product.name.includes('OVERNIGHT SWIMMING')) return 15000;
  }

  return product.price;
};
