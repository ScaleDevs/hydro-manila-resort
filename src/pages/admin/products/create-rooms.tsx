import Head from 'next/head';
import Link from 'next/link';
import { Box, Button, Stack, Heading, useToast, Text, SlideFade } from '@chakra-ui/react';
import { BsArrowLeft } from 'react-icons/bs';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import Layout from '@/layouts/admin';
import { TextField } from '@/components/TextField';
import { trpc } from '@/utils/trpc';
import { RadioBooleanField } from '@/components/RadioBooleanField';
import { GetApp } from '@/appspecs/theme';
import { NumberFieldV2 } from '@/components/NumberFieldV2';

const schema = z.object({
  roomIdentityName: z.string().min(1, 'Required'),
  description: z.string().optional(),
  guests: z.number().min(1, 'Must be greater than 0'),
  price: z.number().min(1, 'Must be greater than 0'),
  bedSingle: z.number(),
  bedDouble: z.number(),
  bedQueen: z.number(),
  withBathroom: z.boolean(),
  withAircon: z.boolean(),
  withFan: z.boolean(),
});

type FormSchemaType = z.infer<typeof schema>;

const Label = ({ children }: any) => {
  return <Text fontWeight='semibold'>{children}</Text>;
};

function Admin() {
  const { mutate, isLoading } = trpc.room.create.useMutation();
  const toast = useToast();

  const defaultValues = {
    bedSingle: 0,
    bedDouble: 0,
    bedQueen: 0,
    price: 0,
    guests: 0,
  };

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const createAddOnSubmit = (data: FormSchemaType) => {
    const { description, ...rest } = data;

    const payload = {
      ...rest,
      description: description ? description : null,
    };

    mutate(payload, {
      onSuccess() {
        toast({
          title: 'Room created.',
          status: 'success',
          duration: 9000,
          isClosable: true,
        });
        reset();
      },
    });
  };
  return (
    <Layout>
      <Head>
        <title>Admin | Create Room</title>
        <meta name='description' content='Sample Home page with nextjs' />
        <link rel='icon' href={GetApp.Favicon} />
      </Head>

      <Stack spacing={7} w='100%' bg='gray.50' p='25px' borderRadius='sm' boxShadow='xl'>
        <Link href='/admin/products/rooms'>
          <Button borderRadius='2xl'>
            <BsArrowLeft />
          </Button>
        </Link>

        <Heading>Create Room Form</Heading>

        <SlideFade in offsetY='20px'>
          <Box w='100%' mx='auto'>
            <form onSubmit={handleSubmit(createAddOnSubmit)}>
              <Stack spacing={6}>
                <Stack direction={{ base: 'column', md: 'row' }}>
                  <TextField
                    register={register}
                    property='roomIdentityName'
                    label='Room ID'
                    placeholder='Room ID'
                    errMsg={errors.roomIdentityName?.message}
                  />
                  <TextField
                    register={register}
                    property='description'
                    label='Room Description'
                    placeholder='Room Description'
                    errMsg={errors.description?.message}
                  />
                </Stack>

                <Stack direction={{ base: 'column', md: 'row' }}>
                  <NumberFieldV2 control={control} property='guests' label='Number of guests' errMsg={errors.guests?.message} />
                  <NumberFieldV2 control={control} property='price' label='Room Price' errMsg={errors.price?.message} />
                </Stack>

                <Stack direction={{ base: 'column', md: 'row' }} spacing={3}>
                  <NumberFieldV2
                    control={control}
                    property='bedSingle'
                    label='How many Single Bed?'
                    errMsg={errors.bedSingle?.message}
                  />
                  <NumberFieldV2
                    control={control}
                    property='bedDouble'
                    label='How many Double Bed?'
                    errMsg={errors.bedDouble?.message}
                  />
                  <NumberFieldV2
                    control={control}
                    property='bedQueen'
                    label='How many Queen Bed?'
                    errMsg={errors.bedQueen?.message}
                  />
                </Stack>

                <Stack>
                  <Label>Does it have a bathroom:</Label>
                  <RadioBooleanField control={control} property='withBathroom' errMsg={errors.withBathroom?.message} />
                </Stack>

                <Stack>
                  <Label>Does it have a Air Condition?:</Label>
                  <RadioBooleanField control={control} property='withAircon' errMsg={errors.withAircon?.message} />
                </Stack>

                <Stack>
                  <Label>Does it have a Electric Fan?:</Label>
                  <RadioBooleanField control={control} property='withFan' errMsg={errors.withFan?.message} />
                </Stack>

                <Button type='submit' borderRadius='sm' isLoading={isLoading}>
                  Add Room
                </Button>
              </Stack>
            </form>
          </Box>
        </SlideFade>
      </Stack>
    </Layout>
  );
}

export default Admin;
