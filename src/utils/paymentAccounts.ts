import { useEffect, useState } from 'react';
import { PAYMENT_ACCOUNTS } from '../data/mockData';
import { PaymentAccounts } from '../types';

const STORAGE_KEY = 'rifaq_payment_accounts';
const PAYMENT_ACCOUNTS_EVENT = 'rifaq-payment-accounts-updated';

export function getPaymentAccounts(): PaymentAccounts {
  if (typeof window === 'undefined') return PAYMENT_ACCOUNTS;

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return PAYMENT_ACCOUNTS;
    return { ...PAYMENT_ACCOUNTS, ...JSON.parse(saved) };
  } catch {
    return PAYMENT_ACCOUNTS;
  }
}

export function savePaymentAccounts(accounts: PaymentAccounts): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  window.dispatchEvent(new Event(PAYMENT_ACCOUNTS_EVENT));
}

export function usePaymentAccounts(): PaymentAccounts {
  const [accounts, setAccounts] = useState<PaymentAccounts>(getPaymentAccounts);

  useEffect(() => {
    const refresh = () => setAccounts(getPaymentAccounts());
    window.addEventListener('storage', refresh);
    window.addEventListener(PAYMENT_ACCOUNTS_EVENT, refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener(PAYMENT_ACCOUNTS_EVENT, refresh);
    };
  }, []);

  return accounts;
}