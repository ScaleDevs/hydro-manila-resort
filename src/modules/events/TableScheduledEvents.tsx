import { useState } from 'react';
import Link from 'next/link';
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
  useToast,
  Button,
  ScaleFade,
  chakra,
  HStack,
  Text,
  useDisclosure,
  Stack,
  Tag,
} from '@chakra-ui/react';
import { BsFillTrashFill, BsFilterCircleFill } from 'react-icons/bs';
import dayjs from 'dayjs';

import { tableFormatTimeDisplay } from '../utils/helper';
import { trpc } from '@/utils/trpc';
import Paginator from '@/components/Paginator';
import ModalFilter, { SessionFilter } from './ModalFilter';
import { GetApp } from '@/appspecs/theme';

const FilterIcon = chakra(BsFilterCircleFill);

export default function TableScheduledEvent() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState<SessionFilter>({
    startDate: dayjs.tz(dayjs(), process.env.NEXT_PUBLIC_TIMEZONE).startOf('day').toISOString(),
    endDate: dayjs.tz(dayjs(), process.env.NEXT_PUBLIC_TIMEZONE).endOf('month').toISOString(),
  });
  const { isOpen, onToggle } = useDisclosure();
  const { data, isLoading } = trpc.scheduledevent.getManyScheduledEvent.useQuery({
    page,
    limit: 5,
    startDate: dateFilter.startDate,
    endDate: dateFilter.endDate,
  });
  const { mutate } = trpc.scheduledevent.deleteScheduledEvent.useMutation();
  const utils = trpc.useContext();

  const deleteScheduledEvent = (scheduleEventId: string, calendarEventId: string | null) => {
    mutate(
      {
        scheduleEventId,
        calendarEventId,
      },
      {
        onSuccess() {
          utils.scheduledevent.getManyScheduledEvent.setData(
            { page, limit: 5, startDate: dateFilter.startDate, endDate: dateFilter.endDate },
            (rec: any) => {
              const newRecords = rec?.records.filter(
                (value: { scheduledEventId: string }) => value.scheduledEventId !== scheduleEventId,
              );
              return {
                pageCount: rec?.pageCount,
                records: newRecords,
              };
            },
          );

          toast({
            title: 'scheduled event deleted.',
            status: 'error',
            duration: 9000,
            isClosable: true,
          });
        },
      },
    );
  };

  const handlePageChange = (pageNumber: number) => {
    setPage(pageNumber);
  };

  return (
    <>
      <ModalFilter onClose={onToggle} {...{ isOpen, setDateFilter }} />
      <Stack justifyContent='space-between' direction={{ base: 'column', sm: 'row' }}>
        <HStack>
          <Link href='/admin/events/create'>
            <Button borderRadius='full' h='50px' w='50px' fontSize='25px' fontWeight='normal'>
              +
            </Button>
          </Link>
          <FilterIcon
            h='50px'
            w='50px'
            color='primary.1'
            _hover={{ color: GetApp.ActiveColor, cursor: 'pointer' }}
            onClick={onToggle}
          />
        </HStack>
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
          <Table fontFamily='primary' color='primary.1'>
            <Thead>
              <Tr>
                <Th fontSize='md' fontFamily='primary'>
                  START
                </Th>
                <Th fontSize='md' fontFamily='primary'>
                  END
                </Th>
                <Th fontSize='md' fontFamily='primary'>
                  DESCRIPTION
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
                    </Tr>
                  ))
              ) : data?.records.length === 0 ? (
                <Tr _hover={{ cursor: 'pointer', bg: 'secondary.1' }}>
                  <Td colSpan={4} textAlign='center' fontSize='lg'>
                    No Records Found
                  </Td>
                </Tr>
              ) : (
                data?.records.map((v, i) => (
                  <Tr key={i} _hover={{ cursor: 'pointer', bg: 'secondary.1' }}>
                    <Td>{tableFormatTimeDisplay(v.startSession)}</Td>
                    <Td>{tableFormatTimeDisplay(v.endSession)}</Td>
                    <Td>{v.description}</Td>
                    <Td>
                      <Button borderRadius='sm' onClick={() => deleteScheduledEvent(v.scheduledEventId, v.calendarEventId)}>
                        <BsFillTrashFill />
                      </Button>
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
