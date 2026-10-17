export type ReportKind = "user" | "listing" | "problem" | "dispute";

export const REASONS: Record<ReportKind, string[]> = {
  user: [
    "Spam or scam",
    "Harassment or abuse",
    "Fake profile or impersonation",
    "Inappropriate content",
    "Other",
  ],
  listing: [
    "Misleading or fake listing",
    "Prohibited item or service",
    "Wrong price or category",
    "Offensive content",
    "Other",
  ],
  problem: [
    "Something isn't working",
    "Payment problem",
    "Account issue",
    "Other",
  ],
  dispute: [
    "Item or service not received",
    "Not as described",
    "Seller or buyer not responding",
    "Payment issue",
    "Other",
  ],
};

export const COPY: Record<ReportKind, { title: string; description: string; submit: string }> = {
  user: {
    title: "Report user",
    description: "Why are you reporting this person?",
    submit: "Submit report",
  },
  listing: {
    title: "Report listing",
    description: "What's wrong with this listing?",
    submit: "Submit report",
  },
  problem: {
    title: "Report a problem",
    description: "Tell us what went wrong.",
    submit: "Submit report",
  },
  dispute: {
    title: "Open a dispute",
    description: "Our team will review the order and step in.",
    submit: "Open dispute",
  },
};