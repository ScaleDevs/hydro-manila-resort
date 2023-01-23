import { defineStyleConfig } from '@chakra-ui/react';

const Button = defineStyleConfig({
  baseStyle: {
    fontFamily: 'primary',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    borderRadius: '0',
  },
  sizes: {
    sm: {
      fontSize: 'sm',
      px: 4,
      py: 3,
    },
    md: {
      fontSize: 'md',
      px: 6,
      py: 4,
    },
    lg: {
      fontSize: 'lg',
      px: 8,
      py: 5,
    },
  },
  variants: {
    solid: {
      bg: 'primary.1',
      color: 'white',
      _hover: {
        bg: 'teal',
      },
    },
  },
  defaultProps: {
    size: 'md',
    variant: 'solid',
  },
});

export default Button;
