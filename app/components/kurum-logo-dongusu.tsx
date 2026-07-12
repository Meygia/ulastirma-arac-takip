"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/** Cache bust — kırpılmış jant videosu */
const VIDEO_SRC = "/intro.mp4?v=6";
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
      <div className="absolute inset-0 overflow-hidden rounded-full">
        <video
          ref={videoRef}
          className={`h-full w-full object-cover object-center transition-opacity duration-300 ${
            asamasi === "video" ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          src={VIDEO_SRC}
          muted
          playsInline
          preload="auto"
          onEnded={videoBitti}
        />
      </div>

      <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full p-[6%]">
        <Image
          src={LOGO_SRC}
          alt="T.C. Cumhurbaşkanlığı İletişim Başkanlığı"
          width={128}
          height={128}
          priority
          unoptimized
          className={`h-full w-full object-contain transition-opacity duration-300 ${
            asamasi === "logo" ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        />
      </div>
    </div>
  );
}
