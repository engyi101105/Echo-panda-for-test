import React, { useMemo, useState, useEffect } from "react";
import { FaMusic, FaMicrophone, FaFire, FaCalendarAlt, FaSpinner } from "react-icons/fa";
import { supabase } from "../../backend/supabaseClient";
import { useDataCache } from "../../contexts/DataCacheContext";

interface Song {
  id: string;
  rank: number;
  title: string;
  artist: string;
  favorites: number;
  plays: number;
  cover_url?: string;
}

interface Artist {
  id: string;
  rank: number;
  name: string;
  favorites: number;
  followers: number;
  image_url?: string;
}

export default function Favorites({ dateFilter: dateFilterProp, onFilterChange }: { dateFilter?: string; onFilterChange?: (filter: string) => void }) {
  const { getCachedData, clearCache } = useDataCache();
  const [dateFilter, setDateFilter] = useState(dateFilterProp || "all");
  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, [dateFilter]);

  const getDateFilter = () => {
    const now = new Date();
    switch (dateFilter) {
      case '7days':
        return new Date(now.setDate(now.getDate() - 7)).toISOString();
      case '30days':
        return new Date(now.setDate(now.getDate() - 30)).toISOString();
      case '90days':
        return new Date(now.setDate(now.getDate() - 90)).toISOString();
      default:
        return null;
    }
  };

  const fetchFavorites = async () => {
    try {
      setLoading(true);

      const data = await getCachedData(`admin_favorites_${dateFilter}`, async () => {
        console.log('🔄 [Admin Favorites] Fetching data...');
        const dateThreshold = getDateFilter();

        // Fetch top favorited songs
        let songsQuery = supabase
          .from('user_favorite_songs')
          .select(`
            song_id,
            songs (
              id,
              title,
              songCover_url,
              song_artist (
                artists (id, name, image_url)
              )
            )
          `);

        if (dateThreshold) {
          songsQuery = songsQuery.gte('created_at', dateThreshold);
        }

        const { data: favoritesData, error: favError } = await songsQuery;

        if (favError) throw favError;

        // Count favorites per song and get plays
        const songCounts = new Map<string, { song: any; count: number }>();
        (favoritesData || []).forEach((fav: any) => {
          if (fav.songs) {
            const existing = songCounts.get(fav.song_id) || { song: fav.songs, count: 0 };
            songCounts.set(fav.song_id, { ...existing, count: existing.count + 1 });
          }
        });

        // Get play counts for these songs
        const songIds = Array.from(songCounts.keys());
        let playCounts = new Map<string, number>();
        
        if (songIds.length > 0) {
          let playsQuery = supabase
            .from('user_listens')
            .select('song_id');
          
          if (dateThreshold) {
            playsQuery = playsQuery.gte('listened_at', dateThreshold);
          }
          
          const { data: playsData } = await playsQuery.in('song_id', songIds);
          
          (playsData || []).forEach((play: any) => {
            playCounts.set(play.song_id, (playCounts.get(play.song_id) || 0) + 1);
          });
        }

        const topSongs: Song[] = Array.from(songCounts.entries())
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 10)
          .map(([songId, { song, count }], index) => ({
            id: songId,
            rank: index + 1,
            title: song.title,
            artist: song.song_artist?.map((sa: any) => sa.artists.name).join(', ') || 'Unknown',
            favorites: count,
            plays: playCounts.get(songId) || 0,
            cover_url: song.songCover_url
          }));

        // Calculate artist favorites from song favorites
        // Get all artists from favorited songs
        const artistCounts = new Map<string, { artist: { id: string; name: string; image_url?: string }; count: number }>();
        
        (favoritesData || []).forEach((fav: any) => {
          if (fav.songs?.song_artist) {
            fav.songs.song_artist.forEach((sa: any) => {
              if (sa.artists) {
                const artistId = sa.artists.id || sa.artists.name; // Use ID or name as fallback
                const existing = artistCounts.get(artistId);
                
                if (existing) {
                  artistCounts.set(artistId, { ...existing, count: existing.count + 1 });
                } else {
                  artistCounts.set(artistId, { 
                    artist: {
                      id: artistId,
                      name: sa.artists.name,
                      image_url: sa.artists.image_url
                    }, 
                    count: 1 
                  });
                }
              }
            });
          }
        });

        const topArtists: Artist[] = Array.from(artistCounts.entries())
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 10)
          .map(([artistId, { artist, count }], index) => ({
            id: artistId,
            rank: index + 1,
            name: artist.name,
            favorites: count,
            followers: count, // Use favorite count as followers for now
            image_url: artist.image_url
          }));

        console.log(`📊 [Admin Favorites] Retrieved ${topSongs.length} songs, ${topArtists.length} artists`);
        return { songs: topSongs, artists: topArtists };
      });

      setSongs(data.songs);
      setArtists(data.artists);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filter: string) => {
    clearCache(`admin_favorites_${dateFilter}`);
    setDateFilter(filter);
    if (onFilterChange) onFilterChange(filter);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6">
        <div className="flex items-center justify-center h-96">
          <FaSpinner className="text-purple-400 text-4xl animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">Favorites</h1>
            <p className="text-slate-400 mt-1">Analyze popular content and trending songs</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/60 rounded-lg px-4 py-2 border border-purple-500/20">
            <FaCalendarAlt className="text-purple-400" />
            <select value={dateFilter} onChange={(e) => handleFilterChange(e.target.value)} className="bg-transparent text-white focus:outline-none">
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="bg-slate-800/60 shadow-lg rounded-xl p-6 border border-purple-500/20">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <FaMusic className="text-purple-400" />
              Top 10 Favorited Songs
            </h2>

            <div className="space-y-3">
              {songs.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  No favorite songs data available
                </div>
              ) : (
                songs.map((song) => (
                <div key={song.rank} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors group">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-sm">
                      {song.rank}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">{song.title}</p>
                      <p className="text-slate-400 text-xs">{song.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-white font-semibold flex items-center gap-1">
                        <FaFire className="text-orange-400" />
                        {song.favorites.toLocaleString()}
                      </p>
                      <p className="text-slate-400 text-xs">{song.plays.toLocaleString()} plays</p>
                    </div>
                  </div>
                </div>
              ))
              )}
            </div>
          </div>

          <div className="bg-slate-800/60 shadow-lg rounded-xl p-6 border border-purple-500/20">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <FaMicrophone className="text-cyan-400" />
              Top 10 Artists
            </h2>

            <div className="space-y-3">
              {artists.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  No favorite artists data available
                </div>
              ) : (
                artists.map((artist) => (
                <div key={artist.rank} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors group">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 text-white font-bold text-sm">
                      {artist.rank}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">{artist.name}</p>
                      <p className="text-slate-400 text-xs">{artist.favorites} favorites</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-white font-semibold flex items-center gap-1">
                      <FaFire className="text-orange-400" />
                      {artist.favorites.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/60 shadow-lg rounded-xl p-6 border border-purple-500/20">
            <p className="text-slate-400 text-sm">Total Favorites</p>
            <p className="text-3xl font-bold text-white mt-2">{songs.reduce((sum, s) => sum + s.favorites, 0).toLocaleString()}</p>
            <p className="text-slate-400 text-xs mt-2">{dateFilter === 'all' ? 'All time' : `Last ${dateFilter}`}</p>
          </div>

          <div className="bg-slate-800/60 shadow-lg rounded-xl p-6 border border-purple-500/20">
            <p className="text-slate-400 text-sm">Top Song</p>
            {songs.length > 0 ? (
              <>
                <p className="text-xl font-bold text-white mt-2">{songs[0].title}</p>
                <p className="text-slate-400 text-xs mt-2">{songs[0].artist}</p>
              </>
            ) : (
              <p className="text-slate-500 text-sm mt-2">No data</p>
            )}
          </div>

          <div className="bg-slate-800/60 shadow-lg rounded-xl p-6 border border-purple-500/20">
            <p className="text-slate-400 text-sm">Top Artist</p>
            {artists.length > 0 ? (
              <>
                <p className="text-xl font-bold text-white mt-2">{artists[0].name}</p>
                <p className="text-slate-400 text-xs mt-2">{artists[0].favorites} favorites</p>
              </>
            ) : (
              <p className="text-slate-500 text-sm mt-2">No data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

