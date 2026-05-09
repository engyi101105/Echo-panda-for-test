import React, { useState, useEffect } from "react";
import {
  FaTimes, FaMusic, FaClock, FaMicrophone, 
  FaCompactDisc, FaSpinner, FaImage, FaUpload
} from "react-icons/fa";
import { supabase } from "../../backend/supabaseClient";
import { uploadToR2, generateFileKey, deleteFromR2 } from "../../backend/r2Client";

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
  duration: number;
  album_id: string | null;
  audio_url: string;
  songCover_url: string;
  created_at: string;
  updated_at: string;
  artists?: Artist[];
  album?: Album;
}

interface SongModalProps {
  show: boolean;
  editingSong: Song | null;
  allArtists: Artist[];
  allAlbums: Album[];
  onClose: () => void;
  onSave: () => void;
}

export default function SongModal({
  show,
  editingSong,
  allArtists,
  allAlbums,
  onClose,
  onSave
}: SongModalProps) {
  const [formData, setFormData] = useState<Partial<Song>>({
    title: "",
    duration: 0,
    album_id: null,
    audio_url: "",
    songCover_url: ""
  });

  const [selectedArtistIds, setSelectedArtistIds] = useState<string[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState({ cover: 0, audio: 0 });
  const [uploading, setUploading] = useState(false);

  // Reset form when modal opens/closes or editingSong changes
  useEffect(() => {
    if (editingSong) {
      setFormData({
        title: editingSong.title,
        duration: editingSong.duration,
        album_id: editingSong.album_id,
        audio_url: editingSong.audio_url,
        songCover_url: editingSong.songCover_url
      });
      setSelectedArtistIds(editingSong.artists?.map(a => a.id) || []);
      setCoverPreview(editingSong.songCover_url || "");
    } else {
      setFormData({
        title: "",
        duration: 0,
        album_id: null,
        audio_url: "",
        songCover_url: ""
      });
      setSelectedArtistIds([]);
      setCoverPreview("");
    }
    setCoverFile(null);
    setAudioFile(null);
    setUploadProgress({ cover: 0, audio: 0 });
  }, [editingSong, show]);

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

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPG, PNG, or WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Cover image must be less than 5MB');
      return;
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/flac', 'audio/aac'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.mp3')) {
      alert('Please upload a valid audio file (MP3, WAV, FLAC, or AAC)');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('Audio file must be less than 50MB');
      return;
    }

    setAudioFile(file);
  };

  const handleSave = async () => {
    if (!formData.title) {
      alert('Please enter a song title');
      return;
    }

    if (!editingSong && !audioFile) {
      alert('Please upload an audio file');
      return;
    }

    try {
      setUploading(true);
      let coverUrl = formData.songCover_url || '';
      let audioUrl = formData.audio_url || '';

      // Upload cover image if new file selected
      if (coverFile) {
        setUploadProgress({ ...uploadProgress, cover: 0 });
        const coverKey = generateFileKey(coverFile.name, 'song-covers');
        coverUrl = await uploadToR2(coverFile, coverKey, coverFile.type);
        setUploadProgress({ ...uploadProgress, cover: 100 });
        
        // Delete old cover if updating
        if (editingSong?.songCover_url) {
          try {
            const oldKey = editingSong.songCover_url.split('/').slice(-2).join('/');
            await deleteFromR2(oldKey);
          } catch (err) {
            console.warn('Failed to delete old cover:', err);
          }
        }
      }

      // Upload audio file if new file selected
      if (audioFile) {
        setUploadProgress({ ...uploadProgress, audio: 0 });
        const audioKey = generateFileKey(audioFile.name, 'songs');
        audioUrl = await uploadToR2(audioFile, audioKey, audioFile.type);
        setUploadProgress({ ...uploadProgress, audio: 100 });
        
        // Delete old audio if updating
        if (editingSong?.audio_url) {
          try {
            const oldKey = editingSong.audio_url.split('/').slice(-2).join('/');
            await deleteFromR2(oldKey);
          } catch (err) {
            console.warn('Failed to delete old audio:', err);
          }
        }
      }

      if (editingSong) {
        // Update song
        const { error: updateError } = await supabase
          .from('songs')
          .update({
            title: formData.title,
            duration: formData.duration,
            album_id: formData.album_id || null,
            audio_url: audioUrl,
            songCover_url: coverUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingSong.id);

        if (updateError) {
          console.error('❌ Update error details:', updateError);
          console.error('Error message:', updateError.message);
          console.error('Error code:', updateError.code);
          alert(`Failed to update song: ${updateError.message}`);
          throw updateError;
        }

        console.log('✅ Song updated successfully');

        // Delete existing artist relationships
        await supabase
          .from('song_artist')
          .delete()
          .eq('song_id', editingSong.id);

        // Insert new artist relationships
        if (selectedArtistIds.length > 0) {
          const artistRelations = selectedArtistIds.map(artistId => ({
            song_id: editingSong.id,
            artist_id: artistId,
            primary_artist: true
          }));

          const { error: artistError } = await supabase
            .from('song_artist')
            .insert(artistRelations);
            
          if (artistError) {
            console.error('❌ Artist relationship error:', artistError);
            alert(`Failed to add artists: ${artistError.message}`);
            throw artistError;
          }
        }
      } else {
        // Insert new song
        const { data: newSong, error: insertError } = await supabase
          .from('songs')
          .insert([{
            title: formData.title,
            duration: formData.duration || 0,
            album_id: formData.album_id || null,
            audio_url: audioUrl,
            songCover_url: coverUrl
          }])
          .select()
          .single();

        if (insertError) {
          console.error('❌ Insert error details:', insertError);
          console.error('Error message:', insertError.message);
          console.error('Error code:', insertError.code);
          console.error('Error details:', insertError.details);
          alert(`Failed to insert song: ${insertError.message}`);
          throw insertError;
        }

        console.log('✅ Song inserted successfully:', newSong);

        // Insert artist relationships
        if (selectedArtistIds.length > 0) {
          const artistRelations = selectedArtistIds.map(artistId => ({
            song_id: newSong.id,
            artist_id: artistId,
            primary_artist: true
          }));

          const { error: artistError } = await supabase
            .from('song_artist')
            .insert(artistRelations);
            
          if (artistError) {
            console.error('❌ Artist relationship error:', artistError);
            alert(`Failed to add artists: ${artistError.message}`);
            throw artistError;
          }
        }
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('❌ Error saving song:', error);
      const errorMessage = error?.message || 'Unknown error';
      const errorDetails = error?.details || '';
      alert(`Failed to save song: ${errorMessage}${errorDetails ? '\n' + errorDetails : ''}`);
    } finally {
      setUploading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-white/10 w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold text-white">{editingSong ? 'Update Track' : 'Add New Track'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><FaTimes size={24}/></button>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Song Title</label>
            <input 
              required
              value={formData.title || ''} 
              onChange={(e) => setFormData({...formData, title: e.target.value})} 
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-purple-500 text-white" 
              placeholder="e.g. Midnight Dreams" 
            />
          </div>

          {/* Song Cover Upload */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-2">
              <FaImage /> Song Cover Image
            </label>
            <div className="flex gap-4 items-center">
              {coverPreview && (
                <img 
                  src={coverPreview} 
                  alt="Cover preview" 
                  className="w-20 h-20 rounded-xl object-cover border-2 border-purple-500"
                />
              )}
              <label className="flex-1 cursor-pointer">
                <div className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 hover:bg-white/10 transition-all flex items-center gap-3">
                  <FaUpload className="text-purple-400" />
                  <span className="text-slate-300">
                    {coverFile ? coverFile.name : 'Choose cover image (JPG, PNG, WEBP - Max 5MB)'}
                  </span>
                </div>
                <input 
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCoverChange}
                  className="hidden"
                />
              </label>
            </div>
            {uploadProgress.cover > 0 && uploadProgress.cover < 100 && (
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress.cover}%` }}
                />
              </div>
            )}
          </div>

          {/* Audio File Upload */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-2">
              <FaMusic /> Audio File {!editingSong && <span className="text-red-400">*</span>}
            </label>
            <label className="cursor-pointer block">
              <div className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 hover:bg-white/10 transition-all flex items-center gap-3">
                <FaUpload className="text-pink-400" />
                <span className="text-slate-300">
                  {audioFile ? audioFile.name : formData.audio_url ? 'Audio uploaded ✓' : 'Choose audio file (MP3, WAV, FLAC - Max 50MB)'}
                </span>
              </div>
              <input 
                type="file"
                accept="audio/mpeg,audio/mp3,audio/wav,audio/flac,audio/aac"
                onChange={handleAudioChange}
                className="hidden"
                required={!editingSong}
              />
            </label>
            {uploadProgress.audio > 0 && uploadProgress.audio < 100 && (
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div 
                  className="bg-pink-500 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress.audio}%` }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-2">
                <FaClock /> Duration (MM:SS)
              </label>
              <input 
                value={formatDuration(formData.duration || 0)} 
                onChange={(e) => setFormData({...formData, duration: parseDuration(e.target.value)})} 
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-purple-500 text-white" 
                placeholder="3:45" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-2">
                <FaCompactDisc /> Album
              </label>
              <select 
                value={formData.album_id || ''} 
                onChange={(e) => setFormData({...formData, album_id: e.target.value || null})} 
                className="w-full bg-slate-800 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-purple-500 text-white"
              >
                <option value="">No Album</option>
                {allAlbums.map(album => (
                  <option key={album.id} value={album.id}>{album.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Artists Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-2">
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
        </div>

        <div className="mt-10 flex gap-4">
          <button 
            onClick={onClose} 
            disabled={uploading}
            className="flex-1 px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={uploading}
            className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <FaSpinner className="animate-spin" />
                Uploading...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
