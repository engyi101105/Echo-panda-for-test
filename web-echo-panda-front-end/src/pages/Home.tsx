import React, { useState, useEffect } from "react";
import HeroSection from "./home/HeroSection";
import SongSection from "./home/Songs";
import ArtistSection from "./home/Artists";
import AppFooter from "./home/AppFooter";
import ContactUs from "./ContactUs";

import InterestOnboardingModal from "../components/InterestOnboardingModal";
import { getRecommendationsForInterests, type AlbumRef } from "../backend/recommendationService";
import { supabase } from "../backend/supabaseClient";
import { useDataCache } from "../contexts/DataCacheContext";

interface Tag {
  id: string;
  name: string;
  description: string;
  display_order: number;
  albums: any[];
}

const Home: React.FC = () => {
  const isLightMode = false;
  const { getCachedData } = useDataCache();

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [recommendedAlbums, setRecommendedAlbums] = useState<AlbumRef[] | undefined>(undefined);
  const [tags, setTags] = useState<Tag[]>([]);
  const [genreOptions, setGenreOptions] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('onboarding:interests');
    if (!stored) {
      setIsOnboardingOpen(true);
    } else {
      try {
        const interests = JSON.parse(stored);
        getRecommendationsForInterests(interests).then(setRecommendedAlbums);
      } catch (e) {
        // ignore
      }
    }

    // Fetch dynamic genres and tags
    fetchGenres();
    fetchTags();
  }, []);

  const fetchGenres = async () => {
    try {
      const { data: categoryData, error } = await supabase
        .from('categories')
        .select('id, name');

      if (error) throw error;

      const genreNames = (categoryData || []).map((cat: any) => cat.name);
      setGenreOptions(genreNames);
      console.log('✅ [Home] Genres loaded:', genreNames);
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const data = await getCachedData('home_tags', async () => {
        console.log('🔄 [Home] Fetching active tags...');

        // Fetch active tags with their albums
        const { data: tagsData, error } = await supabase
          .from('tags')
          .select(`
            id,
            name,
            description,
            display_order,
            album_tag (
              albums (
                id,
                title,
                cover_url,
                type,
                release_date,
                album_artist (
                  artists (id, name, image_url)
                )
              )
            )
          `)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;

        const transformedTags = (tagsData || []).map((tag: any) => ({
          id: tag.id,
          name: tag.name,
          description: tag.description,
          display_order: tag.display_order,
          albums: tag.album_tag?.map((at: any) => ({
            id: at.albums.id,
            title: at.albums.title,
            cover_url: at.albums.cover_url,
            type: at.albums.type,
            release_date: at.albums.release_date,
            artists: at.albums.album_artist?.map((aa: any) => aa.artists).filter(Boolean) || []
          })) || []
        }));

        console.log(`✅ [Home] ${transformedTags.length} active tags loaded`);
        return transformedTags;
      });

      setTags(data);
      console.log('🏷️ [Home] Tags state updated:', data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleOnboardingSave = (interests: string[]) => {
    localStorage.setItem('onboarding:interests', JSON.stringify(interests));
    setIsOnboardingOpen(false);
    getRecommendationsForInterests(interests).then(setRecommendedAlbums);
  };

  return (
    <div className="w-full max-w-full">
      {/* Hero */}
      <HeroSection isLightMode={isLightMode} />

      {recommendedAlbums && recommendedAlbums.length > 0 && (
        <SongSection title="Recommended for you" isLightMode={isLightMode} songs={recommendedAlbums} />
      )}

      {/* Trending Songs */}
      <SongSection title="Trending Songs" isLightMode={isLightMode} limit={6} offset={0} />
      
      {/* Popular Artists */}
      <ArtistSection title="Popular Artists" isLightMode={isLightMode} layout="grid" />

      {/* Dynamic Tag Sections */}
      {tags.map((tag) => (
        <SongSection 
          key={tag.id}
          title={tag.name} 
          isLightMode={isLightMode} 
          songs={tag.albums}
        />
      ))}

      {/* Contact Us */}
      <div className="mb-12">
        <ContactUs isLightMode={isLightMode} />
      </div>

      {/* Onboarding modal */}
      <InterestOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSave={handleOnboardingSave}
        genreOptions={genreOptions}
      />

      {/* Footer */}
      <AppFooter isLightMode={isLightMode} />
    </div>
  );
};

export default Home;
