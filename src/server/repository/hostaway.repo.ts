import fetch from 'node-fetch';
import prisma from './prisma.client';
import { GetVars } from '@/appspecs/vars';

type ReservationDetails = {
  id: number;
  guestName: string;
  numberOfGuests: number;
  arrivalDate: string;
  departureDate: string;
  checkInTime: number;
  checkOutTime: number;
  phone: string;
  totalPrice: number;
  status: string;
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

export const createReservation = async (details: Omit<ReservationDetails, 'id' | 'status'>) => {
  console.log('EXECUTING :: createReservation');

  try {
    const secrets = await prisma.secrets.findFirst();
    if (!secrets)
      return {
        conflict: true,
        message: 'No token was found to be used to access the api',
      };

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

    if (result.status === 403 && !!res.message.includes('Requested dates are not available for listing')) {
      return {
        conflict: true,
        message: 'Requested date is not available',
      };
    }

    if (res.status === 'fail')
      return {
        conflict: true,
        message: 'Something went wrong',
      };

    console.log('SUCCESS EXECUTION :: createReservation');

    return res.result as ReservationDetails;
  } catch (err) {
    console.log(err);
    return {
      conflict: true,
      message: 'Something went wrong',
    };
  }
};

export const updateReservation = async (
  reservationId: string,
  details: { numberOfGuests?: number; arrivalDate?: string; departureDate?: string },
) => {
  console.log('EXECUTING :: updateReservation');

  try {
    const secrets = await prisma.secrets.findFirst();
    if (!secrets)
      return {
        conflict: true,
        message: 'No token was found to be used to access the api',
      };

    const result = await fetch('https://api.hostaway.com/v1/reservations' + '/' + reservationId, {
      method: 'put',
      body: JSON.stringify({
        ...details,
      }),
      headers: {
        'Content-Type': 'application/json',
        'Cache-control': 'no-cache',
        Authorization: 'Bearer ' + secrets.accessToken,
      },
    });

    const res = (await result.json()) as any;

    if (result.status === 403 && !!res.message.includes('Requested dates are not available for listing')) {
      console.error(res);
      return {
        conflict: true,
        message: 'Requested date is not available',
      };
    }

    if (res.status === 'fail') {
      console.error(res);
      return {
        conflict: true,
        message: 'Something went wrong! Kindly Try Again!',
      };
    }

    console.log('SUCCESS EXECUTION :: updateReservation');

    return res.result as ReservationDetails;
  } catch (err) {
    console.log(err);
    return {
      conflict: true,
      message: 'Something went wrong! Kindly Try Again!',
    };
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
    return res as { status: string; result: ReservationDetails[] };
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const cancelReservation = async (reservationId: string, cancelledBy: 'guest' | 'host') => {
  console.log('EXECUTING :: cancelReservation');

  try {
    const secrets = await prisma.secrets.findFirst();
    if (!secrets)
      return {
        conflict: true,
        message: 'Something went wrong! Kindly Try Again!',
      };

    const result = await fetch('https://api.hostaway.com/v1/reservations' + '/' + reservationId + '/statuses/cancelled', {
      method: 'put',
      body: JSON.stringify({ cancelledBy }),
      headers: {
        'Content-type': 'application/json',
        'Cache-control': 'no-cache',
        Authorization: 'Bearer ' + secrets.accessToken,
      },
    });

    const res = (await result.json()) as any;

    if (res.status === 'fail') {
      console.error(res);
      return {
        conflict: true,
        message: 'Something went wrong! Kindly Try Again!',
      };
    }

    console.log('SUCCESS EXECUTION :: cancelReservation');
    return res as { status: string };
  } catch (err) {
    console.log(err);
    return {
      conflict: true,
      message: 'Something went wrong! Kindly Try Again!',
    };
  }
};
