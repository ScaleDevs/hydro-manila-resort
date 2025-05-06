import * as React from 'react';
import { z } from 'zod';
import { Control, Controller, useFieldArray, useForm, UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  SlideFade,
  Heading,
  Stack,
  Button,
  Alert,
  AlertIcon,
  RadioGroup,
  Radio,
  Text,
  Checkbox,
  Input,
} from '@chakra-ui/react';

import { trpc } from '@/utils/trpc';
import { DateTimeField } from '@/components/DateTimeField';
import { NumberFieldV2 } from '@/components/NumberFieldV2';
import { GetApp } from '@/appspecs/theme';
import { BsTrash } from 'react-icons/bs';

export interface IAddPromoProps {
  productId: string;
  isIn?: boolean;
}

const DayRateSchema = z.object({
  days: z.array(z.number().int().min(0).max(6)), // 0 = Sunday
  price: z.number().nonnegative(),
});

const baseSchema = z.object({
  promoStart: z.string(),
  promoEnd: z.string(),
  promoType: z.enum(['FLAT_RATE', 'DAY_RATES']),
  price: z
    .preprocess((v) => {
      if (typeof v === 'string' && v.trim() === '') return undefined;
      const parsed = Number.parseInt(v as string, 10);
      return isNaN(parsed) ? undefined : parsed;
    }, z.number().optional())
    .optional(),
  dayRates: z.array(DayRateSchema).optional(),
});

const schema = baseSchema.superRefine((data, ctx) => {
  if (data.promoType === 'FLAT_RATE') {
    if (data.price === undefined || data.price === null || typeof data.price !== 'number' || isNaN(data.price)) {
      ctx.addIssue({
        path: ['price'],
        code: z.ZodIssueCode.custom,
        message: 'Price is required and must be a valid number for FLAT_RATE.',
      });
    }
  }

  if (data.promoType === 'DAY_RATES') {
    if (!data.dayRates || data.dayRates.length === 0) {
      ctx.addIssue({
        path: ['dayRates'],
        code: z.ZodIssueCode.custom,
        message: 'dayRates are required when promoType is DAY_RATES.',
      });
      return;
    }

    const allDays = new Set<number>();
    const duplicates = new Set<number>();

    for (let i = 0; i < data.dayRates.length; i++) {
      const rate = data.dayRates[i];

      for (const day of rate.days) {
        if (allDays.has(day)) {
          duplicates.add(day);
        } else {
          allDays.add(day);
        }
      }
    }

    if (duplicates.size > 0) {
      ctx.addIssue({
        path: ['dayRates'],
        code: z.ZodIssueCode.custom,
        message: `Each day can only belong to one rate. Duplicates found for: ${[...duplicates]
          .sort()
          .map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d])
          .join(', ')}.`,
      });
    }

    if (allDays.size !== 7) {
      ctx.addIssue({
        path: ['dayRates'],
        code: z.ZodIssueCode.custom,
        message: 'dayRates must cover all 7 days of the week (0 to 6).',
      });
    }
  }
});

type FormSchemaType = z.infer<typeof schema>;

function DayRatesInput(props: {
  control: Control<FormSchemaType, any>;
  register: UseFormRegister<FormSchemaType>;
  errMessage?: string;
}) {
  const { fields, append, remove } = useFieldArray({
    control: props.control,
    name: 'dayRates',
  });

  return (
    <Stack boxShadow='lg' padding={4}>
      {fields.map((field, index) => (
        <Stack
          key={field.id}
          border='1px'
          borderColor='blackAlpha.400'
          padding='4'
          mb='2'
          rounded='md'
          flexDirection='row'
          justifyContent='space-between'
          alignItems='center'
        >
          <Stack spacing={3}>
            <Stack spacing={0}>
              <Text>Days of Week</Text>
              <Box display='flex' flexWrap='wrap' gap={2}>
                {[...Array(7).keys()].map((day) => (
                  <Controller
                    key={day}
                    control={props.control}
                    name={`dayRates.${index}.days`}
                    render={({ field: { onChange, value = [] } }) => {
                      const isChecked = value.includes(day);

                      const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                        const checked = e.target.checked;
                        if (checked) {
                          onChange([...value, day]);
                        } else {
                          onChange(value.filter((d: number) => d !== day));
                        }
                      };

                      return (
                        <Checkbox isChecked={isChecked} onChange={handleCheckboxChange}>
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]}
                        </Checkbox>
                      );
                    }}
                  />
                ))}
              </Box>
            </Stack>

            <Stack spacing={0}>
              <Text>
                Price{' '}
                <Text as='span' color='red' pl='1'>
                  *
                </Text>
              </Text>
              <Input
                type='number'
                step='any'
                {...props.register(`dayRates.${index}.price`, { valueAsNumber: true })}
                px={2}
                borderColor='blackAlpha.500'
                borderRadius='sm'
                _hover={{
                  borderColor: GetApp.ActiveColor,
                }}
                focusBorderColor={GetApp.ActiveColor}
                maxW='sm'
              />
            </Stack>
          </Stack>

          <Button
            type='button'
            onClick={() => remove(index)}
            bg='red.400'
            rounded='md'
            _hover={{
              bg: 'red.300',
            }}
          >
            <BsTrash />
          </Button>
        </Stack>
      ))}

      <Button
        type='button'
        onClick={() => append({ days: [], price: 0 })}
        className='bg-blue-500 text-white px-3 py-1 rounded'
        bg='blue.500'
        rounded='md'
        maxW='sm'
        _hover={{
          bg: 'blue.400',
        }}
      >
        Add Day Rate
      </Button>

      {props.errMessage ? <Text color='red'>{props.errMessage}!</Text> : ''}
    </Stack>
  );
}

