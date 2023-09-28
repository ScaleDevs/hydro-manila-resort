import Head from 'next/head';
import Link from 'next/link';
import { Box, Button, Stack, Heading, Alert, AlertIcon, SlideFade, useToast } from '@chakra-ui/react';
import { BsArrowLeft } from 'react-icons/bs';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { GetApp } from '@/appspecs/theme';
import { GetVars } from '@/appspecs/vars';
import { trpc } from '@/utils/trpc';
import useAuthStoreTrack from '@/store/auth.store';
import Layout from '@/layouts/admin';
import { TextField } from '@/components/TextField';
import { DateTimeField } from '@/components/DateTimeField';
import { NumberFieldV2 } from '@/components/NumberFieldV2';
import { SelectNumberField } from '@/components/SelectNumberField';

const schema = z.object({
  guestName: z.string().min(1),
  guests: z.preprocess((v) => Number(v), z.number()),
  description: z.string().min(1, 'Required'),
  startSession: z.string().min(1, 'Required'),
  endSession: z.string().min(1, 'Required'),
  checkInTime: z.number(),
  checkOutTime: z.number(),
});

type FormSchemaType = z.infer<typeof schema>;

function CreateScheduledEvent() {
  const { username } = useAuthStoreTrack();
  const toast = useToast();
  const { mutate, isLoading, error, isSuccess, reset: resetMutation } = trpc.scheduledevent.createScheduledEvent.useMutation();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
    defaultValues: {
      guestName: '',
      guests: 0,
      description: '',
      checkInTime: GetVars.appName === 'VillaLeonora' ? undefined : 1,
      checkOutTime: GetVars.appName === 'VillaLeonora' ? undefined : 1,
    },
  });

  const addScheduledEvent = (data: FormSchemaType) => {
    if (!username) {
      toast({
        title: 'Invalid Admin User!',
        position: 'top-right',
        duration: 5000,
        isClosable: true,
        status: 'error',
      });

      return;
    }

    const payload = {
      guestName: data.guestName,
      guests: data.guests,
      description: data.description,
      startSession: data.startSession,
      endSession: data.endSession,
      createdBy: username,
    };

    if (GetVars.appName === 'VillaLeonora') {
      payload['startSession'] = `${data.startSession}T${data.checkInTime}:00`;
      payload['endSession'] = `${data.endSession}T${data.checkOutTime}:00`;
    }

    mutate(payload, {
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
        <title>Admin | Create Schedule</title>
        <meta name='description' content='Sample Home page with nextjs' />
        <link rel='icon' href={GetApp.Favicon} />
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
          <Alert status='success' bg='green.500' borderRadius='sm' color='white'>
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
                  label='Guest Name:'
                  register={register}
                  property='guestName'
                  placeholder='Enter guest name'
                  errMsg={errors.description?.message}
                />

                <NumberFieldV2 control={control} property='guests' label='Guests' required errMsg={errors.guests?.message} />

                <TextField
                  required
                  label='Description:'
                  register={register}
                  property='description'
                  placeholder='Schedule Event Description'
                  errMsg={errors.description?.message}
                />

                <Stack direction={{ base: 'column', md: 'row' }}>
                  <DateTimeField
                    required
                    label='Start:'
                    register={register}
                    property='startSession'
                    errMsg={errors.startSession?.message}
                    type={GetVars.appName === 'VillaLeonora' ? 'date' : 'datetime-local'}
                  />
                  <DateTimeField
                    required
                    label='End:'
                    register={register}
                    property='endSession'
                    errMsg={errors.endSession?.message}
                    type={GetVars.appName === 'VillaLeonora' ? 'date' : 'datetime-local'}
                  />
                </Stack>

                {GetVars.appName === 'VillaLeonora' && (
                  <Stack direction={{ base: 'column', md: 'row' }}>
                    <SelectNumberField
                      label='Check In Time'
                      placeholder='Hour'
                      maxOpt={23}
                      register={register}
                      property='checkInTime'
                      errMsg={errors.checkInTime?.message}
                    />

                    <SelectNumberField
                      label='Check Out Time'
                      placeholder='Hour'
                      maxOpt={23}
                      register={register}
                      property='checkOutTime'
                      errMsg={errors.checkOutTime?.message}
                    />
                  </Stack>
                )}

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
