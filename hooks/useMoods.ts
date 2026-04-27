import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc, getDocs, collection, onSnapshot, query } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

export type MoodEntry = {
  date: string;
  emojiId: string;
  energy: string;
  word: string;
  note: string;
  timestamp: number;
};

export function useMoods() {
  const [entries, setEntries] = useState<Record<string, MoodEntry>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isCloudMode, setIsCloudMode] = useState(false);

  // 1. Initial Local Load
  useEffect(() => {
    const saved = localStorage.getItem('moodschool_entries');
    /* eslint-disable react-hooks/set-state-in-effect */
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing moods from local storage", e);
      }
    }
    setIsLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // 2. Setup Auth & Firestore Listeners
  useEffect(() => {
    if (!auth || !db) return;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      /* eslint-disable react-hooks/set-state-in-effect */
      setUser(currentUser);
      setIsCloudMode(!!currentUser);

      if (currentUser && db) {
        // Sync local to cloud when logging in
        const saved = localStorage.getItem('moodschool_entries');
        if (saved) {
          try {
            const localEntries: Record<string, MoodEntry> = JSON.parse(saved);
            for (const key in localEntries) {
              const entry = localEntries[key];
              await setDoc(doc(db, `usuarios/${currentUser.uid}/moods`, entry.date), entry, { merge: true });
            }
          } catch (e) {
             console.error("Error syncing local to cloud", e);
          }
        }

        // Listen to cloud changes
        const q = query(collection(db, `usuarios/${currentUser.uid}/moods`));
        const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const cloudEntries: Record<string, MoodEntry> = {};
          snapshot.forEach((doc) => {
            cloudEntries[doc.id] = doc.data() as MoodEntry;
          });
          setEntries(cloudEntries);
          localStorage.setItem('moodschool_entries', JSON.stringify(cloudEntries));
        }, (error) => {
          console.error("Firebase Snapshot Error:", error);
        });

        return () => unsubscribeSnapshot();
      }
      /* eslint-enable react-hooks/set-state-in-effect */
    });

    return () => unsubscribeAuth();
  }, []);

  const saveEntry = async (entry: MoodEntry) => {
    const newEntries = { ...entries, [entry.date]: entry };
    setEntries(newEntries);
    localStorage.setItem('moodschool_entries', JSON.stringify(newEntries));

    if (user && db) {
      try {
        await setDoc(doc(db, `usuarios/${user.uid}/moods`, entry.date), entry);
      } catch (error) {
        console.error("Error saving to Firebase, saved locally:", error);
      }
    }
  };

  return { entries, saveEntry, isLoaded, user, isCloudMode };
}
