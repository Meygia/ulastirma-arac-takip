import { redirect } from "next/navigation";
import { mevcutKullanici } from "@/app/actions/auth-actions";
import { GirisSayfaIcerik } from "@/app/giris/giris-formu";

export default async function GirisPage() {
  const kullanici = await mevcutKullanici();
  if (kullanici) redirect("/");

  return <GirisSayfaIcerik />;
}
