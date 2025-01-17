import admin from 'firebase-admin';
import serviceAccount from './firebase-service-account.json' with { type: 'json' };

// const serviceAccount = JSON.parse(new Buffer.from(process.env.FIREBASE,"base64").toString("utf8"))

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;