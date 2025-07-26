// Global type declarations for external packages

declare module '@campnetwork/origin/react' {
  export interface AuthState {
    authenticated: boolean;
  }

  export interface AuthContext {
    origin: any;
    jwt?: string;
  }

  export function useAuth(): AuthContext;
  export function useAuthState(): AuthState;
  export function CampProvider(props: { clientId: string; children: React.ReactNode }): JSX.Element;
  export function CampModal(): JSX.Element;
}

declare module '@campnetwork/origin' {
  export class TwitterAPI {
    constructor(config: { apiKey: string });
    fetchUserByUsername(username: string): Promise<any>;
  }
}

declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react';
  
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    absoluteStrokeWidth?: boolean;
  }
  
  export const Search: ComponentType<IconProps>;
  export const Hash: ComponentType<IconProps>;
  export const Calendar: ComponentType<IconProps>;
  export const User: ComponentType<IconProps>;
  export const FileText: ComponentType<IconProps>;
  export const Database: ComponentType<IconProps>;
  export const Zap: ComponentType<IconProps>;
  export const Copy: ComponentType<IconProps>;
} 