import { useState } from 'react';
import { Center, Stack, HStack, Image, Text } from '@chakra-ui/react';
import { UseFormSetValue } from 'react-hook-form';

const PaymentMethodWrapper = ({
  srcImg,
  title,
  active,
  onClick,
}: {
  srcImg: string;
  title: string;
  active: string;
  onClick: (value: string) => void;
}) => {
  return (
    <HStack
      h='130px'
      p='12px'
      border='2px solid'
      borderColor={active === title ? 'primary.1' : 'gray.400'}
      spacing='5'
      borderRadius='sm'
      _hover={{ borderColor: 'primary.1', cursor: 'pointer', transition: 'border-color 0.5s ease;' }}
      onClick={() => onClick(title)}
    >
      <Center w='100px' h='100%'>
        <Image alt='gcash logo' src={srcImg} />
      </Center>
      <Center w='100px' h='100%'>
        <Text fontSize='20px'>{title}</Text>
      </Center>
    </HStack>
  );
};

export interface ISelectPaymentMethodProps {
  setValue: UseFormSetValue<any>;
  property: string;
}

export default function SelectPaymentMethod({ setValue, property }: ISelectPaymentMethodProps) {
  const [active, setActive] = useState('');

  const handleClick = (value: string) => {
    setActive(value);
    setValue(property, value, {
      shouldValidate: true,
    });
  };

  return (
    <Stack mt='20px' direction={{ base: 'column', md: 'row' }}>
      <PaymentMethodWrapper srcImg='/gcash.webp' title='gcash' active={active} onClick={handleClick} />
      <PaymentMethodWrapper srcImg='/mastercard.png' title='card' active={active} onClick={handleClick} />
    </Stack>
  );
}
