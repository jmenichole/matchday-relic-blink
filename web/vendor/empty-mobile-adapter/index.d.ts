export declare const SolanaMobileWalletAdapterWalletName: string;
export declare class SolanaMobileWalletAdapter {
  constructor(config?: unknown);
  name: string;
  readyState: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
export declare function createDefaultAddressSelector(): unknown;
export declare function createDefaultAuthorizationResultCache(): unknown;
export declare function createDefaultWalletNotFoundHandler(): unknown;
