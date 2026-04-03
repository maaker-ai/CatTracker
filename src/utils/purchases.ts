import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesPackage } from 'react-native-purchases';
import { useAppStore } from '@/stores/appStore';

// These will be populated after RevenueCat setup
const RC_IOS_KEY = 'appl_fAyuyQCPeIYprMEauuaNyzAixYV';
const RC_ANDROID_KEY = 'goog_wkyTrMhPGEJeBYsrnvWbwoXLNTu';
const RC_TEST_KEY = 'test_qQHCXaEhwzQVXUGavJULVewEETk';
const ENTITLEMENT_ID = 'pro';

export async function initPurchases(): Promise<void> {
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }
  const apiKey = __DEV__
    ? RC_TEST_KEY
    : Platform.OS === 'ios'
      ? RC_IOS_KEY
      : RC_ANDROID_KEY;
  Purchases.configure({ apiKey });
}

export async function refreshProStatus(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    useAppStore.getState().setIsPro(isPro);
    return isPro;
  } catch (e) {
    console.warn('Failed to refresh pro status:', e);
    return false;
  }
}

export async function getOfferings(): Promise<PurchasesPackage[]> {
  try {
    const offerings = await Purchases.getOfferings();
    // TEMP: diagnostic logging
    console.log('[RC] offerings.current:', offerings.current?.identifier ?? 'null');
    console.log('[RC] all offering keys:', Object.keys(offerings.all));
    if (offerings.current) {
      console.log('[RC] available packages:', offerings.current.availablePackages.map(p => p.identifier));
    }
    if (offerings.current && offerings.current.availablePackages.length > 0) {
      return offerings.current.availablePackages;
    }
    return [];
  } catch (e) {
    console.warn('[RC] Failed to get offerings:', e);
    return [];
  }
}

export type PurchaseResult =
  | { status: 'success'; isPro: boolean }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

export async function purchasePackage(pkg: PurchasesPackage): Promise<PurchaseResult> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    useAppStore.getState().setIsPro(isPro);
    return { status: 'success', isPro };
  } catch (e: any) {
    if (e.userCancelled) return { status: 'cancelled' };
    console.warn('Purchase failed:', e);
    return { status: 'error', message: e.message ?? 'Purchase failed. Please try again.' };
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    useAppStore.getState().setIsPro(isPro);
    return isPro;
  } catch (e) {
    console.warn('Restore failed:', e);
    return false;
  }
}
