import { supabase } from "./supabaseClient";

// Get current user UID from localStorage
const getCurrentUserUID = (): string | null => {
  const user = localStorage.getItem("user");
  if (!user) return null;
  try {
    const userData = JSON.parse(user);
    return userData.uid || null;
  } catch {
    return null;
  }
};

// Track a song play/listen
export const trackSongPlay = async (songId: string): Promise<boolean> => {
  const uid = getCurrentUserUID();
  if (!uid) {
    console.error("User not logged in");
    return false;
  }

  try {
    const { error } = await supabase
      .from("user_listens")
      .insert({
        user_id: uid,
        song_id: songId,
      });

    if (error) {
      console.error("Error tracking play:", error);
      return false;
    }

    console.log(`✅ Tracked play for song ${songId}`);
    return true;
  } catch (error) {
    console.error("Error tracking play:", error);
    return false;
  }
};

// Get play count for a song (all users)
export const getSongPlayCount = async (songId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from("user_listens")
      .select("*", { count: "exact", head: true })
      .eq("song_id", songId);

    if (error) {
      console.error("Error getting play count:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("Error getting play count:", error);
    return 0;
  }
};

// Get most played songs (global) - optimized
export const getMostPlayedSongs = async (limit: number = 25): Promise<any[]> => {
  try {
    console.log('🔄 Fetching most played songs...');
    
    // Get top songs by doing aggregation in a simpler way
    const { data: listenData, error } = await supabase
      .from('user_listens')
      .select('song_id')
      .limit(5000); // Reasonable limit to avoid fetching everything

    if (error) throw error;

    // Count in JS (still faster than before since we only fetch song_id)
    const counts = new Map<string, number>();
    (listenData || []).forEach(item => {
      counts.set(item.song_id, (counts.get(item.song_id) || 0) + 1);
    });

    // Get top song IDs
    const topSongIds = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id, count]) => ({ id, count }));

    if (topSongIds.length === 0) return [];

    // Fetch full song details only for top songs
    const { data: songsData, error: songsError } = await supabase
      .from('songs')
      .select(`
        id,
        title,
        duration,
        audio_url,
        songCover_url,
        album_id,
        song_artist(artists(id, name, image_url)),
        albums(id, title, cover_url)
      `)
      .in('id', topSongIds.map(s => s.id));

    if (songsError) throw songsError;

    // Merge counts with song data
    return (songsData || []).map(song => {
      const playCount = topSongIds.find(s => s.id === song.id)?.count || 0;
      return {
        ...song,
        play_count: playCount,
        artists: song.song_artist?.map((sa: any) => sa.artists).filter(Boolean) || [],
        album: song.albums || null,
      };
    }).sort((a, b) => b.play_count - a.play_count);
  } catch (error) {
    console.error('Error fetching most played songs:', error);
    return [];
  }
};

// Get user's recently played songs
export const getRecentlyPlayed = async (limit: number = 25): Promise<any[]> => {
  const uid = getCurrentUserUID();
  if (!uid) return [];

  try {
    const { data, error } = await supabase
      .from("user_listens")
      .select(`
        song_id,
        listened_at,
        songs(
          id,
          title,
          duration,
          songCover_url,
          album_id,
          song_artist(
            artists(id, name, image_url)
          ),
          albums(id, title, cover_url)
        )
      `)
      .eq("user_id", uid)
      .order("listened_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching recently played:", error);
      return [];
    }

    return (data || []).map((item: any) => ({
      ...item.songs,
      listened_at: item.listened_at,
      artists: item.songs.song_artist?.map((sa: any) => sa.artists).filter(Boolean) || [],
      album: item.songs.albums || null,
    }));
  } catch (error) {
    console.error("Error fetching recently played:", error);
    return [];
  }
};

// Get user's listening stats
export const getUserListeningStats = async (): Promise<{
  totalPlays: number;
  uniqueSongs: number;
  topArtist: string | null;
}> => {
  const uid = getCurrentUserUID();
  if (!uid) return { totalPlays: 0, uniqueSongs: 0, topArtist: null };

  try {
    const { data, error } = await supabase
      .from("user_listens")
      .select(`
        song_id,
        songs(
          song_artist(
            artists(name)
          )
        )
      `)
      .eq("user_id", uid);

    if (error) {
      console.error("Error fetching stats:", error);
      return { totalPlays: 0, uniqueSongs: 0, topArtist: null };
    }

    const totalPlays = data?.length || 0;
    const uniqueSongs = new Set(data?.map((item) => item.song_id)).size;

    // Count artist plays
    const artistCounts: { [key: string]: number } = {};
    data?.forEach((item: any) => {
      const artists = item.songs?.song_artist || [];
      artists.forEach((sa: any) => {
        const artistName = sa.artists?.name;
        if (artistName) {
          artistCounts[artistName] = (artistCounts[artistName] || 0) + 1;
        }
      });
    });

    const topArtist = Object.entries(artistCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return { totalPlays, uniqueSongs, topArtist };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return { totalPlays: 0, uniqueSongs: 0, topArtist: null };
  }
};

// Get most played albums (calculated from song plays) - optimized
export const getMostPlayedAlbums = async (limit: number = 10): Promise<any[]> => {
  try {
    // Optimized: fetch limited listens and aggregate in JS
    const { data: listenData, error } = await supabase
      .from('user_listens')
      .select(`
        songs!inner(album_id)
      `)
      .not('songs.album_id', 'is', null)
      .limit(5000); // Reasonable limit

    if (error) throw error;

    // Count plays per album
    const counts = new Map<string, number>();
    (listenData || []).forEach((item: any) => {
      const albumId = item.songs?.album_id;
      if (albumId) {
        counts.set(albumId, (counts.get(albumId) || 0) + 1);
      }
    });

    // Get top album IDs
    const topAlbumIds = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id, count]) => ({ id, count }));

    if (topAlbumIds.length === 0) return [];

    // Fetch full album details only for top albums
    const { data: albumsData, error: albumsError } = await supabase
      .from('albums')
      .select(`
        id,
        title,
        cover_url,
        release_date,
        album_artist(artists(id, name, image_url))
      `)
      .in('id', topAlbumIds.map(a => a.id));

    if (albumsError) throw albumsError;

    // Merge counts with album data
    return (albumsData || []).map(album => {
      const playCount = topAlbumIds.find(a => a.id === album.id)?.count || 0;
      return {
        id: album.id,
        title: album.title,
        cover_url: album.cover_url,
        release_date: album.release_date,
        play_count: playCount,
        artists: album.album_artist?.map((aa: any) => aa.artists).filter(Boolean) || [],
      };
    }).sort((a, b) => b.play_count - a.play_count);
  } catch (error) {
    console.error('Error fetching most played albums:', error);
    return [];
  }
};
