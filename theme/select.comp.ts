import { inputAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers } from '@chakra-ui/react';

const { defineMultiStyleConfig } = createMultiStyleConfigHelpers(inputAnatomy.keys);

const Select = defineMultiStyleConfig({
  variants: {
    outline: {
      field: {
        display: 'block',
        border: '1px solid',
        borderColor: 'primary.1',
        borderRadius: 'sm',
        _hover: {
          border: '2px solid teal',
        },
        _placeholder: {
          color: 'primary.1',
        },
      },
    },
  },
});

export default Select;
