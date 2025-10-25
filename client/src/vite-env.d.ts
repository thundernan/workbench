/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Window ethereum extensions
interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    isTrust?: boolean;
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on?: (event: string, callback: (...args: any[]) => void) => void;
    removeListener?: (event: string, callback: (...args: any[]) => void) => void;
  };
  coinbaseWalletExtension?: {
    request: (args: { method: string; params?: any[] }) => Promise<any>;
  };
}
