import Head from 'next/head';
import Link from 'next/link';
import { Box, Button, Stack, Heading, useToast } from '@chakra-ui/react';
import { BsArrowLeft } from 'react-icons/bs';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import Layout from '@/layouts/admin';
import { NumberField } from '@/components/NumberField';
import { TextField } from '@/components/TextField';
import { SelectField } from '@/components/SelectField';
import { trpc } from '@/utils/trpc';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  type: z.enum(['ROOM', 'PERSON'], {
    invalid_type_error: 'value must be ROOM or PERSON',
  }),
  description: z.string().min(1, 'Required'),
  price: z.number({
    invalid_type_error: 'Must be a number',
  }),
});

type FormSchemaType = z.infer<typeof schema>;

function Admin() {
  const { mutate, isLoading } = trpc.addOn.create.useMutation();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
  });

  const createAddOnSubmit = (data: FormSchemaType) => {
    const { name, type, ...rest } = data;

    const payload = {
      name,
      type,
      details: {
        ...rest,
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

        <Heading>Create Add On Form</Heading>

        <Box w='100%' mx='auto'>
          <form onSubmit={handleSubmit(createAddOnSubmit)}>
            <Stack spacing={6}>
              <Stack direction='row'>
                <TextField register={register} property='name' placeholder='Product Name' errMsg={errors.name?.message} />
                <TextField
                  register={register}
                  property='description'
                  placeholder='Product Description'
                  errMsg={errors.description?.message}
                />
              </Stack>

              <Stack direction='row'>
                <NumberField register={register} property='price' placeholder='Product Price' errMsg={errors.price?.message} />
                <SelectField
                  register={register}
                  property='type'
                  value={watch('type')}
                  placeholder='type'
                  options={[
                    { label: 'ROOM', value: 'ROOM' },
                    { label: 'PERSON', value: 'PERSON' },
                  ]}
                  errMsg={!!errors.type?.message ? 'Required!' : undefined}
                />
              </Stack>

              <Button type='submit' borderRadius='sm' isLoading={isLoading}>
                Add Product
              </Button>
            </Stack>
          </form>
        </Box>
      </Stack>
    </Layout>
  );
}

export default Admin;
