import Head from 'next/head';
import Link from 'next/link';
import { Box, Button, Stack, Heading, useToast, Text } from '@chakra-ui/react';
import { BsArrowLeft } from 'react-icons/bs';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import Layout from '@/layouts/admin';
import { NumberField } from '@/components/NumberField';
import { TextField } from '@/components/TextField';
import { trpc } from '@/utils/trpc';
import { RadioBooleanField } from '@/components/RadioBooleanField';

const schema = z.object({
  roomNumber: z.number({ invalid_type_error: 'Must be a number' }),
  description: z.string().optional(),
  price: z.number({
    invalid_type_error: 'Must be a number',
  }),
  withBathroom: z.boolean(),
  guests: z.number(),
});

type FormSchemaType = z.infer<typeof schema>;

const Label = ({ children }: any) => {
  return <Text fontWeight='semibold'>{children}</Text>;
};

function Admin() {
  const { mutate, isLoading } = trpc.room.create.useMutation();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
    reset,
  } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
  });

  const createAddOnSubmit = (data: FormSchemaType) => {
    const { roomNumber, description, ...rest } = data;

    const payload = {
      roomNumber,
      details: {
        ...rest,
        description: description ? description : null,
      },
    };

    console.log(payload);

    mutate(payload, {
      onSuccess() {
        toast({
          title: 'Product created.',
          status: 'success',
          duration: 9000,
          isClosable: true,
        });
        reset();
      },
    });
  };

  console.log(errors);

  return (
    <Layout>
      <Head>
        <title>Home</title>
        <meta name='description' content='Sample Home page with nextjs' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Stack spacing={7}>
        <Link href='/admin/products'>
          <Button borderRadius='2xl'>
            <BsArrowLeft />
          </Button>
        </Link>

        <Heading>Create Room Form</Heading>

        <Box w='100%' mx='auto'>
          <form onSubmit={handleSubmit(createAddOnSubmit)}>
            <Stack spacing={6}>
              <Stack direction={{ base: 'column', md: 'row' }}>
                <NumberField
                  register={register}
                  property='roomNumber'
                  placeholder='Room Number'
                  errMsg={errors.roomNumber?.message}
                />
                <TextField
                  register={register}
                  property='description'
                  placeholder='Room Description'
                  errMsg={errors.description?.message}
                />
              </Stack>

              <Stack direction={{ base: 'column', md: 'row' }}>
                <NumberField
                  register={register}
                  property='guests'
                  placeholder='Number of guests'
                  errMsg={errors.guests?.message}
                />
                <NumberField register={register} property='price' placeholder='Room Price' errMsg={errors.price?.message} />
              </Stack>

              <Stack>
                <Label>Does it have a bathroom:</Label>
                <RadioBooleanField
                  setValue={setValue}
                  value={watch('withBathroom')}
                  property='withBathroom'
                  errMsg={errors.withBathroom?.message}
                />
              </Stack>

              <Button type='submit' borderRadius='sm' isLoading={isLoading}>
                Add Room
              </Button>
            </Stack>
          </form>
        </Box>
      </Stack>
    </Layout>
  );
}

export default Admin;
