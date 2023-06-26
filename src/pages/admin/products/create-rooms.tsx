import Head from 'next/head';
import Link from 'next/link';
import { Box, Button, Stack, Heading, useToast, Text, SlideFade } from '@chakra-ui/react';
import { BsArrowLeft } from 'react-icons/bs';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import Layout from '@/layouts/admin';
import { NumberField } from '@/components/NumberField';
import { TextField } from '@/components/TextField';
import { trpc } from '@/utils/trpc';
import { RadioBooleanField } from '@/components/RadioBooleanField';
import { GetApp } from '@/appspecs/theme';

const schema = z.object({
  roomIdentityName: z.string().min(1, 'Required'),
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
    const { description, ...rest } = data;

    const payload = {
      ...rest,
      description: description ? description : null,
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
                  <NumberField
                    register={register}
                    property='roomIdentityName'
                    placeholder='Room ID'
                    errMsg={errors.roomIdentityName?.message}
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
        </SlideFade>
      </Stack>
    </Layout>
  );
}

export default Admin;
