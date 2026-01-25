import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDisplayName(profile: { full_name?: string | null, nickname?: string | null, use_nickname?: boolean | null } | null) {
  if (!profile) return "Anonym"
  if (profile.use_nickname && profile.nickname) {
    return profile.nickname
  }
  return profile.full_name || profile.nickname || "Anonym"
}
