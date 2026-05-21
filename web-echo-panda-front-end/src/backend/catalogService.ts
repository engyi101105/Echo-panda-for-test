const viteEnv = (import.meta as any).env || {};
const BACKEND_API_BASE_URL =
  viteEnv.VITE_BACKEND_API_URL || "http://localhost:8082/api";

export interface CatalogArtist {
  id: string;
  name: string;
  image_url?: string;
}

export interface CatalogAlbum {
  id: string;
  title: string;
  cover_url?: string;
  release_date?: string;
  type?: string;
  artists?: CatalogArtist[];
}

export interface CatalogSong {
  id: string;
  title: string;
  duration: number;
  album_id: string | null;
  audio_url: string | null;
  songCover_url: string | null;
  created_at: string;
  artists: CatalogArtist[];
  album?: {
    id: string;
    title: string;
    cover_url?: string;
  } | null;
}

const request = async <T = any>(path: string): Promise<T> => {
  const res = await fetch(`${BACKEND_API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return (await res.json()) as T;
};

export async function getAlbums(limit = 10, offset = 0): Promise<CatalogAlbum[]> {
  const data = await request<{ data?: any[] }>(`/albums?per_page=200&sort_by=latest`);
  const rows = Array.isArray(data?.data) ? data.data : [];

  return rows.slice(offset, offset + limit).map((album: any) => ({
    id: String(album.id),
    title: album.title,
    cover_url: album.s3_cover_image_url || album.cover_image || undefined,
    release_date: album.release_date || undefined,
    type: album.type || undefined,
    artists: album.artist
      ? [{ id: String(album.id), name: album.artist, image_url: undefined }]
      : [],
  }));
}

export async function getSongs(limit = 25): Promise<CatalogSong[]> {
  const data = await request<{ data?: any[] }>(`/songs?per_page=${Math.max(1, limit)}&sort_by=latest`);
  const rows = Array.isArray(data?.data) ? data.data : [];

  return rows.map((song: any) => ({
    id: String(song.id),
    title: song.title,
    duration: song.duration,
    album_id: song.album_id ? String(song.album_id) : null,
    audio_url: song.s3_audio_url || null,
    songCover_url: song.album?.s3_cover_image_url || song.album?.cover_image || null,
    created_at: song.created_at,
    artists: song.artist ? [{ id: String(song.id), name: song.artist, image_url: undefined }] : [],
    album: song.album
      ? {
          id: String(song.album.id),
          title: song.album.title,
          cover_url: song.album.s3_cover_image_url || song.album.cover_image || undefined,
        }
      : null,
  }));
}

export async function getDerivedArtists(limit = 10, search = ""): Promise<CatalogArtist[]> {
  const songs = await getSongs(200);
  const albums = await getAlbums(200, 0);

  const map = new Map<string, CatalogArtist>();

  songs.forEach((song) => {
    song.artists.forEach((artist) => {
      if (!map.has(artist.name.toLowerCase())) {
        map.set(artist.name.toLowerCase(), {
          id: encodeURIComponent(artist.name),
          name: artist.name,
          image_url: artist.image_url,
        });
      }
    });
  });

  albums.forEach((album) => {
    (album.artists || []).forEach((artist) => {
      if (!map.has(artist.name.toLowerCase())) {
        map.set(artist.name.toLowerCase(), {
          id: encodeURIComponent(artist.name),
          name: artist.name,
          image_url: artist.image_url,
        });
      }
    });
  });

  const normalizedSearch = search.trim().toLowerCase();
  const list = Array.from(map.values()).filter((artist) =>
    normalizedSearch ? artist.name.toLowerCase().includes(normalizedSearch) : true
  );

  return list.slice(0, Math.max(1, limit));
}

export async function getDerivedCategories(): Promise<Array<{ id: string; name: string; description: string }>> {
  const defaults = ["Pop", "Rock", "Hip Hop", "Chill", "Acoustic", "Electronic"];

  return defaults.map((name) => ({
    id: encodeURIComponent(name.toLowerCase()),
    name,
    description: `${name} music`,
  }));
}

export async function getHomeTags(): Promise<Array<{ id: string; name: string; description: string; display_order: number; albums: CatalogAlbum[] }>> {
  const albums = await getAlbums(12, 0);
  const newReleases = albums.slice(0, 6);
  const trending = albums.slice(6, 12);

  return [
    {
      id: "new-releases",
      name: "New Releases",
      description: "Latest albums on Echo Panda",
      display_order: 1,
      albums: newReleases,
    },
    {
      id: "trending",
      name: "Trending",
      description: "Popular picks right now",
      display_order: 2,
      albums: trending,
    },
  ];
}
