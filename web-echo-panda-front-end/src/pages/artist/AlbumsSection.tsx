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
  artists?: { id: string; name: string; image_url?: string }[];
}

interface Props {
  artistId: string;
}

export default function AlbumsSection({ artistId }: Props) {
  const { getCachedData } = useDataCache();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchArtistAlbums();
  }, [artistId]);

  const fetchArtistAlbums = async () => {
    try {
      const data = await getCachedData(`artist_albums_${artistId}`, async () => {
        console.log(`🔄 [Artist Albums] Fetching albums (type='album') for artist ${artistId}...`);

        const { data: albumData, error } = await supabase
          .from('albums')
          .select(`
            id,
            title,
            cover_url,
            type,
            release_date,
            album_artist!inner (
              artist_id,
              artists (id, name, image_url)
            )
          `)
          .eq('album_artist.artist_id', artistId)
          .eq('type', 'album')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const transformedAlbums = (albumData || []).map((album: any) => ({
          id: album.id,
          title: album.title,
          cover_url: album.cover_url,
          type: album.type,
          release_date: album.release_date,
          artists: album.album_artist?.map((aa: any) => aa.artists).filter(Boolean) || []
        }));

        console.log(`✅ [Artist Albums] ${transformedAlbums.length} albums found`);
        return transformedAlbums;
      });

      setAlbums(data);
    } catch (error) {
      console.error('Error fetching artist albums:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section>
        <h2 className="text-xl font-semibold mb-4">
          Artist's <span className="text-blue-400">Albums</span>
        </h2>
        <div className="flex justify-center py-8">
          <FaSpinner className="text-purple-400 text-3xl animate-spin" />
        </div>
      </section>
    );
  }

  if (albums.length === 0) {
    return null; // Don't show section if no albums
  }

  const displayedAlbums = showAll ? albums : albums.slice(0, 5);

  return (
    <section>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold">
          Artist's{" "}
          <span className="text-xl font-semibold text-blue-400">Albums</span>
        </h2>
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          {showAll ? "View Less" : "View More"}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {displayedAlbums.map((album) => (
          <div key={album.id} className="w-full">
            <AlbumCard album={album} />
          </div>
        ))} 
      </div>
    </section>
  );
}
