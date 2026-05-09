import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  FaSearch, FaTimes, FaPlus, FaCamera, FaCalendarAlt, 
  FaEye, FaEdit, FaTrash, FaCompactDisc, FaMusic, FaRecordVinyl, FaMicrophone, FaTag 
} from "react-icons/fa";
import { supabase } from "../../backend/supabaseClient";
import { useDataCache } from "../../contexts/DataCacheContext";

type AlbumType = "album" | "single" | "ep";

interface Artist {
  id: string;
  name: string;
  image_url: string;
}

interface Category {
  id: string;
  name: string;
}

interface Album {
  id: string;
  title: string;
  cover_url: string;
  type: AlbumType;
  release_date: string;
  created_at: string;
  updated_at: string;
  artists?: Artist[];
  categories?: Category[];
}

export default function Albums() {
  const { getCachedData, clearCache } = useDataCache();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [allArtists, setAllArtists] = useState<Artist[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view" | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasFetched = useRef(false);

  const [formData, setFormData] = useState<Partial<Album>>({
    title: "",
    type: "album",
    cover_url: "",
    release_date: new Date().toISOString().split('T')[0]
  });

  const [selectedArtistIds, setSelectedArtistIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // Fetch albums from Supabase
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
     
    fetchAlbums();
    fetchArtists();
    fetchCategories();
  }, []);

  const fetchAlbums = async () => {
    try {
      setLoading(true);

      const data = await getCachedData('admin_albums', async () => {
        const startTime = performance.now();
        console.log('🔄 [Admin] Fetching albums...');

        const { data: albumsData, error } = await supabase
          .from('albums')
          .select(`
            id,
            title,
            cover_url,
            type,
            release_date,
            created_at,
            updated_at,
            album_artist(
              artists(id, name, image_url)
            ),
            album_category(
              categories(id, name)
            )
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        const fetchTime = performance.now() - startTime;
        console.log(`✅ [Admin] Albums fetched in ${fetchTime.toFixed(0)}ms`);

        if (error) {
          console.error('❌ Fetch error:', error);
          throw error;
        }

        const transformedAlbums = (albumsData || []).map(album => ({
          id: album.id,
          title: album.title,
          cover_url: album.cover_url,
          type: album.type,
          release_date: album.release_date,
          created_at: album.created_at,
          updated_at: album.updated_at,
          artists: album.album_artist?.map((aa: any) => aa.artists).filter(Boolean) || [],
          categories: album.album_category?.map((ac: any) => ac.categories).filter(Boolean) || []
        }));

        console.log(`📊 Transformed ${transformedAlbums.length} albums`);
        return transformedAlbums;
      });

      setAlbums(data);
    } catch (error) {
      console.error('Error fetching albums:', error);
      alert('Failed to fetch albums');
    } finally {
      setLoading(false);
    }
  };

  const fetchArtists = async () => {
    try {
      const data = await getCachedData('admin_album_artists', async () => {
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

  const fetchCategories = async () => {
    try {
      const data = await getCachedData('admin_album_categories', async () => {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name')
          .order('name');

        if (error) throw error;
        return data || [];
      });

      setAllCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, cover_url: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setFormData({ 
      title: "", 
      type: "album", 
      cover_url: "", 
      release_date: new Date().toISOString().split('T')[0] 
    });
    setSelectedArtistIds([]);
    setSelectedCategoryIds([]);
    setModalMode("add");
  };

  const openEditModal = (album: Album) => {
    setSelectedAlbum(album);
    setFormData(album);
    setSelectedArtistIds(album.artists?.map(a => a.id) || []);
    setSelectedCategoryIds(album.categories?.map(c => c.id) || []);
    setModalMode("edit");
  };

  const openViewModal = (album: Album) => {
    setSelectedAlbum(album);
    setModalMode("view");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === "add") {
        // Insert album
        const { data: newAlbum, error: albumError } = await supabase
          .from('albums')
          .insert([{
            title: formData.title,
            type: formData.type,
            cover_url: formData.cover_url || `https://ui-avatars.com/api/?name=${formData.title}&background=random&size=400`,
            release_date: formData.release_date
          }])
          .select()
          .single();

        if (albumError) throw albumError;

        // Insert artist relationships
        if (selectedArtistIds.length > 0) {
          const artistRelations = selectedArtistIds.map(artistId => ({
            album_id: newAlbum.id,
            artist_id: artistId,
            primary_artist: true
          }));

          const { error: artistError } = await supabase
            .from('album_artist')
            .insert(artistRelations);

          if (artistError) throw artistError;
        }

        // Insert category relationships
        if (selectedCategoryIds.length > 0) {
          const categoryRelations = selectedCategoryIds.map(categoryId => ({
            album_id: newAlbum.id,
            category_id: categoryId
          }));

          const { error: categoryError } = await supabase
            .from('album_category')
            .insert(categoryRelations);

          if (categoryError) throw categoryError;
        }

        // Refresh albums
        await fetchAlbums();
        
      } else if (modalMode === "edit" && selectedAlbum) {
        // Update album
        const { error: updateError } = await supabase
          .from('albums')
          .update({
            title: formData.title,
            type: formData.type,
            cover_url: formData.cover_url,
            release_date: formData.release_date,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedAlbum.id);

        if (updateError) throw updateError;

        // Delete existing artist relationships
        await supabase
          .from('album_artist')
          .delete()
          .eq('album_id', selectedAlbum.id);

        // Insert new artist relationships
        if (selectedArtistIds.length > 0) {
          const artistRelations = selectedArtistIds.map(artistId => ({
            album_id: selectedAlbum.id,
            artist_id: artistId,
            primary_artist: true
          }));

          await supabase
            .from('album_artist')
            .insert(artistRelations);
        }

        // Delete existing category relationships
        await supabase
          .from('album_category')
          .delete()
          .eq('album_id', selectedAlbum.id);

        // Insert new category relationships
        if (selectedCategoryIds.length > 0) {
          const categoryRelations = selectedCategoryIds.map(categoryId => ({
            album_id: selectedAlbum.id,
            category_id: categoryId
          }));

          await supabase
            .from('album_category')
            .insert(categoryRelations);
        }

        // Refresh albums
        await fetchAlbums();
      }
      
      setModalMode(null);
    } catch (error) {
      console.error('Error saving album:', error);
      alert('Failed to save album');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this album?')) return;
    
    try {
      const { error } = await supabase
        .from('albums')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setAlbums(albums.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting album:', error);
      alert('Failed to delete album');
    }
  };

  const filtered = useMemo(() => {
    return albums.filter((a) => 
      a.title.toLowerCase().includes(query.toLowerCase())
    );
  }, [albums, query]);

  const getTypeIcon = (type: AlbumType) => {
    switch(type) {
      case "album": return <FaRecordVinyl />;
      case "single": return <FaMusic />;
      case "ep": return <FaCompactDisc />;
    }
  };

  const getTypeColor = (type: AlbumType) => {
    switch(type) {
      case "album": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "single": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "ep": return "bg-pink-500/10 text-pink-400 border-pink-500/20";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading albums...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-6 md:p-12 text-white font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* --- HEADER --- */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Album <span className="text-purple-400">Collection</span>
            </h1>
            <p className="text-slate-400">Manage albums, singles, and EPs</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:min-w-[300px]">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search albums..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/40 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
            </div>
            <button
              onClick={openAddModal}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-105 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
            >
              <FaPlus /> Add Album
            </button>
          </div>
        </div>

        {/* --- ALBUM GRID --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((album) => (
            <div key={album.id} className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden hover:scale-[1.02] transition-all shadow-2xl">
              <div className="aspect-square relative overflow-hidden">
                <img 
                  src={album.cover_url || `https://ui-avatars.com/api/?name=${album.title}&background=random&size=400`} 
                  alt={album.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase border flex items-center gap-1.5 backdrop-blur-md ${getTypeColor(album.type)}`}>
                    {getTypeIcon(album.type)} {album.type}
                  </span>
                </div>
              </div>
              
              <div className="p-5 space-y-3">
                <div>
                  <h3 className="text-lg font-bold text-white truncate">{album.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <FaCalendarAlt className="text-purple-400" />
                    {new Date(album.release_date).toLocaleDateString()}
                  </div>
                  
                  {/* Artists */}
                  {album.artists && album.artists.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-2">
                      <FaMicrophone className="text-pink-400" />
                      <span className="truncate">{album.artists.map(a => a.name).join(', ')}</span>
                    </div>
                  )}
                  
                  {/* Categories */}
                  {album.categories && album.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {album.categories.map(cat => (
                        <span key={cat.id} className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] rounded-full border border-purple-500/20">
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => openViewModal(album)} 
                    className="flex-1 p-2.5 bg-slate-800 hover:bg-purple-500/20 rounded-xl transition-all text-sm font-bold"
                  >
                    <FaEye className="inline mr-1" /> View
                  </button>
                  <button 
                    onClick={() => openEditModal(album)} 
                    className="p-2.5 bg-slate-800 hover:bg-blue-500/20 rounded-xl transition-all"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    onClick={() => handleDelete(album.id)} 
                    className="p-2.5 bg-slate-800 hover:bg-red-500/20 rounded-xl transition-all"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-20">🎵</div>
            <p className="text-slate-400 text-lg">No albums found</p>
          </div>
        )}
      </div>

      {/* --- MODAL --- */}
      {modalMode && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-purple-500/30 rounded-[2.5rem] p-8 max-w-2xl w-full shadow-2xl relative">
            <button onClick={() => setModalMode(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
              <FaTimes size={20} />
            </button>

            {modalMode === "view" && selectedAlbum ? (
              <div className="space-y-6">
                <img 
                  src={selectedAlbum.cover_url || `https://ui-avatars.com/api/?name=${selectedAlbum.title}&background=random&size=400`} 
                  className="w-48 h-48 mx-auto rounded-3xl object-cover border-4 border-purple-500/30" 
                  alt="" 
                />
                <div className="text-center">
                  <h2 className="text-3xl font-black text-white">{selectedAlbum.title}</h2>
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-black uppercase border mt-3 ${getTypeColor(selectedAlbum.type)}`}>
                    {getTypeIcon(selectedAlbum.type)} {selectedAlbum.type}
                  </span>
                </div>

                {/* Artists */}
                {selectedAlbum.artists && selectedAlbum.artists.length > 0 && (
                  <div className="bg-white/5 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                      <FaMicrophone /> ARTISTS
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedAlbum.artists.map(artist => (
                        <div key={artist.id} className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-xl">
                          <img 
                            src={artist.image_url || `https://ui-avatars.com/api/?name=${artist.name}&background=random`} 
                            className="w-6 h-6 rounded-full object-cover"
                            alt=""
                          />
                          <span className="text-sm font-bold">{artist.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categories */}
                {selectedAlbum.categories && selectedAlbum.categories.length > 0 && (
                  <div className="bg-white/5 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                      <FaTag /> GENRES
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedAlbum.categories.map(cat => (
                        <span key={cat.id} className="px-3 py-1.5 bg-purple-500/10 text-purple-400 text-sm rounded-full border border-purple-500/20 font-bold">
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-left bg-white/5 p-6 rounded-3xl">
                  <div>
                    <p className="text-xs text-slate-500">RELEASE DATE</p>
                    <p className="font-bold">{new Date(selectedAlbum.release_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">ADDED</p>
                    <p className="font-bold">{new Date(selectedAlbum.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <button onClick={() => setModalMode(null)} className="w-full py-4 bg-white/5 rounded-2xl font-bold hover:bg-white/10 transition-all">
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-6">
                <h2 className="text-2xl font-black text-white">
                  {modalMode === "add" ? "Add New" : "Edit"} <span className="text-purple-400">Album</span>
                </h2>
                
                <div className="flex flex-col items-center">
                  <div 
                    onClick={() => fileInputRef.current?.click()} 
                    className="w-48 h-48 rounded-3xl bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-purple-500 overflow-hidden group relative"
                  >
                    {formData.cover_url ? (
                      <img src={formData.cover_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <FaCamera className="text-4xl text-slate-500 group-hover:text-purple-500" />
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageChange} />
                  <p className="text-xs text-slate-500 mt-2">Click to upload cover art</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 ml-2 uppercase font-bold">Album Title</label>
                    <input 
                      required 
                      placeholder="Album Title" 
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-purple-500" 
                      value={formData.title} 
                      onChange={e => setFormData({...formData, title: e.target.value})} 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 ml-2 uppercase font-bold">Type</label>
                      <select 
                        className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl outline-none text-white" 
                        value={formData.type} 
                        onChange={e => setFormData({...formData, type: e.target.value as AlbumType})}
                      >
                        <option value="album">Album</option>
                        <option value="single">Single</option>
                        <option value="ep">EP</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 ml-2 uppercase font-bold">Release Date</label>
                      <input 
                        type="date" 
                        required
                        className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white outline-none focus:border-purple-500" 
                        value={formData.release_date} 
                        onChange={e => setFormData({...formData, release_date: e.target.value})} 
                      />
                    </div>
                  </div>

                  {/* Artists Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 ml-2 uppercase font-bold flex items-center gap-2">
                      <FaMicrophone /> Select Artists
                    </label>
                    <div className="bg-slate-800 border border-white/10 rounded-xl p-3 max-h-40 overflow-y-auto">
                      {allArtists.length === 0 ? (
                        <p className="text-slate-500 text-sm">No artists available</p>
                      ) : (
                        <div className="space-y-2">
                          {allArtists.map(artist => (
                            <label key={artist.id} className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg">
                              <input 
                                type="checkbox"
                                checked={selectedArtistIds.includes(artist.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedArtistIds([...selectedArtistIds, artist.id]);
                                  } else {
                                    setSelectedArtistIds(selectedArtistIds.filter(id => id !== artist.id));
                                  }
                                }}
                                className="w-4 h-4 accent-purple-500"
                              />
                              <img 
                                src={artist.image_url || `https://ui-avatars.com/api/?name=${artist.name}&background=random`}
                                className="w-6 h-6 rounded-full object-cover"
                                alt=""
                              />
                              <span className="text-sm text-white">{artist.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Categories Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 ml-2 uppercase font-bold flex items-center gap-2">
                      <FaTag /> Select Genres
                    </label>
                    <div className="bg-slate-800 border border-white/10 rounded-xl p-3 max-h-40 overflow-y-auto">
                      {allCategories.length === 0 ? (
                        <p className="text-slate-500 text-sm">No categories available</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {allCategories.map(category => (
                            <label key={category.id} className="cursor-pointer">
                              <input 
                                type="checkbox"
                                checked={selectedCategoryIds.includes(category.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCategoryIds([...selectedCategoryIds, category.id]);
                                  } else {
                                    setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== category.id));
                                  }
                                }}
                                className="hidden"
                              />
                              <span className={`inline-block px-3 py-1.5 rounded-full text-sm border transition-all ${
                                selectedCategoryIds.includes(category.id)
                                  ? 'bg-purple-500/20 text-purple-400 border-purple-500/50'
                                  : 'bg-white/5 text-slate-400 border-white/10 hover:border-purple-500/30'
                              }`}>
                                {category.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button 
                    type="button" 
                    onClick={() => setModalMode(null)} 
                    className="flex-1 py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl shadow-lg hover:brightness-110"
                  >
                    {modalMode === "add" ? "Create Album" : "Update Album"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}