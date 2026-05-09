import { useState, useEffect } from 'react';
import { supabase } from '../../backend/supabaseClient';
import { useDataCache } from '../../contexts/DataCacheContext';
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';
import { FaSpinner } from 'react-icons/fa';
import Song from '../../components/Song';

interface Artist {
  id: string;
  name: string;
  image_url?: string;
}

interface Album {
  id: string;
  title: string;
  cover_url: string;
}

interface SongType {
  id: string;
  title: string;
  duration: number;
  created_at: string;
  audio_url?: string;
  artists?: Artist[];
  album?: Album;
}

interface Props {
  artistId: string;
}

export default function PopularSongs({ artistId }: Props) {
  const { getCachedData } = useDataCache();
  const { playSong } = useAudioPlayer();
  const [showAll, setShowAll] = useState(false);
  const [songs, setSongs] = useState<SongType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtistSongs();
  }, [artistId]);

  const fetchArtistSongs = async () => {
    try {
      setLoading(true);

      const data = await getCachedData(`artist_songs_${artistId}`, async () => {
        const startTime = performance.now();
        console.log(`🔄 [PopularSongs] Fetching songs for artist ${artistId}...`);
        
        const { data: songsData, error } = await supabase
          .from('song_artist')
          .select(`
            songs(
              id,
              title,
              duration,
              audio_url,
              created_at,
              albums(id, title, cover_url),
              song_artist(
                artists(id, name, image_url)
              )
            )
          `)
          .eq('artist_id', artistId)
          .limit(10);

        const fetchTime = performance.now() - startTime;
        console.log(`✅ [PopularSongs] Songs fetched in ${fetchTime.toFixed(0)}ms`);
        console.log(`📊 [PopularSongs] Retrieved ${songsData?.length || 0} songs`);

        if (error) throw error;

        const transformedSongs: SongType[] = (songsData || [])
          .map((item: any) => item.songs)
          .filter(Boolean)
          .map((song: any) => ({
            id: song.id,
            title: song.title,
            duration: song.duration,
            audio_url: song.audio_url,
            created_at: song.created_at,
            album: song.albums,
            artists: song.song_artist?.map((sa: any) => sa.artists).filter(Boolean) || []
          }));

        return transformedSongs;
      });

      setSongs(data);
    } catch (error) {
      console.error('Error fetching artist songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayedSongs = showAll ? songs : songs.slice(0, 5);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handlePlaySong = (songId: string) => {
    const song = songs.find(s => s.id === songId);
    if (song && song.audio_url) {
      playSong({
        id: song.id,
        title: song.title,
        artist: song.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
        coverUrl: song.album?.cover_url || '',
        audioUrl: song.audio_url,
        duration: song.duration
      });
    }
  };

  if (loading) {
    return (
      <section>
        <h2 className="text-2xl font-semibold mb-4">Popular</h2>
        <div className="flex items-center justify-center py-12">
          <FaSpinner className="text-purple-400 text-3xl animate-spin" />
        </div>
      </section>
    );
  }

  if (songs.length === 0) {
    return (
      <section>
        <h2 className="text-2xl font-semibold mb-4">Popular</h2>
        <div className="text-center py-12 text-zinc-500">
          No songs available
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">Popular</h2>

      <div className="space-y-2">
        {displayedSongs.map((song, i) => (
          <Song
            key={song.id}
            id={song.id}
            index={i + 1}
            title={song.title}
            artists={song.artists}
            album={song.album}
            duration={song.duration}
            coverUrl={song.album?.cover_url}
            metadata={formatDate(song.created_at)}
            onPlay={handlePlaySong}
          />
        ))}
      </div>

      {songs.length > 5 && (
        <div className="flex justify-center mt-6">
          <button 
            onClick={() => setShowAll(!showAll)}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white font-medium transition-all hover:scale-105"
          >
            {showAll ? 'Show Less' : 'Show More'}
          </button>
        </div>
      )}
    </section>
  );
}
