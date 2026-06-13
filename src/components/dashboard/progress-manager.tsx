"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  deleteProgressPhoto,
  uploadProgressPhoto,
} from "@/actions/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import type { PhotoType, ProgressPhoto } from "@/types";

const TYPES: PhotoType[] = ["front", "side", "back"];

export function ProgressManager({ photos }: { photos: ProgressPhoto[] }) {
  const [photoType, setPhotoType] = useState<PhotoType>("front");
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("file", file);
    formData.set("photo_type", photoType);
    startTransition(async () => {
      const res = await uploadProgressPhoto(formData);
      if (res.success) toast.success("Photo uploaded");
      else toast.error(res.error ?? "Upload failed");
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this photo?")) return;
    startTransition(async () => {
      const res = await deleteProgressPhoto(id);
      if (res.success) toast.success("Photo deleted");
      else toast.error(res.error ?? "Failed");
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <Label>View</Label>
            <Select
              value={photoType}
              onValueChange={(v) => setPhotoType(v as PhotoType)}
            >
              <SelectTrigger className="w-40 capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">
                    {t} view
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFile}
          />
          <Button
            disabled={isPending}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4" /> Choose photo
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {TYPES.map((t) => (
            <TabsTrigger key={t} value={t} className="capitalize">
              {t}
            </TabsTrigger>
          ))}
        </TabsList>
        {["all", ...TYPES].map((tab) => {
          const filtered =
            tab === "all" ? photos : photos.filter((p) => p.photo_type === tab);
          return (
            <TabsContent key={tab} value={tab}>
              {filtered.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No photos yet.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {filtered.map((p) => (
                    <div
                      key={p.id}
                      className="group relative overflow-hidden rounded-lg border"
                    >
                      <div className="relative aspect-[3/4]">
                        <Image
                          src={p.image_url}
                          alt={`${p.photo_type} progress`}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex items-center justify-between p-2 text-xs">
                        <span className="capitalize text-muted-foreground">
                          {p.photo_type} · {formatDate(p.uploaded_at)}
                        </span>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-destructive"
                          aria-label="Delete photo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
