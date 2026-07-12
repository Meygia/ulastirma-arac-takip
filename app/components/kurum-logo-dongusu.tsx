"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const VIDEO_SRC = "/intro.mp4";
const LOGO_SRC = "/iletisim-baskanligi-amblem.png";
const LOGO_SURESI_MS = 15_000;

type Boyut = "giris" | "baslik";

/** Aynı daire kutusu — video ve logo birebir aynı boyutta */
const BOYUTLAR: Record<Boyut, string> = {
  giris: "h-28 w-28 md:h-32 md:w-32",
  baslik: "h-20 w-20 md:h-24 md:w-24",
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
  const kutu = BOYUTLAR[boyut];

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
      className={`relative aspect-square shrink-0 overflow-hidden rounded-full bg-zinc-950 ${kutu} ${className}`}
      style={{
        clipPath: "circle(50% at 50% 50%)",
        WebkitClipPath: "circle(50% at 50% 50%)",
      }}
      aria-label="T.C. Cumhurbaşkanlığı İletişim Başkanlığı"
    >
      {/* Lastik dışını kırp: güçlü yakınlaştırma + daire maske */}
      <video
        ref={videoRef}
        className={`absolute left-1/2 top-1/2 h-full w-full max-w-none object-cover transition-opacity duration-300 ${
          asamasi === "video" ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        style={{
          transform: "translate(-50%, -50%) scale(1.85)",
          transformOrigin: "center center",
        }}
        src={VIDEO_SRC}
        muted
        playsInline
        preload="auto"
        onEnded={videoBitti}
      />

      <Image
        src={LOGO_SRC}
        alt="T.C. Cumhurbaşkanlığı İletişim Başkanlığı"
        width={128}
        height={128}
        priority
        unoptimized
        className={`absolute inset-0 h-full w-full object-contain p-[6%] transition-opacity duration-300 ${
          asamasi === "logo" ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
    </div>
  );
}
