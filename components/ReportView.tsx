import React from 'react';
import { Copy, Check, FileCheck, AlertTriangle } from 'lucide-react';

interface ReportViewProps {
  report: string | null;
}

const ReportView: React.FC<ReportViewProps> = ({ report }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (report) {
      navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!report) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 p-8 text-center">
        <div className="bg-white p-4 rounded-full mb-4 shadow-sm">
          <FileCheck className="h-8 w-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-medium text-slate-600 mb-1">Aguardando Dados</h3>
        <p className="max-w-xs text-sm">
          Insira as notas da sessão ao lado e clique em gerar para visualizar a análise clínica estruturada.
        </p>
      </div>
    );
  }

  // Simple logic to detect critical alerts for visual highlighting
  const hasCriticalAlert = report.includes("🔴 ALERTA CRÍTICO") || report.includes("ALERTA CRÍTICO");
  
  // Basic formatting to make markdown headers look nicer without a heavy parser library
  const formattedContent = report.split('\n').map((line, index) => {
    if (line.startsWith('# ')) {
      return <h1 key={index} className="text-xl md:text-2xl font-bold text-slate-800 mt-6 mb-4 border-b border-slate-200 pb-2">{line.replace('# ', '')}</h1>;
    }
    if (line.startsWith('## ')) {
      return <h2 key={index} className="text-base md:text-lg font-bold text-teal-800 mt-6 mb-2 flex items-center">{line.replace('## ', '')}</h2>;
    }
    if (line.startsWith('### ')) {
      return <h3 key={index} className="text-sm md:text-md font-semibold text-slate-700 mt-4 mb-2">{line.replace('### ', '')}</h3>;
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return <li key={index} className="ml-4 mb-1 text-slate-700 list-disc text-sm md:text-base">{line.replace(/^[-*] /, '')}</li>;
    }
    if (line.trim().startsWith('🔴 ALERTA') || line.trim().startsWith('ALERTA CRÍTICO')) {
         return (
             <div key={index} className="bg-red-50 border-l-4 border-red-500 p-3 md:p-4 my-4 rounded-r-lg">
                 <div className="flex items-start">
                     <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                     <p className="text-red-700 font-bold text-sm md:text-base">{line}</p>
                 </div>
             </div>
         )
    }
    if (line.trim() === '') {
      return <div key={index} className="h-2"></div>;
    }
    // Bold formatting for **text**
    const parts = line.split(/(\*\*.*?\*\*)/);
    return (
      <p key={index} className="mb-2 text-slate-600 leading-relaxed text-sm md:text-base">
        {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="text-slate-800 font-semibold">{part.slice(2, -2)}</strong>;
            }
            return part;
        })}
      </p>
    );
  });

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-full relative">
      <div className={`p-4 border-b flex justify-between items-center ${hasCriticalAlert ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
        <h2 className={`font-semibold flex items-center gap-2 text-sm md:text-base ${hasCriticalAlert ? 'text-red-700' : 'text-slate-800'}`}>
          {hasCriticalAlert ? <AlertTriangle className="h-5 w-5" /> : <FileCheck className="h-5 w-5 text-teal-600" />}
          Relatório Gerado
        </h2>
        <button
          onClick={handleCopy}
          className="text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-slate-600 font-medium"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-green-600 hidden md:inline">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span className="hidden md:inline">Copiar</span>
            </>
          )}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-white">
         <div className="prose prose-slate max-w-none">
            {formattedContent}
         </div>
         
         <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-400 italic text-center">
            Este relatório foi gerado por IA como suporte. A validação final e assinatura são responsabilidade exclusiva do profissional de saúde.
         </div>
      </div>
    </div>
  );
};

export default ReportView;
