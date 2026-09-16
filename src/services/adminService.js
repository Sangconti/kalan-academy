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
      orange_money_id,
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
// ACTIVER / DÉSACTIVER
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


// ==========================
// MODIFIER PREMIUM
// ==========================

export async function updateUserPremium(
  userId,
  isPremium
) {
  if (!userId) {
    throw new Error(
      "Identifiant utilisateur manquant."
    );
  }


  const {
    error
  } = await supabase
    .from("profiles")
    .update({
      is_premium: Boolean(isPremium)
    })
    .eq(
      "id",
      userId
    );


  if (error) {
    console.error(
      "Erreur modification Premium :",
      error
    );

    throw error;
  }


  return true;
}


// ==========================
// MODIFIER LA CLASSE
// ==========================

export async function updateUserClass(
  userId,
  classId
) {
  if (!userId) {
    throw new Error(
      "Identifiant utilisateur manquant."
    );
  }


  const {
    error
  } = await supabase
    .from("profiles")
    .update({
      class_id: classId || null
    })
    .eq(
      "id",
      userId
    );


  if (error) {
    console.error(
      "Erreur modification classe :",
      error
    );

    throw error;
  }


  return true;
}


// ==========================
// MODIFIER ORANGE MONEY
// ==========================

export async function updateUserOrangeMoney(
  userId,
  orangeMoneyId
) {
  if (!userId) {
    throw new Error(
      "Identifiant utilisateur manquant."
    );
  }


  const {
    error
  } = await supabase
    .from("profiles")
    .update({
      orange_money_id:
        orangeMoneyId?.trim() || null
    })
    .eq(
      "id",
      userId
    );


  if (error) {
    console.error(
      "Erreur modification Orange Money :",
      error
    );

    throw error;
  }


  return true;
}


// ==========================
// RÉINITIALISER LA PROGRESSION
// ==========================

export async function resetUserProgress(
  userId
) {
  if (!userId) {
    throw new Error(
      "Identifiant élève manquant."
    );
  }


  const {
    data,
    error
  } = await supabase.rpc(
    "reset_user_progress",
    {
      p_user_id: userId
    }
  );


  if (error) {
    console.error(
      "Erreur RPC reset_user_progress :",
      error
    );

    throw error;
  }


  if (!data?.success) {
    throw new Error(
      data?.message ||
      "La réinitialisation de la progression a échoué."
    );
  }


  return data;
}


// ==========================
// EMAIL ADMIN DE L'ÉLÈVE
// ==========================

export async function getAdminStudentEmail(
  userId
) {
  if (!userId) {
    throw new Error(
      "Identifiant élève manquant."
    );
  }


  const {
    data,
    error
  } = await supabase.rpc(
    "get_admin_student_email",
    {
      p_user_id: userId
    }
  );


  if (error) {
    console.error(
      "Erreur RPC get_admin_student_email :",
      error
    );

    throw error;
  }


  if (!data?.success) {
    throw new Error(
      data?.message ||
      "Impossible de récupérer l'adresse email."
    );
  }


  return data.email || null;
}


// ==========================
// SUPPRIMER UN UTILISATEUR
// ==========================

