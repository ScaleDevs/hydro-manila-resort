import { Booking, Product, Room, BookingSetting, BookingRefund, ScheduledEvent } from '@prisma/client';

export type IProduct = Product;
export type IRoom = Room;
export type IBooking = Booking;
export type IBookingSetting = BookingSetting;
export type IBookingRefund = BookingRefund;
export type IScheduledEvent = ScheduledEvent;

// inputs
export type IPaginationInputs = {
  page: number;
  limit: number;
};

export type DatesInput = {
  startDate: string | Date;
  endDate: string | Date;
};

// ph geo data
export type IPHGeo = [{ name: string; region: string; key: string }, { name: string; province: string; city?: boolean }[]][];

// payment repo

export type PaymentMethodTypes = 'gcash' | 'card' | 'dob' | 'paymaya' | 'billease';

export type PaymongoWebhookEventType = 'source.chargeable' | 'payment.paid' | 'payment.failed' | 'payment.refunded';

export interface PaymentIntentResource {
  data: {
    id: string;
    type: 'payment_intent';
    attributes: {
      amount: number;
      currency: 'PHP';
      description?: string;
      statement_descriptor?: string;
      status: 'awaiting_payment_method' | 'awaiting_next_action' | 'succeeded' | 'processing';
      livemode: boolean;
      client_key: string;
      created_at: number;
      updated_at: number;
      last_payment_error: any;
      payment_method_allowed: PaymentMethodTypes[];
      payments: any[];
      next_action: null | {
        type: 'redirect';
        redirect?: {
          url: string;
          return_url: string;
        };
      };
      payment_method_options: {
        card: {
          request_three_d_secure: 'any';
        };
      };
      metadata: any;
    };
  };
}

export type RefundResourceReason = 'others' | 'duplicate' | 'fraudulent' | 'requested_by_customer';

export interface RefundResource {
  data: {
    id: string;
    type: 'refund';
    attributes: {
      amount: number;
      balance_transaction_id: string;
      currency: 'PHP';
      livemode: boolean;
      metadata: null | any;
      notes: null | any;
      payment_id: string;
      payout_id: null | string;
      reason: RefundResourceReason;
      status: 'succeeded' | 'pending' | 'processing' | 'failed';
      available_at: number;
      created_at: number;
      refunded_at: number;
      updated_at: number;
    };
  };
}

export interface PayMongoWebHookResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      type: PaymongoWebhookEventType;
      livemode: boolean;
      data: {
        attributes: {
          id: string;
          type: string;
          access_url: string | null;
          amount: number;
          balance_transaction_id: string;
          billing: {
            address: {
              line1: string | null;
              line2: string | null;
              city: string;
              postal_code: string;
              country: string;
              state: string;
            };
            email: string;
            name: string;
            phone: null | string;
          };
          currency: 'PHP';
          description: string | null;
          disputed: boolean;
          external_reference_number: string | null;
          fee: number;
          foreign_fee: number;
          livemode: boolean;
          net_amount: number;
          origin: string;
          payment_intent_id: string;
          payout: any | null;
          source: {
            id: string;
            type: string;
            brand: string;
            country: string;
            last4: string;
          };
          statement_descriptor: string;
          status: string;
          tax_amount: number | null;
          metadata: {
            bookingRecord: string;
          };
          refunds: any[];
          taxes: any[];
          available_at: number;
          created_at: number;
          credited_at: number;
          paid_at: number;
          updated_at: number;
        };
      };
      previous_data: any;
      pending_webhooks: number;
      created_at: number;
      updated_at: number;
    };
  };
}
