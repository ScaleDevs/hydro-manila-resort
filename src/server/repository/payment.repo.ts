import fetch from 'node-fetch';
import { constants } from '../constants';
import { base64Encoding } from '@/utils/helper';
import { PaymentMethodTypes, PaymentIntentResource, RefundResource, RefundResourceReason } from '@/utils/types';

export interface CreatePaymentIntentAttr {
  amount: number;
  currency: 'PHP';
  description?: string;
  capture_type: 'automatic' | 'manual';
  statement_descriptor?: string;
  payment_method_allowed: PaymentMethodTypes[];
  payment_method_options: {
    card: {
      request_three_d_secure: 'any';
    };
  };
  metadata: any;
}

export const createPaymentIntent = async (data: CreatePaymentIntentAttr) => {
  const response = await fetch('https://api.paymongo.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
      authorization: 'Basic ' + base64Encoding(`${constants.paymongo.secretKey as string}:`),
    },
    body: JSON.stringify({
      data: {
        attributes: {
          ...data,
        },
      },
    }),
  });

  const result = (await response.json()) as any;

  return result as PaymentIntentResource;
};

export interface AttachPaymentMethodToIntentAttr {
  paymentIntentId: string;
  paymentMethodId: string;
  clientKey: string;
  returnUrl?: string;
}

export const attachPaymentMethodToIntent = async (data: AttachPaymentMethodToIntentAttr) => {
  const response = await fetch(`https://api.paymongo.com/v1/payment_intents/${data.paymentIntentId}/attach`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
      authorization: 'Basic ' + base64Encoding(`${constants.paymongo.secretKey as string}:`),
    },
    body: JSON.stringify({
      data: {
        attributes: {
          payment_method: data.paymentMethodId,
          client_key: data.clientKey,
          return_url: data.returnUrl,
        },
      },
    }),
  });

  const result = (await response.json()) as PaymentIntentResource;

  return result;
};

export const getPaymentIntentSession = async (paymentIntentId: string) => {
  const response = await fetch(`https://api.paymongo.com/v1/payment_intents/${paymentIntentId}`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      authorization: 'Basic ' + base64Encoding(`${constants.paymongo.secretKey as string}:`),
    },
  });

  const result = (await response.json()) as PaymentIntentResource;

  return result.data;
};

export interface CreateRefundInput {
  amount: number;
  payment_id: string;
  reason: RefundResourceReason;
  metadata?: any;
}

export const createRefund = async (data: CreateRefundInput) => {
  const response = await fetch('https://api.paymongo.com/refunds', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
      authorization: 'Basic ' + base64Encoding(`${constants.paymongo.secretKey as string}:`),
    },
    body: JSON.stringify({
      data: {
        attributes: {
          ...data,
        },
      },
    }),
  });

  const result: any = await response.json();

  if (!!result.errors && result.errors[0].code === 'available_balance_insufficient') {
    return {
      error: 'available_balance_insufficient',
    };
  } else if (!!result.errors) {
    return {
      error: 'something_went_wrong',
    };
  }

  return result as RefundResource;
};

export const getRefundDetails = async (refundId: string) => {
  const response = await fetch('https://api.paymongo.com/refunds/' + refundId, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      authorization: 'Basic ' + base64Encoding(`${constants.paymongo.secretKey as string}:`),
    },
  });

  const result = (await response.json()) as RefundResource | undefined;

  if (result) return result.data;
};
