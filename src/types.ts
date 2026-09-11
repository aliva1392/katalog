export interface Variant {
  id: number;
  design_id: number;
  size_dimensions: string;
  stock_count: number;
  is_active: boolean;
}

export interface Design {
  id: number;
  category_id: number;
  sku_code: string;
  image_url: string;
  is_active: boolean;
  variants: Variant[];
}

export interface Category {
  id: number;
  parent_id: number | null;
  layer_level: number;
  name_fa: string;
  name_ar: string;
  name_en: string;
  name_tr: string;
  is_active: boolean;
  children: Category[];
  designs: Design[];
}

export type Language = 'fa' | 'ar' | 'en' | 'tr';
