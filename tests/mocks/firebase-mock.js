// Firebase mock for testing

export const createUserWithEmailAndPassword = jest.fn();
export const signInWithEmailAndPassword = jest.fn();
export const signOut = jest.fn();
export const sendEmailVerification = jest.fn();
export const sendPasswordResetEmail = jest.fn();
export const onAuthStateChanged = jest.fn();
export const setPersistence = jest.fn();
export const browserLocalPersistence = {};

export class GoogleAuthProvider {
  constructor() {}
}

export class OAuthProvider {
  constructor(provider) {
    this.provider = provider;
  }
}

export const signInWithPopup = jest.fn();

// Firestore mocks
export const doc = jest.fn();
export const setDoc = jest.fn();
export const serverTimestamp = jest.fn(() => new Date());
export const getDoc = jest.fn();
export const collection = jest.fn();
export const query = jest.fn();
export const where = jest.fn();
export const getDocs = jest.fn();