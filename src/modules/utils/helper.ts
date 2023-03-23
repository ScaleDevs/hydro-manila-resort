import genString from 'randomstring';
import dayjs from 'dayjs';
import { IPHGeo } from '@/types';
import phGeoJsonData from './ph-geo.json';

export const RegexValidations = {
  NumberOnly: /(^[0-9]+$|^$)/,
  FloatOnly: /(^[1-9]\d*(\.\d+)?$)/,
  NoNumber: /(^[a-zA-Z\s-'.]*$)/,
  Address: /(^[a-zA-Z0-9\s-'#.]*$)/,
  MobileNumber: /^[0-9-]*$/,
  hasNumber: /[0-9]/,
  acceptedNumberWithNine: /\b9+/,
  acceptedNumberWithZero: /\b09+/,
  hasLowerCase: /[a-z]/,
  hasUpperCase: /[A-Z]/,
  hasSpecialChar: /[`!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/,
  masterCard: new RegExp('^5[1-5][0-9]{14}|^(222[1-9]|22[3-9]\\d|2[3-6]\\d{2}|27[0-1]\\d|2720)[0-9]{12}$'),
  visaCard: new RegExp('^4[0-9]{12}(?:[0-9]{3})?$'),
};

export const createTempPassword = () => {
  return (
    genString.generate({
      length: 2,
      charset: 'alphanumeric',
    }) +
    genString.generate({
      length: 2,
      charset: 'numeric',
    }) +
    genString.generate({
      length: 1,
      charset: '!@#$%^&*()_+~`|}{[]:;?><,./-=\\',
    }) +
    genString.generate({
      length: 2,
      charset: 'numeric',
    }) +
    genString.generate({
      length: 2,
      charset: 'alphabetic',
      capitalization: 'uppercase',
    }) +
    genString.generate({
      length: 1,
      charset: '!@#$%^&*()_+~`|}{[]:;?><,./-=\\',
    }) +
    genString.generate({
      length: 2,
      charset: 'alphabetic',
      capitalization: 'lowercase',
    })
  );
};

export const publicRoutes = {
  '/admin/login': '/admin/login',
};

export const isPublicRoute = (pathname: string) => {
  if (!publicRoutes[pathname as keyof typeof publicRoutes]) return false;
  return true;
};

export const getCurrentTimestamp = () => {
  return dayjs().unix();
};

export const PHpeso = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'PHP',
});

export const getProvincesOptions = () => {
  const locations = phGeoJsonData as IPHGeo;

  return locations.map((arr) => {
    return {
      label: arr[0].name,
      value: arr[0].name,
    };
  });
};

export const getCitiesOptions = (province: string) => {
  const locations = phGeoJsonData as IPHGeo;

  const provIndex = locations.find((arr) => {
    return arr[0].name === province;
  });

  if (provIndex)
    return provIndex[1].map((record) => {
      return {
        label: record.name,
        value: record.name,
      };
    });

  return [];
};

export const tableFormatTimeDisplay = (timeString: string) => {
  return dayjs.utc(timeString).tz(process.env.NEXT_PUBLIC_TIMEZONE).format('MMM DD, YYYY hh:mm A');
};
