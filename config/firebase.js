import admin from 'firebase-admin';
import serviceAccounts from './firebase-service-account.json' with { type: 'json' };
import fs from 'fs';
import path from 'path';

let serviceAccount;

if (process.env.NODE_ENV === 'production') {
  // In production, load from Render's secret file or environment variable
  const secretFilePath = '/etc/secrets/firebase-service-account.json';

  if (fs.existsSync(secretFilePath)) {
    // Load service account from Render's secret file
    serviceAccount = JSON.parse(fs.readFileSync(secretFilePath, 'utf8'));
  } else if (process.env.FIREBASE) {
    // Decode from Base64-encoded environment variable
    serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE, 'base64').toString('utf8')
    );
  } else {
    throw new Error(
      'Firebase service account configuration is missing in production.'
    );
  }
} else {
  // In development, import the local JSON file using assert { type: 'json' }
  serviceAccount = serviceAccounts;
}

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;