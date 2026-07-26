import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeViewerProps {
  code: any;
  title?: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ code, title }) => {
  const [copied, setCopied] = useState(false);

  const formattedCode = typeof code === 'string' ? code : JSON.stringify(code, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden text-xs shadow-2xs">
      {title && (
        <div className="bg-slate-950 px-3.5 py-2 border-b border-slate-800 flex items-center justify-between font-mono text-slate-400">
          <span>{title}</span>
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      )}
      <pre className="p-3.5 font-mono text-slate-200 overflow-x-auto text-[11px] leading-relaxed max-h-72">
        <code>{formattedCode || '// Empty payload'}</code>
      </pre>
    </div>
  );
};
