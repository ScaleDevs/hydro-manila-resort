import { useState } from 'react';
import { TableContainer, Table, Thead, Tr, Th, Tbody, Td, Skeleton, Box } from '@chakra-ui/react';

import { trpc } from '@/utils/trpc';
import Paginator from '@/components/Paginator';

export interface ITableAddOnsProps {}

export default function TableAddOns({}: ITableAddOnsProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = trpc.addOn.getAddOns.useQuery({ page, limit: 5 });

  const handlePageChange = (pageNumber: number) => {
    setPage(pageNumber);
  };

  return (
    <>
      <TableContainer>
        <Table fontFamily='primary' color='primary.1'>
          <Thead>
            <Tr>
              <Th fontSize='md' fontFamily='primary'>
                ADD ON NAME
              </Th>
              <Th fontSize='md' fontFamily='primary'>
                DESCRIPTION
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
                  <Td>{v.name}</Td>
                  <Td>{v.details[(v.activeVersion || 1) - 1].description}</Td>
                  <Td>{v.details[(v.activeVersion || 1) - 1].price}</Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </TableContainer>
      <Box w='100%' mt='20px'>
        <Paginator currentPage={page} pageCount={data?.pageCount || 0} handlePageChange={handlePageChange} />
      </Box>
    </>
  );
}
