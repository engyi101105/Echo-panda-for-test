import React, { useState, useEffect } from "react";
import { FaUser, FaArrowLeft, FaCamera, FaSave, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface ProfileFormData {
  name: string;
  email: string;
  role: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  location?: string;
}

export default function AdminSettings() {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileFormData>({
    name: "Admin",
    email: "admin@echopanda.com",
    role: "Administrator",
    bio: "Music platform administrator",
    phone: "+1 (555) 000-0000",
    location: "San Francisco, CA",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>(profileData);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Fetch actual admin profile data from API
    // Replace with real API call
    
    const fetchProfile = async () => {
      try {
        // const response = await fetch("/api/admin/profile");
        // const data = await response.json();
        // setProfileData(data);
        // setFormData(data);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({
          ...prev,
          avatar: event.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      // Replace with actual API call
      // const response = await fetch("/api/admin/profile", {
      //   method: "PUT",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(formData),
      // });

      // if (!response.ok) throw new Error("Failed to update profile");

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setProfileData(formData);
      setIsEditing(false);
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setErrorMessage("Failed to save profile. Please try again.");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profileData);
    setIsEditing(false);
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors mb-4"
        >
          <FaArrowLeft className="text-sm" />
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
          Admin Settings
        </h1>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-300 flex items-center justify-between">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage("")}
            className="text-green-400 hover:text-green-200"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage("")}
            className="text-red-400 hover:text-red-200"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* Profile Card */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800/60 shadow-lg rounded-xl p-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-4xl font-bold overflow-hidden">
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  formData.name.charAt(0)
                )}
              </div>
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-full cursor-pointer transition-colors">
                  <FaCamera className="text-sm" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            {isEditing && (
              <p className="text-xs text-slate-400 text-center">
                Click camera icon to change avatar
              </p>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                <FaUser className="inline mr-2" />
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-2 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={true}
                className="w-full px-4 py-2 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Role
              </label>
              <input
                type="text"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                disabled={true}
                className="w-full px-4 py-2 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                rows={3}
                className="w-full px-4 py-2 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-2 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-2 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-4 justify-end">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-6 py-2 rounded-lg border border-slate-600 text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaSave className="text-sm" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-colors flex items-center gap-2"
              >
                <FaCamera className="text-sm" />
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
