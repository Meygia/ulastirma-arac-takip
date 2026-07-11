import AracYonetimPanel from "@/app/components/arac-yonetim-panel";
import SiteBaslik from "@/app/components/site-baslik";

export default function AracYonetimiPage() {
  return (
    <div className="min-h-full bg-zinc-950">
      <SiteBaslik aktif="yonetim" />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <AracYonetimPanel />
      </main>
    </div>
  );
}
