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
import { GetApp } from '@/appspecs/theme';
import { NumberField } from '@/components/NumberField';

const PencilIcon = chakra(BsPencilSquare);
const XIcon = chakra(BsX);

const schema = z.object({
  bookingFee: z.number(),
});

type FormSchemaType = z.infer<typeof schema>;

export interface IBookingSettingProps {}

export default function BookingSetting({}: IBookingSettingProps) {
  const { isOpen, onToggle } = useDisclosure();
  const toast = useToast();
  const { data, isLoading, refetch } = trpc.bookingSetting.getBookingSetting.useQuery();
  const { mutate, isLoading: processingSettings } = trpc.bookingSetting.upsertBookingSetting.useMutation();
  const defaultValues = {
    bookingFee: data?.bookingFee || 0,
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
        bookingFee: data.bookingFee,
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
                <NumberField
                  placeholder='Booking Fee'
                  register={register}
                  property='bookingFee'
                  errMsg={errors.bookingFee?.message}
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
              <Text>{PHpeso.format(data?.bookingFee)}</Text>
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
