export type SellerListing = {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  images: string[];
  type: "product" | "service";
  category_id: string | null;
  condition: string | null;
  rate_type: string | null;
  availability: string[];
  status: "draft" | "active" | "archived";
};