export interface HeroBanner {
  id: string;
  image_url: string;
  title?: string;
  subtitle?: string;
  badge_text?: string;
  button_text?: string;
  button_link?: string;
  secondary_button_text?: string;
  secondary_button_link?: string;
  show_buttons?: boolean;
  sort_order: number;
  is_active: boolean;
  aspect_ratio?: string; // e.g. "16:9"
  width?: number;
  height?: number;
  created_at?: string;
  updated_at?: string;
}
