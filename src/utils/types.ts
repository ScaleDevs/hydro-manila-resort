import { Booking, Product, Room } from '@prisma/client';

export type IProduct = Product;
export type IRoom = Room;
export type IBooking = Booking;

// inputs
export type IPaginationInputs = {
  page: number;
  limit: number;
};
