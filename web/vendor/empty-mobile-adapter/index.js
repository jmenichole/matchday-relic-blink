const SolanaMobileWalletAdapterWalletName = "Solana Mobile Wallet Adapter (stub)";

class SolanaMobileWalletAdapter {
  constructor() {
    this.name = SolanaMobileWalletAdapterWalletName;
    this.url = "https://solanamobile.com";
    this.icon = "";
    this.readyState = "Unsupported";
    this.publicKey = null;
    this.connecting = false;
    this.connected = false;
  }
  async connect() {
    throw new Error("Solana Mobile Wallet Adapter is not available in this web build");
  }
  async disconnect() {}
  async signTransaction() {
    throw new Error("unsupported");
  }
  async signAllTransactions() {
    throw new Error("unsupported");
  }
  async signMessage() {
    throw new Error("unsupported");
  }
  on() {
    return this;
  }
  off() {
    return this;
  }
  emit() {
    return false;
  }
  removeAllListeners() {
    return this;
  }
}

function createDefaultAddressSelector() {
  return { select: async (addresses) => addresses[0] };
}
function createDefaultAuthorizationResultCache() {
  return {
    clear: async () => {},
    get: async () => undefined,
    set: async () => {},
  };
}
function createDefaultWalletNotFoundHandler() {
  return async () => {};
}

module.exports = {
  SolanaMobileWalletAdapterWalletName,
  SolanaMobileWalletAdapter,
  createDefaultAddressSelector,
  createDefaultAuthorizationResultCache,
  createDefaultWalletNotFoundHandler,
};
