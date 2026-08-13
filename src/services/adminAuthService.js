import { supabase } from "../lib/supabase";

export async function getCurrentAdmin() {
  console.log("🔐 [ADMIN AUTH] getCurrentAdmin()");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log("👤 [ADMIN AUTH] user =", user);
  console.log("❌ [ADMIN AUTH] userError =", userError);

  if (!user) {
    console.log("🚫 [ADMIN AUTH] Aucun utilisateur connecté");
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();

  console.log("📋 [ADMIN AUTH] profile =", profile);
  console.log("❌ [ADMIN AUTH] profile error =", error);

  if (error || !profile) {
    console.log("🚫 [ADMIN AUTH] Profil introuvable");
    return null;
  }

  console.log("🎭 [ADMIN AUTH] role =", profile.role);

  if (!["admin", "super_admin"].includes(profile.role)) {
    console.log("🚫 [ADMIN AUTH] Rôle refusé :", profile.role);
    return null;
  }

  console.log("✅ [ADMIN AUTH] ADMIN VALIDÉ");

  return {
    user,
    profile,
  };
}