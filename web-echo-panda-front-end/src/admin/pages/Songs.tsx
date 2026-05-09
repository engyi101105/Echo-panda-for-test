import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  FaSearch, FaEdit, FaTrash, 
  FaClock, FaPlus, FaMicrophone, 
  FaCalendarAlt, FaCompactDisc, FaSpinner
} from "react-icons/fa";
import { supabase } from "../../backend/supabaseClient";
import { deleteFromR2 } from "../../backend/r2Client";
import { useDataCache } from "../../contexts/DataCacheContext";
import SongModal from "./SongModal";
// main song component
// Data fetching & state management
// Song table display
// Delete functionality
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

interface Song {
  id: string;
  title: string;
  duration: number; // in seconds
  album_id: string | null;
  audio_url: string;
  songCover_url: string;
  created_at: string;
  updated_at: string;
  artists?: Artist[];
  album?: Album;
}

export default function SongsManager() {
  const { getCachedData, clearCache } = useDataCache();
  const [songs, setSongs] = useState<Song[]>([]);
  const [allArtists, setAllArtists] = useState<Artist[]>([]);
  const [allAlbums, setAllAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  
  const hasFetched = useRef(false);
  // Fetch data from Supabase
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchSongs();
    fetchArtists();
    fetchAlbums();
  }, []);

  const fetchSongs = async () => {
    try {
      setLoading(true);

      const data = await getCachedData('admin_songs', async () => {
        const startTime = performance.now();
        console.log('🔄 [Admin] Fetching songs...');

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
            updated_at,
            song_artist(
              artists(id, name, image_url)
            ),
            albums(id, title, cover_url)
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        const fetchTime = performance.now() - startTime;
        console.log(`✅ Songs fetched in ${fetchTime.toFixed(0)}ms`);

        if (error) {
          console.error('❌ Fetch error:', error);
          throw error;
        }

      // Transform the data to match our interface
      const transformedSongs = (songsData || []).map((song: any) => ({
        id: song.id,
        title: song.title,
        duration: song.duration,
        album_id: song.album_id,
        audio_url: song.audio_url,
        songCover_url: song.songCover_url,
        created_at: song.created_at,
        updated_at: song.updated_at,
        artists: song.song_artist?.map((sa: any) => sa.artists).filter(Boolean) || [],
        album: song.albums || null
      }));

        console.log(`📊 Transformed ${transformedSongs.length} songs`);
        console.log('🖼️ First song cover URL:', transformedSongs[0]?.songCover_url);

        return transformedSongs;
      });

      setSongs(data);
    } catch (error) {
      console.error('Error fetching songs:', error);
      alert('Failed to fetch songs');
    } finally {
      setLoading(false);
    }
  };

  const fetchArtists = async () => {
    try {
      const data = await getCachedData('admin_artists_list', async () => {
        const { data, error } = await supabase
          .from('artists')
          .select('id, name, image_url')
          .eq('status', true)
          .order('name');

        if (error) throw error;
        return data || [];
      });

      setAllArtists(data);
    } catch (error) {
      console.error('Error fetching artists:', error);
    }
  };

  const fetchAlbums = async () => {
    try {
      const data = await getCachedData('admin_albums_list', async () => {
        const { data, error } = await supabase
          .from('albums')
          .select('id, title, cover_url')
          .order('title');

        if (error) throw error;
        return data || [];
      });

      setAllAlbums(data);
    } catch (error) {
      console.error('Error fetching albums:', error);
    }
  };

  // Format duration from seconds to mm:ss
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Parse duration from mm:ss to seconds
  const parseDuration = (duration: string): number => {
    const [mins, secs] = duration.split(':').map(Number);
    return (mins || 0) * 60 + (secs || 0);
  };


  const filtered = useMemo(() => {
    return songs.filter((s) => {
      const artistNames = s.artists?.map(a => a.name).join(' ') || '';
      const matchSearch = s.title.toLowerCase().includes(query.toLowerCase()) || 
                         artistNames.toLowerCase().includes(query.toLowerCase());
      return matchSearch;
    });
  }, [songs, query]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this track?")) return;
    
    try {
      // Find the song to get file URLs
      const song = songs.find(s => s.id === id);
      
      // Delete from database first
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Delete files from R2 if they exist
      if (song) {
        // Delete cover image
        if (song.songCover_url) {
          try {
            const coverKey = song.songCover_url.split('/').slice(-2).join('/'); // e.g., "song-covers/filename.jpg"
            await deleteFromR2(coverKey);
            console.log('✅ Deleted cover from R2:', coverKey);
          } catch (err) {
            console.warn('⚠️ Failed to delete cover from R2:', err);
          }
        }

        // Delete audio file
        if (song.audio_url) {
          try {
            const audioKey = song.audio_url.split('/').slice(-2).join('/'); // e.g., "songs/filename.mp3"
            await deleteFromR2(audioKey);
            console.log('✅ Deleted audio from R2:', audioKey);
          } catch (err) {
            console.warn('⚠️ Failed to delete audio from R2:', err);
          }
        }
      }

      setSongs(songs.filter(s => s.id !== id));
      clearCache('admin_songs'); // Clear cache after deletion
    } catch (error) {
      console.error('Error deleting song:', error);
      alert('Failed to delete song');
    }
  };

  const handleOpenEdit = (song: Song) => {
    setEditingSong(song);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-slate-200 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
  
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <h2 className="text-3xl font-black text-white tracking-tight">Songs <span className="text-purple-400">Management</span></h2>
          <button 
            onClick={() => { 
              setEditingSong(null);
              setShowModal(true); 
            }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-2xl font-bold transition-all hover:scale-105 flex items-center gap-2 shadow-lg shadow-purple-500/20"
          >
            <FaPlus /> Add New Song
          </button>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[300px] relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              placeholder="Search by title or artist..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <FaSpinner className="text-purple-400 text-4xl animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-slate-400 text-xs uppercase tracking-widest font-bold">
                    <th className="px-6 py-5">Song & Artist</th>
                    <th className="px-6 py-5">Album</th>
                    <th className="px-6 py-5">Duration</th>
                    <th className="px-6 py-5">Created</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                {filtered.map(song => (
                  <tr key={song.id} className="group hover:bg-white/5 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img 
                          src={song.songCover_url || song.album?.cover_url || `https://ui-avatars.com/api/?name=${song.title}&background=random`}
                          alt={song.title}
                          className="w-12 h-12 rounded-xl object-cover shadow-lg"
                          onError={(e) => {
                            console.error('❌ Failed to load image:', song.songCover_url);
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${song.title}&background=random`;
                          }}
                          onLoad={() => console.log('✅ Image loaded:', song.songCover_url)}
                        />
                        <div>
                          <p className="text-white font-bold leading-tight">{song.title}</p>
                          <div className="text-slate-500 text-sm flex items-center gap-1 mt-0.5">
                            <FaMicrophone size={10}/>
                            {song.artists && song.artists.length > 0 
                              ? song.artists.map(a => a.name).join(', ')
                              : 'No artists'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-medium">
                      {song.album ? (
                        <div className="flex items-center gap-2">
                          <FaCompactDisc className="text-slate-500"/> 
                          {song.album.title}
                        </div>
                      ) : (
                        <span className="text-slate-600 text-sm">No album</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-mono flex items-center gap-2">
                      <FaClock className="text-slate-500" size={12}/>
                      {formatDuration(song.duration)}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                       <div className="flex items-center gap-2">
                         <FaCalendarAlt size={12}/> 
                         {new Date(song.created_at).toLocaleDateString()}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <button onClick={() => handleOpenEdit(song)} className="p-2 hover:bg-white/10 rounded-lg text-blue-400 hover:text-blue-300"><FaEdit/></button>
                        <button onClick={() => handleDelete(song.id)} className="p-2 hover:bg-white/10 rounded-lg text-red-400 hover:text-red-300"><FaTrash/></button>
                      </div>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4 opacity-20">🎵</div>
                  <p className="text-slate-400 text-lg">No songs found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <SongModal 
        show={showModal}
        editingSong={editingSong}
        allArtists={allArtists}
        allAlbums={allAlbums}
        onClose={() => {
          setShowModal(false);
          setEditingSong(null);
        }}
        onSave={fetchSongs}
      />
    </div>
  );
}