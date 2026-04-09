import { supabase } from '../config/supabase.js';
import { uploadFile } from './storageService.js';

/**
 * Sign up a new user with email and password
 */
export async function signUp(email, password, userData) {
    try {
        // 1. Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role: userData.role,
                    fullName: userData.fullName || `${userData.firstName || ''} ${userData.surname || ''}`.trim(),
                    mobileNumber: userData.mobileNumber,
                },
            },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('User creation failed');

        const userId = authData.user.id;

        // 2. Create profile based on role
        if (userData.role === 'patient') {
            const { error: patientError } = await supabase
                .from('patients')
                .insert({
                    user_id: userId,
                    first_name: userData.firstName,
                    surname: userData.surname,
                    age: userData.age,
                    gender: userData.gender,
                    mobile_number: userData.mobileNumber,
                    email: email,
                    address: userData.address,
                });

            if (patientError) throw patientError;
        } else if (userData.role === 'doctor') {
            const { error: doctorError } = await supabase
                .from('doctors')
                .insert({
                    user_id: userId,
                    first_name: userData.firstName,
                    surname: userData.surname,
                    age: userData.age,
                    gender: userData.gender,
                    mobile_number: userData.mobileNumber,
                    email: email,
                    address: userData.address,
                    hospital_name: userData.hospitalName,
                    specialty: userData.specialty,
                    years_of_experience: userData.yearsOfExperience,
                    hospital_location: userData.hospitalLocation,
                    hospital_website: userData.hospitalWebsite,
                    professional_bio: userData.professionalBio,
                    approval_status: 'pending',
                });

            if (doctorError) throw doctorError;
        }

        return {
            success: true,
            user: authData.user,
            session: authData.session,
        };
    } catch (error) {
        console.error('[Auth Service] Signup error:', error);
        return {
            success: false,
            error: error.message,
            details: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)))
        };
    }
}

/**
 * Sign in with email or mobile and password
 */
// Register a new doctor with documents

/**
 * Register a new doctor with documents
 */
export async function registerDoctor(email, password, doctorData, files) {
    try {
        // 1. Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role: 'doctor',
                },
            },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('User creation failed');

        const userId = authData.user.id;

        // 2. Upload documents
        const documentUrls = {};
        if (files) {
            if (files.medicalLicense) {
                documentUrls.medical_license_url = await uploadFile(
                    files.medicalLicense[0],
                    'doctor-documents',
                    userId
                );
            }
            if (files.degree) {
                documentUrls.degree_url = await uploadFile(
                    files.degree[0],
                    'doctor-documents',
                    userId
                );
            }
        }

        // 3. Create doctor profile
        const { error: doctorError } = await supabase
            .from('doctors')
            .insert({
                user_id: userId,
                first_name: doctorData.firstName,
                surname: doctorData.surname,
                age: doctorData.age,
                gender: doctorData.gender,
                mobile_number: doctorData.mobileNumber,
                email: email,
                address: doctorData.address,
                hospital_name: doctorData.hospitalName,
                specialty: doctorData.specialty,
                years_of_experience: doctorData.yearsOfExperience,
                hospital_location: doctorData.hospitalLocation,
                hospital_website: doctorData.hospitalWebsite,
                professional_bio: doctorData.professionalBio,
                approval_status: 'pending', // Default status
                ...documentUrls
            });

        if (doctorError) {
            // Cleanup: Delete auth user if profile creation fails? 
            // For now, just throw error.
            throw doctorError;
        }

        // 4. Record document metadata in separate table if needed, 
        // or just rely on columns in doctors table.
        // For strict requirement "Accept multipart/form-data... Upload to Storage",
        // we have done that.

        return {
            success: true,
            user: authData.user,
            session: authData.session,
        };
    } catch (error) {
        console.error('[Auth Service] Doctor Registration error:', error);
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Sign in with email or mobile and password
 */
export async function signIn(emailOrMobile, password) {
    try {
        // Check if input is email or mobile
        const isEmail = emailOrMobile.includes('@');
        let email = emailOrMobile;

        // If mobile number provided, find email from database
        if (!isEmail) {
            // Try patients table first
            let { data: patientData } = await supabase
                .from('patients')
                .select('email')
                .eq('mobile_number', emailOrMobile)
                .single();

            if (patientData) {
                email = patientData.email;
            } else {
                // Try doctors table
                let { data: doctorData } = await supabase
                    .from('doctors')
                    .select('email')
                    .eq('mobile_number', emailOrMobile)
                    .single();

                if (doctorData) {
                    email = doctorData.email;
                } else {
                    throw new Error('No account found with this mobile number');
                }
            }
        }

        // Sign in with email
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        // Get user role and profile
        const userProfile = await getUserProfile(data.user.id);

        // Check verification status for doctors
        if (userProfile.role === 'doctor') {
            if (userProfile.approval_status === 'rejected') {
                await supabase.auth.signOut();
                return {
                    success: false,
                    error: 'Account application rejected',
                    status: 403
                };
            }
            if (userProfile.approval_status === 'pending') {
                // Allow login but indicate pending status
                // The frontend should handle this by showing "Under Review" screen
                return {
                    success: true,
                    user: data.user,
                    session: data.session,
                    profile: userProfile,
                    verificationStatus: 'PENDING'
                };
            }
        }

        return {
            success: true,
            user: data.user,
            session: data.session,
            profile: userProfile,
            verificationStatus: userProfile.approval_status === 'approved' ? 'VERIFIED' : null
        };
    } catch (error) {
        console.error('[Auth Service] Signin error:', error);
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Sign out current user
 */
export async function signOut() {
    try {
        // Backend doesn't need to sign out if we are using stateless JWT tokens
        // For a true sign out that revokes the token, it would require tracking token blacklists
        // The client simply clears the token from its storage.
        return { success: true };
    } catch (error) {
        console.error('[Auth Service] Signout error:', error);
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(token) {
    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error) throw error;
        if (!user) return { success: false, error: 'Not authenticated' };

        const userProfile = await getUserProfile(user.id);

        return {
            success: true,
            user,
            profile: userProfile,
        };
    } catch (error) {
        console.error('[Auth Service] Get user error:', error);
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Get user profile with role-specific data
 */
export async function getUserProfile(userId) {
    try {
        // Get role from users_profiles
        const { data: profileData, error: profileError } = await supabase
            .from('users_profiles')
            .select('role')
            .eq('id', userId)
            .single();

        if (profileError) throw profileError;

        const role = profileData.role;

        // Get role-specific data
        if (role === 'patient') {
            const { data: patientData, error: patientError } = await supabase
                .from('patients')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (patientError) throw patientError;

            return {
                role,
                ...patientData,
            };
        } else if (role === 'doctor') {
            const { data: doctorData, error: doctorError } = await supabase
                .from('doctors')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (doctorError) throw doctorError;

            return {
                role,
                ...doctorData,
            };
        }

        return { role };
    } catch (error) {
        console.error('[Auth Service] Get profile error:', error);
        throw error;
    }
}
