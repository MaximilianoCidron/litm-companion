import { redirect } from "next/navigation";
import { verifySessionCookie } from "@/shared/firebase/session";

export default async function RootPage() {
  const claims = await verifySessionCookie();
  redirect(claims ? "/dashboard" : "/login");
}
