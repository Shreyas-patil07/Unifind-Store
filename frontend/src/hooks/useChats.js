import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot
} from "firebase/firestore";
import { db } from "../services/firebase";

export const useChats = (userId) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "chat_rooms"),
      where("participants", "array-contains", userId),
      orderBy("last_message_time", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setChats(chatList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { chats, loading };
};
