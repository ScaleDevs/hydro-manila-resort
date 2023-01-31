import * as React from 'react';
import { useRouter } from 'next/router';
import { Heading, VStack, Text, Image, Box, Button } from '@chakra-ui/react';
import { trpc } from '@/utils/trpc';

const Component = ({ payment_intent_id }: { payment_intent_id: string }) => {
  const { data } = trpc.payment.getPaymentIntentSession.useQuery({ paymentIntentId: payment_intent_id as string });

  const retryPayment = () => {
    if (data && data.attributes.next_action?.redirect?.url) window.location.href = data.attributes.next_action.redirect.url;
  };

  return (
    <Box h='100vh'>
      <VStack spacing={10}>
        <Box marginBottom={{ base: '-100px', md: '-150px' }}>
          <Image
            src='/logo_blue.png'
            alt='Hydro Resort Logo'
            h={{ base: '350px', md: '500px' }}
            w={{ base: '350px', md: '500px' }}
            marginTop={{ base: '-30px', xl: '-60px' }}
          />
        </Box>

        {data?.attributes.status}

        {data?.attributes.status === 'awaiting_next_action' && (
          <Button bg='primary.1' borderRadius='sm' size='lg' onClick={retryPayment}>
            RETRY PAYMENT!
          </Button>
        )}

        {data?.attributes.status === 'succeeded' && (
          <Box bg='primary.1' p='20px' borderRadius='sm'>
            <Heading color='white' as='h1'>
              PAYMENT COMPLETE!
            </Heading>
          </Box>
        )}
        {data?.attributes.status === 'succeeded' && <Text mt='10px'>Check your email for booking confirmation</Text>}
      </VStack>
    </Box>
  );
};

export default function SuccessPayment() {
  const router = useRouter();

  if (!router.query.payment_intent_id) return '';

  return <Component payment_intent_id={router.query.payment_intent_id as string} />;
}
