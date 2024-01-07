import { useState } from 'react';
import { TableContainer, Table, Thead, Tr, Th, Tbody, Td, Skeleton, Box, Button, useToast, ScaleFade } from '@chakra-ui/react';
import { BsFillTrashFill } from 'react-icons/bs';

import { trpc } from '@/utils/trpc';
import Paginator from '@/components/Paginator';

export interface ITableRoomProps {}

export default function TableRoom({}: ITableRoomProps) {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { data, isLoading } = trpc.room.getRooms.useQuery({ page, limit: 5 });
  const { mutate } = trpc.room.deleteRoom.useMutation();
  const utils = trpc.useContext();

  const deleteRoomRecord = (roomIdentityName: string, id: string) => {
    mutate(id, {
      onSuccess() {
        utils.room.getRooms.setData({ page, limit: 5 }, (rec: any) => {
          const newRecords = rec?.records.filter((value: { roomId: string }) => value.roomId !== id);
          return {
            pageCount: rec?.pageCount,
            records: newRecords,
          };
        });

        toast({
          title: `Room ${roomIdentityName} deleted.`,
          status: 'error',
          duration: 9000,
          isClosable: true,
        });
      },
    });
  };

  const handlePageChange = (pageNumber: number) => {
    setPage(pageNumber);
  };

  return (
    <ScaleFade initialScale={0.9} in>
      <TableContainer>
        <Table fontFamily='primary' color='black'>
          <Thead>
            <Tr>
              <Th fontSize='md' fontFamily='primary'>
                ROOM NUMBER
              </Th>
              <Th fontSize='md' fontFamily='primary'>
                PAX
              </Th>
              <Th fontSize='md' fontFamily='primary'>
                BATHROOM
              </Th>
              <Th fontSize='md' fontFamily='primary'>
                PRICE
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
                  <Td>{v.roomIdentityName}</Td>
                  <Td>{v.guests}</Td>
                  <Td>{v.withBathroom ? 'AVAILABLE' : 'N/A'}</Td>
                  <Td>₱{v.price}</Td>
                  <Td>
                    <Button borderRadius='sm' onClick={() => deleteRoomRecord(v.roomIdentityName, v.roomId)}>
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
  );
}
