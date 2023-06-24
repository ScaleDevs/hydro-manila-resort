import { defineStyleConfig } from '@chakra-ui/react';
import { GetApp } from '@/appspecs/theme';

const Button = defineStyleConfig({
  baseStyle: {
    fontFamily: 'primary',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    borderRadius: 'sm',
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
    solid: GetApp.ButtonSolid,
    ghost: {
      color: 'white',
      fontFamily: 'primary',
      _hover: {
        bg: 'whiteAlpha.400',
      },
      _active: {
        bg: 'whiteAlpha.400',
      },
    },
  },
  defaultProps: {
    size: 'md',
    variant: 'solid',
  },
});

export default Button;
