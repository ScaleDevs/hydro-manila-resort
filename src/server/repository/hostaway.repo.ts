import fetch from 'node-fetch';
import prisma from './prisma.client';
import { GetVars } from '@/appspecs/vars';

type ReservationDetails = {
  guestName: string;
  numberOfGuests: number;
  arrivalDate: string;
  departureDate: string;
  checkInTime: number;
  checkOutTime: number;
  phone: string;
  totalPrice: number;
};

type AccessTokenResponse = {
  token_type: 'Bearer';
  expires_in: number;
  access_token: string;
};

const getSecrets = async (secretId: string) => {
  const secrets = await prisma.secrets.findFirst({ where: { secretId } });
  if (!secrets) return false;
  return secrets;
};

export const generateToken = async (secretId: string) => {
  console.log('EXECUTING :: generateToken');

  try {
    const secrets = await getSecrets(secretId);

    if (!secrets) return false;

    const result = await fetch('https://api.hostaway.com/v1/accessTokens', {
      method: 'post',
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'general',
        client_id: secrets.clientId,
        client_secret: secrets.clientSecret,
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-control': 'no-cache',
      },
    });

    const newAccessToken = (await result.json()) as AccessTokenResponse;

    console.log('NEW ACCESS TOKEN GENERATED :: ', newAccessToken);

    await prisma.secrets.update({
      where: { secretId: secrets.secretId },
      data: {
        accessToken: newAccessToken.access_token,
        expiresIn: newAccessToken.expires_in,
        createdAt: new Date(),
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { secretId: _secretId, ...rest } = secrets;

    // keep record for old tokens
    await prisma.secrets.create({
      data: {
        ...rest,
        isActive: false,
      },
    });

    console.log('SUCCESS EXECUTION :: generateToken');

    return newAccessToken.access_token;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const createReservation = async (details: ReservationDetails) => {
  console.log('EXECUTING :: createReservation');

  try {
    const secrets = await prisma.secrets.findFirst();
    if (!secrets) return false;

    const result = await fetch('https://api.hostaway.com/v1/reservations', {
      method: 'post',
      body: JSON.stringify({
        ...details,
        listingMapId: GetVars.hostAwayListingId,
        channelId: 2000,
        isGuestIdentityVerified: 1,
      }),
      headers: {
        'Content-Type': 'application/json',
        'Cache-control': 'no-cache',
        Authorization: 'Bearer ' + secrets.accessToken,
      },
    });

    const res = (await result.json()) as any;

    console.log('SUCCESS EXECUTION :: createReservation');

    return res;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const getReservations = async ({
  arrivalStartDate,
  arrivalEndDate,
}: {
  arrivalStartDate: string;
  arrivalEndDate: string;
}) => {
  console.log('EXECUTING :: getReservations');

  const url = new URL('https://api.hostaway.com/v1/reservations');
  url.searchParams.append('listingId', GetVars.hostAwayListingId.toString());
  url.searchParams.append('arrivalStartDate', arrivalStartDate);
  url.searchParams.append('arrivalEndDate', arrivalEndDate);

  try {
    const secrets = await prisma.secrets.findFirst();
    if (!secrets) return false;

    const result = await fetch(url.toString(), {
      method: 'get',
      headers: {
        'Cache-control': 'no-cache',
        Authorization: 'Bearer ' + secrets.accessToken,
      },
    });

    const res = (await result.json()) as any;

    console.log('SUCCESS EXECUTION :: getReservations');
    return res;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const deleteReservation = async (reservationId: string) => {
  console.log('EXECUTING :: deleteReservation');

  try {
    const secrets = await prisma.secrets.findFirst();
    if (!secrets) return false;

    const result = await fetch('https://api.hostaway.com/v1/reservations' + '/' + reservationId, {
      method: 'delete',
      headers: {
        'Content-type': 'application/json',
        'Cache-control': 'no-cache',
        Authorization: 'Bearer ' + secrets.accessToken,
      },
    });

    const res = (await result.json()) as any;

    console.log('SUCCESS EXECUTION :: deleteReservation');
    return res;
  } catch (err) {
    console.log(err);
    return false;
  }
};
