// import { supabase } from "./supabase";

// export const loginWithGoogle = async () => {
//   const { error } = await supabase.auth.signInWithOAuth({
//     provider: "google",
//     options: {
//       redirectTo: `${window.location.origin}/dashboard`,
//     },
//   });

//   if (error) console.error("Login error:", error.message);
// };

// export const logout = async () => {
//   await supabase.auth.signOut();
// };

// export const getSession = async () => {
//   const { data } = await supabase.auth.getSession();
//   return data.session;
// };
