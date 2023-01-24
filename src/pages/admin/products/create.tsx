import Head from 'next/head';
import Link from 'next/link';
import { Box, Button, Stack, Heading, Input, Text, RadioGroup, Radio, Select } from '@chakra-ui/react';
import { BsArrowLeft } from 'react-icons/bs';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import Layout from '@/layouts/admin';

const schema = z.object({
  name: z.string(),
  price: z.number(),
  minHeadCount: z.number(),
  maxHeadCount: z.number(),
  scheduleStartHour: z.number().max(12, 'Max value is 12'),
  scheduleStartMin: z.number().max(59, 'Max value is 59'),
  scheduleStartPost: z.enum(['AM', 'PM']),
  scheduleEndHour: z.number().max(12, 'Max value is 12'),
  scheduleEndMin: z.number().max(59, 'Max value is 59'),
  scheduleEndPost: z.enum(['AM', 'PM']),
  scheduleEndDay: z.number().max(1, 'Max value is 1'),
  withRooms: z.boolean(),
});

type FormSchemaType = z.infer<typeof schema>;

const Label = ({ children }: any) => {
  return <Text fontWeight='semibold'>{children}</Text>;
};

const SelectNumber = ({ placeholder, maxOpt }: { placeholder: string; maxOpt: number }) => {
  return (
    <Select>
      <option value='' disabled selected>
        {placeholder}
      </option>
      {Array(maxOpt)
        .fill(1)
        .map((v, i) => (
          <option key={i} value={v + i}>
            {v + i}
          </option>
        ))}
    </Select>
  );
};

function Admin() {
  const { register } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
  });

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
          <form>
            <Stack spacing={6}>
              <Stack>
                <Label>BASIC INFO:</Label>
                <Stack direction='row'>
                  <Input {...register('name')} placeholder='Product Name' />
                  <Input {...register('price')} placeholder='Product Price' />
                </Stack>
              </Stack>

              <Stack>
                <Label>HEAD COUNT CONFIGURATION:</Label>
                <Stack direction='row'>
                  <Input {...register('minHeadCount')} placeholder='Initial Max Head Count' />
                  <Input {...register('maxHeadCount')} placeholder='Final Max Head Count' />
                </Stack>
              </Stack>

              <Stack>
                <Label>SCHEDULE START DETAILS:</Label>
                <Stack direction='row'>
                  <SelectNumber placeholder='Hour' maxOpt={12} />
                  <SelectNumber placeholder='Minute' maxOpt={59} />
                  <Select>
                    <option value='' disabled selected>
                      AM/PM
                    </option>
                    <option value='AM'>AM</option>
                    <option value='PM'>PM</option>
                  </Select>
                </Stack>
              </Stack>

              <Stack>
                <Label>SCHEDULE END DETAILS:</Label>
                <Stack direction='row'>
                  <SelectNumber placeholder='Hour' maxOpt={12} />
                  <SelectNumber placeholder='Minute' maxOpt={59} />
                  <Select>
                    <option value='' disabled selected>
                      AM/PM
                    </option>
                    <option value='AM'>AM</option>
                    <option value='PM'>PM</option>
                  </Select>
                  <Select>
                    <option value='' disabled selected>
                      Next Day?
                    </option>
                    <option value='0'>Yes</option>
                    <option value='1'>No</option>
                  </Select>
                </Stack>
              </Stack>

              <Stack>
                <Label>SCHEDULE END DETAILS:</Label>
                <RadioGroup>
                  <Stack direction='row'>
                    <Radio value='1' colorScheme='teal'>
                      Yes
                    </Radio>
                    <Radio value='2' colorScheme='teal'>
                      No
                    </Radio>
                  </Stack>
                </RadioGroup>
              </Stack>

              <Button borderRadius='sm'>Add Product</Button>
            </Stack>
          </form>
        </Box>
      </Stack>
    </Layout>
  );
}

export default Admin;
