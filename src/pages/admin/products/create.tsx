import Head from 'next/head';
import Link from 'next/link';
import { Box, Button, Stack, Heading, Text, useToast, SlideFade, Center } from '@chakra-ui/react';
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
import { GetApp } from '@/appspecs/theme';

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
  includedRooms: z.map(z.string().min(1), z.string().min(1)),
});

type FormSchemaType = z.infer<typeof schema>;

const Label = ({ children }: any) => {
  return <Text fontWeight='semibold'>{children}</Text>;
};

function CreateProduct() {
  const { mutate, isLoading } = trpc.product.create.useMutation();
  const { data } = trpc.room.getRooms.useQuery({ limit: 100, page: 1 });

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
    defaultValues: {
      includedRooms: new Map(),
    },
  });

  const addProductSubmit = (data: FormSchemaType) => {
    const { includedRooms, ...rest } = data;

    const payload = {
      ...rest,
      includedRooms: Array.from(includedRooms, (entry) => entry[1]),
    };

    console.log('result', payload);

    mutate(payload, {
      onSuccess() {
        toast({
          title: 'Product created.',
          status: 'success',
          duration: 9000,
          isClosable: true,
        });
        reset();
        reset({ includedRooms: new Map() });
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
        <Link href='/admin/products/schedules'>
          <Button borderRadius='2xl'>
            <BsArrowLeft />
          </Button>
        </Link>

        <Heading>Create Product Form</Heading>

        <SlideFade in offsetY='20px'>
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
                    <NumberField
                      register={register}
                      property='price'
                      placeholder='Product Price'
                      errMsg={errors.price?.message}
                    />
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
                  <Label>Pick Rooms Included with this schedule:</Label>
                  <Stack direction={{ base: 'column', sm: 'row' }}>
                    {data?.records.map((info) => {
                      const isActive = !!watch('includedRooms')?.get(info.roomId);

                      return (
                        <Center
                          key={info.roomId}
                          bg={isActive ? GetApp.ActiveColor : 'blackAlpha.200'}
                          p='15px'
                          rounded='lg'
                          _hover={{ cursor: 'pointer', bg: isActive ? '' : 'blackAlpha.300' }}
                          transition='background-color 0.25s'
                          onClick={() => {
                            const newMapValue = watch('includedRooms');
                            if (isActive) newMapValue.delete(info.roomId);
                            else newMapValue.set(info.roomId, info.roomId);

                            setValue('includedRooms', newMapValue);
                          }}
                        >
                          {info.roomIdentityName}
                        </Center>
                      );
                    })}
                  </Stack>
                  {errors.includedRooms ? <Text color='red'>{errors.includedRooms.message}!</Text> : ''}
                </Stack>

                <Button type='submit' borderRadius='sm' isLoading={isLoading}>
                  Add Product
                </Button>
              </Stack>
            </form>
          </Box>
        </SlideFade>
      </Stack>
    </Layout>
  );
}

export default CreateProduct;
