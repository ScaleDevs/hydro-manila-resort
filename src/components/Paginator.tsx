import React, { useEffect, useState } from 'react';
import { Center, HStack, Box } from '@chakra-ui/react';
import { BsChevronRight, BsChevronLeft } from 'react-icons/bs';

const Elipse = () => {
  return (
    <Box h='10' w='35px' bg='gray.200' display='flex' alignItems='end' justifyContent='center'>
      &hellip;
    </Box>
  );
};

const ArrowClick = ({ children, callback }: { children: any; callback: any }) => {
  return (
    <Box
      h='10'
      w='35px'
      bg='gray.200'
      display='flex'
      alignItems='center'
      justifyContent='center'
      borderRadius='sm'
      _hover={{ cursor: 'pointer', bg: 'gray.100' }}
      onClick={() => callback()}
    >
      {children}
    </Box>
  );
};

export interface IPaginatorProps {
  currentPage: number;
  pageCount: number;
  handlePageChange: (pageNumber: number) => void;
}

export default function Paginator({ currentPage, pageCount, handlePageChange }: IPaginatorProps) {
  const [lowerLimit, setLowerLimit] = useState(1);
  const [higherLimit, setHigherLimit] = useState(5);

  useEffect(() => {
    let pageForLowerLimit = currentPage;
    let pageForHigherLimit = currentPage;

    do {
      pageForLowerLimit -= 1;
    } while (pageForLowerLimit % 5 !== 0);

    do {
      if (pageForHigherLimit % 5 !== 0) pageForHigherLimit += 1;
    } while (pageForHigherLimit % 5 !== 0);

    setLowerLimit(pageForLowerLimit + 1);
    setHigherLimit(pageForHigherLimit);
  }, [currentPage]);

  return (
    <HStack spacing={2}>
      {currentPage > 1 && (
        <ArrowClick callback={() => handlePageChange(currentPage - 1)}>
          <BsChevronLeft />
        </ArrowClick>
      )}
      {lowerLimit > 1 && <Elipse />}
      {Array(pageCount)
        .fill(1)
        .map((v, i) => {
          const currentIteration = v + i;
          const isActive = currentPage === i + 1;

          if (currentIteration >= lowerLimit && currentIteration <= higherLimit)
            return (
              <Box
                key={i}
                w='35px'
                h='10'
                bg={isActive ? 'primary.1' : 'gray.200'}
                color={isActive ? 'white' : 'black'}
                borderRadius='sm'
                overflow='hidden'
                _hover={isActive ? { cursor: 'pointer' } : { cursor: 'pointer', bg: 'gray.300' }}
                onClick={() => handlePageChange(currentIteration)}
              >
                <Center h='100%'>{currentIteration}</Center>
              </Box>
            );
          return '';
        })}
      {pageCount > higherLimit && <Elipse />}
      {currentPage < pageCount && (
        <ArrowClick callback={() => handlePageChange(currentPage + 1)}>
          <BsChevronRight />
        </ArrowClick>
      )}
    </HStack>
  );
}
