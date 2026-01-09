
export interface Zone {
  id: number;
  name: string;
  author: string;
  authorLink?: string;
  url: string;
  cover: string;
  featured?: boolean;
}

export interface PopularityStats {
  [key: number]: number;
}
