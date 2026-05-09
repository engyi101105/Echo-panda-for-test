import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  FaEye, FaEdit, FaBan, FaSearch, FaTimes, FaPlus, 
  FaCamera, FaMars, FaVenus, FaGenderless, FaCalendarAlt, FaCheckCircle, FaTimesCircle
} from "react-icons/fa";
import { supabase } from "../../backend/supabaseClient";
import { useDataCache } from "../../contexts/DataCacheContext";

interface Artist {
  id: string;
  created_at: string;
  name: string;
  image_url: string;
  bio: string;
  updated_at: string;
  gender: string;
  status: boolean;
  role: string;
}

export default function ArtistsManager() {
  const { getCachedData, clearCache } = useDataCache();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view" | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Artist>>({
    name: "",
    role: "Single",
    gender: "Male",
    image_url: "",
    bio: "",
    status: true
  });

  // Fetch artists from Supabase
  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    try {
      setLoading(true);

      const data = await getCachedData('admin_artists', async () => {
        const { data, error } = await supabase
          .from('artists')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      });

      setArtists(data);
    } catch (error) {
      console.error('Error fetching artists:', error);
      alert('Failed to fetch artists');
    } finally {
      setLoading(false);
    }
  };


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, image_url: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setFormData({ 
      name: "", 
      role: "Single", 
      gender: "Male", 
      image_url: "", 
      bio: "",
      status: true
    });
    setModalMode("add");
  };

  const openEditModal = (artist: Artist) => {
    setSelectedArtist(artist);
    setFormData(artist);
    setModalMode("edit");
  };

  const openViewModal = (artist: Artist) => {
    setSelectedArtist(artist);
    setModalMode("view");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === "add") {
        const { data, error } = await supabase
          .from('artists')
          .insert([{
            name: formData.name,
            role: formData.role,
            gender: formData.gender,
            image_url: formData.image_url || `https://ui-avatars.com/api/?name=${formData.name}&background=random`,
            bio: formData.bio || '',
            status: formData.status ?? true
          }])
          .select();

        if (error) throw error;
        if (data) setArtists([data[0], ...artists]);
      } else if (modalMode === "edit" && selectedArtist) {
        const { error } = await supabase
          .from('artists')
          .update({
            name: formData.name,
            role: formData.role,
            gender: formData.gender,
            image_url: formData.image_url,
            bio: formData.bio,
            status: formData.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedArtist.id);

        if (error) throw error;
        setArtists(artists.map(a => 
          a.id === selectedArtist.id ? { ...a, ...formData, updated_at: new Date().toISOString() } as Artist : a
        ));
      }
      setModalMode(null);
    } catch (error) {
      console.error('Error saving artist:', error);
      alert('Failed to save artist');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const artist = artists.find(a => a.id === id);
      if (!artist) return;

      const { error } = await supabase
        .from('artists')
        .update({ 
          status: !artist.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      setArtists(artists.map(a => 
        a.id === id ? { ...a, status: !a.status, updated_at: new Date().toISOString() } : a
      ));
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update status');
    }
  };

  const filtered = useMemo(() => {
    return artists.filter((a) => 
      a.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [artists, query]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading artists...</div>
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
              Artist <span className="text-purple-400">List</span>
            </h1>
            <p className="text-slate-400">System management for platform creators</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:min-w-[300px]">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search artists..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/40 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
            </div>
            <button
              onClick={openAddModal}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-105 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
            >
              <FaPlus /> Add Artist
            </button>
          </div>
        </div>

        {/* --- ARTIST TABLE --- */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-widest font-bold">
                  <th className="p-5">Profile</th>
                  <th className="p-5">Role</th>
                  <th className="p-5">Gender</th>
                  <th className="p-5">Joined Date</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-white/5">
                {filtered.map((a) => (
                  <tr key={a.id} className="group hover:bg-white/5 transition-all">
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <img src={a.image_url || `https://ui-avatars.com/api/?name=${a.name}&background=random`} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-purple-500/20" alt="" />
                        <div>
                          <div className="text-white font-bold">{a.name}</div>
                          <div className="text-xs text-slate-500">{a.role}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        a.role === "Group" 
                        ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" 
                        : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                      }`}>
                        {a.role}
                      </span>
                    </td>

                    <td className="p-5">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        {a.gender === "Male" && <FaMars className="text-blue-400" />}
                        {a.gender === "Female" && <FaVenus className="text-pink-400" />}
                        {(a.gender === "N/A" || a.gender === "Other") && <FaGenderless className="text-slate-500" />}
                        {a.gender}
                      </span>
                    </td>

                    <td className="p-5">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <FaCalendarAlt className="text-purple-400 text-xs" />
                        {new Date(a.created_at).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 w-fit ${
                        a.status ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {a.status ? <><FaCheckCircle /> Active</> : <><FaTimesCircle /> Inactive</>}
                      </span>
                    </td>

                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openViewModal(a)} className="p-2.5 bg-slate-800 hover:bg-purple-500/20 rounded-xl transition-all"><FaEye /></button>
                        <button onClick={() => openEditModal(a)} className="p-2.5 bg-slate-800 hover:bg-blue-500/20 rounded-xl transition-all"><FaEdit /></button>
                        <button onClick={() => handleToggleStatus(a.id)} className="p-2.5 bg-slate-800 hover:bg-red-500/20 rounded-xl transition-all"><FaBan /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {modalMode && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-purple-500/30 rounded-[2.5rem] p-8 max-w-2xl w-full shadow-2xl relative">
            <button onClick={() => setModalMode(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><FaTimes size={20} /></button>

            {modalMode === "view" && selectedArtist ? (
              <div className="space-y-6 text-center">
                <img src={selectedArtist.image_url || `https://ui-avatars.com/api/?name=${selectedArtist.name}&background=random`} className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-purple-500/30" alt="" />
                <div>
                  <h2 className="text-3xl font-black text-white">{selectedArtist.name}</h2>
                  <p className="text-slate-400 tracking-widest uppercase text-sm mt-1">{selectedArtist.role}</p>
                </div>
                {selectedArtist.bio && (
                  <div className="bg-white/5 p-4 rounded-2xl text-left">
                    <p className="text-xs text-slate-500 mb-2">BIO</p>
                    <p className="text-slate-300">{selectedArtist.bio}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-left bg-white/5 p-6 rounded-3xl">
                  <div><p className="text-xs text-slate-500">ROLE</p><p className="font-bold">{selectedArtist.role}</p></div>
                  <div><p className="text-xs text-slate-500">GENDER</p><p className="font-bold">{selectedArtist.gender}</p></div>
                  <div><p className="text-xs text-slate-500">JOINED</p><p className="font-bold">{new Date(selectedArtist.created_at).toLocaleDateString()}</p></div>
                  <div><p className="text-xs text-slate-500">STATUS</p><p className="font-bold">{selectedArtist.status ? "Active" : "Inactive"}</p></div>
                </div>
                <button onClick={() => setModalMode(null)} className="w-full py-4 bg-white/5 rounded-2xl font-bold">Close Profile</button>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-6">
                <h2 className="text-2xl font-black text-white">{modalMode === "add" ? "Register New" : "Edit"} <span className="text-purple-400">Artist</span></h2>
                
                <div className="flex flex-col items-center">
                  <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-3xl bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-purple-500 overflow-hidden group relative">
                    {formData.image_url ? <img src={formData.image_url} className="w-full h-full object-cover" alt="" /> : <FaCamera className="text-2xl text-slate-500 group-hover:text-purple-500" />}
                  </div>
                  <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageChange} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] text-slate-500 ml-2 uppercase font-bold">Artist Name</label>
                    <input required placeholder="Artist Name" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-purple-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 ml-2 uppercase font-bold">Gender</label>
                    <select className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl outline-none text-white" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} disabled={formData.role === "Group"}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="N/A">N/A</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 ml-2 uppercase font-bold">Musical Role</label>
                    <select className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl outline-none text-white" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value, gender: e.target.value === "Group" ? "N/A" : formData.gender})}>
                        <option value="Single">Single Artist</option>
                        <option value="Group">Musical Group</option>
                    </select>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] text-slate-500 ml-2 uppercase font-bold">Bio</label>
                    <textarea placeholder="Artist biography..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-purple-500 resize-none" rows={3} value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
                  </div>
                </div>

                <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
                    <input type="checkbox" id="status" checked={formData.status} onChange={e => setFormData({...formData, status: e.target.checked})} className="w-4 h-4 accent-purple-500 cursor-pointer" />
                    <label htmlFor="status" className="text-slate-300 text-sm cursor-pointer font-medium">Active Status</label>
                </div>

                <div className="flex gap-4 mt-8">
                  <button type="button" onClick={() => setModalMode(null)} className="flex-1 py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-all">Discard</button>
                  <button type="submit" className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl shadow-lg hover:brightness-110">
                    {modalMode === "add" ? "Save Artist" : "Update Profile"}
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