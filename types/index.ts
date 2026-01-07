export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  _count?: {
    posts: number;
  };
}

export interface Author {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  mainImage?: string | null;
  mainImageDescription?: string | null;
  published: boolean;
  featured?: boolean;
  views?: number;
  categoryId: string;
  category?: Category;
  authorId?: string;
  author?: Author | null;
  keywords?: string[];
  createdAt: Date;
  updatedAt: Date;
}
