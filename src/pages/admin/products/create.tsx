import Head from 'next/head';
import Link from 'next/link';
import { Box, Button, Stack, Heading, Input, Text, RadioGroup, Radio } from '@chakra-ui/react';
import { BsArrowLeft } from 'react-icons/bs';

import Layout from '@/layouts/admin';

const Label = ({ children }: any) => {
  return <Text fontWeight='semibold'>{children}</Text>;
};

function Admin() {
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
                  <Input placeholder='Product Name' />
                  <Input placeholder='Product Price' />
                </Stack>
              </Stack>

              <Stack>
                <Label>HEAD COUNT CONFIGURATION:</Label>
                <Stack direction='row'>
                  <Input placeholder='Initial Max Head Count' />
                  <Input placeholder='Final Max Head Count' />
                </Stack>
              </Stack>

              <Stack>
                <Label>SCHEDULE START DETAILS:</Label>
                <Stack direction='row'>
                  <Stack direction='row'>
                    <Input type='number' placeholder='Hour' />
                    <Input type='number' placeholder='Minute' />
                    <Input type='number' placeholder='AM/PM' />
                  </Stack>
                </Stack>
              </Stack>

              <Stack>
                <Label>SCHEDULE END DETAILS:</Label>
                <Stack direction='row'>
                  <Stack direction='row'>
                    <Input type='number' placeholder='Hour' />
                    <Input type='number' placeholder='Minute' />
                    <Input type='number' placeholder='AM/PM' />
                    <Input type='number' placeholder='IS IT NEXT DAY?' />
                  </Stack>
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
