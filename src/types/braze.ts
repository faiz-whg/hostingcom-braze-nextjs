export interface AppBrazeCard {
  id: string;
  viewed?: boolean;
  title?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  created?: Date | null;
  updated?: Date | null;
  categories?: string[];
  expiresAt?: Date | null;
  url?: string | null;
  linkText?: string | null;
  aspectRatio?: number;
  extras?: {
    slot_target?: string;
    optin_button_above_text?: string;
    optin_button_below_text?: string;
    optin_primary_button_text?: string;
    optin_secondary_button_text?: string;
    count_down_hours?: string | number;
    alt_text?: string;
    display_duration_ms?: number;
    [key: string]: any;
  };
  pinned?: boolean;
  dismissible?: boolean;
  clicked?: boolean;
  dismissed?: boolean;
  isControl?: boolean;
  test?: boolean;
  ti?: string | null;
  ii?: string | null;
  si?: string | null;
  oe?: string;
  ae?: boolean;
} 