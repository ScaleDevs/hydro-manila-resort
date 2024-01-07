import * as React from 'react';
import Head from 'next/head';
import { Alert, AlertIcon, Button, Collapse, Heading, SlideFade, Stack, Text } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { trpc } from '@/utils/trpc';
import Layout from '@/layouts/index';
import { TextField } from '@/components/TextField';
import { TextAreaField } from '@/components/TextAreaField';
import { GetApp } from '@/appspecs/theme';

const schema = z.object({
  refNo: z.string().min(1, 'Required'),
  reason: z.string().min(1, 'Required'),
});

type FormSchemaType = z.infer<typeof schema>;

function BookingCancel() {
  const { mutate, isLoading, isSuccess, error, reset: resetMutation } = trpc.payment.createRefund.useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
  });

  const onCancellation = (data: FormSchemaType) => {
    mutate(data, {
      onSuccess() {
        reset();
      },
      onSettled() {
        setTimeout(() => {
          resetMutation();
        }, 5000);
      },
    });
  };

  return (
    <Layout>
      <Head>
        <title>Booking | Cancellation</title>
        <meta name='description' content='form to cancel booking' />
        <link rel='icon' href={GetApp.Favicon} />
      </Head>

      <br />

      <Stack w={{ base: '90%', lg: '1000px' }} mx='auto'>
        <SlideFade in offsetY='20px'>
          <form onSubmit={handleSubmit(onCancellation)}>
            <Stack w='100%' spacing={5}>
              <Heading>Cancellation Form</Heading>

              <Collapse in={true}>
                <Alert status='info' borderRadius='sm'>
                  <AlertIcon />
                  <Text>Cancellation 3 days before your booking date will not be allowed!</Text>
                </Alert>
              </Collapse>

              <Collapse in={isSuccess}>
                <Alert status='success' borderRadius='xl' color='white'>
                  <AlertIcon />
                  <Text color='green.700'>
                    Cancellation Submitted! You will receive an email within 30mins regarding the next steps
                  </Text>
                </Alert>
              </Collapse>

              <Collapse in={error?.data?.code === 'BAD_REQUEST' || error?.data?.code === 'INTERNAL_SERVER_ERROR'}>
                <Alert status='error' borderRadius='xl'>
                  <AlertIcon />
                  <Text color='red.700'>
                    Something went wrong! Kindly Try again or contact customer support through{' '}
                    {process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? ''}
                  </Text>
                </Alert>
              </Collapse>

              <Collapse in={error?.data?.code === 'FORBIDDEN'}>
                <Alert status='error' borderRadius='xl'>
                  <AlertIcon />
                  <Text color='red.700'>{error?.message}</Text>
                </Alert>
              </Collapse>

              <TextField
                label='Booking Reference No:'
                required
                register={register}
                property='refNo'
                errMsg={errors.refNo?.message}
                placeholder='enter reference no here'
              />

              <TextAreaField
                label='Reason for Cancellation:'
                required
                register={register}
                property='reason'
                errMsg={errors.reason?.message}
                placeholder='enter reason for cancellation here'
              />

              <Stack direction='row' justifyContent='left'>
                <Button type='submit' isLoading={isLoading}>
                  SUBMIT
                </Button>
              </Stack>
            </Stack>
          </form>
        </SlideFade>
      </Stack>
    </Layout>
  );
}

export default BookingCancel;
