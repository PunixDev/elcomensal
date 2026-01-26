// Firebase configuration and initialization for AngularFire
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAnalytics, provideAnalytics } from '@angular/fire/analytics';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';

export const firebaseConfig = {
  apiKey: 'AIzaSyCi9afaM5GXHpy3D06TM4OGUM5U1v172ik',
  authDomain: 'lacomanda-1adce.firebaseapp.com',
  projectId: 'lacomanda-1adce',
  storageBucket: 'lacomanda-1adce.appspot.com',
  messagingSenderId: '923674824712',
  appId: '1:923674824712:web:15c321c9c51b934e1601bd',
  measurementId: 'G-HEH55CQEWB',
};

export const firebaseProviders = [
  provideFirebaseApp(() => initializeApp(firebaseConfig)),
  provideAnalytics(() => getAnalytics()),
  provideFirestore(() => getFirestore()),
  provideAuth(() => getAuth()),
];
