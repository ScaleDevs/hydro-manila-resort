import { base64Encoding } from '@/utils/helper';

export interface CreatePaymentMethodInput {
  type: 'card' | 'gcash';
}

export interface PaymentMethodResource {
  data: {
    id: string;
    type: string;
    attributes: {
      livemode: boolean;
      type: 'card' | 'gcash';
      billing?: {
        address: {
          city: string;
          country: string;
          line1: string;
          line2: string;
          postal_code: string;
          state: string | null;
        };
        email: string;
        name: string;
        phone: string;
      };
      created_at: number;
      updated_at: number;
      details?: {
        exp_month: number;
        exp_year: number;
        last4: string;
      };
      metadata: any;
    };
  };
}

export const createPaymentMethod = async (data: CreatePaymentMethodInput) => {
  console.log('CREATING');

  if (!process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY) return;

  const response = await fetch('https://api.paymongo.com/v1/payment_methods', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
      authorization: 'Basic ' + base64Encoding(process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY + ':'),
    },
    body: JSON.stringify({
      data: {
        attributes: {
          ...data,
        },
      },
    }),
  });

  const result = (await response.json()) as PaymentMethodResource;

  console.log(result);

  return result.data;
};