export function AddPromo({ productId, isIn }: IAddPromoProps) {
  const { mutate, isSuccess, isLoading, error } = trpc.product.addPromo.useMutation();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset: resetFormFields,
  } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
  });

  const submitUpdate = async (data: FormSchemaType) => {
    const { promoType, ...rest } = data;

    if (promoType === 'FLAT_RATE') {
      data.dayRates = [];
    } else {
      data.price = undefined;
    }

    console.log('SUBMITTING', data);

    mutate(
      {
        id: productId,
        promo: {
          ...rest,
          dayRates: promoType === 'FLAT_RATE' ? [] : data.dayRates ?? [], // validation is on the form
          price: promoType === 'FLAT_RATE' ? data.price : undefined,
        },
      },
      {
        onSuccess() {
          resetFormFields();
        },
      },
    );
  };

  return (
    <SlideFade in={isIn} offsetY='20px'>
      <Box w='100%' mx='auto' bg='gray.50' p='25px' boxShadow='xl' borderRadius='sm'>
        <Heading textAlign='center'>EDIT BOOKING</Heading>

        <br />

        <Box w={{ base: '95%', md: '90%' }} mx='auto'>
          <form onSubmit={handleSubmit(submitUpdate)}>
            <Stack spacing={1}>
              <Text fontSize='md'>
                Choose Promo Type:
                <Text as='span' color='red' pl='1'>
                  *
                </Text>
              </Text>
              <Controller
                control={control}
                name='promoType'
                render={({ field: { onChange, value } }) => {
                  return (
                    <Box w='100%'>
                      <RadioGroup
                        value={value === undefined ? undefined : value}
                        onClick={(v) => {
                          onChange({ target: { value: (v.target as any).value } });
                        }}
                      >
                        <Stack direction='row'>
                          <Radio value='FLAT_RATE' colorScheme='default'>
                            FLAT RATE
                          </Radio>
                          <Radio value='DAY_RATES' colorScheme='default'>
                            DAY RATES
                          </Radio>
                        </Stack>
                      </RadioGroup>
                      {errors.promoType?.message ? <Text color='red'>{errors.promoType?.message}!</Text> : ''}
                    </Box>
                  );
                }}
              />
            </Stack>

            <br />

            <Stack spacing={5}>
              <DateTimeField
                type='date'
                required
                label='Promo Start Period:'
                register={register}
                property='promoStart'
                errMsg={errors.promoStart?.message}
              />

              <DateTimeField
                type='date'
                required
                label='Promo End Period:'
                register={register}
                property='promoEnd'
                errMsg={errors.promoEnd?.message}
              />

              {watch('promoType') === 'FLAT_RATE' && (
                <NumberFieldV2 control={control} property='price' label='Price' errMsg={errors.price?.message} required />
              )}

              {watch('promoType') === 'DAY_RATES' && (
                <DayRatesInput control={control} register={register} errMessage={errors.dayRates?.message} />
              )}
            </Stack>

            <br />

            {isSuccess && (
              <>
                <Alert status='success' bg='green.500' borderRadius='sm' color='white'>
                  <AlertIcon color='green.200' />
                  Promo Successfuly Added!
                </Alert>
                <br />
              </>
            )}

            {!!error && (
              <>
                <Alert status='error' borderRadius='sm' color='red.600'>
                  <AlertIcon />
                  {error?.message || ''}
                </Alert>
                <br />
              </>
            )}

            <Button type='submit' isLoading={isLoading}>
              ADD PROMO
            </Button>
          </form>
        </Box>

        <br />
      </Box>
    </SlideFade>
  );
}
