export interface Customer {
  id: string;
  object: "customer";
  email: string | null;
  name: string | null;
  phone: string | null;
  description: string | null;
  metadata: Record<string, string>;
  created: number;
  livemode: false;
  default_source: string | null;
  deleted?: boolean;
}

export interface CreateCustomerParams {
  email?: string;
  name?: string;
  phone?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export type UpdateCustomerParams = Partial<CreateCustomerParams>;