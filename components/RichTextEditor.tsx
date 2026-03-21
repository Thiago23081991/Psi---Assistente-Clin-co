import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  minHeight?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange, 
  disabled, 
  placeholder,
  minHeight = "min-h-[300px]"
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Sync with external value changes (e.g. clear form or appending from audio transcription)
  useEffect(() => {
    if (contentRef.current) {
      if (value !== contentRef.current.innerHTML) {
         contentRef.current.innerHTML = value;
         
         // If the user was dictating or the form updated externally, move cursor to the end 
         // so they can continue typing naturally without jumping to the start.
         if (document.activeElement === contentRef.current) {
             const range = document.createRange();
             const sel = window.getSelection();
             range.selectNodeContents(contentRef.current);
             range.collapse(false);
             if (sel) {
                 sel.removeAllRanges();
                 sel.addRange(range);
             }
         }
      }
    }
  }, [value]);

  const execCommand = (command: string) => {
    document.execCommand(command, false);
    if (contentRef.current) {
        onChange(contentRef.current.innerHTML);
        contentRef.current.focus();
    }
  };

  const handleToolbarClick = (e: React.MouseEvent, command: string) => {
    e.preventDefault();
    execCommand(command);
  };

  const handleInput = () => {
    if (contentRef.current) {
      const html = contentRef.current.innerHTML;
      // Handle the case where browser leaves <br> in empty editor
      const isEmpty = html === '<br>' || html === '';
      onChange(isEmpty ? '' : html);
    }
  };

  return (
    <div className={`flex flex-col h-full ${minHeight} border rounded-lg overflow-hidden transition-all bg-white ${isFocused ? 'ring-2 ring-teal-500 border-teal-500' : 'border-slate-200'}`}>
      <div className="flex items-center gap-1 p-2 border-b border-slate-200 bg-slate-50">
        <ToolbarButton 
            onClick={(e) => handleToolbarClick(e, 'bold')} 
            icon={<Bold className="w-4 h-4" />} 
            label="Negrito"
            disabled={disabled}
        />
        <ToolbarButton 
            onClick={(e) => handleToolbarClick(e, 'italic')} 
            icon={<Italic className="w-4 h-4" />} 
            label="Itálico"
            disabled={disabled}
        />
        <div className="w-px h-5 bg-slate-300 mx-1"></div>
        <ToolbarButton 
            onClick={(e) => handleToolbarClick(e, 'insertUnorderedList')} 
            icon={<List className="w-4 h-4" />} 
            label="Lista com marcadores"
            disabled={disabled}
        />
        <ToolbarButton 
            onClick={(e) => handleToolbarClick(e, 'insertOrderedList')} 
            icon={<ListOrdered className="w-4 h-4" />} 
            label="Lista numerada"
            disabled={disabled}
        />
      </div>
      
      <div 
        className="flex-1 p-4 overflow-y-auto cursor-text text-slate-700 outline-none rich-text-content"
        contentEditable={!disabled}
        ref={contentRef}
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        role="textbox"
        aria-multiline="true"
        aria-placeholder={placeholder}
      />
      <style>{`
        .rich-text-content:empty:before {
          content: attr(aria-placeholder);
          color: #94a3b8;
          pointer-events: none;
          display: block;
        }
        .rich-text-content ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 0.5rem; }
        .rich-text-content ol { list-style-type: decimal; margin-left: 1.5rem; margin-bottom: 0.5rem; }
        .rich-text-content li { margin-bottom: 0.25rem; }
        .rich-text-content b, .rich-text-content strong { font-weight: 700; color: #1e293b; }
        .rich-text-content i, .rich-text-content em { font-style: italic; }
        .rich-text-content {
             font-family: 'Inter', sans-serif;
             font-size: 0.875rem; /* Text-sm equivalent */
             line-height: 1.6;
        }
      `}</style>
    </div>
  );
};

const ToolbarButton: React.FC<{ onClick: (e: React.MouseEvent) => void; icon: React.ReactNode; label: string; disabled?: boolean }> = ({ onClick, icon, label, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="p-2 rounded hover:bg-white hover:shadow-sm text-slate-600 hover:text-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    title={label}
    onMouseDown={(e) => e.preventDefault()} // Prevent losing focus from editor
  >
    {icon}
  </button>
);

export default RichTextEditor;
