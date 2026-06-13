"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

export function SubmitButton({
  children,
  pending: pendingProp,
  ...props
}: ButtonProps & { pending?: boolean }) {
  const { pending } = useFormStatus();
  const isPending = pendingProp ?? pending;
  return (
    <Button type="submit" disabled={isPending} {...props}>
      {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}
