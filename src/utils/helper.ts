import dayjs from 'dayjs';

export const base64Encoding = (str: string) => {
  const bufferObj = Buffer.from(str, 'utf8');
  const result = bufferObj.toString('base64');
  return result;
};

export const dateToIsoString = (date: string) => {
  return dayjs.tz(date, process.env.NEXT_PUBLIC_TIMEZONE).toISOString();
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
