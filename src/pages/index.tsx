import { useState } from 'react';
import Head from 'next/head';
import { Box, SlideFade } from '@chakra-ui/react';
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
      <Box w={{ base: '100%', sm: '90%', lg: '1000px' }} mx='auto'>
        {step === 1 ? (
          <SlideFade in={step === 1} offsetY='20px'>
            <BookingForm setStep={setStep} />
          </SlideFade>
        ) : (
          ''
        )}
        {step === 2 ? (
          <SlideFade in={step === 2} offsetY='20px'>
            <PaymentForm />
          </SlideFade>
        ) : (
          ''
        )}
        <br />
        <br />
        <br />
        <br />
      </Box>
    </Layout>
  );
}

export default Home;
