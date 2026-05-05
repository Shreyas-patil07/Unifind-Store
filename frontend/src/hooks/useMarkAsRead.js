import {
  collection,
  query,
  getDocs,
  updateDoc,
  doc,
  arrayUnion
} from "firebase/firestore";
import { db } from "../services/firebase";

export const markChatAsRead = async (chatId, userId) => {
  const chatRef = doc(db, "chat_rooms", chatId);
  const messagesRef = collection(chatRef, "messages");

  const snapshot = await getDocs(messagesRef);

  const updates = [];

  snapshot.forEach((msg) => {
    const data = msg.data();

    if (!data.read_by?.includes(userId)) {
      updates.push(
        updateDoc(msg.ref, {
          read_by: arrayUnion(userId)
        })
      );
    }
  });

  await Promise.all(updates);

  // reset unread count
  await updateDoc(chatRef, {
    [`unread_counts.${userId}`]: 0
  });
};
