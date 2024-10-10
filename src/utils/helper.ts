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

export const tzSchedToUnix = (date: string, time: number) => {
  return dayjs.tz(`${date}T${time}:00:00`, process.env.NEXT_PUBLIC_TIMEZONE).unix();
};

export const buildGoogleCalendarDateTime = (utcDateTime: string | Date) => {
  return dayjs.utc(utcDateTime).format('YYYY-MM-DDTHH:mm:00.000') + 'Z';
};

export const getExtraHeadsTotal = (guests: number, min: number, fee: number) => {
  if (guests > min) return (guests - min) * fee;
  return 0;
};

export const getSubtractedHeadsTotal = (guests: number, min: number, fee: number) => {
  return (guests - min) * fee;
};

export const getExtraHeads = (guests: number, min: number) => {
  if (guests > min) return guests - min;
  return 0;
};

// temporary helper for price rates
export const getProductPrice = (bookingDate: string, product: IProduct, tz?: string) => {
  const promos = !!product.promos ? product.promos : [];

  if (promos.length > 0) {
    for (const promo of promos) {
      const now = dayjs.utc(bookingDate).unix();

      const promoStart = dayjs.utc(promo.promoStart).unix();
      const promoEnd = dayjs.utc(promo.promoEnd).unix();

      if (now >= promoStart && now < promoEnd) return promo.price;
    }
  }

  if (process.env.GENERAL_APP_NAME === 'HydroResortManila' || process.env.NEXT_PUBLIC_APP === 'HydroResortManila') {
    const bookedDate = dayjs(bookingDate);
    const isPeakMonth2024 = bookedDate.year() === 2024 && [10, 11].includes(bookedDate.month());
    const isPeakMonth2025 = bookedDate.year() === 2025 && [0, 1].includes(bookedDate.month());

    if (!isPeakMonth2024 && !isPeakMonth2025) return product.price;

    if (product.name === 'DAY SWIMMING') return 8000;
    if (product.name === 'NIGHT SWIMMING') return 8000;
    if (product.name.includes('OVERNIGHT SWIMMING')) return 16000;
  }

  if (process.env.GENERAL_APP_NAME === 'VillaLeonora' || process.env.NEXT_PUBLIC_APP === 'VillaLeonora') {
    const bookedDate = dayjs(bookingDate);
    const bookedDay = bookedDate.day();

    const isPeakMonth = bookedDate.year() === 2024 && [8, 9].includes(bookedDate.month());

    if (isPeakMonth && product.name.includes('OVERNIGHT')) {
      if (bookedDay > 0 && bookedDay < 5) return 10000;
      else return 15000;
    }

    if (product.name.includes('OVERNIGHT')) {
      if (bookedDay > 0 && bookedDay < 5) return 15000;
      else return 20000;
    }
  }

  return product.price;
};

export const capsFirstLetter = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
