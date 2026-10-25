export type ChatMsg = {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  kind: "text" | "offer" | "invoice";
  offerId: string | null;
};

export type OfferInfo = {
  id: string;
  price: number;
  listedPrice: number | null;
  status: string;
  expiresAt: string;
  invoiceNo: string | null;
  acceptedAt: string | null;
  orderId: string | null;
  listingTitle: string;
  proposedBy: "buyer" | "seller";
};