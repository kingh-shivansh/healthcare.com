import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';

export const profilesRef = collection(db, 'profiles');
export const blogsRef = collection(db, 'blogs');
export const remindersRef = collection(db, 'reminders');
export const appointmentsRef = collection(db, 'appointments');
export const ordersRef = collection(db, 'orders');
export const labBookingsRef = collection(db, 'labBookings');
export const chatsRef = collection(db, 'chats');
export const paymentsRef = collection(db, 'payments');

export const firebaseService = {
  // Profiles
  async getProfile(userId: string) {
    try {
      const docRef = doc(db, 'profiles', userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `profiles/${userId}`);
    }
  },

  async getProfileByEmail(email: string) {
    try {
      const q = query(profilesRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'profiles');
    }
  },

  async saveProfile(profile: any) {
    try {
      const docRef = doc(db, 'profiles', profile.id);
      await setDoc(docRef, { ...profile, updatedAt: serverTimestamp() }, { merge: true });
      return profile;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `profiles/${profile.id}`);
    }
  },

  // Blogs
  async getBlogs() {
    try {
      const q = query(blogsRef, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'blogs');
    }
  },

  async createBlog(blog: any) {
    try {
      const docRef = await addDoc(blogsRef, { ...blog, date: new Date().toISOString(), createdAt: serverTimestamp() });
      return { id: docRef.id, ...blog };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'blogs');
    }
  },

  // Reminders
  async getReminders(userId: string) {
    try {
      const q = query(remindersRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'reminders');
    }
  },

  async createReminder(reminder: any) {
    try {
      const docRef = await addDoc(remindersRef, { ...reminder, createdAt: serverTimestamp() });
      return { id: docRef.id, ...reminder };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reminders');
    }
  },

  async updateReminder(id: string, data: any) {
    try {
      const docRef = doc(db, 'reminders', id);
      await updateDoc(docRef, data);
      return { id, ...data };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reminders/${id}`);
    }
  },

  async deleteReminder(id: string) {
    try {
      const docRef = doc(db, 'reminders', id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `reminders/${id}`);
    }
  },

  // Requests (Appointments, Orders, LabBookings)
  async getRequests(userId: string, role: 'patient' | 'provider', collectionRef: any, providerIdField: string) {
    try {
      const field = role === 'patient' ? 'patientId' : providerIdField;
      const q = query(collectionRef, where(field, '==', userId), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, collectionRef.id);
    }
  },

  async createRequest(collectionRef: any, data: any) {
    try {
      // Check for double booking if it's an appointment
      if (collectionRef.id === 'appointments') {
        const q = query(
          collectionRef, 
          where('doctorId', '==', data.doctorId),
          where('date', '==', data.date),
          where('time', '==', data.time),
          where('status', 'in', ['pending', 'confirmed'])
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          throw new Error("This slot is already booked or requested. Please choose another time.");
        }
      }

      const docRef = await addDoc(collectionRef, { 
        ...data, 
        createdAt: serverTimestamp(),
        status: 'pending'
      });
      return { id: docRef.id, ...data, status: 'pending' };
    } catch (error: any) {
      if (error.message.includes("already booked")) throw error;
      handleFirestoreError(error, OperationType.CREATE, collectionRef.id);
    }
  },

  async getAppointments(userId: string, role: 'patient' | 'doctor') {
    return this.getRequests(userId, role === 'patient' ? 'patient' : 'provider', appointmentsRef, 'doctorId');
  },

  async createAppointment(appointment: any) {
    return this.createRequest(appointmentsRef, appointment);
  },

  // Chats
  async getOrCreateChat(patientId: string, providerId: string, providerName: string, providerImage: string) {
    try {
      const q = query(chatsRef, where('patientId', '==', patientId), where('doctorId', '==', providerId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
      }

      const newChat = {
        patientId,
        doctorId: providerId,
        doctorName: providerName,
        doctorImage: providerImage,
        lastMessage: 'Conversation started',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(chatsRef, newChat);
      return { id: docRef.id, ...newChat };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'chats');
    }
  },

  async getMessages(chatId: string) {
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'asc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `chats/${chatId}/messages`);
    }
  },

  async sendMessage(chatId: string, message: any) {
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const docRef = await addDoc(messagesRef, {
        ...message,
        createdAt: serverTimestamp()
      });
      
      const chatDocRef = doc(db, 'chats', chatId);
      await updateDoc(chatDocRef, {
        lastMessage: message.text,
        updatedAt: serverTimestamp()
      });
      
      return { id: docRef.id, ...message };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `chats/${chatId}/messages`);
    }
  },

  // Payments
  async createPayment(payment: any) {
    try {
      const docRef = await addDoc(paymentsRef, {
        ...payment,
        createdAt: serverTimestamp()
      });
      return { id: docRef.id, ...payment };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'payments');
    }
  },

  // Reports
  async getReports(userId: string) {
    try {
      const q = query(collection(db, 'reports'), where('userId', '==', userId), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'reports');
    }
  },

  async createReport(report: any) {
    try {
      const docRef = await addDoc(collection(db, 'reports'), {
        ...report,
        createdAt: serverTimestamp()
      });
      return { id: docRef.id, ...report };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reports');
    }
  },

  // Professionals
  async getProfessionals(role: string) {
    try {
      const q = query(profilesRef, where('role', '==', role), where('onboarded', '==', true));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'profiles');
    }
  }
};
