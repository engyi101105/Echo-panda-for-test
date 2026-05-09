import { supabase } from "./supabaseClient";

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  song_count?: number;
}

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

// Get all playlists for current user
export const getUserPlaylists = async (): Promise<Playlist[]> => {
  const uid = getCurrentUserUID();
  if (!uid) return [];

  try {
    const { data, error } = await supabase
      .from("playlists")
      .select(`
        id,
        user_id,
        name,
        created_at,
        updated_at,
        playlist_song(count)
      `)
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching playlists:", error);
      return [];
    }

    return (data || []).map((playlist: any) => ({
      ...playlist,
      song_count: playlist.playlist_song?.[0]?.count || 0,
    }));
  } catch (error) {
    console.error("Error fetching playlists:", error);
    return [];
  }
};

// Create new playlist
export const createPlaylist = async (name: string): Promise<Playlist | null> => {
  const uid = getCurrentUserUID();
  if (!uid) {
    console.error("User not logged in");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("playlists")
      .insert({
        user_id: uid,
        name: name,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating playlist:", error);
      return null;
    }

    console.log(`✅ Playlist "${name}" created`);
    return data;
  } catch (error) {
    console.error("Error creating playlist:", error);
    return null;
  }
};

// Add song to playlist
export const addSongToPlaylist = async (
  playlistId: string,
  songId: string
): Promise<boolean> => {
  try {
    // Check if song already exists in playlist
    const { data: existing } = await supabase
      .from("playlist_song")
      .select("*")
      .eq("playlist_id", playlistId)
      .eq("song_id", songId)
      .single();

    if (existing) {
      console.log("Song already in playlist");
      return true;
    }

    const { error } = await supabase
      .from("playlist_song")
      .insert({
        playlist_id: playlistId,
        song_id: songId,
      });

    if (error) {
      console.error("Error adding song to playlist:", error);
      return false;
    }

    console.log(`✅ Song ${songId} added to playlist ${playlistId}`);
    return true;
  } catch (error) {
    console.error("Error adding song to playlist:", error);
    return false;
  }
};

// Remove song from playlist
export const removeSongFromPlaylist = async (
  playlistId: string,
  songId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("playlist_song")
      .delete()
      .eq("playlist_id", playlistId)
      .eq("song_id", songId);

    if (error) {
      console.error("Error removing song from playlist:", error);
      return false;
    }

    console.log(`✅ Song ${songId} removed from playlist ${playlistId}`);
    return true;
  } catch (error) {
    console.error("Error removing song from playlist:", error);
    return false;
  }
};

// Get songs in a playlist
export const getPlaylistSongs = async (playlistId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from("playlist_song")
      .select(`
        song_id,
        added_at,
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
      .eq("playlist_id", playlistId)
      .order("added_at", { ascending: false });

    if (error) {
      console.error("Error fetching playlist songs:", error);
      return [];
    }

    return (data || []).map((item: any) => ({
      ...item.songs,
      added_at: item.added_at,
      artists: item.songs.song_artist?.map((sa: any) => sa.artists).filter(Boolean) || [],
      album: item.songs.albums || null,
    }));
  } catch (error) {
    console.error("Error fetching playlist songs:", error);
    return [];
  }
};

// Delete playlist
export const deletePlaylist = async (playlistId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("playlists")
      .delete()
      .eq("id", playlistId);

    if (error) {
      console.error("Error deleting playlist:", error);
      return false;
    }

    console.log(`✅ Playlist ${playlistId} deleted`);
    return true;
  } catch (error) {
    console.error("Error deleting playlist:", error);
    return false;
  }
};

// Check if song is in playlist
export const isSongInPlaylist = async (
  playlistId: string,
  songId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("playlist_song")
      .select("*")
      .eq("playlist_id", playlistId)
      .eq("song_id", songId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error checking playlist:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Error checking playlist:", error);
    return false;
  }
};
