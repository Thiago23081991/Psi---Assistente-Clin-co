import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ProfessionType, UserProfile } from '../types';
import { BrainCircuit, Stethoscope, HeartHandshake, ArrowRight } from 'lucide-react';

interface OnboardingProps {
  uid: string;
  email?: string | null;
  onComplete: (profile: UserProfile) => void;
}

const OnboardingProfession: React.FC<OnboardingProps> = ({ uid, email, onComplete }) => {
  const [selected, setSelected] = useState<ProfessionType | null>(null);
  const [name, setName] = useState('');
  const [crp, setCrp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!selected || !name.trim()) return;
    setLoading(true);

    const profile: UserProfile = {
      uid,
      email: email || '',
      name: name.trim(),
      profession: selected,
      crp: crp.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'userProfiles', uid), profile);
      onComplete(profile);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const professions = [
    {
      id: 'psicologo' as ProfessionType,
      title: 'Psicólogo(a)',
      subtitle: 'CRP registrado, atendimento clínico individual, grupos ou laudos.',
      icon: <Stethoscope className="h-8 w-8" />,
      color: 'teal',
      bg: 'bg-teal-50 hover:bg-teal-100 border-teal-200',
      selectedBg: 'bg-teal-600 text-white border-teal-600',
      iconColor: 'text-teal-600',
    },
    {
      id: 'terapeuta' as ProfessionType,
      title: 'Terapeuta Integrativo(a)',
      subtitle: 'Abordagem holística, integrativa ou complementar à saúde mental.',
      icon: <HeartHandshake className="h-8 w-8" />,
      color: 'violet',
      bg: 'bg-violet-50 hover:bg-violet-100 border-violet-200',
      selectedBg: 'bg-violet-600 text-white border-violet-600',
      iconColor: 'text-violet-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-8 sm:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-teal-600 p-3 rounded-2xl">
              <BrainCircuit className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Bem-vindo(a) ao PsiAI!</h1>
          <p className="text-slate-500 text-sm">
            Para personalizar sua experiência, precisamos de algumas informações básicas sobre você.
          </p>
        </div>

        {/* Name field */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Seu nome completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Dra. Maria Silva"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
          />
        </div>

        {/* Profession selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Qual é a sua área de atuação? <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {professions.map((prof) => {
              const isSelected = selected === prof.id;
              return (
                <button
                  key={prof.id}
                  onClick={() => setSelected(prof.id)}
                  className={`relative p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                    isSelected ? prof.selectedBg : prof.bg
                  }`}
                >
                  <div className={`mb-3 ${isSelected ? 'text-white' : prof.iconColor}`}>
                    {prof.icon}
                  </div>
                  <h3 className={`font-bold text-base mb-1 ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                    {prof.title}
                  </h3>
                  <p className={`text-xs leading-relaxed ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                    {prof.subtitle}
                  </p>
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-white/30 rounded-full flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-white rounded-full" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* CRP / Registro profissional (opcional) */}
        {selected === 'psicologo' && (
          <div className="mb-6 animate-fadeIn">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              CRP (número de registro) <span className="text-slate-400 font-normal">— opcional</span>
            </label>
            <input
              type="text"
              value={crp}
              onChange={(e) => setCrp(e.target.value)}
              placeholder="Ex: 06/123456"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
            />
            <p className="text-xs text-slate-400 mt-1.5">Usado automaticamente no carimbo dos relatórios em PDF.</p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleComplete}
          disabled={!selected || !name.trim() || loading}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? (
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              Acessar a Plataforma <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default OnboardingProfession;
