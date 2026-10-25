import React, { useState } from 'react';
import { Search, X, ArrowRight, Building, HelpCircle, FileText } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function SearchModal({ isOpen, onClose, isDark, onSelectResult }) {
  const [query, setQuery] = useState('');
  const { t } = useLanguage();

  if (!isOpen) return null;

  const quickLinks = [
    { title: 'Municipal Corporation (MCD / BMC / GHMC)', category: 'Department', type: 'dept' },
    { title: 'How does automated complaint escalation work?', category: 'FAQ', type: 'faq' },
    { title: 'PWD Road repair & drainage grievances', category: 'Department', type: 'dept' },
    { title: 'Free Legal Aid under NALSA Act 1987', category: 'Legal Aid', type: 'legal' },
    { title: 'Filing an RTI against delay in public services', category: 'Guide', type: 'guide' },
    { title: 'Electricity Discom billing dispute escalation', category: 'Department', type: 'dept' },
  ];

  const filteredLinks = query.trim()
    ? quickLinks.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      )
    : quickLinks;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-xl rounded-3xl p-5 sm:p-6 shadow-2xl relative border ${
          isDark
            ? 'bg-slate-900/95 border-sky-400/20 text-white'
            : 'bg-white/95 border-slate-200 text-slate-900'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-500/20 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center px-3 py-2 rounded-2xl border mb-4 mt-2 bg-transparent border-slate-400/30">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('transparencySearchPlaceholder')}
            className="w-full text-base bg-transparent focus:outline-none"
          />
        </div>

        <div className="space-y-1 max-h-72 overflow-y-auto">
          <div
            className={`text-[11px] font-bold uppercase tracking-wider px-2 py-1 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {query.trim() ? 'Search Results' : 'Recommended Topics'}
          </div>

          {filteredLinks.map((item, idx) => (
            <div
              key={idx}
              onClick={() => {
                if (onSelectResult) onSelectResult(item);
                onClose();
              }}
              className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition ${
                isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[#0F4C81]/15 text-[#0F4C81] dark:text-sky-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{item.title}</div>
                  <div
                    className={`text-[11px] ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {item.category}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>
          ))}

          {filteredLinks.length === 0 && (
            <div className="text-center py-6 text-sm text-slate-400">
              No matching results found for "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
