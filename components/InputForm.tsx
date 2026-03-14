import React, { useState } from 'react';
import { TherapeuticApproach, ReportTemplate } from '../types';
import { Sparkles, FileText, Eraser, Settings } from 'lucide-react';
import RichTextEditor from './RichTextEditor';

interface InputFormProps {
  onSubmit: (notes: string, approach: string) => void;
  isAnalyzing: boolean;
  templates: ReportTemplate[];
  selectedTemplateId: string;
  onSelectTemplate: (id: string) => void;
  onOpenTemplateManager: () => void;
}

const InputForm: React.FC<InputFormProps> = ({ 
  onSubmit, 
  isAnalyzing,
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onOpenTemplateManager
}) => {
  const [notes, setNotes] = useState('');
  const [approach, setApproach] = useState<string>(TherapeuticApproach.TCC);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (notes.trim()) {
      onSubmit(notes, approach);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <FileText className="h-5 w-5 text-slate-500" />
          Notas da Sessão
        </h2>
        <button 
          onClick={() => setNotes('')}
          className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1 transition-colors"
          disabled={isAnalyzing}
        >
          <Eraser className="h-3 w-3" /> Limpar
        </button>
      </div>
      
      <div className="p-5 flex-1 flex flex-col gap-4">
        <div className="flex-1 min-h-[300px]">
          <label htmlFor="notes" className="sr-only">Notas brutas ou transcrição</label>
          <RichTextEditor 
            value={notes} 
            onChange={setNotes} 
            disabled={isAnalyzing}
            placeholder="Cole aqui as anotações brutas, transcrição da sessão ou observações soltas..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* Approach Selection */}
          <div>
            <label htmlFor="approach" className="block text-xs font-medium text-slate-700 mb-1">
              Abordagem Teórica
            </label>
            <div className="relative">
              <select
                id="approach"
                value={approach}
                onChange={(e) => setApproach(e.target.value)}
                className="block w-full pl-3 pr-8 py-2 text-sm border-slate-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 rounded-lg border bg-white shadow-sm"
                disabled={isAnalyzing}
              >
                {Object.values(TherapeuticApproach).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Template Selection */}
          <div>
            <label htmlFor="template" className="block text-xs font-medium text-slate-700 mb-1 flex justify-between">
              <span>Modelo de Relatório</span>
              <button onClick={onOpenTemplateManager} className="text-teal-600 hover:text-teal-800 flex items-center gap-0.5 text-[10px] uppercase font-bold tracking-wider">
                <Settings className="h-3 w-3" /> Gerenciar
              </button>
            </label>
            <div className="relative">
              <select
                id="template"
                value={selectedTemplateId}
                onChange={(e) => onSelectTemplate(e.target.value)}
                className="block w-full pl-3 pr-8 py-2 text-sm border-slate-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 rounded-lg border bg-white shadow-sm truncate"
                disabled={isAnalyzing}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button
            onClick={handleSubmit}
            disabled={!notes.trim() || isAnalyzing}
            className={`flex items-center justify-center w-full py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all mt-1
              ${!notes.trim() || isAnalyzing 
                ? 'bg-slate-300 cursor-not-allowed' 
                : 'bg-teal-600 hover:bg-teal-700 hover:shadow-md active:transform active:scale-[0.98]'
              }`}
          >
            {isAnalyzing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processando Clínica...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Gerar Relatório Estruturado
              </>
            )}
        </button>
      </div>
    </div>
  );
};

export default InputForm;
