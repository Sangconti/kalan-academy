import { supabase } from "../lib/supabase";


// ==========================
// DASHBOARD STATISTIQUES
// ==========================

export async function getAdminStats() {

  const [

    students,
    premium,
    classes,
    subjects,
    lessons,
    quizzes,
    xp

  ] = await Promise.all([


    supabase
      .from("profiles")
      .select("*", {
        count: "exact",
        head: true
      })
      .eq("role", "student"),


    supabase
      .from("profiles")
      .select("*", {
        count: "exact",
        head: true
      })
      .eq("is_premium", true),


    supabase
      .from("classes")
      .select("*", {
        count: "exact",
        head: true
      }),


    supabase
      .from("subjects")
      .select("*", {
        count: "exact",
        head: true
      }),


    supabase
      .from("lessons")
      .select("*", {
        count: "exact",
        head: true
      }),


    supabase
      .from("quizzes")
      .select("*", {
        count: "exact",
        head: true
      }),


    supabase
      .from("profiles")
      .select("xp")

  ]);


  const responses = [

    {
      name: "students",
      response: students
    },

    {
      name: "premium",
      response: premium
    },

    {
      name: "classes",
      response: classes
    },

    {
      name: "subjects",
      response: subjects
    },

    {
      name: "lessons",
      response: lessons
    },

    {
      name: "quizzes",
      response: quizzes
    },

    {
      name: "xp",
      response: xp
    }

  ];


  const failedRequest = responses.find(
    item => item.response.error
  );


  if (failedRequest) {

    console.error(
      `Erreur statistiques ${failedRequest.name}:`,
      failedRequest.response.error
    );

    throw failedRequest.response.error;

  }


  const totalXP =
    xp.data?.reduce(
      (sum, user) => {

        return sum + (
          Number(user.xp) || 0
        );

      },
      0
    ) || 0;


  return {

    students:
      students.count || 0,

    premium:
      premium.count || 0,

    classes:
      classes.count || 0,

    subjects:
      subjects.count || 0,

    lessons:
      lessons.count || 0,

    quizzes:
      quizzes.count || 0,

    totalXP

  };

}


// ==========================
// UTILISATEURS ADMIN
// ==========================

export async function getAdminUsers() {

  const {
    data,
    error
  } = await supabase

    .from("profiles")

    .select(`
      id,
      full_name,
      avatar_url,
      role,
      access_status,
      class_id,
      is_premium,
      xp,
      level,
      created_at
    `)

    .order(
      "created_at",
      {
        ascending: false
      }
    );


  if (error) {

    throw error;

  }


  return data || [];

}


// ==========================
// MODIFIER LE RÔLE
// ==========================

export async function updateUserRole(
  userId,
  role
) {

  const {
    error
  } = await supabase

    .from("profiles")

    .update({
      role
    })

    .eq(
      "id",
      userId
    );


  if (error) {

    throw error;

  }


  return true;

}

// ==========================
// ACTIVER / DÉSACTIVER UN UTILISATEUR
// ==========================

export async function updateUserAccess(
  userId,
  accessStatus
) {

  const {
    error
  } = await supabase

    .from("profiles")

    .update({
      access_status: accessStatus
    })

    .eq(
      "id",
      userId
    );

  if (error) {
    throw error;
  }

  return true;
}


// ==========================
// MODIFIER L'ACCÈS UTILISATEUR
// ==========================

export async function updateUserAccessStatus(
  userId,
  accessStatus
) {
  const {
    error
  } = await supabase
    .from("profiles")
    .update({
      access_status: accessStatus
    })
    .eq(
      "id",
      userId
    );

  if (error) {
    console.error(
      "Erreur modification access_status :",
      error
    );

    throw error;
  }

  return true;
}

export async function deleteAdminUser(userId) {

  const {
    data,
    error
  } = await supabase.functions.invoke(
    "delete-user",
    {
      body: {
        userId
      }
    }
  );

  if (error) {

    console.error(
      "❌ Erreur Edge Function :",
      error
    );

    console.error(
      "❌ Type erreur :",
      error?.constructor?.name
    );

    console.error(
      "❌ Message :",
      error?.message
    );

    // Lire la vraie réponse JSON de l'Edge Function
    if (error.context) {

      try {

        const details =
          await error.context.json();

        console.error(
          "🔥 RÉPONSE DELETE-USER :",
          details
        );

        throw new Error(
          details?.error ||
          details?.message ||
          "Erreur lors de la suppression."
        );

      } catch (readError) {

        // Si readError est notre propre erreur,
        // on la remonte directement.
        if (
          readError instanceof Error &&
          readError.message
        ) {
          throw readError;
        }

        console.error(
          "Impossible de lire la réponse Edge Function :",
          readError
        );

      }

    }

    throw error;
  }

  if (!data?.success) {

    throw new Error(
      data?.error ||
      "La suppression n'a pas été confirmée."
    );

  }

  return true;
}


// ==========================
// CLASSES
// ==========================

export async function getAdminClasses() {

  const {
    data,
    error
  } = await supabase

    .from("classes")

    .select("*")

    .order(
      "order_number",
      {
        ascending: true
      }
    );


  if (error) {

    throw error;

  }


  return data || [];

}


// ==========================
// CRÉER UNE CLASSE
// ==========================

export async function createClass(
  classData
) {

  const {
    data,
    error
  } = await supabase

    .from("classes")

    .insert(classData)

    .select()

    .single();


  if (error) {

    throw error;

  }


  return data;

}


// ==========================
// MODIFIER UNE CLASSE
// ==========================

export async function updateClass(
  id,
  classData
) {

  const {
    error
  } = await supabase

    .from("classes")

    .update(classData)

    .eq(
      "id",
      id
    );


  if (error) {

    throw error;

  }


  return true;

}


// ==========================
// SUPPRIMER UNE CLASSE
// ==========================

export async function deleteClass(
  id
) {

  const {
    error
  } = await supabase

    .from("classes")

    .delete()

    .eq(
      "id",
      id
    );


  if (error) {

    throw error;

  }


  return true;

}