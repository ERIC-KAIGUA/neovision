import { type User, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { getDoc,  doc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { googleProvider, auth, db } from "../firebase/config";
import toast from "react-hot-toast";


type Role = "admin" | "customer"; 

interface AuthContextType {
    user: User | null;
    role: Role | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout : ()=>Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

//We are creating a custom hook function
export const useAuth = () => {
    const context = useContext(AuthContext);
    if(!context) throw new Error("useAuth must be used within an AutnProvider");
    return context;
}

// helper function that helps create or update the user document
const ensureDocument = async(firebaseUser : User) => {
    const userRef = doc(db, "users", firebaseUser.uid);

    const snapshot = await getDoc(userRef);

    if(!snapshot.exists()){
        //first-time users
        await setDoc(userRef, {
           uid: firebaseUser.uid,
           email:firebaseUser.email,
           displayName:firebaseUser.displayName, 
           photoUrl:firebaseUser.photoURL,
           role: "customer",
           createdAt: serverTimestamp(),
           lastLogin: serverTimestamp()
        });
    } else {
        //returning customer 
        await updateDoc(userRef,{
           displayName:firebaseUser.displayName,
           photoUrl: firebaseUser.photoURL,
           lastLogin:serverTimestamp(),
        })
    }

    return snapshot.data()?.role as Role;
};

export const AuthProvider = ({children} : {children: React.ReactNode})=>{
   const [ user, setUser ] = useState<User | null>(null);
   const [ role, setRole ] = useState<Role | null>(null);
   const [loading, setLoading] = useState(true);
   // Track if this is first load to avoid toasting on page refresh
  const [initialised, setInitialised] = useState(false);


   useEffect(()=>{
    const unsubscribe = onAuthStateChanged(auth,async(currentUser) =>{
        try {
            if(!currentUser) {
                setUser(null);
                setRole(null);
                setLoading(false);
                setInitialised(true);
                return;
            }
            setUser(currentUser);

          //wait for forebase to get the user then set loading to false
          const resolvedRole = await ensureDocument(currentUser);
          setRole(resolvedRole); 

          // Only show welcome toast on actual sign-in, not on page refresh
        if (initialised) {
          const name = currentUser.displayName?.split(" ")[0] ?? "back";
          toast.success(`Welcome back, ${name}!`);
        }
        } catch (error) {
            console.error("Auth initialization error", error)
            setUser(null);
            setRole(null);
        } finally {
            setLoading(false);
            setInitialised(true)
        }
    });

    return unsubscribe;
   }, [initialised]);

   const signinWithGoogle = async() => {
       await signInWithPopup( auth, googleProvider);
   };

   const logout = () => signOut(auth);

  
   return (
    <AuthContext.Provider value = {{ user, role, loading, signInWithGoogle: signinWithGoogle, logout }}>
        {children}
    </AuthContext.Provider>
   );   

};