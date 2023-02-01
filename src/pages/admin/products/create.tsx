import Head from 'next/head';
import Link from 'next/link';
import { Box, Button, Stack, Heading, Text, useToast } from '@chakra-ui/react';
import { BsArrowLeft } from 'react-icons/bs';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import Layout from '@/layouts/admin';
import { NumberField } from '@/components/NumberField';
import { TextField } from '@/components/TextField';
import { SelectNumberField } from '@/components/SelectNumberField';
import { SelectField } from '@/components/SelectField';
import { RadioBooleanField } from '@/components/RadioBooleanField';
import { trpc } from '@/utils/trpc';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  description: z.string().optional(),
  price: z.number(),
  scheduleStartHour: z.number().max(12, 'Max value is 12'),
  scheduleStartMin: z.number().max(59, 'Max value is 59'),
  scheduleStartPost: z.enum(['AM', 'PM']),
  scheduleEndHour: z.number().max(12, 'Max value is 12'),
  scheduleEndMin: z.number().max(59, 'Max value is 59'),
  scheduleEndPost: z.enum(['AM', 'PM']),
  scheduleEndNextDay: z.boolean(),
  withRooms: z.boolean(),
});

type FormSchemaType = z.infer<typeof schema>;

const Label = ({ children }: any) => {
  return <Text fontWeight='semibold'>{children}</Text>;
};

function CreateProduct() {
  const { mutate, isLoading } = trpc.product.create.useMutation();
  const toast = useToast();

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
  });

  const addProductSubmit = (data: FormSchemaType) => {
    const { name, ...rest } = data;

    const payload = {
      name: name,
      details: {
        ...rest,
      },
    };

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

        <Heading>Create Product Form</Heading>

        <Box w='100%' mx='auto'>
          <form onSubmit={handleSubmit(addProductSubmit)}>
            <Stack spacing={6}>
              <Stack>
                <Label>BASIC INFO:</Label>
                <Stack direction={{ base: 'column', md: 'row' }}>
                  <TextField register={register} property='name' placeholder='Product Name' errMsg={errors.name?.message} />
                  <TextField
                    register={register}
                    property='description'
                    placeholder='Product Description'
                    errMsg={errors.description?.message}
                  />
                  <NumberField register={register} property='price' placeholder='Product Price' errMsg={errors.price?.message} />
                </Stack>
              </Stack>

              <Stack>
                <Label>SCHEDULE START DETAILS:</Label>
                <Stack direction={{ base: 'column', md: 'row' }}>
                  <SelectNumberField
                    placeholder='Hour'
                    maxOpt={12}
                    register={register}
                    property='scheduleStartHour'
                    value={watch('scheduleStartHour')}
                    errMsg={errors.scheduleStartHour?.message}
                  />
                  <SelectNumberField
                    placeholder='Minute'
                    maxOpt={59}
                    register={register}
                    property='scheduleStartMin'
                    value={watch('scheduleStartMin')}
                    errMsg={errors.scheduleStartMin?.message}
                  />
                  <SelectField
                    register={register}
                    property='scheduleStartPost'
                    value={watch('scheduleStartPost')}
                    placeholder='AM/PM'
                    options={[
                      { label: 'AM', value: 'AM' },
                      { label: 'PM', value: 'PM' },
                    ]}
                    errMsg={!!errors.scheduleStartPost?.message ? 'Required!' : undefined}
                  />
                </Stack>
              </Stack>

              <Stack>
                <Label>SCHEDULE END DETAILS:</Label>
                <Stack direction={{ base: 'column', md: 'row' }}>
                  <SelectNumberField
                    placeholder='Hour'
                    maxOpt={12}
                    register={register}
                    property='scheduleEndHour'
                    value={watch('scheduleEndHour')}
                    errMsg={errors.scheduleEndHour?.message}
                  />
                  <SelectNumberField
                    placeholder='Minute'
                    maxOpt={59}
                    register={register}
                    property='scheduleEndMin'
                    value={watch('scheduleEndMin')}
                    errMsg={errors.scheduleEndMin?.message}
                  />
                  <SelectField
                    register={register}
                    property='scheduleEndPost'
                    value={watch('scheduleEndPost')}
                    placeholder='AM/PM'
                    options={[
                      { label: 'AM', value: 'AM' },
                      { label: 'PM', value: 'PM' },
                    ]}
                    errMsg={!!errors.scheduleEndPost?.message ? 'Required!' : undefined}
                  />
                </Stack>
              </Stack>

              <Stack>
                <Label>Does Schedule End Next Day?:</Label>
                <RadioBooleanField
                  setValue={setValue}
                  value={watch('scheduleEndNextDay')}
                  property='scheduleEndNextDay'
                  errMsg={errors.scheduleEndNextDay?.message}
                />
              </Stack>

              <Stack>
                <Label>WITH ROOMS?:</Label>
                <RadioBooleanField
                  setValue={setValue}
                  value={watch('withRooms')}
                  property='withRooms'
                  errMsg={errors.withRooms?.message}
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

export default CreateProduct;
