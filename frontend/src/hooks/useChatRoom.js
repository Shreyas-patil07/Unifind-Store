import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../services/firebase";

export const getOrCreateChatRoom = async (userA, userB, productId = null) => {
  // Query existing chat rooms
  const q = query(
    collection(db, "chat_rooms"),
    where("participants", "array-contains", userA)
  );

  const snapshot = await getDocs(q);

  // Filter for exact match
  const existingChat = snapshot.docs.find((doc) => {
    const data = doc.data();
    return (
      data.participants.includes(userB) &&
      data.product_id === productId
    );
  });

  if (existingChat) {
    return { id: existingChat.id, ...existingChat.data() };
  }

  // Create new chat room
  const newChat = await addDoc(collection(db, "chat_rooms"), {
    participants: [userA, userB],
    product_id: productId,
    last_message: "",
    last_message_time: serverTimestamp(),
    unread_counts: {
      [userA]: 0,
      [userB]: 0
    },
    created_at: serverTimestamp()
  });

  return {
    id: newChat.id,
    participants: [userA, userB],
    product_id: productId,
    last_message: "",
    last_message_time: new Date(),
    unread_counts: {
      [userA]: 0,
      [userB]: 0
    },
    created_at: new Date()
  };
};
