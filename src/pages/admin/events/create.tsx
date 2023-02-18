import Head from 'next/head';
import Link from 'next/link';
import dayjs from 'dayjs';
import { Box, Button, Stack, Heading, Alert, AlertIcon, SlideFade } from '@chakra-ui/react';
import { BsArrowLeft } from 'react-icons/bs';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import Layout from '@/layouts/admin';
import { TextField } from '@/components/TextField';
import { trpc } from '@/utils/trpc';
import { DateTimeField } from '@/components/DateTimeField';

const schema = z.object({
  description: z.string().min(1, 'Required'),
  startSession: z.string().min(1, 'Required'),
  endSession: z.string().min(1, 'Required'),
});

type FormSchemaType = z.infer<typeof schema>;

function CreateScheduledEvent() {
  const { mutate, isLoading, error, isSuccess } = trpc.scheduledevent.createScheduledEvent.useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
  });

  const addScheduledEvent = (data: FormSchemaType) => {
    mutate(
      {
        ...data,
        startSession: dayjs.tz(data.startSession).toISOString(),
        endSession: dayjs.tz(data.endSession).toISOString(),
      },
      {
        onSuccess() {
          reset();
        },
      },
    );
  };

  return (
    <Layout>
      <Head>
        <title>Admin | Create Schedule</title>
        <meta name='description' content='Sample Home page with nextjs' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Stack spacing={7} w='100%' bg='gray.50' p='25px' borderRadius='sm' boxShadow='xl'>
        <Link href='/admin/events'>
          <Button borderRadius='2xl'>
            <BsArrowLeft />
          </Button>
        </Link>

        <Heading>Create Scheduled Event Form</Heading>

        {error ? (
          <Alert status='error' borderRadius='sm' color='red.600'>
            <AlertIcon />
            {error?.message}!
          </Alert>
        ) : (
          ''
        )}

        {isSuccess ? (
          <Alert status='success' borderRadius='sm' color='green.600'>
            <AlertIcon />
            Scheduled Event Successfuly created!
          </Alert>
        ) : (
          ''
        )}
        <SlideFade in offsetY='20px'>
          <Box w='100%' mx='auto'>
            <form onSubmit={handleSubmit(addScheduledEvent)}>
              <Stack spacing={6}>
                <TextField
                  required
                  label='DESCRIPTION:'
                  register={register}
                  property='description'
                  placeholder='Schedule Event Description'
                  errMsg={errors.description?.message}
                />

                <Stack direction={{ base: 'column', md: 'row' }}>
                  <DateTimeField
                    required
                    label='START:'
                    register={register}
                    property='startSession'
                    errMsg={errors.startSession?.message}
                  />
                  <DateTimeField
                    required
                    label='END:'
                    register={register}
                    property='endSession'
                    errMsg={errors.endSession?.message}
                  />
                </Stack>

                <Button type='submit' borderRadius='sm' w='200px' isLoading={isLoading}>
                  Add Schedule Event
                </Button>
              </Stack>
            </form>
          </Box>
        </SlideFade>
      </Stack>
    </Layout>
  );
}

export default CreateScheduledEvent;
