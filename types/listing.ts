export type Listing = {
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