import { useEffect } from 'react';
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
import { NumberFieldV2 } from '@/components/NumberFieldV2';
import { GetApp } from '@/appspecs/theme';

const PencilIcon = chakra(BsPencilSquare);
const XIcon = chakra(BsX);

const schema = z
  .object({
    overNightGuestFee: z.number(),
    minNonOverNightGuestPax: z.number(),
    maxNonOverNightGuestPax: z.number({ invalid_type_error: 'must be a number' }),
    nonOverNightGuestFee: z.number(),
    minOverNightGuestPax: z.number(),
    maxOverNightGuestPax: z.number(),
  })
  .superRefine((data, ctx) => {
    if (
      data.minNonOverNightGuestPax > data.maxNonOverNightGuestPax ||
      data.minNonOverNightGuestPax === data.maxNonOverNightGuestPax
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['minNonOverNightGuestPax'],
        message: 'Minimum Non Overnight Pax field should be lower than Max Non Overnight Pax Field',
      });
    }
    if (data.minOverNightGuestPax > data.maxOverNightGuestPax || data.minOverNightGuestPax === data.maxOverNightGuestPax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['minOverNightGuestPax'],
        message: 'Minimum Overnight Pax field should be lower than Max Overnight Pax Field',
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
  const defaultValues = {
    nonOverNightGuestFee: data?.guests.nonOverNightGuestFee,
    minNonOverNightGuestPax: data?.guests.minNonOverNightGuestPax,
    maxNonOverNightGuestPax: data?.guests.maxNonOverNightGuestPax,
    overNightGuestFee: data?.guests.overNightGuestFee,
    minOverNightGuestPax: data?.guests.minOverNightGuestPax,
    maxOverNightGuestPax: data?.guests.maxOverNightGuestPax,
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const updateOrCreateSetting = (data: FormSchemaType) => {
    mutate(
      {
        guests: data,
        bookingFee: 0,
      },
      {
        onSuccess() {
          toast({
            title: 'Update Success',
            status: 'success',
            duration: 9000,
            isClosable: true,
          });
          refetch();
        },
      },
    );
  };

  useEffect(() => {
    reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, reset]);

  return (
    <Box w={{ base: '100%', md: '700px', lg: '500px' }} bg='gray.50' p='25px' borderRadius='sm' boxShadow='xl'>
      <HStack w='100%' justifyContent='space-between'>
        <Heading>Settings</Heading>
        {isOpen ? (
          <XIcon
            h='40px'
            w='40px'
            _hover={{ cursor: 'pointer', color: GetApp.ActiveColor }}
            transition='color 0.25s'
            onClick={() => {
              onToggle();
              reset(defaultValues);
            }}
          />
        ) : (
          <PencilIcon
            h='30px'
            w='30px'
            _hover={{ cursor: 'pointer', color: GetApp.ActiveColor }}
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
                <Text>Minimum Non Overnight Guests:</Text>
                <NumberFieldV2
                  placeholder='Minimum Non Overnight Guests'
                  register={register}
                  property='minNonOverNightGuestPax'
                  errMsg={errors.minNonOverNightGuestPax?.message}
                />
              </Stack>

              <Stack spacing={0}>
                <Text>Maximum Non Overnight Guests:</Text>
                <NumberFieldV2
                  placeholder='Maximum Non Overnight Guests'
                  register={register}
                  property='maxNonOverNightGuestPax'
                  errMsg={errors.maxNonOverNightGuestPax?.message}
                />
              </Stack>

              <Stack spacing={0}>
                <Text>Non Overnight Guest Fee:</Text>
                <NumberFieldV2
                  placeholder='Non Overnight Guest Fee'
                  register={register}
                  property='nonOverNightGuestFee'
                  errMsg={errors.nonOverNightGuestFee?.message}
                />
              </Stack>

              <Stack spacing={0}>
                <Text>Minimum Overnight Guests:</Text>
                <NumberFieldV2
                  placeholder='Minimum Overnight Guests'
                  register={register}
                  property='minOverNightGuestPax'
                  errMsg={errors.minOverNightGuestPax?.message}
                />
              </Stack>

              <Stack spacing={0}>
                <Text>Maximum Overnight Guests:</Text>
                <NumberFieldV2
                  placeholder='Maximum Overnight Guests'
                  register={register}
                  property='maxOverNightGuestPax'
                  errMsg={errors.maxOverNightGuestPax?.message}
                />
              </Stack>

              <Stack spacing={0}>
                <Text>Overnight Guest Fee:</Text>
                <NumberFieldV2
                  placeholder='Overnight Guest Fee'
                  register={register}
                  property='overNightGuestFee'
                  errMsg={errors.overNightGuestFee?.message}
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
              <Text>Minimum Non Overnight Guests:</Text>
              <Text>{data?.guests.minNonOverNightGuestPax}</Text>
            </Stack>

            <Divider borderColor='gray.400' />

            <Stack spacing={0} direction='row' justifyContent='space-between'>
              <Text>Maximum Non Overnight Guests:</Text>
              <Text>{data?.guests.maxNonOverNightGuestPax}</Text>
            </Stack>

            <Divider borderColor='gray.400' />

            <Stack spacing={0} direction='row' justifyContent='space-between'>
              <Text>Non Overnight Guest Fee:</Text>
              <Text>{PHpeso.format(data?.guests.nonOverNightGuestFee)}</Text>
            </Stack>

            <Divider borderColor='gray.400' />

            <Stack spacing={0} direction='row' justifyContent='space-between'>
              <Text>Minimum Overnight Guests:</Text>
              <Text>{data?.guests.minOverNightGuestPax}</Text>
            </Stack>

            <Divider borderColor='gray.400' />

            <Stack spacing={0} direction='row' justifyContent='space-between'>
              <Text>Maximum Overnight Guests:</Text>
              <Text>{data?.guests.maxOverNightGuestPax}</Text>
            </Stack>

            <Divider borderColor='gray.400' />

            <Stack spacing={0} direction='row' justifyContent='space-between'>
              <Text>Overnight Guest Fee:</Text>
              <Text>{PHpeso.format(data?.guests.overNightGuestFee)}</Text>
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
