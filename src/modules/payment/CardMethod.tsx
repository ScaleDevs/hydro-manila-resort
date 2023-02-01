import { useState } from 'react';
import { Box, Button, Stack, chakra } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AiOutlineCheck, AiOutlineClose } from 'react-icons/ai';

import { RegexValidations } from '@/utils/helper';
import { TextField } from '@/components/TextField';

const CheckIcon = chakra(AiOutlineCheck);
const InvalidIcon = chakra(AiOutlineClose);

const schema = z.object({
  details: z.object({
    card_number: z.union([
      z.string().regex(RegexValidations.masterCard, 'Invalid Card Number').length(16, 'Must be 16 digits'),
      z.string().regex(RegexValidations.visaCard, 'Invalid Card Number').length(16, 'Must be 16 digits'),
      z.string().regex(RegexValidations.visaCard, 'Invalid Card Number').length(13, 'Must be 13 digits'),
    ]),
  }),
});

type FormSchemaType = z.infer<typeof schema>;

export interface ICardInputsFormProps {}

export default function CardInputsForm({}: ICardInputsFormProps) {
  const [isCardNumberValid, setIsCardNumberValid] = useState<boolean | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
  });

  const handlePayment = (data: FormSchemaType) => {
    console.log(data);
  };

  const onBlurCardNumberInput = async () => {
    const result = await trigger('details.card_number');
    setIsCardNumberValid(result);
  };

  console.log(errors);

  return (
    <Box mt='20px' p='1px'>
      <form onSubmit={handleSubmit(handlePayment)}>
        <Stack position='relative' w={{ base: '100%', md: '50%' }}>
          <TextField
            register={register}
            property='details.card_number'
            placeholder='card number'
            errMsg={errors.details?.card_number?.message}
            onBlur={onBlurCardNumberInput}
          />
          {isCardNumberValid === null ? (
            ''
          ) : isCardNumberValid ? (
            <CheckIcon position='absolute' top='2px' right='10px' color='green' h='20px' w='20px' />
          ) : (
            <InvalidIcon position='absolute' top='2px' right='10px' color='red' h='20px' w='20px' />
          )}
        </Stack>

        <br />

        <Button type='submit'>Create</Button>
      </form>
    </Box>
  );
}
