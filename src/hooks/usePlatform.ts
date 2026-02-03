"use client";

import { create } from "zustand";

export type Platform = "dramabox" | "reelshort" | "netshort" | "melolo" | "flickreels" | "freereels";

export interface PlatformInfo {
  id: Platform;
  name: string;
  logo: string;
  apiBase: string;
}

import { getApiBaseUrl } from "@/utils/api";

export const PLATFORMS: PlatformInfo[] = [
  {
    id: "dramabox",
    name: "DramaBox",
    logo: "/dramabox.webp",
    apiBase: `${getApiBaseUrl()}/api/dramabox`,
  },
  {
    id: "reelshort",
    name: "ReelShort",
    logo: "/reelshort.webp",
    apiBase: `${getApiBaseUrl()}/api/reelshort`,
  },
  {
    id: "netshort",
    name: "NetShort",
    logo: "/netshort.webp",
    apiBase: `${getApiBaseUrl()}/api/netshort`,
  },
  {
    id: "melolo",
    name: "Melolo",
    logo: "/melolo.webp",
    apiBase: `${getApiBaseUrl()}/api/melolo`,
  },
  {
    id: "flickreels",
    name: "FlickReels",
    logo: "/flickreels.png",
    apiBase: `${getApiBaseUrl()}/api/flickreels`,
  },
  {
    id: "freereels",
    name: "FreeReels",
    logo: "/freereels.webp",
    apiBase: `${getApiBaseUrl()}/api/freereels`,
  },
];

interface PlatformState {
  currentPlatform: Platform;
  setPlatform: (platform: Platform) => void;
}

export const usePlatformStore = create<PlatformState>((set) => ({
  currentPlatform: "reelshort",
  setPlatform: (platform) => set({ currentPlatform: platform }),
}));

export function usePlatform() {
  const { currentPlatform, setPlatform } = usePlatformStore();
  const platformInfo = PLATFORMS.find((p) => p.id === currentPlatform)!;

  const getPlatformInfo = (platformId: Platform) => {
    return PLATFORMS.find((p) => p.id === platformId) || PLATFORMS[0];
  };

  return {
    currentPlatform,
    platformInfo,
    setPlatform,
    platforms: PLATFORMS,
    getPlatformInfo,
    isDramaBox: currentPlatform === "dramabox",
    isReelShort: currentPlatform === "reelshort",
    isNetShort: currentPlatform === "netshort",
    isMelolo: currentPlatform === "melolo",
    isFlickReels: currentPlatform === "flickreels",
    isFreeReels: currentPlatform === "freereels",
  };
}
