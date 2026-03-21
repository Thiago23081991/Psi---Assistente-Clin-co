import React, { useRef, useState } from 'react';
import { Copy, Check, FileCheck, AlertTriangle, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ReportViewProps {
  report: string | null;
  doctorName?: string;
}

const ReportView: React.FC<ReportViewProps> = ({ report, doctorName = "Dr(a). Psicólogo" }) => {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [crp, setCrp] = useState(localStorage.getItem('psiAssistant_crp') || '');
  const printRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    if (report) {
      navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    
    setIsExporting(true);
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 850,
        onclone: (clonedDoc) => {
            const el = clonedDoc.querySelector('[data-pdf-container="true"]') as HTMLElement;
            if (el) {
                el.style.width = '800px';
                el.style.maxWidth = '800px';
                el.style.margin = '0';
            }
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Adiciona a primeira página
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfPageHeight;

      // Se a imagem for maior que uma página A4, adiciona as demais páginas transladadas
      while (heightLeft > 0) {
        position -= pdfPageHeight; 
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfPageHeight;
      }
      
      pdf.save(`Prontuario_Sessao_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF', error);
      alert('Não foi possível gerar o PDF da sessão.');
    } finally {
      setIsExporting(false);
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
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-slate-200 transition-all text-slate-700 font-medium disabled:opacity-50"
          >
            {isExporting ? (
                 <svg className="animate-spin h-4 w-4 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                <Download className="h-4 w-4" />
            )}
            <span className="hidden md:inline">{isExporting ? 'Gerando...' : 'PDF'}</span>
          </button>
          
          <button
            onClick={handleCopy}
            className="text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-slate-600 font-medium bg-slate-100"
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
      </div>
      
      <div className="flex-1 overflow-auto bg-slate-200/50 p-4 md:p-8 block">
         {/* A4 Paper wrapper for visual PDF context */}
         <div 
             ref={printRef}
             data-pdf-container="true"
             className="bg-white p-6 md:p-12 shadow-md w-[210mm] min-h-[297mm] mx-auto text-slate-800 break-words"
             style={{ 
                 fontFamily: '"Inter", sans-serif',
             }}
         >
             
             {/* Simple Header for PDF */}
             <div className="border-b-2 border-slate-800 pb-4 mb-8 flex justify-between items-end">
                <div>
                   <h1 className="text-2xl font-bold tracking-tight text-slate-900">PsiAI</h1>
                   <p className="text-sm text-slate-500 font-medium">Registro Clínico</p>
                </div>
                <div className="text-right">
                   <p className="text-xs text-slate-400">Gerado eletronicamente em {new Date().toLocaleDateString('pt-BR')}</p>
                </div>
             </div>

             <div className="prose prose-slate max-w-none">
                {formattedContent}
             </div>
             
             <div className="mt-20 pt-8 border-t border-slate-200">
                <div className="w-80 mx-auto border-b border-slate-800 mb-2"></div>
                <p className="text-center text-base font-bold text-slate-800 uppercase">{doctorName}</p>
                <p className="text-center text-sm font-semibold text-slate-600 mb-4">Psicólogo(a) Clínico(a) {crp && `- CRP: ${crp}`}</p>
                <p className="text-center text-xs text-slate-500 mt-1">Este documento é confidencial e protegido por sigilo profissional.</p>
             </div>
         </div>
      </div>

      {/* Editor footer where we can add the CRP for the next PDF generations */}
      <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
         <span className="mb-2 sm:mb-0">A validação e assinatura são responsabilidade exclusiva do profissional.</span>
         <div className="flex items-center gap-2">
            <span className="font-medium text-slate-600">Seu CRP:</span>
            <input 
              type="text" 
              placeholder="00/00000" 
              value={crp}
              onChange={(e) => {
                  setCrp(e.target.value);
                  localStorage.setItem('psiAssistant_crp', e.target.value);
              }}
              className="px-2 py-1 border border-slate-300 rounded text-xs w-24 outline-none focus:border-teal-500"
            />
         </div>
      </div>
    </div>
  );
};

export default ReportView;
