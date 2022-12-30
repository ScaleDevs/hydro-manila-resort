import { Booking, Product, ProductExtra } from '@prisma/client';

export type IProduct = Product;
export type IProductExtra = ProductExtra;
export type IBooking = Booking;

// inputs
export type IPaginationInputs = {
  page: number;
  limit: number;
};
