import React, { useState } from 'react';
import { ReportTemplate } from '../types';
import { X, Plus, Trash2, FileText, LayoutTemplate } from 'lucide-react';

interface TemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  templates: ReportTemplate[];
  onAddTemplate: (template: ReportTemplate) => void;
  onDeleteTemplate: (id: string) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ 
  isOpen, 
  onClose, 
  templates, 
  onAddTemplate, 
  onDeleteTemplate 
}) => {
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateStructure, setNewTemplateStructure] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!newTemplateName.trim() || !newTemplateStructure.trim()) return;

    const newTemplate: ReportTemplate = {
      id: Date.now().toString(),
      name: newTemplateName,
      structure: newTemplateStructure,
      isDefault: false
    };

    onAddTemplate(newTemplate);
    setNewTemplateName('');
    setNewTemplateStructure('');
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        
        {/* Background overlay */}
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-start mb-5 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-teal-100 sm:mx-0">
                  <LayoutTemplate className="h-5 w-5 text-teal-600" />
                </div>
                <h3 className="text-lg leading-6 font-medium text-slate-900" id="modal-title">
                  Gerenciar Modelos de Relatório
                </h3>
              </div>
              <button 
                onClick={onClose}
                className="bg-white rounded-md text-slate-400 hover:text-slate-500 focus:outline-none"
              >
                <span className="sr-only">Fechar</span>
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* List existing templates */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-3">Modelos Disponíveis</h4>
                <div className="bg-slate-50 border border-slate-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-200">
                  {templates.map((template) => (
                    <div key={template.id} className="p-3 flex items-center justify-between hover:bg-white transition-colors">
                      <div className="flex items-center gap-2">
                         <FileText className="h-4 w-4 text-slate-400" />
                         <div>
                            <p className="text-sm font-medium text-slate-800">{template.name}</p>
                            <p className="text-xs text-slate-500 truncate max-w-[250px]">{template.structure.substring(0, 50)}...</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {template.isDefault && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                            Padrão
                          </span>
                        )}
                        {!template.isDefault && (
                          <button 
                            onClick={() => onDeleteTemplate(template.id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                            title="Excluir modelo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add new template */}
              <div className="border-t border-slate-100 pt-5">
                <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Criar Novo Modelo
                </h4>
                <div className="grid gap-4">
                  <div>
                    <label htmlFor="templateName" className="block text-xs font-medium text-slate-600 mb-1">Nome do Modelo</label>
                    <input
                      type="text"
                      id="templateName"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="Ex: Relatório SOAP Simplificado"
                      className="w-full text-sm p-2 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="templateStructure" className="block text-xs font-medium text-slate-600 mb-1">
                      Estrutura (Markdown) - Instruções para a IA
                    </label>
                    <textarea
                      id="templateStructure"
                      value={newTemplateStructure}
                      onChange={(e) => setNewTemplateStructure(e.target.value)}
                      placeholder={`# Título do Relatório\n\n## 1. Seção Um\nDescrição do que deve constar aqui.\n\n## 2. Seção Dois\n...`}
                      className="w-full h-32 text-sm p-2 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 outline-none font-mono text-xs"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Defina os cabeçalhos e o que deve ser incluído em cada seção. Use Markdown (#, ##, -).
                    </p>
                  </div>
                  <button
                    onClick={handleAdd}
                    disabled={!newTemplateName.trim() || !newTemplateStructure.trim()}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-slate-800 text-base font-medium text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                  >
                    Adicionar Modelo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateManager;
