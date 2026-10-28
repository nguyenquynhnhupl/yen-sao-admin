export type Category = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at?: string;
  sort_order: number;
  image_url?: string | null;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  category_id: string | null;
  stock: number;
  is_published: boolean;
  created_at?: string;
};


export type Banner = {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  position: string;
  is_active: boolean;
  created_at?: string;
};

export type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  is_published: boolean;
  created_at?: string;
};

export type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  status: string;
  created_at: string;
};
