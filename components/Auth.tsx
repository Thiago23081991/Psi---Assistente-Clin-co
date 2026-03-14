import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { BrainCircuit, CheckCircle2, Shield, Zap, Lock } from 'lucide-react';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/unauthorized-domain') {
        setError('Domínio não autorizado. Adicione a URL deste app na lista de domínios autorizados no Console do Firebase (Authentication -> Settings -> Authorized domains).');
      } else if (error.code === 'auth/popup-closed-by-user') {
        setError('O login foi cancelado. Tente novamente.');
      } else {
        setError(`Erro ao fazer login com Google: ${error.message}`);
      }
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.');
      } else if (error.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso.');
      } else if (error.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else if (error.code === 'auth/operation-not-allowed') {
        setError('Login por e-mail e senha não está habilitado no Firebase. Habilite-o no console.');
      } else {
        setError('Ocorreu um erro na autenticação.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Panel - Branding & Value Prop */}
      <div className="hidden lg:flex lg:w-1/2 bg-teal-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-teal-500 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-teal-950 to-transparent"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="bg-teal-500 p-2 rounded-xl">
              <BrainCircuit className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">PsiAI</h1>
          </div>

          <h2 className="text-5xl font-bold leading-tight mb-6">
            A evolução do seu <br />
            <span className="text-teal-400">consultório clínico.</span>
          </h2>
          <p className="text-teal-100 text-lg max-w-md mb-12 leading-relaxed">
            Automatize relatórios, gerencie pacientes e foque no que realmente importa: o cuidado com a saúde mental.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-teal-800/50 p-2 rounded-lg mt-1">
                <Zap className="h-5 w-5 text-teal-300" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Relatórios com IA</h3>
                <p className="text-teal-200/80 text-sm">Gere evoluções clínicas em segundos baseadas nas suas anotações.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-teal-800/50 p-2 rounded-lg mt-1">
                <Shield className="h-5 w-5 text-teal-300" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Segurança e Privacidade</h3>
                <p className="text-teal-200/80 text-sm">Dados criptografados e armazenados com segurança na nuvem.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-teal-800/50 p-2 rounded-lg mt-1">
                <CheckCircle2 className="h-5 w-5 text-teal-300" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Gestão Completa</h3>
                <p className="text-teal-200/80 text-sm">Prontuários, agendamentos e histórico em um só lugar.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-teal-400/60 text-sm">
          &copy; {new Date().getFullYear()} PsiAI. Todos os direitos reservados.
        </div>
      </div>

      {/* Right Panel - Login/Signup Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="bg-teal-600 p-2 rounded-xl">
              <BrainCircuit className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">PsiAI</h1>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
            </h2>
            <p className="text-slate-500">
              {isLogin 
                ? 'Acesse sua conta para gerenciar seu consultório.' 
                : 'Junte-se a centenas de psicólogos usando o PsiAI.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-3 px-4 rounded-xl transition-all shadow-sm mb-6"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Continuar com Google
          </button>

          <div className="relative flex items-center justify-center mb-6">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-slate-50 px-4 text-xs text-slate-400 uppercase tracking-wider absolute">Ou</span>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail Profissional</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                placeholder="dr.nome@exemplo.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                  placeholder="••••••••"
                />
                <Lock className="absolute right-3 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white font-medium py-3 px-4 rounded-xl hover:bg-teal-700 transition-all shadow-sm disabled:opacity-70 flex justify-center items-center"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                isLogin ? 'Entrar na Plataforma' : 'Criar Conta Grátis'
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-600">
            {isLogin ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="ml-2 text-teal-600 font-semibold hover:text-teal-700 hover:underline"
            >
              {isLogin ? 'Cadastre-se' : 'Faça login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
