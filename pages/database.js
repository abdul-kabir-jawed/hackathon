
/* ========================================
   DATABASE CONFIGURATION & AUTH FUNCTIONS
   ======================================== */

const supabase = window.supabase.createClient("https://tvhiclvilogrqypftvhc.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aGljbHZpbG9ncnF5cGZ0dmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNzc5NDAsImV4cCI6MjA3NzY1Mzk0MH0.ojWP8BnW6RRQnu4y_bSJBLy7k6MWxQxlZJr7WzkwJ44")

/* ========================================
   AUTHENTICATION FUNCTIONS
   ======================================== */

/**
 * Sign in an existing user
 */
export async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error("Sign in error:", error);
            return { error, data: null };
        }

        console.log("User signed in:", data.user);

        const currentUserCheck = await checkRegisteredUser(data.user.id);

        if (!currentUserCheck.exists) {
            await createUserRecord(
                data.user.user_metadata.first_name,
                data.user.user_metadata.last_name,
                data.user.user_metadata.email
            );
            console.log("New user record created.");
        } else {
            console.log("User already exists, skipping record creation.");
        }

        return { error: null, data };
    } catch (err) {
        console.error("Sign in exception:", err);
        return { error: err, data: null };
    }
}


/**
 * Sign up a new user
 */
export async function signUp(email, password, firstName, lastName) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                }
            }
        })
        if (error) {
            console.error('Sign up error:', error)
            return { error, data: null }
        }
        return { error: null, data }
    } catch (err) {
        console.error('Sign up exception:', err)
        return { error: err, data: null }
    }
}

/**
 * Sign out the current user
 */
export async function signOut() {
    try {
        const { error } = await supabase.auth.signOut()
        if (error) {
            console.error('Sign out error:', error)
            return { error, success: false }
        }
        return { error: null, success: true }
    } catch (err) {
        console.error('Sign out exception:', err)
        return { error: err, success: false }
    }
}

/**
 * Get the current session
 */
export async function session() {
    try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
            console.error('Get session error:', error)
            return { error, data: null }
        }
        return { error: null, data }
    } catch (err) {
        console.error('Get session exception:', err)
        return { error: err, data: null }
    }
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) {
            console.error('Get user error:', error)
            return { error, user: null }
        }
        return { error: null, user }
    } catch (err) {
        console.error('Get user exception:', err)
        return { error: err, user: null }
    }
}

/* ========================================
   APPOINTMENTS TABLE FUNCTIONS
   ======================================== */

/**
 * Read all appointments for the current user
 * RLS automatically filters to only show the logged-in user's appointments
 */
export async function readAppointments() {
    try {
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Read appointments error:', error)
            return { error, data: null }
        }
        return { error: null, data }
    } catch (err) {
        console.error('Read appointments exception:', err)
        return { error: err, data: null }
    }
}

async function checkRegisteredUser(userId) {
    try {
        const { data, error } = await supabase
            .from("appointments")
            .select("user_id")
            .eq("user_id", userId); // ✅ only check this one user

        if (error) {
            console.error("Read users error:", error);
            return { exists: false, data: null, error };
        }

        const exists = data && data.length > 0;
        return { exists, data, error: null };
    } catch (err) {
        console.error("Read users exception:", err);
        return { exists: false, data: null, error: err };
    }
}


/**
 * Create a new reecord for the  user
 * Automatically sets user_id from the authenticated session (required for RLS)
 */
async function createUserRecord(firstName, lastName, email, appointments = []) {
    try {
        // Get current user - required for RLS
        const { user, error: userError } = await getCurrentUser()
        if (userError || !user) {
            return { error: { message: 'User must be authenticated to create appointments' }, data: null }
        }

        const { data, error } = await supabase
            .from('appointments')
            .insert({
                user_id: user.id,  
                first_name: firstName,
                last_name: lastName,
                email: email,
                appointments: appointments
            })
            .select()

        if (error) {
            console.error('Create appointment error:', error)
            return { error, data: null }
        }
        return { error: null, data }
    } catch (err) {
        console.error('Create appointment exception:', err)
        return { error: err, data: null }
    }
}

/**
 * Add appointments to existing record or create new one
 */
export async function addAppointments(newAppointment) {
  try {
    const { user, error: userError } = await getCurrentUser();
    if (userError || !user) {
      return { error: { message: 'User must be authenticated' }, data: null };
    }

    const { data: existing, error: readError } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (readError && readError.code !== 'PGRST116') {
      return { error: readError, data: null };
    }

    if (existing) {
      const updatedAppointments = Array.isArray(existing.appointments)
        ? [...existing.appointments, newAppointment] 
        : [newAppointment]; 

      const { data, error: updateError } = await supabase
        .from('appointments')
        .update({ appointments: updatedAppointments })
        .eq('user_id', user.id)
        .select();

      if (updateError) {
        console.error('Update appointment error:', updateError);
        return { error: updateError, data: null };
      }

      return { error: null, data };
    }
  } catch (err) {
    console.error('Add appointments exception:', err);
    return { error: err, data: null };
  }
}


/**
 * Update an appointments row by its id
 */
async function updateAppointment(appointmentId, fields) {
    try {
        const { data, error } = await supabase
            .from('appointments')
            .update(fields)
            .eq('id', appointmentId)
            .select();

        if (error) {
            console.error('Update appointment error:', error)
            return { error, data: null }
        }
        return { error: null, data }
    } catch (err) {
        console.error('Update appointment exception:', err)
        return { error: err, data: null }
    }
}

/**
 * Remove a specific appointment from the appointments array
 */
export async function removeAppointmentFromArray(appointmentId, appointmentIndex) {
    try {
        // Get current appointment record
        const { data: appointment, error: readError } = await supabase
            .from('appointments')
            .select('*')
            .eq('id', appointmentId)
            .single()

        if (readError) {
            return { error: readError, data: null }
        }

        // Remove the appointment at the specified index
        const updatedAppointments = [...(appointment.appointments || [])]
        updatedAppointments.splice(appointmentIndex, 1)

        // Update the record
        return updateAppointment(appointmentId, {
            appointments: updatedAppointments
        })
    } catch (err) {
        console.error('Remove appointment from array exception:', err)
        return { error: err, data: null }
    }
}



/* ========================================
   DOCTORS TABLE FUNCTIONS
   ======================================== */

/**
 * Get all doctors
 * This table has RLS disabled, so all users can view doctors
 */
export async function getAllDoctors() {
    try {
        const { data, error } = await supabase
            .from('doctors')
            .select('*')
            .order('name', { ascending: true })

        if (error) {
            console.error('Get doctors error:', error)
            return { error, data: null }
        }
        return { error: null, data }
    } catch (err) {
        console.error('Get doctors exception:', err)
        return { error: err, data: null }
    }
}

/**
 * Get a doctor by ID
 */



