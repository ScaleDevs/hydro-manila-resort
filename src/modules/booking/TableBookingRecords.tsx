import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  TableContainer,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  Skeleton,
  Box,
  ScaleFade,
  chakra,
  useDisclosure,
  Tag,
  Text,
  Stack,
} from '@chakra-ui/react';
import { BsFilterCircleFill } from 'react-icons/bs';
import dayjs from 'dayjs';

import { tableFormatTimeDisplay } from '../utils/helper';
import { trpc } from '@/utils/trpc';
import Paginator from '@/components/Paginator';
import ModalFilter, { SessionFilter } from './ModalFilter';
import { GetApp } from '@/appspecs/theme';

const BadgeColor = {
  PENDING: 'orange.300',
  COMPLETED: 'green.300',
  BOOKED: 'green.300',
  REFUNDING: 'gray.300',
  REFUNDED: 'gray.300',
  FAILED: 'red.300',
};

const TextColor = {
  PENDING: 'orange.700',
  COMPLETED: 'green.700',
  BOOKED: 'green.700',
  REFUNDING: 'gray.700',
  REFUNDED: 'gray.700',
  FAILED: 'red.700',
};

const FilterIcon = chakra(BsFilterCircleFill);

export default function TableBookingRecords() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [refNo, setRefNo] = useState<undefined | string>(undefined);
  const [dateFilter, setDateFilter] = useState<undefined | SessionFilter>(
    !!router.query.startDate && !!router.query.endDate
      ? {
          startDate: router.query.startDate as string,
          endDate: router.query.endDate as string,
        }
      : {
          startDate: dayjs.tz(dayjs(), process.env.NEXT_PUBLIC_TIMEZONE).startOf('day').toISOString(),
          endDate: dayjs.tz(dayjs(), process.env.NEXT_PUBLIC_TIMEZONE).endOf('month').toISOString(),
        },
  );
  const [status, setStatus] = useState<'ALL' | 'BOOKED' | 'FAILED' | 'PENDING' | 'REFUNDED'>('BOOKED');
  const { isOpen, onToggle } = useDisclosure();
  const { data, isLoading } = trpc.booking.getManyBooking.useQuery({
    page,
    limit: 10,
    ref_no: refNo,
    dateFilter,
    status,
  });

  const handlePageChange = (pageNumber: number) => {
    setPage(pageNumber);
  };

  const goToBookingDetails = (refNo: string) => {
    router.push('/admin/bookings/' + refNo);
  };

  return (
    <>
      <ModalFilter {...{ isOpen, setRefNo, setDateFilter, setStatus, onClose: onToggle }} />

      <Stack spacing={5} direction={{ base: 'column', sm: 'row' }}>
        <FilterIcon
          h='40px'
          w='40px'
          color='primary.1'
          _hover={{ color: GetApp.ActiveColor, cursor: 'pointer' }}
          onClick={onToggle}
        />
        {dateFilter && (
          <Stack direction={{ base: 'column', sm: 'row' }} alignItems='center'>
            <Tag size='lg' colorScheme='gray' borderRadius='full'>
              {dayjs(dateFilter?.startDate).format('MMM DD, YYYY hh:mm A')}
            </Tag>
            <Text fontWeight='bold' textAlign='center'>
              -
            </Text>
            <Tag size='lg' colorScheme='gray' borderRadius='full'>
              {dayjs(dateFilter?.endDate).format('MMM DD, YYYY hh:mm A')}
            </Tag>
          </Stack>
        )}
      </Stack>

      <br />

      <ScaleFade initialScale={0.9} in>
        <TableContainer w='100%'>
          <Table fontFamily='primary' color='black'>
            <Thead>
              <Tr>
                <Th fontSize='md' fontFamily='primary'>
                  NAME
                </Th>
                <Th fontSize='md' fontFamily='primary'>
                  SCHEDULE
                </Th>
                <Th fontSize='md' fontFamily='primary'>
                  GUESTS
                </Th>
                <Th fontSize='md' fontFamily='primary'>
                  REFERENCE
                </Th>
                <Th fontSize='md' fontFamily='primary'>
                  STATUS
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {isLoading ? (
                Array(5)
                  .fill(1)
                  .map((v, i) => (
                    <Tr key={i}>
                      <Td>
                        <Skeleton height='20px' />
                      </Td>
                      <Td>
                        <Skeleton height='20px' />
                      </Td>
                      <Td>
                        <Skeleton height='20px' />
                      </Td>
                      <Td>
                        <Skeleton height='20px' />
                      </Td>
                      <Td>
                        <Skeleton height='20px' />
                      </Td>
                    </Tr>
                  ))
              ) : data?.records.length === 0 ? (
                <Tr _hover={{ cursor: 'pointer', bg: 'secondary.1' }}>
                  <Td colSpan={5} textAlign='center' fontSize='lg'>
                    No Records Found
                  </Td>
                </Tr>
              ) : (
                data?.records.map((v, i) => (
                  <Tr key={i} _hover={{ cursor: 'pointer', bg: 'secondary.1' }} onClick={() => goToBookingDetails(v.ref_no)}>
                    <Td>{v.name}</Td>
                    <Td>
                      {tableFormatTimeDisplay(v.startSession)} - {tableFormatTimeDisplay(v.endSession)}
                    </Td>
                    <Td>{v.guests.nonOverNightGuests + v.guests.overNightGuests}</Td>
                    <Td>{v.ref_no}</Td>
                    <Td>
                      <Box
                        bg={BadgeColor[v.refundId ? 'REFUNDED' : v.status]}
                        textAlign='center'
                        p='5px'
                        borderRadius='md'
                        color={TextColor[v.refundId ? 'REFUNDED' : v.status]}
                      >
                        {v.refundId ? 'REFUNDED' : v.status}
                      </Box>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
        <Box w='100%' mt='20px'>
          <Paginator currentPage={page} pageCount={data?.pageCount || 0} handlePageChange={handlePageChange} />
        </Box>
      </ScaleFade>
    </>
  );
}
