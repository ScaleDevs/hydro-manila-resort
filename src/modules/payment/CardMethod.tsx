import { useState, Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/router';
import { Box, Button, Stack, chakra, Text, Heading, useToast } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AiOutlineCheck, AiOutlineClose } from 'react-icons/ai';
import dayjs from 'dayjs';

import { createPaymentMethod } from '../fetch-calls';
import { getCitiesOptions, getProvincesOptions, RegexValidations } from '@/modules/utils/helper';
import usePaymentStoreTrack from '@/store/payment.store';
import { TextField } from '@/components/TextField';
import { SelectNumberField } from '@/components/SelectNumberField';
import { SelectField } from '@/components/SelectField';
import { trpc } from '@/utils/trpc';
import ModalLoader from '@/components/ModalLoader';

const CheckIcon = chakra(AiOutlineCheck);
const InvalidIcon = chakra(AiOutlineClose);

const schema = z.object({
  details: z.object({
    card_number: z.union([
      z.string().regex(RegexValidations.masterCard, 'Invalid Card Number').length(16, 'Must be 16 digits'),
      z.string().regex(RegexValidations.visaCard, 'Invalid Card Number').length(16, 'Must be 16 digits'),
      z.string().regex(RegexValidations.visaCard, 'Invalid Card Number').length(13, 'Must be 13 digits'),
    ]),
    exp_month: z.number(),
    exp_year: z.number(),
    cvc: z.string().regex(RegexValidations.NumberOnly).length(3, 'Must be 3 digits'),
  }),
  billing: z.object({
    name: z.string().min(1, 'Required'),
    email: z.string().email(),
    address: z.object({
      line1: z.string().min(1, 'Required'),
      line2: z.string().optional(),
      city: z.string().min(1, 'Required'),
      state: z.string().min(1, 'Required'),
      postal_code: z.string().length(4, 'Invalid Postal Code'),
    }),
  }),
});

type FormSchemaType = z.infer<typeof schema>;

export interface ICardInputsFormProps {
  setIsTaken: Dispatch<SetStateAction<boolean>>;
}

