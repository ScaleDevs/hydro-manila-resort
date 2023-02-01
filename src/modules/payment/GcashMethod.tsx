import * as React from 'react';
import { Button, useToast } from '@chakra-ui/react';

import { trpc } from '@/utils/trpc';
import { createPaymentMethod } from '../fetch-calls';
import useBookingStoreTrack from '@/store/booking.store';

export interface IGcashMethodProps {}

export default function GcashMethod({}: IGcashMethodProps) {
  const { clientKey, paymentIntentId } = useBookingStoreTrack();
  const { mutate } = trpc.payment.attachPaymentMethodToIntent.useMutation();
  const toast = useToast();

  const handlePayment = async () => {
    try {
      const paymentMethod = await createPaymentMethod({ type: 'gcash' });

      if (paymentMethod && clientKey && paymentIntentId)
        mutate(
          {
            clientKey,
            paymentIntentId,
            paymentMethodId: paymentMethod.id,
            returnUrl: process.env.NEXT_PUBLIC_RETURN_URL || 'http://localhost:3000/booking-status',
          },
          {
            onSuccess({ data }) {
              if (data.attributes.next_action?.redirect) window.location.href = data.attributes.next_action.redirect.url;
            },
          },
        );
    } catch (err) {
      console.log('ERROR HERE');
      console.log(err);
      toast({
        description: 'Kindly Try Again',
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    }
  };

  return (
    <>
      <Button mt='20px' onClick={handlePayment}>
        PROCEED
      </Button>
    </>
  );
}
