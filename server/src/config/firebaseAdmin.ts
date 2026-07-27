import * as admin from 'firebase-admin';
import { config } from './index';

let firebaseApp: admin.app.App | null = null;
let isInitialized = false;

try {
  let privateKey = config.firebase.privateKey || '';
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, '\n');

  if (!admin.apps.length) {
    if (config.firebase.serviceAccount) {
      const serviceAccount = JSON.parse(config.firebase.serviceAccount);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      isInitialized = true;
    } else if (config.firebase.clientEmail && privateKey) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.firebase.projectId,
          clientEmail: config.firebase.clientEmail,
          privateKey: privateKey,
        }),
      });
      isInitialized = true;
    } else if (process.env.FIREBASE_PROJECT_ID) {
      firebaseApp = admin.initializeApp({
        projectId: config.firebase.projectId,
      });
      isInitialized = true;
    }
  } else {
    firebaseApp = admin.app();
    isInitialized = true;
  }
} catch (error) {
  console.warn('⚠️ Firebase Admin SDK initialization warning:', (error as Error).message);
  console.warn('⚠️ Running in fallback mode for Firebase Admin token verification until credentials are provided in .env');
}

export interface DecodedFirebaseToken {
  uid: string;
  email?: string;
  email_verified?: boolean;
  phone_number?: string;
  name?: string;
  picture?: string;
  firebase?: any;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<DecodedFirebaseToken | null> {
  if (isInitialized && firebaseApp) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return {
        uid: decodedToken.uid,
        email: decodedToken.email,
        email_verified: decodedToken.email_verified,
        phone_number: decodedToken.phone_number,
        name: decodedToken.name,
        picture: decodedToken.picture,
        firebase: decodedToken.firebase,
      };
    } catch (err: any) {
      console.error('Firebase token verification error:', err.message);
      return null;
    }
  }

  // Fallback dev mode parser for mock / client-signed token payloads
  try {
    const parts = idToken.split('.');
    if (parts.length === 3) {
      const payloadBuf = Buffer.from(parts[1], 'base64').toString('utf-8');
      const payload = JSON.parse(payloadBuf);
      if (payload.sub || payload.uid) {
        return {
          uid: payload.sub || payload.uid,
          email: payload.email,
          email_verified: payload.email_verified ?? true,
          phone_number: payload.phone_number,
          name: payload.name || payload.email?.split('@')[0],
          picture: payload.picture,
        };
      }
    }
  } catch {
    // ignore
  }

  return null;
}

export default firebaseApp;
