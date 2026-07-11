"use client";

type HataProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Hata({ error, reset }: HataProps) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <h2 className="text-lg text-zinc-100">Bir şeyler ters gitti</h2>
      <p className="mt-2 text-sm text-zinc-400">
        {error.message || "Sayfa yüklenirken beklenmeyen bir hata oluştu."}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-lg bg-zinc-100 px-4 py-2 text-sm text-zinc-900 hover:bg-zinc-200"
      >
        Tekrar dene
      </button>
    </div>
  );
}
