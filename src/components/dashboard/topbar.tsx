"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, LogOut, Menu } from "lucide-react";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/providers/theme-toggle";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { getInitials } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

export function Topbar({
  name,
  email,
}: {
  name: string | null;
  email: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-2">
        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="left-0 top-0 h-full max-w-[260px] translate-x-0 translate-y-0 rounded-none border-r p-0 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left">
            <DialogTitle className="flex items-center gap-2 border-b p-4 font-bold">
              <BarChart3 className="h-5 w-5 text-primary" />
              {APP_NAME}
            </DialogTitle>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </DialogContent>
        </Dialog>
        <Link href="/dashboard" className="flex items-center gap-2 font-bold md:hidden">
          {APP_NAME}
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar>
                <AvatarFallback>{getInitials(name)}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">
                {name ?? "Account"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span>{name ?? "Account"}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">Profile &amp; Goals</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={logout} className="w-full">
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full text-destructive">
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
