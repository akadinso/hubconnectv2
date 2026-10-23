export type Seller = {
  id?: string;
  name: string;
  avatarUrl?: string | null;
  role?: string | null;
  verified?: boolean;
  isNew?: boolean;
};

export type Listing = {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string;
  price?: number;
  type?: "product" | "service" | string;
  image?: string | null;
  image_url?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  createdAt?: string;
  seller?: Seller;
  campus?: string | null;
};