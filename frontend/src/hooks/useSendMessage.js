import {
  collection,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
  increment
} from "firebase/firestore";
import { db } from "../services/firebase";

export const sendMessage = async ({
  chatId,
  senderId,
  receiverId,
  text,
  replyTo = null
}) => {
  if (!text.trim()) return;

  const chatRef = doc(db, "chat_rooms", chatId);
  const messagesRef = collection(chatRef, "messages");

  // 1. Add message
  await addDoc(messagesRef, {
    sender_id: senderId,
    text: text.trim(),
    timestamp: serverTimestamp(),
    read_by: [senderId],
    reply_to: replyTo || null
  });

  // 2. Update chat room
  await updateDoc(chatRef, {
    last_message: text.trim(),
    last_message_time: serverTimestamp(),
    [`unread_counts.${receiverId}`]: increment(1)
  });
};
