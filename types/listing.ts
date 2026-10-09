export type Seller = {
  id?: string;
  name: string;
  avatarUrl?: string | null;
  verified?: boolean;
  isNew?: boolean;
};

export type Listing = {
  id: string;
  title: string;
  subtitle?: string | null;
  price?: number;
  image?: string | null;
  image_url?: string | null; // Database fallback
  rating?: number | null;
  reviewCount?: number | null;
  category?: string;
  type?: "product" | "service";
  createdAt?: string;
  seller?: Seller;
};