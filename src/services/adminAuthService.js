import { supabase } from "../lib/supabase";

export async function getCurrentAdmin() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();

  if (error || !profile) return null;

  if (!["admin", "super_admin"].includes(profile.role)) {
    return null;
  }

  return {
    user,
    profile,
  };
}