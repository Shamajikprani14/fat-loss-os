"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { photoTypeSchema } from "@/lib/validations";
import type { ActionResult, ProgressPhoto } from "@/types";

const BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "progress-photos";

export async function uploadProgressPhoto(
  formData: FormData,
): Promise<ActionResult<ProgressPhoto>> {
  const file = formData.get("file");
  const photoType = photoTypeSchema.safeParse(formData.get("photo_type"));
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "No file provided" };
  }
  if (!photoType.success) {
    return { success: false, error: "Invalid photo type" };
  }
  if (!file.type.startsWith("image/")) {
    return { success: false, error: "File must be an image" };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: "Image must be under 5MB" };
  }

  const { user, supabase } = await requireUser();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/${photoType.data}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { success: false, error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { data, error } = await supabase
    .from("progress_photos")
    .insert({
      user_id: user.id,
      image_url: publicUrl,
      storage_path: path,
      photo_type: photoType.data,
    })
    .select()
    .single();
  if (error) return { success: false, error: error.message };

  revalidatePath("/progress");
  return { success: true, data: data as ProgressPhoto };
}

export async function deleteProgressPhoto(
  id: string,
): Promise<ActionResult> {
  const { user, supabase } = await requireUser();
  const { data: photo } = await supabase
    .from("progress_photos")
    .select("storage_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (photo?.storage_path) {
    await supabase.storage.from(BUCKET).remove([photo.storage_path]);
  }

  const { error } = await supabase
    .from("progress_photos")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/progress");
  return { success: true };
}
