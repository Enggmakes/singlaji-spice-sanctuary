export interface HeroBanner {
  id: string;
  image_url: string;
  mobile_image_url?: string | null; // Optional dedicated mobile banner (e.g. 4:3, 1:1, or portrait)
  title?: string | null;
  subtitle?: string | null;
  badge_text?: string | null;
  button_text?: string | null;
  button_link?: string | null;
  secondary_button_text?: string | null;
  secondary_button_link?: string | null;
  show_buttons?: boolean;
  hide_overlay?: boolean;
  sort_order: number;
  is_active: boolean;
  aspect_ratio?: string; // e.g. "2.4:1" or "21:9"
  width?: number;
  height?: number;
  created_at?: string;
  updated_at?: string;
}
