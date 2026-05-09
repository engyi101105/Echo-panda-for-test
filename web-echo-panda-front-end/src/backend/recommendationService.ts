import { supabase } from "./supabaseClient";

export interface ArtistRef {
  id: string;
  name: string;
  image_url?: string;
}

export interface AlbumRef {
  id: string;
  title: string;
  cover_url?: string;
  type?: string;
  release_date?: string;
  artists?: ArtistRef[];
}

export async function getRecommendationsForInterests(
  interests: string[],
  max = 8
): Promise<AlbumRef[]> {
  const names = (interests || [])
    .map((n) => (typeof n === "string" ? n.trim() : ""))
    .filter((n) => n.length > 0);

  // Helper to map raw album rows into UI-ready album objects
  const mapAlbums = (albumsData: any[]): AlbumRef[] =>
    (albumsData || []).map((album: any) => ({
      id: album.id,
      title: album.title,
      cover_url: album.cover_url,
      type: album.type,
      release_date: album.release_date,
      artists:
        album.album_artist?.map((aa: any) => aa.artists).filter(Boolean) || [],
    }));

  // If no interests, fall back to recent albums
  if (names.length === 0) {
    const { data, error } = await supabase
      .from("albums")
      .select(
        `id, title, cover_url, type, release_date,
         album_artist(artists(id, name, image_url))`
      )
      .order("created_at", { ascending: false })
      .limit(Math.max(1, max));

    if (error) throw error;
    return mapAlbums(data || []);
  }

  // Find matching category IDs by name
  const { data: categoryData, error: catError } = await supabase
    .from("categories")
    .select("id, name")
    .in("name", names);

  if (catError) throw catError;

  const categoryIds: string[] = (categoryData || []).map((c: any) => c.id);
  const albumIdSet = new Set<string>();

  // Get album IDs linked to selected categories
  if (categoryIds.length > 0) {
    const { data, error } = await supabase
      .from("album_category")
      .select("album_id")
      .in("category_id", categoryIds);
    if (error) throw error;
    (data || []).forEach((row: any) => albumIdSet.add(row.album_id));
  }

  let albumsQuery = supabase
    .from("albums")
    .select(
      `id, title, cover_url, type, release_date,
       album_artist(artists(id, name, image_url))`
    );

  if (albumIdSet.size > 0) {
    albumsQuery = albumsQuery.in("id", Array.from(albumIdSet));
  } else {
    // No direct matches, return a sensible fallback
    albumsQuery = albumsQuery.order("created_at", { ascending: false });
  }

  const { data: albumsData, error: albumsError } = await albumsQuery.limit(
    Math.max(1, max)
  );
  if (albumsError) throw albumsError;

  return mapAlbums(albumsData || []);
}
