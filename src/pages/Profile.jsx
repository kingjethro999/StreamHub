"use client"

import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { createClient } from "../lib/supabase/client"
import { LogOut, UploadCloud, Copy, Plus, Trash2, Check, ExternalLink } from "lucide-react"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Input } from "../components/ui/input"

export default function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  // Form State
  const [name, setName] = useState("")
  const [handle, setHandle] = useState("")
  const [description, setDescription] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [bannerUrl, setBannerUrl] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [links, setLinks] = useState([]) // Array of { title: "", url: "" }

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Refs for hidden file inputs
  const avatarInputRef = useRef(null)
  const bannerInputRef = useRef(null)

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setUser(user)
        const { data: profileData } = await supabase.from("channels").select("*").eq("user_id", user.id).single()

        if (profileData) {
          setName(profileData.name || "")
          setHandle(profileData.handle || "")
          setDescription(profileData.description || "")
          setAvatarUrl(profileData.avatar_url || "")
          setBannerUrl(profileData.banner_url || "")
          setContactEmail(profileData.contact_email || "")
          setLinks(profileData.links || [])
        }
      } else {
        navigate("/auth/login")
      }
      setLoading(false)
    }

    fetchUser()
  }, [navigate])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    navigate("/auth/login")
  }

  const uploadToCloudinary = async (file) => {
    setUploadingImage(true)
    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "streamhub_uploads"

      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", uploadPreset)
      formData.append("resource_type", "image")

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      })

      if (!res.ok) throw new Error("Upload failed")

      const data = await res.json()
      return data.secure_url
    } catch (err) {
      console.error(err)
      alert("Image upload failed.")
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  const handleImageChange = async (e, type) => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = await uploadToCloudinary(file)
    if (url) {
      if (type === 'avatar') setAvatarUrl(url)
      else setBannerUrl(url)
    }
  }

  const addLink = () => setLinks([...links, { title: "", url: "" }])

  const updateLink = (index, field, value) => {
    const newLinks = [...links]
    newLinks[index][field] = value
    setLinks(newLinks)
  }

  const removeLink = (index) => {
    setLinks(links.filter((_, i) => i !== index))
  }

  const handlePublish = async () => {
    setSaving(true)
    const supabase = createClient()

    try {
      // Format handle properly
      let formattedHandle = handle.trim()
      if (formattedHandle && !formattedHandle.startsWith('@')) {
        formattedHandle = '@' + formattedHandle
      }

      // Check if channel already exists
      const { data: existingChannel, error: checkError } = await supabase
        .from("channels")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()

      if (checkError) {
        throw checkError
      }

      if (existingChannel) {
        // Update existing channel
        const { error } = await supabase
          .from("channels")
          .update({
            name,
            handle: formattedHandle,
            description,
            avatar_url: avatarUrl,
            banner_url: bannerUrl,
            contact_email: contactEmail,
            links
          })
          .eq("user_id", user.id)
        if (error) throw error
      } else {
        // Insert new channel
        const { error } = await supabase
          .from("channels")
          .insert({
            user_id: user.id,
            name: name || "My Channel", // Provides a fallback name to avoid DB constraints if any
            handle: formattedHandle || `@user-${user.id.substring(0, 6)}`,
            description,
            avatar_url: avatarUrl,
            banner_url: bannerUrl,
            contact_email: contactEmail,
            links
          })
        if (error) throw error
      }
      alert("Profile published successfully!")
    } catch (err) {
      console.error(err)
      alert("Failed to publish profile updates: " + (err.message || "Unknown error"))
    } finally {
      setSaving(false)
    }
  }

  const channelUrlText = user ? `${window.location.origin}/channel/${user.id}` : ""

  if (loading) return null

  return (
    <div className="flex-1 w-full h-full flex overflow-hidden">

      {/* Sidebar - Desktop Only (Visual Stub) */}
      <aside className="w-64 border-r border-border hidden md:flex flex-col p-4 overflow-y-auto">
        <div className="flex flex-col items-center gap-4 py-8 border-b border-border">
          <Avatar className="h-24 w-24 border-4 border-muted">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="text-2xl">{name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h3 className="font-bold text-lg">{name || "Your Channel"}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1">{handle || "No handle set"}</p>
          </div>
        </div>
        <nav className="flex-1 py-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start text-primary bg-primary/10">Channel customization</Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">Dashboard</Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">Content</Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">Analytics</Button>
        </nav>
        <div className="pt-4 border-t border-border">
          <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
            <LogOut size={16} className="mr-2" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto w-full relative">
        {/* Top Bar Actions */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Channel customisation</h1>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="hidden sm:flex" onClick={() => navigate(`/channel/${user.id}`)}>
              View channel
            </Button>
            <Button onClick={handlePublish} disabled={saving || uploadingImage} className="min-w-[100px]">
              {saving ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6 space-y-12 pb-24">

          {/* Branding Section */}
          <section>
            <h2 className="text-xl font-bold mb-6">Branding</h2>
            <div className="space-y-8">

              {/* Avatar Upload */}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-6 items-start p-6 bg-card border border-border rounded-xl">
                <div>
                  <h3 className="font-semibold mb-1">Picture</h3>
                  <p className="text-sm text-muted-foreground">Your profile picture will appear next to your videos and comments.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                    <AvatarImage src={avatarUrl} className="object-cover" />
                    <AvatarFallback className="bg-muted text-4xl">{name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-3 flex-1 w-full">
                    <p className="text-xs text-muted-foreground">It's recommended to use a picture that's at least 98x98 pixels and 4MB or less. Use a PNG or GIF (no animations) file.</p>
                    <div className="flex gap-2">
                      <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'avatar')} />
                      <Button variant="secondary" onClick={() => avatarInputRef.current?.click()} disabled={uploadingImage}>
                        {avatarUrl ? "Change" : "Upload"}
                      </Button>
                      {avatarUrl && (
                        <Button variant="ghost" onClick={() => setAvatarUrl("")} className="text-destructive">Remove</Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Banner Upload */}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-6 items-start p-6 bg-card border border-border rounded-xl">
                <div>
                  <h3 className="font-semibold mb-1">Banner image</h3>
                  <p className="text-sm text-muted-foreground">This image will appear across the top of your channel.</p>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="aspect-[16/4] w-full bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden group relative">
                    {bannerUrl ? (
                      <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-muted-foreground flex flex-col items-center">
                        <UploadCloud className="mb-2 opacity-50" size={32} />
                        <span className="text-sm font-medium">No banner set</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer" onClick={() => bannerInputRef.current?.click()}>
                      <span className="text-white font-medium flex items-center gap-2"><UploadCloud size={20} /> Upload new banner</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground max-w-sm">For the best results on all devices, use an image that's at least 2048 x 1152 pixels and 6MB or less.</p>
                    <div className="flex gap-2">
                      <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'banner')} />
                      <Button variant="secondary" size="sm" onClick={() => bannerInputRef.current?.click()} disabled={uploadingImage}>
                        {bannerUrl ? "Change" : "Upload"}
                      </Button>
                      {bannerUrl && (
                        <Button variant="ghost" size="sm" onClick={() => setBannerUrl("")} className="text-destructive">Remove</Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Basic Info Section */}
          <section>
            <h2 className="text-xl font-bold mb-6">Basic info</h2>
            <div className="space-y-6">

              <div className="space-y-2">
                <label className="text-sm font-semibold">Name</label>
                <p className="text-xs text-muted-foreground mb-1">Choose a channel name that represents you and your content.</p>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Channel Name"
                  className="max-w-2xl bg-card"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Handle</label>
                <p className="text-xs text-muted-foreground mb-1">Choose your unique handle by adding letters and numbers.</p>
                <Input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="@yourhandle"
                  className="max-w-2xl bg-card"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Description</label>
                <p className="text-xs text-muted-foreground mb-1">Tell viewers about your channel. Your description will appear in the About section.</p>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Welcome to my channel! Here we discuss..."
                  className="w-full max-w-2xl min-h-[160px] flex rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Channel URL</label>
                <p className="text-xs text-muted-foreground mb-1">This is the standard web address for your channel.</p>
                <div className="flex gap-2 max-w-2xl">
                  <Input
                    value={channelUrlText}
                    readOnly
                    className="bg-muted text-muted-foreground"
                  />
                  <Button variant="secondary" onClick={() => navigator.clipboard.writeText(channelUrlText)} title="Copy URL">
                    <Copy size={18} />
                  </Button>
                </div>
              </div>

              {/* Links Array */}
              <div className="space-y-4 pt-4 border-t border-border">
                <div>
                  <label className="text-sm font-semibold">Links</label>
                  <p className="text-xs text-muted-foreground mb-4">Share external links with your viewers. They'll be visible on your channel profile.</p>
                </div>

                <div className="space-y-3 max-w-3xl">
                  {links.map((link, idx) => (
                    <div key={idx} className="flex gap-2 items-start group">
                      <Input
                        placeholder="Link title (e.g. My Website)"
                        value={link.title}
                        onChange={(e) => updateLink(idx, 'title', e.target.value)}
                        className="w-1/3 bg-card"
                      />
                      <Input
                        placeholder="URL"
                        value={link.url}
                        onChange={(e) => updateLink(idx, 'url', e.target.value)}
                        className="flex-1 bg-card"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeLink(idx)} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-destructive hover:bg-destructive/10">
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  ))}
                  <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10 pl-2" onClick={addLink}>
                    <Plus size={18} className="mr-2" /> Add link
                  </Button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 pt-4 border-t border-border">
                <label className="text-sm font-semibold">Contact info</label>
                <p className="text-xs text-muted-foreground mb-1">Let people know how to contact you with business enquiries.</p>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Email address"
                  className="max-w-md bg-card"
                />
              </div>

            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
