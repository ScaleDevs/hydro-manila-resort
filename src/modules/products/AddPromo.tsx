import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, SlideFade, Heading, Stack, Button, Alert, AlertIcon } from '@chakra-ui/react';

import { trpc } from '@/utils/trpc';
import { DateTimeField } from '@/components/DateTimeField';
import { NumberFieldV2 } from '@/components/NumberFieldV2';

export interface IAddPromoProps {
  productId: string;
  isIn?: boolean;
}

const schema = z.object({
  promoStart: z.string(),
  promoEnd: z.string(),
  price: z.preprocess((v) => Number(parseInt(v as string, 10)), z.number()),
});

type FormSchemaType = z.infer<typeof schema>;

export function AddPromo({ productId, isIn }: IAddPromoProps) {
  const { mutate, isSuccess, isLoading, error } = trpc.product.addPromo.useMutation();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset: resetFormFields,
  } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
  });

  const submitUpdate = async (data: FormSchemaType) => {
    console.log('SUBMITTING', data);
    mutate(
      {
        id: productId,
        promo: data,
      },
      {
        onSuccess() {
          resetFormFields();
        },
      },
    );
  };

  return (
    <SlideFade in={isIn} offsetY='20px'>
      <Box w='100%' mx='auto' bg='gray.50' p='25px' boxShadow='xl' borderRadius='sm'>
        <Heading textAlign='center'>EDIT BOOKING</Heading>

        <br />

        <Box w={{ base: '95%', md: '90%' }} mx='auto'>
          <form onSubmit={handleSubmit(submitUpdate)}>
            <Stack spacing={5}>
              <DateTimeField
                type='date'
                required
                label='Promo Start Period:'
                register={register}
                property='promoStart'
                errMsg={errors.promoStart?.message}
              />

              <DateTimeField
                type='date'
                required
                label='Promo End Period:'
                register={register}
                property='promoEnd'
                errMsg={errors.promoEnd?.message}
              />

              <NumberFieldV2 control={control} property='price' label='Price' errMsg={errors.price?.message} />
            </Stack>

            <br />

            {isSuccess && (
              <>
                <Alert status='success' bg='green.500' borderRadius='sm' color='white'>
                  <AlertIcon color='green.200' />
                  Promo Successfuly Added!
                </Alert>
                <br />
              </>
            )}

            {!!error && (
              <>
                <Alert status='error' borderRadius='sm' color='red.600'>
                  <AlertIcon />
                  {error?.message || ''}
                </Alert>
                <br />
              </>
            )}

            <Button type='submit' isLoading={isLoading}>
              ADD PROMO
            </Button>
          </form>
        </Box>

        <br />
      </Box>
    </SlideFade>
  );
}
