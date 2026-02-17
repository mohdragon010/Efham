"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export default function useAuth() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async currentUser => {
            setUser(currentUser);

            if (currentUser) {

                try {
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    if (userDoc.exists()) {
                        setUserData({ ...userDoc.data(), id: userDoc.id });
                    }
                }
                catch (err) {
                    console.log("error fetching user:", err);
                    setUser(null);
                    logout()
                }
            } else {
                setUserData(null);
            }
            setLoading(false);
        })
        return () => unsubscribe();
    }, []);

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (err) {
            console.log("error signing out: ", err)
        }
    }
    return { user, userData, loading, logout, isAdmin: userData?.role === "admin" }
}