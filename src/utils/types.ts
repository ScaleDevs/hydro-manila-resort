import { Booking, Product, AddOn } from '@prisma/client';

export type IProduct = Product;
export type IAddOn = AddOn;
export type IBooking = Booking;

// inputs
export type IPaginationInputs = {
  page: number;
  limit: number;
};
