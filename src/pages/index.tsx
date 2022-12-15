import Head from 'next/head';
import { Heading } from '@chakra-ui/react';
import Layout from '@/layouts/index';

function Home() {
  return (
    <Layout>
      <Head>
        <title>Home</title>
        <meta name='description' content='Sample Home page with nextjs' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <br />
      <Heading as='h1' size='2xl' noOfLines={1}>
        Welcome To Hydro Manila
      </Heading>
    </Layout>
  );
}

export default Home;
