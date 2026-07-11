import { markaLogoYolu } from "@/app/lib/arac-grupla";

type MarkaLogosuProps = {
  marka: string;
  aktif?: boolean;
};

export default function MarkaLogosu({ marka, aktif = false }: MarkaLogosuProps) {
  const logoYolu = markaLogoYolu(marka);

  if (!logoYolu) {
    return null;
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center ${
        aktif ? "rounded bg-zinc-900 px-1 py-0.5" : ""
      }`}
      aria-hidden
    >
      <img
        src={logoYolu}
        alt=""
        className={`h-[1.125em] w-auto object-contain ${
          aktif ? "opacity-100" : "opacity-90 mix-blend-screen"
        }`}
        draggable={false}
      />
    </span>
  );
}
