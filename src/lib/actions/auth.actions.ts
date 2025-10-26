'use server';

import { headers } from 'next/headers';
import { auth } from '../better-auth/auth';
import { inngest } from '../inngest/client';

export const signupWithEmail = async ({
  email,
  password,
  fullName,
  country,
  investmentGoals,
  riskTolerance,
  preferredIndustry,
}: SignUpFormData) => {
  try {
    const response = await auth.api.signUpEmail({
      body: { email, password, name: fullName },
    });

    if (response) {
      await inngest.send({
        name: 'app/user.created',
        data: {
          email,
          name: fullName,
          country,
          investmentGoals,
          riskTolerance,
          preferredIndustry,
        },
      });

      return { success: true, message: 'Account created successfully' };
    }
  } catch (error) {
    console.log('Sign up failed', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create an account.' };
  }
};

export const signOut = async () => {
  try {
    await auth.api.signOut({
      headers: await headers(),
    });
  } catch (error) {
    console.log('Sign out failed', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to sign out.' };
  }
};

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
  try {
    await auth.api.signInEmail({
      body: { email, password },
    });
    return { success: true, message: 'Signed in successfully' };
  } catch (error) {
    console.log('Sign in failed', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to sign in.' };
  }
};
