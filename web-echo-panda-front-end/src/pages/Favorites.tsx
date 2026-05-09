import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSpinner, FaMusic, FaTrash } from "react-icons/fa";
import { supabase } from "../backend/supabaseClient";
import { useDataCache } from "../contexts/DataCacheContext";
import Song from "../components/Song";
import { getUserFavorites, removeFromFavorites } from "../backend/favoritesService";
import { trackSongPlay } from "../backend/playTrackingService";

interface Artist {
  id: string;
  name: string;
  image_url: string;
}

interface Album {
  id: string;
  title: string;
  cover_url: string;
}

interface SongData {
  id: string;
  title: string;
  duration: number;
  album_id: string | null;
  audio_url: string | null;
  songCover_url: string | null;
  created_at: string;
  artists?: Artist[];
  album?: Album;
  added_at?: string;
}



const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const { getCachedData } = useDataCache();
  const [songs, setSongs] = useState<SongData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavoriteSongs();
  }, []);

  const fetchFavoriteSongs = async () => {
    try {
      setLoading(true);
      const startTime = performance.now();
      console.log('🔄 [Favorites] Fetching favorite songs...');

      const data = await getCachedData('favorite_songs', async () => {
        // Get user's favorite song IDs
        const favoriteSongIds = await getUserFavorites();

        if (favoriteSongIds.length === 0) {
          return [];
        }

        // Fetch full song details
        const { data: songsData, error } = await supabase
          .from('songs')
          .select(`
            id,
            title,
            duration,
            album_id,
            audio_url,
            songCover_url,
            created_at,
            song_artist(
              artists(id, name, image_url)
            ),
            albums(id, title, cover_url)
          `)
          .in('id', favoriteSongIds);

        const fetchTime = performance.now() - startTime;
        console.log(`✅ [Favorites] Songs fetched in ${fetchTime.toFixed(0)}ms`);
        console.log(`📊 [Favorites] Retrieved ${songsData?.length || 0} songs`);

        if (error) throw error;

        const transformedSongs: SongData[] = (songsData || []).map((song: any) => ({
          id: song.id,
          title: song.title,
          duration: song.duration,
          album_id: song.album_id,
          audio_url: song.audio_url,
          songCover_url: song.songCover_url,
          created_at: song.created_at,
          artists: song.song_artist?.map((sa: any) => sa.artists).filter(Boolean) || [],
          album: song.albums || null
        }));

        return transformedSongs;
      });

      setSongs(data);
    } catch (error) {
      console.error('Error fetching favorite songs:', error);
    } finally {
      setLoading(false);
    }
  };



  const handlePlay = (songId: string) => {
    trackSongPlay(songId);
    navigate(`/song/${songId}`);
  };

  const handleAddToPlaylist = (songId: string) => {
    console.log('Add to playlist:', songId);
    // Implement add to playlist logic
  };

  const handleRemoveFavorite = async (songId: string) => {
    const success = await removeFromFavorites(songId);
    if (success) {
      // Refresh the list
      await fetchFavoriteSongs();
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to remove all favorites?')) {
      for (const song of songs) {
        await removeFromFavorites(song.id);
      }
      setSongs([]);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-5xl font-black text-white tracking-tight">
              Liked <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Songs</span>
            </h1>
          </div>
          <p className="text-slate-400 text-lg">
            {songs.length} {songs.length === 1 ? 'song' : 'songs'}
          </p>
          {songs.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/30"
            >
              <FaTrash size={16} />
              Clear All
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <FaSpinner className="text-purple-400 text-5xl animate-spin" />
          </div>
        ) : songs.length === 0 ? (
          <div className="text-center py-32">
            <FaMusic className="text-slate-700 text-6xl mx-auto mb-4" />
            <p className="text-slate-400 text-xl mb-2">No liked songs yet</p>
            <p className="text-slate-500">Songs you like will appear here</p>
          </div>
        ) : (
          <div className="bg-[#0f0f0f] rounded-lg">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 text-xs md:text-sm uppercase tracking-wide text-gray-400 font-medium border-b border-gray-800 pb-2 px-3">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-5 md:col-span-4">Title</div>
              <div className="hidden md:block md:col-span-3">Album</div>
              <div className="hidden md:block md:col-span-2">Added</div>
              <div className="col-span-2 text-right">Time</div>
            </div>

            {/* Song List */}
            <div className="space-y-2 mt-3">
              {songs.map((song, index) => (
                <Song
                  key={song.id}
                  id={song.id}
                  index={index + 1}
                  title={song.title}
                  artists={song.artists}
                  album={song.album}
                  duration={song.duration}
                  coverUrl={song.songCover_url}
                  metadata={formatDate(song.created_at)}
                  onPlay={handlePlay}
                  onAddToPlaylist={handleAddToPlaylist}
                  onAddToFavorite={handleRemoveFavorite}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
