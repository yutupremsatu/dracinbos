import { supabase } from '@/lib/supabase'

export const signInWithGoogleNative = async () => {
    try {
        const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth')
        await GoogleAuth.initialize()
        const user = await GoogleAuth.signIn()

        if (user.authentication.idToken) {
            // const supabase = createClient() // Removed
            const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: user.authentication.idToken,
            })
            if (error) throw error
            return { data, error: null }
        } else {
            throw new Error('No ID token returned from Google')
        }
    } catch (error: any) {
        console.error('Google Native Sign-In Error:', error)
        // alert('Native Auth Error: ' + JSON.stringify(error)) // Remove debug alert for production
        return { data: null, error }
    }
}

export const signOutNative = async () => {
    try {
        const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth')
        await GoogleAuth.initialize()
        await GoogleAuth.signOut()
        return { error: null }
    } catch (error: any) {
        console.error('Native Sign-Out Error:', error)
        return { error }
    }
}
