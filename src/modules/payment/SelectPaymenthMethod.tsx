import { Dispatch, SetStateAction } from 'react';
import { Center, Stack, HStack, Image, Text } from '@chakra-ui/react';

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
      borderColor={active === title ? 'teal.500' : 'gray.400'}
      spacing='5'
      borderRadius='sm'
      _hover={{ borderColor: 'teal.400', cursor: 'pointer', transition: 'border-color 0.5s ease;' }}
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
        <Center w='100px' h='100%'>
          <Image alt='gcash logo' src='/gcash.webp' />
        </Center>
      </PaymentMethodWrapper>
      <PaymentMethodWrapper title='card' active={paymentMethod} onClick={handleClick}>
        <Center w='100px' h='100%'>
          <Stack>
            <Image alt='gcash logo' src='/visacard.png' />
            <Image alt='gcash logo' src='/mastercard.png' />
          </Stack>
        </Center>
      </PaymentMethodWrapper>
    </Stack>
  );
}
