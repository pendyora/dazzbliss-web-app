declare namespace JSX {
  interface IntrinsicElements {
    'amp-analytics': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    script: React.DetailedHTMLProps<React.ScriptHTMLAttributes<HTMLScriptElement>, HTMLScriptElement> & {
      'custom-element'?: string;
    };
  }
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
