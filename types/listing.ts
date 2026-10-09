export type Listing = {
  image_url: string | null | undefined;
  price: any;
  type: string;
  description: string;
  id: string;
  title: string;
  subtitle?: string;
  image?: string | null;
  rating?: number | null;
  reviewCount?: number;
  seller: {
    name: string;
    avatarUrl?: string | null;
    verified?: boolean;
    isNew?: boolean;
  };
};