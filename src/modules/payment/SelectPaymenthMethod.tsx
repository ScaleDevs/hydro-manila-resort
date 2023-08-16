import { Dispatch, SetStateAction } from 'react';
import Image from 'next/image';
import { Center, Stack, HStack, Text } from '@chakra-ui/react';
import { GetApp } from '@/appspecs/theme';

const PaymentMethodWrapper = ({
  children,
  title,
  active,
  onClick,
}: {
  children: any;
  title: string;
  active: string;
  onClick: (value: string) => void;
}) => {
  return (
    <HStack
      h='130px'
      p='12px'
      border='2px solid'
      borderColor={active === title ? GetApp.ActiveColor : 'gray.400'}
      spacing='5'
      borderRadius='sm'
      _hover={{ borderColor: GetApp.ActiveColor, cursor: 'pointer', transition: 'border-color 0.5s ease;' }}
      onClick={() => onClick(title)}
    >
      {children}
      <Center w='100px' h='100%'>
        <Text fontSize='20px'>{title}</Text>
      </Center>
    </HStack>
  );
};

export interface ISelectPaymentMethodProps {
  paymentMethod: string;
  setPaymentMethod: Dispatch<SetStateAction<string>>;
}

export default function SelectPaymentMethod({ paymentMethod, setPaymentMethod }: ISelectPaymentMethodProps) {
  const handleClick = (value: string) => setPaymentMethod(value);

  return (
    <Stack mt='20px' direction={{ base: 'column', md: 'row' }}>
      <PaymentMethodWrapper title='gcash' active={paymentMethod} onClick={handleClick}>
        <Center w='100px' h='100%' position='relative'>
          <Image alt='gcash logo' src='/gcash.webp' priority style={{ objectFit: 'contain' }} fill />
        </Center>
      </PaymentMethodWrapper>
      <PaymentMethodWrapper title='card' active={paymentMethod} onClick={handleClick}>
        <Center w='100px' h='100%'>
          <Stack>
            <Image alt='visa logo' src='/visacard.png' width={90} height={70} priority />
            <Image alt='gcash logo' src='/mastercard.png' width={90} height={70} priority />
          </Stack>
        </Center>
      </PaymentMethodWrapper>
    </Stack>
  );
}
