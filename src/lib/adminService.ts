import { supabase } from './supabase';

/**
 * Generates a URL-friendly slug from a store name and ensures it's unique
 */
export const generateStoreSlug = async (storeName: string): Promise<string> => {
  // Convert store name to lowercase and replace spaces/special chars with dashes
  let baseSlug = storeName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

  let slug = baseSlug;
  let counter = 1;

  // Keep checking until we find a unique slug
  while (true) {
    const { data, error } = await supabase
      .from('creators')
      .select('store_slug')
      .eq('store_slug', slug)
      .single();

    if (error || !data) {
      // If no match found, this slug is available
      return slug;
    }

    // If slug exists, append number and try again
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

/**
 * Add an existing user to a store
 */
export const addExistingUserToStore = async (
  creatorId: string,
  email: string,
  fullName?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // First, find the user by email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      return {
        success: false,
        message: 'User not found with this email address'
      };
    }

    // Check if user is already in the store
    const { data: existingUser, error: existingError } = await supabase
      .from('store_users')
      .select('id')
      .eq('user_id', userData.id)
      .eq('creator_id', creatorId)
      .single();

    if (existingUser) {
      return {
        success: false,
        message: 'User is already added to your store'
      };
    }

    // Add user to store
    const { error: insertError } = await supabase
      .from('store_users')
      .insert({
        user_id: userData.id,
        creator_id: creatorId
      });

    if (insertError) {
      throw insertError;
    }

    // Update user's name if provided
    if (fullName) {
      await supabase
        .from('users')
        .update({ full_name: fullName })
        .eq('id', userData.id);
    }

    return {
      success: true,
      message: 'User successfully added to your store'
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to add user to store'
    };
  }
};

/**
 * Invite a new user to join the store
 */
export const inviteUserToStore = async (
  creatorId: string,
  email: string,
  message?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Check if invitation already exists
    const { data: existingInvite, error: existingError } = await supabase
      .from('store_invitations')
      .select('id, accepted_at')
      .eq('creator_id', creatorId)
      .eq('email', email)
      .single();

    if (existingInvite) {
      if (!existingInvite.accepted_at) {
        return {
          success: false,
          message: 'An invitation has already been sent to this email'
        };
      }
    }

    // Create new invitation
    const { error: inviteError } = await supabase
      .from('store_invitations')
      .insert({
        creator_id: creatorId,
        email,
        message
      });

    if (inviteError) {
      throw inviteError;
    }

    return {
      success: true,
      message: 'Invitation sent successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to send invitation'
    };
  }
};

/**
 * Create a new user and add them to the store
 */
export const createNewUserInStore = async (
  creatorId: string,
  email: string,
  password: string,
  fullName?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return {
        success: false,
        message: 'A user with this email already exists'
      };
    }

    // Create new user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (signUpError || !authData.user) {
      throw signUpError || new Error('Failed to create user');
    }

    // Add user to store
    const { error: storeError } = await supabase
      .from('store_users')
      .insert({
        user_id: authData.user.id,
        creator_id: creatorId
      });

    if (storeError) {
      throw storeError;
    }

    return {
      success: true,
      message: 'User created and added to your store successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to create user'
    };
  }
};