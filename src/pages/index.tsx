import { useState } from 'react';
import Head from 'next/head';
import { Box } from '@chakra-ui/react';
import Layout from '@/layouts/index';
import BookingForm from '@/modules/booking/BookingForm';
import PaymentForm from '@/modules/payment/PaymentForm';

function Home() {
  const [step, setStep] = useState(1);
  return (
    <Layout>
      <Head>
        <title>Home</title>
        <meta name='description' content='Sample Home page with nextjs' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <br />
      <Box w={{ base: '100%', sm: '90%', lg: '780px' }} mx='auto'>
        {step === 1 ? <BookingForm setStep={setStep} /> : ''}
        {step === 2 ? <PaymentForm /> : ''}
        <br />
        <br />
        <br />
        <br />
      </Box>
    </Layout>
  );
}

export default Home;
