import admin from 'firebase-admin';
import serviceAccounts from './firebase-service-account.json' with { type: 'json' };
import fs from 'fs';
import path from 'path';

let serviceAccount;

if (process.env.NODE_ENV === 'production') {
  // In production, load from Render's secret file or environment variable
  const serviceAccount = '/etc/secrets/firebase-service-account.json';

} else {
  // In development, import the local JSON file using assert { type: 'json' }
  serviceAccount = serviceAccounts;
}

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;