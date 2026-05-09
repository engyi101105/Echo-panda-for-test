import { useState, useEffect } from "react";
import { supabase } from "../../backend/supabaseClient";
import { useDataCache } from "../../contexts/DataCacheContext";
import AlbumCard from "../../components/AlbumCard";
import { FaSpinner } from "react-icons/fa";

interface Album {
  id: string;
  title: string;
  cover_url: string;
  type?: string;
  release_date?: string;
  artists?: { id: string; name: string }[];
}

interface Props {
  artistId: string;
}

export default function SingleSongs({ artistId }: Props) {
  const { getCachedData } = useDataCache();
  const [singles, setSingles] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchSingles();
  }, [artistId]);

  const fetchSingles = async () => {
    try {
      const data = await getCachedData(`artist_singles_${artistId}`, async () => {
        console.log(`🔄 [Artist Singles] Fetching singles (type='single') for artist ${artistId}...`);

        // Fetch albums with type='single' by this artist
        const { data: albumData, error } = await supabase
          .from('album_artist')
          .select(`
            albums (
              id,
              title,
              cover_url,
              type,
              release_date,
              album_artist (
                artists (id, name)
              )
            )
          `)
          .eq('artist_id', artistId);

        if (error) throw error;

        // Filter for type='single' and transform
        const transformedSingles = (albumData || [])
          .map((item: any) => item.albums)
          .filter((album: any) => album && album.type === 'single')
          .map((album: any) => ({
            id: album.id,
            title: album.title,
            cover_url: album.cover_url,
            type: album.type,
            release_date: album.release_date,
            artists: album.album_artist?.map((aa: any) => aa.artists).filter(Boolean) || []
          }));

        console.log(`✅ [Artist Singles] ${transformedSingles.length} singles found`);
        return transformedSingles;
      });

      setSingles(data);
    } catch (error) {
      console.error('Error fetching singles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section>
        <h2 className="text-xl font-semibold mb-4">
          Single <span className="text-blue-400">Songs</span>
        </h2>
        <div className="flex justify-center py-8">
          <FaSpinner className="text-purple-400 text-3xl animate-spin" />
        </div>
      </section>
    );
  }

  if (singles.length === 0) {
    return null; // Don't show section if no singles
  }

  const displayedSingles = showAll ? singles : singles.slice(0, 5);

  return (
    <section>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold">
          Single{" "}
          <span className="text-xl font-semibold text-blue-400">Songs</span>{" "}
        </h2>
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          {showAll ? "View Less" : "View More"}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {displayedSingles.map((single) => (
          <div key={single.id} className="w-full">
            <AlbumCard album={single} />
          </div>
        ))}
      </div>
    </section>
  );
}
