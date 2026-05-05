import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from "firebase/firestore";
import { db } from "../services/firebase";

export const useMessages = (chatId) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "chat_rooms", chatId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [chatId]);

  return { messages };
};