export default function CardInputsForm({ setIsTaken }: ICardInputsFormProps) {
  const toast = useToast();
  const router = useRouter();
  const { clientKey, paymentIntentId } = usePaymentStoreTrack();
  const [isCardNumberValid, setIsCardNumberValid] = useState<boolean | null>(null);
  const { mutate, isLoading } = trpc.payment.attachPaymentMethodToIntent.useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    trigger,
    watch,
  } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
  });

  const handlePayment = async (data: FormSchemaType) => {
    try {
      const paymentMethod = await createPaymentMethod({
        type: 'card',
        details: {
          ...data.details,
          exp_year: parseInt(`${data.details.exp_year}`.slice(-2), 10),
        },
        billing: {
          address: {
            country: 'PH',
            ...data.billing.address,
          },
          name: data.billing.name,
          email: data.billing.email,
        },
      });

      if (paymentMethod && clientKey && paymentIntentId)
        mutate(
          {
            clientKey,
            paymentIntentId,
            paymentMethodId: paymentMethod.id,
            returnUrl: `${
              process.env.NEXT_PUBLIC_RETURN_URL || 'http://localhost:3000/booking/status'
            }?payment_intent_id=${paymentIntentId}`,
          },
          {
            onSuccess({ data }) {
              if (!data) {
                setIsTaken(true);
                return;
              }

              const status = data.attributes.status;

              if (status === 'awaiting_next_action' && data.attributes.next_action?.redirect?.url) {
                window.location.href = data.attributes.next_action?.redirect?.url;
                return;
              }

              if (status === 'succeeded') {
                router.push(`/booking/status?payment_intent_id=${paymentIntentId}`);
                return;
              }

              if (status === 'awaiting_payment_method')
                toast({
                  description: 'Failed processing payment, Kindly Try again',
                  status: 'error',
                  duration: 9000,
                  isClosable: true,
                });
            },
          },
        );
    } catch (err) {
      console.log('ERROR HERE');
      console.log(err);
      toast({
        description: 'Kindly Try Again',
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    }
  };

  const onBlurCardNumberInput = async () => {
    const result = await trigger('details.card_number');
    setIsCardNumberValid(result);
  };

  const onBlurCVC = () => {
    trigger('details.cvc');
  };

  const onChangeProvince = () => {
    setValue('billing.address.city', '');
  };

  return (
    <Box mt='20px' p='1px' w={{ base: '100%', md: '100%' }}>
      <form onSubmit={handleSubmit(handlePayment)}>
        <ModalLoader isOpen={isLoading} title='PROCESSING PAYMENT' />
        <Stack direction={{ base: 'column', md: 'row' }} spacing={{ base: 1, md: 10 }}>
          <Stack w={{ base: '100%', md: '50%' }}>
            <Heading size='lg'>Card Details</Heading>

            <TextField
              required
              label='Card Holder Name'
              register={register}
              property='billing.name'
              placeholder='name'
              errMsg={errors.billing?.name?.message}
            />

            <TextField
              required
              label='Email'
              register={register}
              property='billing.email'
              placeholder='email'
              errMsg={errors.billing?.email?.message}
            />

            <Stack position='relative' w='100%'>
              <TextField
                required
                label='Card Number'
                register={register}
                property='details.card_number'
                placeholder='card number'
                errMsg={errors.details?.card_number?.message}
                onBlur={onBlurCardNumberInput}
              />
              {isCardNumberValid === null ? (
                ''
              ) : isCardNumberValid ? (
                <CheckIcon position='absolute' top='26px' right='10px' color='green' h='20px' w='20px' />
              ) : (
                <InvalidIcon position='absolute' top='26px' right='10px' color='red' h='20px' w='20px' />
              )}
            </Stack>

            <Stack direction={{ base: 'column', sm: 'row' }} w='100%'>
              <Stack w={{ base: '100%', md: '60%' }} direction='column' spacing={0.1}>
                <Text>
                  Expiration Date
                  <Text as='span' color='red' pl='1'>
                    *
                  </Text>
                </Text>
                <Stack direction={{ base: 'row' }} w='100%'>
                  <SelectNumberField
                    noZeroStart
                    placeholder='Month'
                    maxOpt={12}
                    register={register}
                    property='details.exp_month'
                    value={watch('details.exp_month')}
                    errMsg={errors.details?.exp_month?.message}
                  />
                  <SelectNumberField
                    noZeroStart
                    placeholder='Year'
                    minOpt={dayjs().year()}
                    maxOpt={15}
                    register={register}
                    property='details.exp_year'
                    value={watch('details.exp_year')}
                    errMsg={errors.details?.exp_year?.message}
                  />
                </Stack>
              </Stack>

              <Stack w={{ base: '100%', md: '40%' }} direction='column' spacing={0}>
                <TextField
                  required
                  label='CVC'
                  placeholder='CVC'
                  register={register}
                  property='details.cvc'
                  errMsg={errors.details?.cvc?.message}
                  onBlur={onBlurCVC}
                />
              </Stack>
            </Stack>
          </Stack>

          <br />

          <Stack w={{ base: '100%', md: '50%' }}>
            <Heading size='lg'>Billing Details</Heading>

            <TextField
              required
              label='Adderss Line 1'
              register={register}
              property='billing.address.line1'
              placeholder='Address Line 1'
              errMsg={errors.billing?.address?.line1?.message}
            />

            <TextField
              label='Adderss Line 2'
              register={register}
              property='billing.address.line2'
              placeholder='Address Line 2'
              errMsg={errors.billing?.address?.line2?.message}
            />

            <Stack direction={{ base: 'column', md: 'row' }}>
              <SelectField
                required
                label='Province'
                register={register}
                property='billing.address.state'
                value={watch('billing.address.state')}
                placeholder='Province'
                options={getProvincesOptions()}
                errMsg={!!errors.billing?.address?.state?.message ? 'Required!' : undefined}
                handleOnChange={onChangeProvince}
              />

              <SelectField
                required
                disabled={watch('billing.address.state') === '' || !watch('billing.address.state')}
                label='City'
                register={register}
                property='billing.address.city'
                value={watch('billing.address.city')}
                placeholder='City'
                options={getCitiesOptions(watch('billing.address.state'))}
                errMsg={!!errors.billing?.address?.city?.message ? 'Required!' : undefined}
              />
            </Stack>

            <TextField
              required
              label='Postal Code'
              placeholder='Postal Code'
              register={register}
              property='billing.address.postal_code'
              errMsg={errors.billing?.address?.postal_code?.message}
              onBlur={onBlurCVC}
            />
          </Stack>
        </Stack>

        <br />

        <Box display='flex' justifyContent='right'>
          <Button type='submit' isLoading={isLoading}>
            PROCEED
          </Button>
        </Box>
      </form>
    </Box>
  );
}
