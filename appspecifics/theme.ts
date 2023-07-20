type GetAppKeys = 'VillaLeonora' | 'HydroResortManila';

export const GetApp = {
  ThemeColors: (() => {
    const result = {
      VillaLeonora: {
        primary: {
          1: '#A2AF3D',
          2: '#FFFAF6',
          3: '#3B3E1E',
        },
        secondary: {
          1: '#ebebeb',
          2: '#7f9193',
        },
        default: {
          50: '#A2AF3D',
          100: '#A2AF3D',
          500: '#A2AF3D',
        },
      },
      HydroResortManila: {
        primary: {
          1: '#2c5155',
          2: '#fffbf8',
          3: '#ffffff',
        },
        secondary: {
          1: '#ebebeb',
          2: '#7f9193',
        },
        default: {
          50: '#2c5155',
          100: '#2c5155',
          500: '#2c5155',
        },
      },
    };

    return result[process.env.NEXT_PUBLIC_APP as GetAppKeys];
  })(),
  ButtonSolid: (() => {
    const result = {
      VillaLeonora: {
        bg: 'primary.1',
        color: 'white',
        _hover: {
          bg: '#9dc209',
        },
        _active: {
          bg: '#9dc209',
        },
      },
      HydroResortManila: {
        bg: 'primary.1',
        color: 'white',
        _hover: {
          bg: 'teal',
        },
        _active: {
          bg: 'teal.400',
        },
      },
    };

    return result[process.env.NEXT_PUBLIC_APP as GetAppKeys];
  })(),
  ActiveColor: (() => {
    const result = {
      VillaLeonora: '#9dc209',
      HydroResortManila: 'teal.400',
    };

    return result[process.env.NEXT_PUBLIC_APP as GetAppKeys];
  })(),
  HoverButton: 'whiteAlpha.800',
  Favicon: (() => {
    const result = {
      VillaLeonora: '/VL_favicon.ico',
      HydroResortManila: '/hydro_favicon.ico',
    };

    return result[process.env.NEXT_PUBLIC_APP as GetAppKeys];
  })(),
};
