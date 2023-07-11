type GetAppKeys = 'VillaLeonora' | 'HydroResortManila';
export const GetVars = {
  CalendarTemplates: (() => {
    const result = {
      VillaLeonora: {
        bookingConfirmationId: 'o65qngk02j34wr12',
        reuseableId: 'pxkjn4155p5lz781',
        updateBookingRequestId: 'z86org888kegew13',
        updateBookingConfirmationId: 'v69oxl5vvw24785k',
        updateBookingConfirmationV2Id: '0p7kx4xmdw7l9yjr',
      },
      HydroResortManila: {
        bookingConfirmationId: 'z86org89om04ew13',
        reuseableId: 'yzkq3402kv2gd796',
        updateBookingRequestId: 'z3m5jgr9wqxgdpyo',
        updateBookingConfirmationId: 'pq3enl6xz87l2vwr',
        updateBookingConfirmationV2Id: 'neqvygmrjnzl0p7w',
      },
    };

    return result[process.env.NEXT_PUBLIC_APP as GetAppKeys];
  })(),
};
