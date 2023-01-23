import { inputAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers } from '@chakra-ui/react';

const { defineMultiStyleConfig } = createMultiStyleConfigHelpers(inputAnatomy.keys);

const Input = defineMultiStyleConfig({
  variants: {
    outline: {
      field: {
        border: '1px solid',
        borderColor: 'secondary.2',
        borderRadius: 'sm',
        _hover: {
          borderColor: 'primary.1',
        },
      },
    },
  },
});

export default Input;
