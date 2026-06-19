"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ImagePlus, X } from "lucide-react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateConcernSchema, CreateConcernInput } from "@/lib/validators";
import { createSupabaseClient } from "@/lib/supabase";

export default function NewConcernPage() {
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateConcernInput>({
    resolver: zodResolver(CreateConcernSchema),
    shouldFocusError: false,
  });

  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPhotos = Array.from(files);
      if (photos.length + newPhotos.length > 5) {
        toast.error("Maximum 5 photos allowed");
        return;
      }
      setPhotos([...photos, ...newPhotos]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: CreateConcernInput) => {
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be signed in to post a concern.");
        router.push("/login");
        return;
      }
      const userId = session.user.id;

      // 1. Insert the concern row
      const { data: concern, error: concernErr } = await supabase
        .from("concerns")
        .insert({
          user_id: userId,
          title:   data.title,
          body:    data.body,
          status:  "open",
        })
        .select("id")
        .single();

      if (concernErr || !concern) throw concernErr ?? new Error("Failed to create concern");

      // 2. Upload photos to the public-assets bucket, then record URLs
      for (const file of photos) {
        const ext  = file.name.split(".").pop() || "jpg";
        const path = `concerns/${userId}/${concern.id}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("public-assets")
          .upload(path, file, { upsert: false });

        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage
          .from("public-assets")
          .getPublicUrl(path);

        const { error: photoErr } = await supabase
          .from("concern_photos")
          .insert({
            concern_id: concern.id,
            photo_url:  urlData.publicUrl,
          });

        if (photoErr) throw photoErr;
      }

      toast.success("Concern posted successfully");
      router.push("/tenant/concerns");
    } catch (error) {
      console.error("Error posting concern:", error);
      toast.error("Failed to post concern");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page md:p-6">
      <div className="page-content md:max-w-full md:p-0">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/tenant/concerns" className="btn btn-ghost btn-sm">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-title-md">Post a Concern</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="label">
              Concern Title
            </label>
            <input
              type="text"
              id="title"
              placeholder="e.g., Leaky faucet in bathroom"
              {...register("title")}
              className="input"
            />
            {errors.title && <p className="text-danger text-sm mt-1">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="body" className="label">
              Description
            </label>
            <textarea
              id="body"
              placeholder="Describe your concern in detail..."
              rows={5}
              {...register("body")}
              className="input"
            />
            {errors.body && <p className="text-danger text-sm mt-1">{errors.body.message}</p>}
          </div>

          {/* Photos */}
          <div>
            <label className="label">Photos (Optional)</label>
            <p className="text-caption text-slate-600 mb-3">Upload up to 5 photos to help explain the issue</p>

            {/* Photo Upload Button */}
            <label className="card p-8 border-2 border-dashed border-blue-300 cursor-pointer hover:bg-blue-50 transition-colors flex items-center justify-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleAddPhoto}
                className="sr-only"
              />
              <div className="text-center">
                <ImagePlus className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="font-medium text-slate-900">Add Photos</p>
                <p className="text-sm text-slate-500">Tap to select images</p>
              </div>
            </label>

            {/* Photos Grid */}
            {photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg bg-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Link href="/tenant/concerns" className="btn btn-secondary btn-lg flex-1">
              Cancel
            </Link>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg flex-1">
              {isSubmitting ? "Posting..." : "Post Concern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
