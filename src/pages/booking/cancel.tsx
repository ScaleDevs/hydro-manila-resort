import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Alert, AlertIcon, Button, Fade, Heading, Stack, Text } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { trpc } from '@/utils/trpc';
import Layout from '@/layouts/index';
import { TextField } from '@/components/TextField';
import { TextAreaField } from '@/components/TextAreaField';

const schema = z.object({
  refNo: z.string().min(1, 'Required'),
  reason: z.string().min(1, 'Required'),
});

type FormSchemaType = z.infer<typeof schema>;

function BookingCancel() {
  const { mutate, isLoading, isSuccess } = trpc.payment.createRefund.useMutation();
  const [refundType, setRefundType] = useState<'MANUAL_PROCESSING' | 'AUTOMATIC_PROCESSING' | 'FAILED' | null>(null);

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
      onSuccess(data) {
        setRefundType(data.status);
        reset();
      },
    });
  };

  return (
    <Layout>
      <Head>
        <title>Booking | Cancellation</title>
        <meta name='description' content='form to cancel booking' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <br />

      <Stack w={{ base: '90%', lg: '1000px' }} mx='auto'>
        <Stack direction='row' justifyContent='left'>
          <Link href='/'>
            <Button>BACK TO BOOKING</Button>
          </Link>
        </Stack>

        <br />

        <form onSubmit={handleSubmit(onCancellation)}>
          <Stack w='100%' spacing={5}>
            <Heading>Cancellation Form</Heading>

            {isSuccess ? (
              refundType === 'FAILED' ? (
                <Fade in={isSuccess}>
                  <Alert status='error' borderRadius='sm'>
                    <AlertIcon />
                    <Text>Something went wrong! Kindly Try again or contact customer support through test@gmail.com</Text>
                  </Alert>
                </Fade>
              ) : (
                <Fade in={isSuccess}>
                  <Alert status='success' borderRadius='sm'>
                    <AlertIcon />
                    <Text>Cancellation Submitted! You will receive an email within 30mins regarding the next steps</Text>
                  </Alert>
                </Fade>
              )
            ) : (
              <Fade in={!isSuccess}>
                <Alert status='info' borderRadius='sm'>
                  <AlertIcon />
                  <Text>Cancellation 3 days before your booking date will not be allowed!</Text>
                </Alert>
              </Fade>
            )}

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
      </Stack>
    </Layout>
  );
}

export default BookingCancel;
