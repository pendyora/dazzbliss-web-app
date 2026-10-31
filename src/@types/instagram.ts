export interface InstagramPost {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | string;
  media_url: string;
  thumbnail_url: string | null;
  permalink: string;
  caption: string | null;
  timestamp: string | null;
}

export interface InstagramFeed {
  posts: InstagramPost[];
}
