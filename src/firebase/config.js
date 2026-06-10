import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBpxQJ1DRXTU1rGb5bllpq3GbVrOAHz5xw",
  authDomain: "my-health-diary-e8085.firebaseapp.com",
  projectId: "my-health-diary-e8085",
  storageBucket: "my-health-diary-e8085.firebasestorage.app",
  messagingSenderId: "374157582544",
  appId: "1:374157582544:web:549ededb8a3de1e918fed5"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
