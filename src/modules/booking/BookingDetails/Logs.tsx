import * as React from 'react';
import { UseTRPCQueryResult } from '@trpc/react-query/shared';
import { inferRouterOutputs } from '@trpc/server';
import { AppRouter } from '@/server/routers/_app';
import { TRPCClientErrorLike } from '@trpc/react-query';
import { SlideFade, Box, Heading, TableContainer, Table, Tbody, Td, Th, Thead, Tr, Spinner, Text } from '@chakra-ui/react';
import { trpc } from '@/utils/trpc';
import { utcDateToTzDayInstance } from '@/utils/helper';
import TransactionLogs from './TransactionLogs';

export interface IUpdateLogProps {
  data: UseTRPCQueryResult<inferRouterOutputs<AppRouter>['booking']['getBookingByRefNo'], TRPCClientErrorLike<AppRouter>>['data'];
  isIn?: boolean;
}

export function Logs({ isIn, data }: IUpdateLogProps) {
  const updateLogs = data?.updateLogs || [];
  const transactionLogs = data?.transactionLogs || [];

  const { data: productsData, isLoading: fetchingProducts } = trpc.product.getProducts.useQuery({
    page: 1,
    limit: 100,
  });
  const { data: roomsData, isLoading: fetchingRooms } = trpc.room.getRooms.useQuery({ page: 1, limit: 100 });

  const getReadableFieldName = (fieldUpdated: string) => {
    if (fieldUpdated === 'startSession') return 'CHECK-IN';
    if (fieldUpdated === 'endSession') return 'CHECK-OUT';
    if (fieldUpdated === 'productId') return 'SCHEDULE';
    return fieldUpdated.toUpperCase();
  };

  const transformValues = (fieldUpdated: string, value: string) => {
    if (['startSession', 'endSession'].includes(fieldUpdated))
      return utcDateToTzDayInstance(value).format('MMM DD, YYYY hh:mm A');

    if (fieldUpdated === 'productId' && !!productsData) return productsData.records.find((v) => v.productId === value)?.name;

    if (fieldUpdated === 'rooms' && !!roomsData) {
      console.log(value);
      if (value === '') return 'No Rooms';
      const roomIds = value.split(',');
      const result = roomsData.records.filter((v) => roomIds.includes(v.roomId));
      return result.map((v) => v.roomIdentityName).join(', ');
    }

    return value;
  };

  if (fetchingProducts || fetchingRooms)
    return (
      <SlideFade in={isIn} offsetY='20px'>
        <Box w='100%' mx='auto' bg='gray.50' p='25px' boxShadow='xl' borderRadius='sm'>
          <Spinner size='lg' />
        </Box>
      </SlideFade>
    );

  return (
    <SlideFade in={isIn} offsetY='20px'>
      <Box w='100%' mx='auto' bg='gray.50' p='25px' boxShadow='xl' borderRadius='sm'>
        <Heading size='lg'>UPDATE LOGS</Heading>

        <br />
        <TableContainer>
          <Table fontFamily='primary' color='black' variant='striped'>
            <Thead>
              <Tr>
                <Th fontSize='md' fontFamily='primary'>
                  UPDATED BY
                </Th>
                <Th fontSize='md' fontFamily='primary'>
                  FIELD
                </Th>
                <Th fontSize='md' fontFamily='primary'>
                  FROM
                </Th>
                <Th fontSize='md' fontFamily='primary'>
                  TO
                </Th>
                <Th fontSize='md' fontFamily='primary'>
                  UPDATED AT
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {updateLogs.length === 0 ? (
                <Tr _hover={{ cursor: 'pointer', bg: 'secondary.1' }}>
                  <Td colSpan={5} textAlign='center' fontSize='lg'>
                    No Records Found
                  </Td>
                </Tr>
              ) : (
                updateLogs.map((v, i) => (
                  <Tr key={i} _hover={{ cursor: 'pointer', bg: 'secondary.1' }} fontSize={{ base: 'xs', xl: 'sm' }}>
                    <Td>{v.updatedBy}</Td>
                    <Td>{getReadableFieldName(v.fieldUpdated)}</Td>
                    <Td>
                      <Box minW='200px' maxW='200px' whiteSpace='normal'>
                        <Text sx={{ wordWrap: 'break-word', wordBreak: 'break-word' }}>
                          {transformValues(v.fieldUpdated, v.fromValue)}
                        </Text>
                      </Box>
                    </Td>
                    <Td>
                      <Box minW='200px' maxW='200px' whiteSpace='normal'>
                        <Text sx={{ wordWrap: 'break-word', wordBreak: 'break-word' }}>
                          {transformValues(v.fieldUpdated, v.toValue)}
                        </Text>
                      </Box>
                    </Td>
                    <Td>{utcDateToTzDayInstance(v.createdAt).format('MMM DD, YYYY hh:mm A')}</Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>

      <br />

      <TransactionLogs bookingId={data?.id} logs={transactionLogs} />
    </SlideFade>
  );
}
