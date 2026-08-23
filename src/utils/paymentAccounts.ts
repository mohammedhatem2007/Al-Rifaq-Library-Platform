import { useEffect, useState } from 'react';
import { PAYMENT_ACCOUNTS } from '../data/mockData';
import { PaymentAccounts } from '../types';
import { isSupabaseConfigured, readSetting, writeSetting } from '../services/supabaseRest';

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
  if (isSupabaseConfigured()) {
    void writeSetting('payment_accounts', accounts).catch((error) => console.warn('Payment cloud sync failed:', error));
  }
  window.dispatchEvent(new Event(PAYMENT_ACCOUNTS_EVENT));
}

export function usePaymentAccounts(): PaymentAccounts {
  const [accounts, setAccounts] = useState<PaymentAccounts>(getPaymentAccounts);

  useEffect(() => {
    const refresh = () => setAccounts(getPaymentAccounts());
    const pollCloud = async () => {
      if (!isSupabaseConfigured()) return;
      try {
        const cloudAccounts = await readSetting<PaymentAccounts>('payment_accounts');
        if (cloudAccounts) {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudAccounts));
          setAccounts(cloudAccounts);
        }
      } catch (error) {
        console.warn('Payment cloud refresh failed:', error);
      }
    };
    void pollCloud();
    const interval = window.setInterval(pollCloud, 15000);
    window.addEventListener('storage', refresh);
    window.addEventListener(PAYMENT_ACCOUNTS_EVENT, refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('storage', refresh);
      window.removeEventListener(PAYMENT_ACCOUNTS_EVENT, refresh);
    };
  }, []);

  return accounts;
}