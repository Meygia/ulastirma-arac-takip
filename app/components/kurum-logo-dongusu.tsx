"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const VIDEO_SRC = "/intro.mp4";
const LOGO_SRC = "/iletisim-baskanligi-amblem.png";
const LOGO_SURESI_MS = 15_000;

type Boyut = "giris" | "baslik";

const BOYUTLAR: Record<
  Boyut,
  { kutu: string; videoScale: string }
> = {
  giris: {
    kutu: "h-24 w-24 md:h-28 md:w-28",
    // Lastiğin dışını kırpmak için hafif yakınlaştırma
    videoScale: "scale-[1.28]",
  },
  baslik: {
    kutu: "h-[4.5rem] w-[4.5rem] md:h-20 md:w-20",
    videoScale: "scale-[1.28]",
  },
};

type KurumLogoDongusuProps = {
  boyut?: Boyut;
  className?: string;
};

export default function KurumLogoDongusu({
  boyut = "baslik",
  className = "",
}: KurumLogoDongusuProps) {
  const [asamasi, setAsamasi] = useState<"video" | "logo">("video");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const logoZamanlayiciRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stil = BOYUTLAR[boyut];

  useEffect(() => {
    return () => {
      if (logoZamanlayiciRef.current) {
        clearTimeout(logoZamanlayiciRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (asamasi !== "video") return;

    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    const oynat = video.play();
    if (oynat) {
      void oynat.catch(() => {
        // Tarayıcı otomatik oynatmayı engellerse logoya düş
        setAsamasi("logo");
      });
    }
  }, [asamasi]);

  function videoBitti() {
    setAsamasi("logo");
    if (logoZamanlayiciRef.current) {
      clearTimeout(logoZamanlayiciRef.current);
    }
    logoZamanlayiciRef.current = setTimeout(() => {
      setAsamasi("video");
      logoZamanlayiciRef.current = null;
    }, LOGO_SURESI_MS);
  }

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full bg-zinc-950 ring-1 ring-zinc-700/80 ${stil.kutu} ${className}`}
      aria-label="T.C. Cumhurbaşkanlığı İletişim Başkanlığı"
    >
      <video
        ref={videoRef}
        className={`absolute inset-0 h-full w-full object-cover ${stil.videoScale} transition-opacity duration-300 ${
          asamasi === "video" ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        src={VIDEO_SRC}
        muted
        playsInline
        preload="auto"
        onEnded={videoBitti}
      />

      <Image
        src={LOGO_SRC}
        alt="T.C. Cumhurbaşkanlığı İletişim Başkanlığı"
        width={112}
        height={112}
        priority
        unoptimized
        className={`absolute inset-0 h-full w-full object-contain p-1.5 transition-opacity duration-300 ${
          asamasi === "logo" ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
    </div>
  );
}