export async function deleteAdminUser(
  userId
) {
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


// ==========================
// VUE ADMIN D'UN ÉLÈVE
// ==========================

export async function getAdminStudentView(
  studentId
) {
  if (!studentId) {
    throw new Error(
      "Identifiant élève manquant."
    );
  }


  const [
    profileResult,
    progressResult,
    attemptsResult,
    badgesResult,
    deviceResult,
    lessonsResult,
    emailResult
  ] = await Promise.all([

    // -----------------------------------------
    // PROFIL
    // -----------------------------------------

    supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        avatar_url,
        role,
        access_status,
        class_id,
        is_premium,
        orange_money_id,
        xp,
        level,
        created_at,
        classes(
          id,
          name
        )
      `)
      .eq(
        "id",
        studentId
      )
      .single(),


    // -----------------------------------------
    // PROGRESSION ÉLÈVE
    // -----------------------------------------

    supabase
      .from("user_progress")
      .select(`
        lesson_id,
        completed
      `)
      .eq(
        "user_id",
        studentId
      ),


    // -----------------------------------------
    // QUIZ
    // -----------------------------------------

    supabase
      .from("quiz_attempts")
      .select(`
        score
      `)
      .eq(
        "user_id",
        studentId
      ),


    // -----------------------------------------
    // BADGES
    // -----------------------------------------

    supabase
      .from("user_badges")
      .select(`
        id,
        badge_id,
        earned_at,
        badges(
          id,
          name,
          description,
          image_url,
          xp_reward
        )
      `)
      .eq(
        "user_id",
        studentId
      ),


    // -----------------------------------------
    // APPAREIL
    // -----------------------------------------

    supabase
      .from("user_devices")
      .select(`
        id,
        device_id,
        device_name,
        platform,
        manufacturer,
        model,
        os_version,
        is_active,
        last_seen_at,
        created_at,
        updated_at
      `)
      .eq(
        "user_id",
        studentId
      )
      .maybeSingle(),


    // -----------------------------------------
    // TOUTES LES LEÇONS
    // -----------------------------------------

    supabase
      .from("lessons")
      .select(`
        id,
        subject_id,
        subjects(
          id,
          name
        )
      `),


    // -----------------------------------------
    // EMAIL
    // -----------------------------------------

    supabase.rpc(
      "get_admin_student_email",
      {
        p_user_id: studentId
      }
    )

  ]);


  // -----------------------------------------
  // PROFIL
  // -----------------------------------------

  if (profileResult.error) {
    console.error(
      "❌ [ADMIN STUDENT] Erreur profil :",
      profileResult.error
    );

    throw profileResult.error;
  }


  if (!profileResult.data) {
    throw new Error(
      "Élève introuvable."
    );
  }


  // -----------------------------------------
  // EMAIL
  // -----------------------------------------

  let email = null;


  if (emailResult.error) {
    console.error(
      "❌ [ADMIN STUDENT] Erreur email :",
      emailResult.error
    );
  } else if (
    emailResult.data?.success
  ) {
    email =
      emailResult.data.email || null;
  }


  // -----------------------------------------
  // APPAREIL
  // -----------------------------------------

  if (deviceResult.error) {
    console.error(
      "❌ [ADMIN STUDENT] Erreur appareil :",
      deviceResult.error
    );
  }


  const deviceData =
    deviceResult.data || null;


  // -----------------------------------------
  // PROGRESSION
  // -----------------------------------------

  if (progressResult.error) {
    console.error(
      "❌ [ADMIN STUDENT] Erreur progression :",
      progressResult.error
    );
  }


  const progressData =
    progressResult.data || [];


  // -----------------------------------------
  // TOUTES LES LEÇONS
  // -----------------------------------------

  if (lessonsResult.error) {
    console.error(
      "❌ [ADMIN STUDENT] Erreur leçons :",
      lessonsResult.error
    );
  }


  const lessonsData =
    lessonsResult.data || [];


  // -----------------------------------------
  // LEÇONS TERMINÉES
  // -----------------------------------------

  const completedLessons =
    progressData.reduce(
      (total, item) =>

        total +
        (
          item?.completed === true
            ? 1
            : 0
        ),

      0
    );


  // -----------------------------------------
  // LEÇONS TERMINÉES PAR ID
  // -----------------------------------------

  const completedLessonIds =
    new Set(
      progressData
        .filter(
          item =>
            item?.completed === true &&
            item?.lesson_id
        )
        .map(
          item => item.lesson_id
        )
    );


  // -----------------------------------------
  // PROGRESSION PAR MATIÈRE
  // -----------------------------------------

  const subjectsProgress = {};


  for (const lesson of lessonsData) {

    const subject =
      lesson?.subjects;


    if (!subject?.id) {
      continue;
    }


    const subjectId =
      subject.id;


    const subjectName =
      subject.name ||
      "Matière inconnue";


    if (!subjectsProgress[subjectId]) {

      subjectsProgress[subjectId] = {
        id: subjectId,
        name: subjectName,
        total: 0,
        completed: 0,
        percent: 0
      };

    }


    subjectsProgress[subjectId].total += 1;


    if (
      completedLessonIds.has(
        lesson.id
      )
    ) {

      subjectsProgress[
        subjectId
      ].completed += 1;

    }

  }


  // -----------------------------------------
  // CALCUL DES POURCENTAGES
  // -----------------------------------------

  Object.values(
    subjectsProgress
  ).forEach(subject => {

    if (subject.total > 0) {

      subject.percent =
        Math.round(
          (
            subject.completed /
            subject.total
          ) * 100
        );

    } else {

      subject.percent = 0;

    }

  });


  // -----------------------------------------
  // QUIZ
  // -----------------------------------------

  if (attemptsResult.error) {
    console.error(
      "❌ [ADMIN STUDENT] Erreur quiz :",
      attemptsResult.error
    );
  }


  const attemptsData =
    attemptsResult.data || [];


  let averageScore = 0;


  if (attemptsData.length > 0) {

    const totalScore =
      attemptsData.reduce(
        (total, attempt) =>

          total +
          Number(
            attempt?.score || 0
          ),

        0
      );


    averageScore =
      Math.round(
        totalScore /
        attemptsData.length
      );

  }


  // -----------------------------------------
  // BADGES
  // -----------------------------------------

  if (badgesResult.error) {
    console.error(
      "❌ [ADMIN STUDENT] Erreur badges :",
      badgesResult.error
    );
  }


  const badges =
    badgesResult.data || [];


  // -----------------------------------------
  // RÉSULTAT FINAL
  // -----------------------------------------

  return {

    profile: {
      ...profileResult.data,
      email
    },

    device:
      deviceData,

    subjects:
      subjectsProgress,

    stats: {

      lessons:
        completedLessons,

      score:
        averageScore,

      badges:
        badges.length,

      attempts:
        attemptsData.length

    },

    badges

  };
}