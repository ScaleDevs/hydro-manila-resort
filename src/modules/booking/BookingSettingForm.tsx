import * as React from 'react';
import {
  Box,
  Stack,
  Text,
  Button,
  chakra,
  HStack,
  Heading,
  useDisclosure,
  Spinner,
  Divider,
  useToast,
  SlideFade,
  Fade,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { BsPencilSquare, BsX } from 'react-icons/bs';

import { trpc } from '@/utils/trpc';
import { PHpeso } from '@/modules/utils/helper';
import { NumberField } from '@/components/NumberField';

const PencilIcon = chakra(BsPencilSquare);
const XIcon = chakra(BsX);

const schema = z
  .object({
    bookingFee: z.number({ invalid_type_error: 'must be a number' }),
    maxPax: z.number({ invalid_type_error: 'must be a number' }),
    minPax: z.number({ invalid_type_error: 'must be a number' }),
    extraHeadFee: z.number({ invalid_type_error: 'must be a number' }),
  })
  .superRefine((data, ctx) => {
    if (data.minPax > data.maxPax || data.minPax === data.maxPax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['minPax'],
        message: 'Min Pax field should be lower than Max Pax field',
      });
    }
  });

type FormSchemaType = z.infer<typeof schema>;

export interface IBookingSettingProps {}

export default function BookingSetting({}: IBookingSettingProps) {
  const { isOpen, onToggle } = useDisclosure();
  const toast = useToast();
  const { data, isLoading, refetch } = trpc.bookingSetting.getBookingSetting.useQuery();
  const { mutate, isLoading: processingSettings } = trpc.bookingSetting.upsertBookingSetting.useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
    defaultValues: {
      bookingFee: data?.bookingFee,
      maxPax: data?.maxPax,
      minPax: data?.minPax,
      extraHeadFee: data?.extraHeadFee,
    },
  });

  const updateOrCreateSetting = (data: FormSchemaType) => {
    mutate(data, {
      onSuccess() {
        toast({
          title: 'Update Success',
          status: 'success',
          duration: 9000,
          isClosable: true,
        });
        refetch();
      },
    });
  };

  return (
    <Box w={{ base: '100%', md: '700px', lg: '500px' }} bg='gray.50' p='25px' borderRadius='sm' boxShadow='xl'>
      <HStack w='100%' justifyContent='space-between'>
        <Heading>Settings</Heading>
        {isOpen ? (
          <XIcon
            h='40px'
            w='40px'
            _hover={{ cursor: 'pointer', color: 'teal.500' }}
            transition='color 0.25s'
            onClick={onToggle}
          />
        ) : (
          <PencilIcon
            h='30px'
            w='30px'
            _hover={{ cursor: 'pointer', color: 'teal.500' }}
            transition='color 0.25s'
            onClick={onToggle}
          />
        )}
      </HStack>

      <br />

      {isOpen ? (
        <Fade in>
          <form onSubmit={handleSubmit(updateOrCreateSetting)}>
            <Stack spacing={5}>
              <Stack spacing={0}>
                <Text>Booking Fee:</Text>
                <NumberField
                  placeholder='In Percentage'
                  register={register}
                  property='bookingFee'
                  errMsg={errors.bookingFee?.message}
                  defaultvalue={data?.bookingFee}
                />
              </Stack>

              <Stack spacing={0}>
                <Text>Minimum Pax:</Text>
                <NumberField
                  placeholder='Minimum Pax'
                  register={register}
                  property='minPax'
                  errMsg={errors.minPax?.message}
                  defaultvalue={data?.minPax}
                />
              </Stack>

              <Stack spacing={0}>
                <Text>Maximum Pax:</Text>
                <NumberField
                  placeholder='Maximum Pax'
                  register={register}
                  property='maxPax'
                  errMsg={errors.maxPax?.message}
                  defaultvalue={data?.maxPax}
                />
              </Stack>

              <Stack spacing={0}>
                <Text>Extra Head Fee:</Text>
                <NumberField
                  placeholder='Fee per head when it goes above minimum pax'
                  register={register}
                  property='extraHeadFee'
                  errMsg={errors.extraHeadFee?.message}
                  defaultvalue={data?.extraHeadFee}
                />
              </Stack>
            </Stack>

            <br />

            <Button type='submit' isLoading={processingSettings}>
              Update
            </Button>
          </form>
        </Fade>
      ) : isLoading ? (
        <Stack alignItems='center' w='100%' p='30px'>
          <Spinner size='xl' />
          <Text>Loading Data...</Text>
        </Stack>
      ) : data ? (
        <SlideFade in>
          <Stack spacing={2}>
            <Stack spacing={0} direction='row' justifyContent='space-between'>
              <Text>Booking Fee:</Text>
              <Text>{data?.bookingFee}%</Text>
            </Stack>
            <Divider borderColor='gray.400' />

            <Stack spacing={0} direction='row' justifyContent='space-between'>
              <Text>Minimum Pax:</Text>
              <Text>{data?.minPax}</Text>
            </Stack>

            <Divider borderColor='gray.400' />

            <Stack spacing={0} direction='row' justifyContent='space-between'>
              <Text>Maximum Pax:</Text>
              <Text>{data?.maxPax}</Text>
            </Stack>

            <Divider borderColor='gray.400' />

            <Stack spacing={0} direction='row' justifyContent='space-between'>
              <Text>Extra Head Fee:</Text>
              <Text>{PHpeso.format(data?.extraHeadFee)}</Text>
            </Stack>

            <Divider borderColor='gray.400' />

            <Stack spacing={0} direction='row' justifyContent='space-between'>
              <Text>Created At:</Text>
              <Text>{dayjs(data?.createdAt).format('MMM DD, YYYY hh:mm:ss A')}</Text>
            </Stack>

            <Divider borderColor='gray.400' />

            <Stack spacing={0} direction='row' justifyContent='space-between'>
              <Text>Updated At:</Text>
              <Text>{data?.updatedAt ? dayjs(data?.updatedAt).format('MMM DD, YYYY hh:mm:ss A') : 'N/A'}</Text>
            </Stack>
          </Stack>
        </SlideFade>
      ) : (
        <>
          <Text>No Settings Created</Text>
          <Text>Click Pencil Icon above to create booking settings</Text>
        </>
      )}
    </Box>
  );
}
