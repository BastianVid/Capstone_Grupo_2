// ============================== User Model ==============================
// Gestiona perfiles de usuario y usernames únicos en Firestore.
import { db } from '../lib/firebase.js';
import {
  doc,
  getDoc,
  setDoc,
  runTransaction,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

const cache = new Map();

const usernameError = (code, message) => {
  const err = new Error(message || code);
  err.code = code;
  return err;
};

const sanitizeUsername = (raw = '') =>
  raw
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 24);

async function getUserProfile(uid, { fresh = false } = {}) {
  if (!uid) return null;
  if (!fresh && cache.has(uid)) return cache.get(uid);
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = { uid, ...snap.data() };
  cache.set(uid, data);
  return data;
}

async function setUserProfile(uid, data) {
  if (!uid) throw usernameError('USER_MISSING', 'Usuario no válido');
  const ref = doc(db, 'users', uid);
  await setDoc(ref, data, { merge: true });
  cache.set(uid, { uid, ...(cache.get(uid) || {}), ...data });
  return cache.get(uid);
}

async function claimUsername(uid, desired, extras = {}) {
  const username = sanitizeUsername(desired);
  if (!username) throw usernameError('USERNAME_INVALID', 'Nombre de usuario inválido');

  return runTransaction(db, async (tx) => {
    const unameRef = doc(db, 'usernames', username);
    const unameSnap = await tx.get(unameRef);
    if (unameSnap.exists() && unameSnap.data()?.uid !== uid) {
      throw usernameError('USERNAME_TAKEN', 'El usuario ya existe');
    }

    const userRef = doc(db, 'users', uid);
    const baseData = (await tx.get(userRef)).data() || {};
    const payload = {
      ...baseData,
      email: extras.email ?? baseData.email ?? null,
      nombre: extras.nombre ?? baseData.nombre ?? null,
      username,
      usernameLower: username,
      updatedAt: new Date().toISOString(),
    };

    tx.set(unameRef, { uid, username });
    tx.set(userRef, payload, { merge: true });
    cache.set(uid, { uid, ...payload });
    return { username, profile: { uid, ...payload } };
  });
}

async function ensureProfile(user, opts = {}) {
  if (!user?.uid) throw usernameError('USER_MISSING', 'No hay usuario autenticado');

  const existing = await getUserProfile(user.uid);
  if (existing?.username) {
    // Rellena email/nombre si faltan
    const needsMerge = (!existing.email && user.email) || (!existing.nombre && opts.nombre);
    if (needsMerge) {
      await setUserProfile(user.uid, {
        email: existing.email ?? user.email ?? null,
        nombre: existing.nombre ?? opts.nombre ?? user.displayName ?? null,
      });
      return getUserProfile(user.uid, { fresh: true });
    }
    return existing;
  }

  const base =
    sanitizeUsername(opts.username) ||
    sanitizeUsername(user.displayName) ||
    sanitizeUsername(opts.nombre) ||
    sanitizeUsername(user.email ? user.email.split('@')[0] : '') ||
    `user${user.uid.slice(0, 6)}`;

  let attempt = base || `user${user.uid.slice(0, 6)}`;
  for (let i = 0; i < 5; i++) {
    try {
      const { profile } = await claimUsername(user.uid, attempt, {
        email: user.email ?? opts.email ?? null,
        nombre: opts.nombre ?? user.displayName ?? null,
      });
      return profile;
    } catch (err) {
      if (err.code === 'USERNAME_TAKEN') {
        attempt = `${base}${Math.floor(Math.random() * 900 + 100)}`;
        continue;
      }
      throw err;
    }
  }
  throw usernameError('USERNAME_TAKEN', 'El usuario ya existe, intenta con otro.');
}

async function isUsernameAvailable(username, excludeUid = null) {
  const uname = sanitizeUsername(username);
  if (!uname) return false;
  const snap = await getDoc(doc(db, 'usernames', uname));
  if (!snap.exists()) return true;
  return excludeUid ? snap.data()?.uid === excludeUid : false;
}

export const UserModel = {
  sanitizeUsername,
  get: getUserProfile,
  set: setUserProfile,
  ensureProfile,
  claimUsername,
  isUsernameAvailable,
};
