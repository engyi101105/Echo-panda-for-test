import { useState, useEffect } from 'react';
import ArtistSection from '../home/Artists';
import { supabase } from '../../backend/supabaseClient';
import { useDataCache } from '../../contexts/DataCacheContext';

interface Artist {
  id: string;
  name: string;
  image_url?: string;
}

interface Props {
  artistId?: string;
}

export default function FansAlsoListen({ artistId }: Props) {
  const { getCachedData } = useDataCache();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtists();
  }, [artistId]);

  const fetchArtists = async () => {
    try {
      const data = await getCachedData(`fans_also_listen_${artistId || 'all'}`, async () => {
        console.log('🔄 [Fans Also Listen] Fetching related artists...');

        let query = supabase
          .from('artists')
          .select('id, name, image_url')
          .eq('status', true)
          .order('name', { ascending: true })
          .limit(10);

        // Exclude current artist if provided
        if (artistId) {
          query = query.neq('id', artistId);
        }

        const { data: artistsData, error } = await query;

        if (error) throw error;
        console.log(`✅ [Fans Also Listen] ${artistsData?.length || 0} artists loaded`);
        return artistsData || [];
      });

      setArtists(data);
    } catch (error) {
      console.error('Error fetching artists:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="mb-12">
        <div className="text-center py-8">
          <p className="text-zinc-400">Loading artists...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <ArtistSection
        title="Fans Also Listen To"
        isLightMode={false}
        artists={artists.map((artist) => ({
          id: artist.id,
          name: artist.name,
          image_url: artist.image_url,
        }))}
      />
    </section>
  );
}