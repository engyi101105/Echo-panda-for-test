import { supabase } from './supabaseClient';

export interface Song {
  id: number;
  title: string;
  artistId: number;
  artist_name?: string;
  cover_url?: string;
}

export interface Artist {
  id: number | string;
  name: string;
  image_url?: string;
}

/**
 * Search for songs and artists from Supabase database
 * Searches by song title and artist name
 */
export async function searchContent(query: string) {
  if (!query.trim()) {
    return { songs: [], artists: [] };
  }

  const q = query.trim();

  try {
    // Search for songs by title
    const { data: songsByTitle, error: songsError } = await supabase
      .from('songs')
      .select('id, title, duration, album_id, audio_url, songCover_url')
      .ilike('title', `%${q}%`)
      .limit(20);

    // Search for artists by name
    const { data: artistsData, error: artistsError } = await supabase
      .from('artists')
      .select('id, name, image_url')
      .ilike('name', `%${q}%`)
      .limit(20);

    if (songsError) console.error('Songs search error:', songsError);
    if (artistsError) console.error('Artists search error:', artistsError);

    // Helper function to get primary artist for a song
    const getArtistForSong = async (song: any): Promise<any> => {
      // First try song_artist (direct relationship)
      const { data: songArtists } = await supabase
        .from('song_artist')
        .select('artist_id, artists(id, name, image_url)')
        .eq('song_id', song.id)
        .eq('primary_artist', true)
        .limit(1);

      if (songArtists && songArtists.length > 0 && (songArtists[0] as any).artists) {
        return (songArtists[0] as any).artists;
      }

      // Fall back to album_artist (album relationship)
      const { data: albumArtists } = await supabase
        .from('album_artist')
        .select('artist_id, artists(id, name, image_url)')
        .eq('album_id', song.album_id)
        .eq('primary_artist', true)
        .limit(1);

      if (albumArtists && albumArtists.length > 0 && (albumArtists[0] as any).artists) {
        return (albumArtists[0] as any).artists;
      }

      return null;
    };

    // Enrich songs by title with artist info
    let enrichedSongsByTitle: any[] = [];
    if (songsByTitle && songsByTitle.length > 0) {
      for (const song of songsByTitle) {
        const artist = await getArtistForSong(song);
        enrichedSongsByTitle.push({
          ...song,
          artist_id: artist?.id || '',
          artist_name: artist?.name || 'Unknown Artist',
          artist_image: artist?.image_url,
        });
      }
    }

    // Get songs by matching artists
    let songsByArtist: any[] = [];
    if (artistsData && artistsData.length > 0) {
      for (const artist of artistsData) {
        // Get songs from song_artist relationship
        const { data: directSongs } = await supabase
          .from('song_artist')
          .select('song_id, songs(id, title, duration, album_id, audio_url, songCover_url)')
          .eq('artist_id', artist.id)
          .limit(50);

        // Get songs from album_artist relationship
        const { data: albumRelations } = await supabase
          .from('album_artist')
          .select('album_id')
          .eq('artist_id', artist.id)
          .limit(50);

        const albumIds = albumRelations?.map((aa: any) => aa.album_id) || [];
        let albumSongs: any[] = [];
        
        if (albumIds.length > 0) {
          const { data: songsFromAlbums } = await supabase
            .from('songs')
            .select('id, title, duration, album_id, audio_url, songCover_url')
            .in('album_id', albumIds)
            .limit(50);

          albumSongs = songsFromAlbums || [];
        }

        // Combine direct and album songs
        const allArtistSongs = [
          ...(directSongs?.map((sa) => sa.songs) || []),
          ...albumSongs,
        ].filter((s) => s); // Filter nulls

        allArtistSongs.forEach((song: any) => {
          songsByArtist.push({
            ...song,
            artist_id: artist.id,
            artist_name: artist.name,
            artist_image: artist.image_url,
          });
        });
      }
    }

    // Combine and deduplicate songs
    const allSongs = [...enrichedSongsByTitle, ...songsByArtist];
    const uniqueSongsMap = new Map();

    allSongs.forEach((song: any) => {
      if (!uniqueSongsMap.has(song.id)) {
        uniqueSongsMap.set(song.id, song);
      }
    });

    // Format songs
    const songs: Song[] = Array.from(uniqueSongsMap.values())
      .map((song: any) => ({
        id: song.id,
        title: song.title,
        artistId: song.artist_id,
        artist_name: song.artist_name,
        cover_url: song.songCover_url || song.cover_url,
      }))
      .filter((s) => s.title);

    // Format artists
    const artists: Artist[] = (artistsData || []).map((artist: any) => ({
      id: artist.id,
      name: artist.name,
      image_url: artist.image_url,
    }));

    console.log('Search results:', { songs, artists });
    return { songs, artists };
  } catch (error) {
    console.error('Search error:', error);
    return { songs: [], artists: [] };
  }
}

/**
 * Get featured songs from database
 */
export async function getFeaturedSongs(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('id, title, duration, album_id, audio_url, songCover_url')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Enrich with artist information
    const enrichedSongs = [];
    for (const song of data || []) {
      // Try song_artist first
      const { data: songArtists } = await supabase
        .from('song_artist')
        .select('artist_id, artists(id, name, image_url)')
        .eq('song_id', song.id)
        .eq('primary_artist', true)
        .limit(1);

      let artist: any = (songArtists?.[0] as any)?.artists;

      // Fall back to album_artist
      if (!artist) {
        const { data: albumArtists } = await supabase
          .from('album_artist')
          .select('artist_id, artists(id, name, image_url)')
          .eq('album_id', song.album_id)
          .eq('primary_artist', true)
          .limit(1);

        artist = (albumArtists?.[0] as any)?.artists;
      }

      enrichedSongs.push({
        id: song.id,
        title: song.title,
        artistId: artist?.id || '',
        artist_name: artist?.name || 'Unknown Artist',
        cover_url: song.songCover_url,
      });
    }

    return enrichedSongs;
  } catch (error) {
    console.error('Error fetching featured songs:', error);
    return [];
  }
}

/**
 * Get featured artists from database
 */
export async function getFeaturedArtists(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('artists')
      .select('id, name, image_url')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((artist: any) => ({
      id: artist.id,
      name: artist.name,
      image_url: artist.image_url,
    }));
  } catch (error) {
    console.error('Error fetching featured artists:', error);
    return [];
  }
}
