import { Booking, Product, Room } from '@prisma/client';

export type IProduct = Product;
export type IRoom = Room;
export type IBooking = Booking;

// inputs
export type IPaginationInputs = {
  page: number;
  limit: number;
};

// ph geo data
export type IPHGeo = [{ name: string; region: string; key: string }, { name: string; province: string; city?: boolean }[]][];
