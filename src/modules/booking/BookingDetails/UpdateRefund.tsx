import * as React from 'react';
import { useRouter } from 'next/router';
import { Button, VStack, useToast } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { trpc } from '@/utils/trpc';
import useAuthStoreTrack from '@/store/auth.store';
import Modal from '@/components/Modal';
import { TextField } from '@/components/TextField';
import { SelectField } from '@/components/SelectField';
import { NumberFieldV2 } from '@/components/NumberFieldV2';

const schema = z.object({
  refNo: z.string().optional(),
  process: z.enum(['BANK', 'CASH'], {
    errorMap: (issue) => {
      switch (issue.code) {
        case 'invalid_enum_value':
          return { message: 'Please choose value!' };
        default:
          return { message: issue.code };
      }
    },
  }),
  amount: z.preprocess((v) => Number(parseFloat(v as string)), z.number()).optional(),
});

type FormSchemaType = z.infer<typeof schema>;

const processTypes = [
  {
    label: 'CASH',
    value: 'CASH',
  },
  {
    label: 'BANK',
    value: 'BANK',
  },
];

export interface IUpdateRefundProps {
  bookingRefundId?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function UpdateRefund({ bookingRefundId, isOpen, onClose }: IUpdateRefundProps) {
  const router = useRouter();
  const { username } = useAuthStoreTrack();
  const ctx = trpc.useContext();
  const toast = useToast();

  const { mutate, isLoading } = trpc.booking.updateRefundInfo.useMutation();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
  });

  const onConfirm = async (data: FormSchemaType) => {
    if (!bookingRefundId) {
      toast({
        title: 'Invalid Refund Record!',
        position: 'top-right',
        duration: 5000,
        isClosable: true,
        status: 'error',
      });

      return;
    }

    if (!username) {
      toast({
        title: 'Invalid Admin User!',
        position: 'top-right',
        duration: 5000,
        isClosable: true,
        status: 'error',
      });

      return;
    }

    mutate(
      {
        bookingRefundId,
        data: {
          ...data,
          updatedBy: username,
        },
      },
      {
        onSuccess(data) {
          if (router.query.id && typeof router.query.id === 'string')
            ctx.booking.getBookingByRefNo.setData(router.query.id, (currentData: any) => {
              return { ...currentData, refund: data };
            });
          toast({
            title: 'Refund Info Saved',
            position: 'top-right',
            duration: 5000,
            isClosable: true,
            status: 'success',
          });
          reset();
          onClose();
        },
        onError() {
          toast({
            title: 'Something Went Wrong. Try Again',
            position: 'top-right',
            duration: 5000,
            isClosable: true,
            status: 'error',
          });
          onClose();
        },
      },
    );
  };

  return (
    <Modal title='Provide Refund Details' {...{ isOpen, onClose, isLoading }}>
      <form onSubmit={handleSubmit(onConfirm)}>
        <VStack gap={2}>
          <SelectField
            register={register}
            property='process'
            placeholder='Choose Process'
            label='Process:'
            options={processTypes}
            errMsg={errors.process?.message}
            required
          />

          <TextField
            register={register}
            property='refNo'
            placeholder='Reference No'
            label='Reference No:'
            errMsg={errors.refNo?.message}
          />

          <NumberFieldV2
            required
            control={control}
            property='amount'
            label='Amount:'
            errMsg={errors.amount?.message}
            precion={2}
          />

          <Button type='submit' isLoading={isLoading} w='100%'>
            Confirm
          </Button>
        </VStack>
      </form>
    </Modal>
  );
}
