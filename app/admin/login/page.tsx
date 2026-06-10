import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/admin-auth";
import AdminLogin from "@/components/AdminLogin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Connexion admin — Soir de Match",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  if (isAuthenticated()) redirect("/admin");
  return <AdminLogin />;
}
