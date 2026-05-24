import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy, 
  limit,
  serverTimestamp,
  onSnapshot,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Category, BankAccount, Loan, CreditTransaction } from '../types';

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  paymentMethod: 'Cash' | 'Bank' | 'Other';
  accountId: string | null;
  otherMethod?: string | null;
  date: string;
  note: string;
  userId: string;
  createdAt: any;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const financeService = {
  // Generic fetching with userId filter
  subscribeToCollection: (collectionName: string, userId: string, callback: (data: any[]) => void) => {
    const q = query(
      collection(db, collectionName),
      where('userId', '==', userId)
    );
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      // Sort manually to avoid composite index requirement
      const sortedData = data.sort((a, b) => {
        const getTime = (val: any) => {
          if (!val) return 0;
          if (val.seconds) return val.seconds * 1000;
          if (typeof val === 'string') return new Date(val).getTime();
          if (val instanceof Date) return val.getTime();
          return 0;
        };
        const dateA = getTime(a.createdAt) || getTime(a.date);
        const dateB = getTime(b.createdAt) || getTime(b.date);
        return dateB - dateA;
      });
      callback(sortedData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, collectionName);
    });
  },

  // Account Management
  ensureCashAccount: async (userId: string) => {
    try {
      const docRef = doc(db, 'cashAccounts', userId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          userId,
          balance: 0,
          createdAt: serverTimestamp()
        });
      }
      return docRef;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `cashAccounts/${userId}`);
      throw error;
    }
  },

  getCashBalance: (userId: string, callback: (balance: number) => void) => {
    return onSnapshot(doc(db, 'cashAccounts', userId), (doc) => {
      if (doc.exists()) {
        callback(doc.data().balance || 0);
      } else {
        callback(0);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `cashAccounts/${userId}`);
    });
  },

  updateBalance: async (userId: string, method: string, accountId: string | null, amount: number) => {
    try {
      if (method === 'Cash') {
        const docRef = doc(db, 'cashAccounts', userId);
        const docSnap = await getDoc(docRef);
        const current = docSnap.exists() ? docSnap.data().balance || 0 : 0;
        await setDoc(docRef, { balance: current + amount }, { merge: true });
      } else if (method === 'Bank' && accountId) {
        const docRef = doc(db, 'banks', accountId);
        const docSnap = await getDoc(docRef);
        const current = docSnap.exists() ? docSnap.data().currentBalance || 0 : 0;
        await updateDoc(docRef, { currentBalance: current + amount });
      } else if (method === 'Other' && accountId) {
        const docRef = doc(db, 'onlineAccounts', accountId);
        const docSnap = await getDoc(docRef);
        const current = docSnap.exists() ? docSnap.data().balance || 0 : 0;
        await updateDoc(docRef, { balance: current + amount });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, method === 'Cash' ? 'cashAccounts' : (method === 'Bank' ? 'banks' : 'onlineAccounts'));
    }
  },

  // Incomes
  addIncome: async (data: any) => {
    try {
      const incomeDoc = await addDoc(collection(db, 'incomes'), {
        ...data,
        createdAt: serverTimestamp(),
      });
      // Update balance
      await financeService.updateBalance(data.userId, data.paymentMethod, data.accountId, data.amount);
      return incomeDoc;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'incomes');
      throw error;
    }
  },

  // Expenses
  addExpense: async (data: any) => {
    try {
      const expenseDoc = await addDoc(collection(db, 'expenses'), {
        ...data,
        createdAt: serverTimestamp(),
      });
      // Update balance (negative for expense)
      await financeService.updateBalance(data.userId, data.paymentMethod, data.accountId, -data.amount);
      return expenseDoc;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'expenses');
      throw error;
    }
  },

  // Categories
  addCategory: async (data: Omit<Category, 'id' | 'createdAt'>) => {
    try {
      return await addDoc(collection(db, 'categories'), {
        ...data,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'categories');
      throw error;
    }
  },

  deleteCategory: async (id: string) => {
    try {
      return await deleteDoc(doc(db, 'categories', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
      throw error;
    }
  },

  // Banks
  addBank: async (data: Omit<BankAccount, 'id' | 'createdAt'>) => {
    try {
      return await addDoc(collection(db, 'banks'), {
        ...data,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'banks');
      throw error;
    }
  },

  updateBankBalance: async (bankId: string, newBalance: number) => {
    try {
      return await updateDoc(doc(db, 'banks', bankId), {
        currentBalance: newBalance,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `banks/${bankId}`);
      throw error;
    }
  },

  // Loans
  addLoan: async (data: Omit<Loan, 'id' | 'createdAt'>) => {
    try {
      return await addDoc(collection(db, 'loans'), {
        ...data,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'loans');
      throw error;
    }
  },

  updateLoan: async (loanId: string, data: Partial<Loan>) => {
    try {
      return await updateDoc(doc(db, 'loans', loanId), {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `loans/${loanId}`);
      throw error;
    }
  },

  // Credit Transactions
  addCreditTransaction: async (data: Omit<CreditTransaction, 'id' | 'createdAt'>) => {
    try {
      return await addDoc(collection(db, 'creditTransactions'), {
        ...data,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'creditTransactions');
      throw error;
    }
  },

  addDoc: async (collectionName: string, data: any) => {
    try {
      return await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, collectionName);
      throw error;
    }
  },

  updateDoc: async (collectionName: string, id: string, data: any) => {
    try {
      return await updateDoc(doc(db, collectionName, id), {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${id}`);
      throw error;
    }
  },

  deleteDoc: async (collectionName: string, id: string) => {
    try {
      return await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
      throw error;
    }
  },
};
