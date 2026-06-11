import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

const userRecords = (uid) => collection(db, 'users', uid, 'records');

export async function fetchRecords(uid) {
  const q = query(userRecords(uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchRecord(uid, recordId) {
  const snap = await getDoc(doc(db, 'users', uid, 'records', recordId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createRecord(uid, data) {
  const ref = await addDoc(userRecords(uid), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateRecord(uid, recordId, data) {
  await updateDoc(doc(db, 'users', uid, 'records', recordId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteRecord(uid, recordId) {
  await deleteDoc(doc(db, 'users', uid, 'records', recordId));
}
