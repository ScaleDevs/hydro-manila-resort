import * as React from 'react';
import { Button, Heading, Stack, Text } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { trpc } from '@/utils/trpc';
import SelectPaymentMethod from './SelectPaymenthMethod';
import { createPaymentMethod } from '../fetch-calls';
import useBookingStoreTrack from '@/store/booking.store';

const schema = z.object({
  type: z.enum(['gcash', 'card'], {
    invalid_type_error: 'Please select payment method',
  }),
});

type FormSchemaType = z.infer<typeof schema>;

export interface IPaymentFormProps {}

export default function PaymentForm({}: IPaymentFormProps) {
  const { clientKey, paymentIntentId } = useBookingStoreTrack();
  const { mutate } = trpc.payment.attachPaymentMethodToIntent.useMutation();

  const {
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
  });

  console.log(errors);

  const handlePayment = async (data: FormSchemaType) => {
    try {
      const paymentMethod = await createPaymentMethod({ type: data.type });

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
              console.log('SUCCESS');
              console.log(data);
              if (data.attributes.next_action?.redirect) {
                window.location.href = data.attributes.next_action.redirect.url;
              }
            },
          },
        );
    } catch (err) {
      console.log('ERROR HERE');
      console.log(err);
    }
  };

  return (
    <form onSubmit={handleSubmit(handlePayment)}>
      <Heading as='h1' size='lg' noOfLines={1} textAlign={{ bas: 'center', md: 'left' }}>
        Select Payment Method:
      </Heading>
      <Stack>
        <SelectPaymentMethod property='type' setValue={setValue} />
        <Text color='red'>{errors.type?.message === 'Required' ? 'Please select payment method!' : ''}</Text>
      </Stack>

      <Button borderRadius='sm' mt='20px' type='submit' disabled={Object.keys(errors).length > 0}>
        PROCEED
      </Button>
    </form>
  );
}
