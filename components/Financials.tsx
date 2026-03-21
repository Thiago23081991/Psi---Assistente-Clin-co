import React, { useState, useMemo } from 'react';
import { FinancialTransaction } from '../types';
import { useData } from '../contexts/DataContext';
import { DollarSign, PlusCircle, MinusCircle, Wallet, TrendingUp, TrendingDown, ArrowRightLeft, Calendar, User, Search, Trash2, Edit2, AlertCircle, X, Save } from 'lucide-react';

const Financials: React.FC = () => {
    const { transactions, patients, loadingFinancials, saveTransaction, deleteTransaction } = useData();
    
    // Filters
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTxId, setEditingTxId] = useState<string | null>(null);
    
    // Form state
    const [type, setType] = useState<'income' | 'expense'>('income');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<'paid' | 'pending'>('paid');
    const [patientId, setPatientId] = useState('');
    const [category, setCategory] = useState('');

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    // Filter transactions by selected month/year and search term
    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const txDate = new Date(tx.date + 'T12:00:00');
            const matchesMonthYear = txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
            const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  (tx.patientId && patients.find(p => p.id === tx.patientId)?.name.toLowerCase().includes(searchTerm.toLowerCase()));
            
            return matchesMonthYear && matchesSearch;
        });
    }, [transactions, currentMonth, currentYear, searchTerm, patients]);

    // Calculate summaries
    const summaries = useMemo(() => {
        let income = 0;
        let expense = 0;
        let pendingIncome = 0;

        filteredTransactions.forEach(tx => {
            if (tx.type === 'income') {
                if (tx.status === 'paid') income += tx.amount;
                else pendingIncome += tx.amount;
            } else {
                if (tx.status === 'paid') expense += tx.amount;
            }
        });

        return {
            income,
            expense,
            balance: income - expense,
            pendingIncome
        };
    }, [filteredTransactions]);

    const handleOpenModal = (tx?: FinancialTransaction) => {
        if (tx) {
            setEditingTxId(tx.id);
            setType(tx.type);
            setAmount(tx.amount.toString());
            setDate(tx.date);
            setDescription(tx.description);
            setStatus(tx.status);
            setPatientId(tx.patientId || '');
            setCategory(tx.category || '');
        } else {
            setEditingTxId(null);
            setType('income');
            setAmount('');
            setDate(new Date().toISOString().split('T')[0]);
            setDescription('');
            setStatus('paid');
            setPatientId('');
            setCategory('');
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!amount || !date || !description) return;

        const newTx: FinancialTransaction = {
            id: editingTxId || Date.now().toString(),
            type,
            amount: parseFloat(amount.replace(',', '.')),
            date,
            description,
            status,
            patientId: patientId || undefined,
            category: category || undefined
        };

        try {
            await saveTransaction(newTx);
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar transação");
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Deseja realmente excluir este registro?")) {
            await deleteTransaction(id);
        }
    };

    const getPatientName = (id?: string) => {
        if (!id) return '';
        return patients.find(p => p.id === id)?.name || 'Paciente excluído';
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    if (loadingFinancials) {
        return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>;
    }

    return (
        <div className="flex flex-col h-full gap-6 max-w-6xl mx-auto w-full">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="bg-teal-600 p-2 rounded-xl text-white shadow-sm">
                        <Wallet className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Financeiro</h2>
                        <p className="text-sm text-slate-500">Gestão de receitas e despesas clínicas</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button 
                            onClick={() => {
                                let newMonth = currentMonth - 1;
                                let newYear = currentYear;
                                if (newMonth < 0) { newMonth = 11; newYear--; }
                                setCurrentMonth(newMonth); setCurrentYear(newYear);
                            }}
                            className="px-3 py-1 text-slate-600 hover:bg-white rounded shadow-sm transition-colors text-sm"
                        >
                            &larr;
                        </button>
                        <div className="px-4 py-1 text-sm font-semibold text-slate-700 min-w-[120px] text-center flex items-center justify-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {monthNames[currentMonth]} {currentYear}
                        </div>
                        <button 
                            onClick={() => {
                                let newMonth = currentMonth + 1;
                                let newYear = currentYear;
                                if (newMonth > 11) { newMonth = 0; newYear++; }
                                setCurrentMonth(newMonth); setCurrentYear(newYear);
                            }}
                            className="px-3 py-1 text-slate-600 hover:bg-white rounded shadow-sm transition-colors text-sm"
                        >
                            &rarr;
                        </button>
                    </div>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap"
                    >
                        <PlusCircle className="h-4 w-4" /> Registrar
                    </button>
                </div>
            </div>

            {/* Dashboards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium text-slate-500">Saldo Líquido</p>
                        <div className={`p-1.5 rounded-lg ${summaries.balance >= 0 ? 'bg-teal-50 text-teal-600' : 'bg-red-50 text-red-600'}`}>
                            <DollarSign className="h-4 w-4" />
                        </div>
                    </div>
                    <h3 className={`text-2xl font-bold ${summaries.balance >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                        {formatCurrency(summaries.balance)}
                    </h3>
                    <div className="absolute -right-6 -bottom-6 opacity-5">
                        <Wallet className="h-24 w-24" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium text-slate-500">Receitas Pagas</p>
                        <div className="p-1.5 rounded-lg bg-green-50 text-green-600">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(summaries.income)}</h3>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium text-slate-500">Despesas</p>
                        <div className="p-1.5 rounded-lg bg-red-50 text-red-600">
                            <TrendingDown className="h-4 w-4" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(summaries.expense)}</h3>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-yellow-400">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium text-slate-500">A Receber (Inadimplência)</p>
                        <div className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600">
                            <AlertCircle className="h-4 w-4" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(summaries.pendingIncome)}</h3>
                </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                        <ArrowRightLeft className="h-4 w-4" /> Lançamentos
                    </h3>
                    <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar descrição ou paciente..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    {filteredTransactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                            <Wallet className="h-12 w-12 opacity-20 mb-3" />
                            <p>Nenhuma transação encontrada para este mês.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-white border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Data</th>
                                    <th className="px-6 py-4 font-medium">Descrição / Paciente</th>
                                    <th className="px-6 py-4 font-medium">Categoria</th>
                                    <th className="px-6 py-4 font-medium">Valor</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredTransactions.map(tx => (
                                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                            {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-slate-800">{tx.description}</p>
                                            {tx.patientId && (
                                                <p className="text-xs text-teal-600 flex items-center gap-1 mt-0.5"><User className="h-3 w-3" /> {getPatientName(tx.patientId)}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">{tx.category || 'Outros'}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium font-mono">
                                            <span className={tx.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                                                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {tx.status === 'paid' ? (
                                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center w-fit gap-1"><CheckIcon className="h-3 w-3"/> Pago</span>
                                            ) : (
                                                <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center w-fit gap-1"><AlertCircle className="h-3 w-3"/> Pendente</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleOpenModal(tx)} className="text-slate-400 hover:text-blue-600 p-1.5"><Edit2 className="h-4 w-4"/></button>
                                            <button onClick={() => handleDelete(tx.id)} className="text-slate-400 hover:text-red-600 p-1.5 ml-1"><Trash2 className="h-4 w-4"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md z-10 overflow-hidden animate-fadeIn flex flex-col">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                {type === 'income' ? <PlusCircle className="h-5 w-5 text-green-500"/> : <MinusCircle className="h-5 w-5 text-red-500" />}
                                {editingTxId ? 'Editar Lançamento' : 'Novo Lançamento'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5"/></button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            {!editingTxId && (
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    <button 
                                        onClick={() => setType('income')}
                                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-shadow ${type === 'income' ? 'bg-white shadow-sm text-green-600' : 'text-slate-500'}`}
                                    >Receita (Entrada)</button>
                                    <button 
                                        onClick={() => setType('expense')}
                                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-shadow ${type === 'expense' ? 'bg-white shadow-sm text-red-600' : 'text-slate-500'}`}
                                    >Despesa (Saída)</button>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Valor (R$)</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                    placeholder="Ex: 150.00"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Data</label>
                                    <input 
                                        type="date" 
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                                    <select 
                                        value={status}
                                        onChange={e => setStatus(e.target.value as any)}
                                        className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                                    >
                                        <option value="paid">Pago</option>
                                        <option value="pending">Pendente</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Descrição</label>
                                <input 
                                    type="text" 
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                    placeholder="Ex: Sessão Terapia, Aluguel Sala, Internet..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Categoria (Opcional)</label>
                                    <input 
                                        type="text" 
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                        placeholder="Ex: Consulta, Custos..."
                                    />
                                </div>
                                {type === 'income' && (
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Vincular Paciente (Opcional)</label>
                                        <select 
                                            value={patientId}
                                            onChange={e => setPatientId(e.target.value)}
                                            className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                                        >
                                            <option value="">Nenhum...</option>
                                            {patients.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={handleSave}
                                disabled={!amount || !date || !description}
                                className="w-full bg-teal-600 text-white py-2.5 rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 mt-2 shadow-sm"
                            >
                                <Save className="h-4 w-4" /> Salvar {type === 'income' ? 'Receita' : 'Despesa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const CheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

export default Financials;
