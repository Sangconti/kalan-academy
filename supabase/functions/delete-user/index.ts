import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

export default {
  fetch: withSupabase(
    { auth: "user" },
    async (req, ctx) => {
      try {
        // =====================================================
        // 1. RÉCUPÉRER L'UTILISATEUR CONNECTÉ
        // =====================================================

        const {
          data: { user: currentUser },
          error: userError,
        } = await ctx.supabase.auth.getUser();

        if (userError || !currentUser) {
          console.error(
            "Utilisateur non authentifié :",
            userError?.message ?? "Utilisateur absent"
          );

          return Response.json(
            {
              error: "Utilisateur non authentifié.",
            },
            { status: 401 }
          );
        }

        const currentUserId = currentUser.id;

        // =====================================================
        // 2. VÉRIFIER LE PROFIL DE L'ADMIN CONNECTÉ
        // =====================================================

        const {
          data: currentProfile,
          error: currentProfileError,
        } = await ctx.supabaseAdmin
          .from("profiles")
          .select("id, role")
          .eq("id", currentUserId)
          .maybeSingle();

        if (currentProfileError) {
          console.error(
            "Erreur récupération profil admin :",
            currentProfileError
          );

          return Response.json(
            {
              error:
                "Impossible de vérifier les droits administrateur.",
            },
            { status: 500 }
          );
        }

        if (!currentProfile) {
          return Response.json(
            {
              error: "Profil administrateur introuvable.",
            },
            { status: 403 }
          );
        }

        // =====================================================
        // 3. VÉRIFIER LE RÔLE ADMIN
        // =====================================================

        const isAdmin = ["admin", "super_admin"].includes(
          currentProfile.role
        );

        if (!isAdmin) {
          return Response.json(
            {
              error:
                "Accès refusé. Droits administrateur requis.",
            },
            { status: 403 }
          );
        }

        // =====================================================
        // 4. RÉCUPÉRER L'UTILISATEUR À SUPPRIMER
        // =====================================================

        let body;

        try {
          body = await req.json();
        } catch {
          return Response.json(
            {
              error: "Corps de requête JSON invalide.",
            },
            { status: 400 }
          );
        }

        const targetUserId = body?.userId;

        if (
          typeof targetUserId !== "string" ||
          !targetUserId.trim()
        ) {
          return Response.json(
            {
              error: "userId est obligatoire.",
            },
            { status: 400 }
          );
        }

        // =====================================================
        // 5. INTERDIRE L'AUTO-SUPPRESSION
        // =====================================================

        if (targetUserId === currentUserId) {
          return Response.json(
            {
              error:
                "Vous ne pouvez pas supprimer votre propre compte.",
            },
            { status: 403 }
          );
        }

        // =====================================================
        // 6. RÉCUPÉRER LE PROFIL DE LA CIBLE
        // =====================================================

        const {
          data: targetProfile,
          error: targetProfileError,
        } = await ctx.supabaseAdmin
          .from("profiles")
          .select("id, role, full_name")
          .eq("id", targetUserId)
          .maybeSingle();

        if (targetProfileError) {
          console.error(
            "Erreur récupération profil cible :",
            targetProfileError
          );

          return Response.json(
            {
              error:
                "Impossible de récupérer l'utilisateur à supprimer.",
            },
            { status: 500 }
          );
        }

        if (!targetProfile) {
          return Response.json(
            {
              error: "Utilisateur introuvable.",
            },
            { status: 404 }
          );
        }

        // =====================================================
        // 7. PROTECTION DES SUPER ADMINS
        // =====================================================

        if (
          targetProfile.role === "super_admin" &&
          currentProfile.role !== "super_admin"
        ) {
          return Response.json(
            {
              error:
                "Un administrateur ne peut pas supprimer un super administrateur.",
            },
            { status: 403 }
          );
        }

        // =====================================================
        // 8. SUPPRESSION DU COMPTE AUTH
        // =====================================================

        const { error: deleteError } =
          await ctx.supabaseAdmin.auth.admin.deleteUser(
            targetUserId
          );

        if (deleteError) {
          console.error(
            "Erreur suppression utilisateur Auth :",
            deleteError
          );

          return Response.json(
            {
              error:
                "Impossible de supprimer le compte utilisateur.",
              details: deleteError.message,
            },
            { status: 500 }
          );
        }

        // =====================================================
        // 9. ENREGISTRER L'ACTIVITÉ ADMIN
        // =====================================================

        const { error: activityError } =
          await ctx.supabaseAdmin.rpc(
            "log_admin_activity",
            {
              p_action: "user_deleted",
              p_target_user_id: null,
              p_details: {
                target_user_id: targetUserId,
                target_user_name:
                  targetProfile.full_name || null,
              },
            }
          );

        if (activityError) {
          console.error(
            "⚠️ Suppression réussie mais erreur journal admin :",
            activityError
          );
        }

        // =====================================================
        // 10. SUCCÈS
        // =====================================================

        return Response.json({
          success: true,
          message: "Utilisateur supprimé avec succès.",
          userId: targetUserId,
        });
      } catch (error) {
        console.error(
          "Erreur inattendue delete-user :",
          error
        );

        return Response.json(
          {
            error: "Erreur interne du serveur.",
            details:
              error instanceof Error
                ? error.message
                : String(error),
          },
          { status: 500 }
        );
      }
    }
  ),
};