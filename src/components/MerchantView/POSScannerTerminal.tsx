import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scan, X, CheckCircle2, Award, Tag, Sparkles, AlertCircle, QrCode } from 'lucide-react';
import { Store } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface POSScannerTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStore: Store;
  onProcessScan: (
    passId: string,
    action: 'earn' | 'redeem_voucher',
    amount?: number,
    voucherCode?: string
  ) => Promise<{ success: boolean; message: string; points?: number; member?: any }>;
}

export const POSScannerTerminal: React.FC<POSScannerTerminalProps> = ({
  isOpen,
  onClose,
  activeStore,
  onProcessScan
}) => {
  const { t, language } = useLanguage();
  const [passIdInput, setPassIdInput] = useState('');
  const [actionType, setActionType] = useState<'earn' | 'redeem_voucher' | 'store_poster'>('earn');
  const [saleAmount, setSaleAmount] = useState('25.00');
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ success: boolean; text: string } | null>(null);

  const calculatedPoints = Math.round((parseFloat(saleAmount) || 0) * activeStore.pointsRate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passIdInput.trim()) return;

    setIsProcessing(true);
    setResultMsg(null);

    try {
      const res = await onProcessScan(
        passIdInput,
        actionType === 'store_poster' ? 'earn' : actionType,
        actionType === 'earn' ? parseFloat(saleAmount) : undefined,
        actionType === 'redeem_voucher' ? voucherCodeInput : undefined
      );

      setResultMsg({ success: res.success, text: res.message });
    } catch (err: any) {
      setResultMsg({ success: false, text: err.message || (language === 'es' ? 'Error al procesar el escaneo.' : 'Scan process failed.') });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-xl border border-slate-200 z-10 space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Scan className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {language === 'es' ? 'Terminal POS de Comercio' : 'Merchant POS Terminal'}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeStore.name} ({activeStore.pointsRate} {t('stores.points_rate')})
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {resultMsg ? (
            <div className="py-8 text-center space-y-4">
              {resultMsg.success ? (
                <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto animate-bounce" />
              ) : (
                <AlertCircle className="w-16 h-16 text-rose-600 mx-auto" />
              )}
              <h4 className="text-lg font-extrabold text-slate-900">
                {resultMsg.success ? (language === 'es' ? '¡Transacción Completada!' : 'Transaction Complete!') : (language === 'es' ? 'Error al Procesar' : 'Processing Error')}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                {resultMsg.text}
              </p>
              <button
                onClick={() => setResultMsg(null)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition cursor-pointer"
              >
                {language === 'es' ? 'Escanear Siguiente Miembro' : 'Scan Next Member'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Action Mode Switcher */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActionType('earn')}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                    actionType === 'earn'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" /> {language === 'es' ? 'Emitir Pts' : 'Issue Pts'}
                </button>
                <button
                  type="button"
                  onClick={() => setActionType('redeem_voucher')}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                    actionType === 'redeem_voucher'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" /> {language === 'es' ? 'Cupón' : 'Voucher'}
                </button>
                <button
                  type="button"
                  onClick={() => setActionType('store_poster')}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                    actionType === 'store_poster'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" /> {language === 'es' ? 'QR Póster' : 'Standee QR'}
                </button>
              </div>

              {actionType === 'store_poster' ? (
                /* STORE QR POSTER STANDEE DISPLAY */
                <div className="p-5 bg-gradient-to-b from-blue-50 to-slate-50 rounded-xl border border-blue-200 text-center space-y-3">
                  <div className="inline-block px-3 py-1 bg-blue-600 text-white font-black text-[10px] rounded-md tracking-wider uppercase shadow-xs">
                    {language === 'es' ? 'Póster QR de Entrada en Tienda' : 'In-Store Entrance QR Poster'}
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    {language === 'es' ? '¡Escanea para Recibir 1 Punto de Lealtad Gratis!' : 'Scan to Receive 1 Free Loyalty Point!'}
                  </h4>
                  <div className="w-40 h-40 bg-white p-3 rounded-xl border-2 border-slate-900 mx-auto shadow-md flex items-center justify-center">
                    {/* Simulated Clean QR Code Graphic */}
                    <div className="w-full h-full bg-slate-900 p-2 rounded-lg flex flex-col justify-between">
                      <div className="flex justify-between">
                        <div className="w-8 h-8 bg-white rounded-xs p-1">
                          <div className="w-full h-full bg-slate-900 rounded-2xs" />
                        </div>
                        <div className="w-8 h-8 bg-white rounded-xs p-1">
                          <div className="w-full h-full bg-slate-900 rounded-2xs" />
                        </div>
                      </div>
                      <div className="text-center font-mono text-[9px] text-white font-black tracking-widest uppercase">
                        {activeStore.name.slice(0, 8)} • +1 PT
                      </div>
                      <div className="flex justify-between">
                        <div className="w-8 h-8 bg-white rounded-xs p-1">
                          <div className="w-full h-full bg-slate-900 rounded-2xs" />
                        </div>
                        <div className="w-4 h-4 bg-blue-500 rounded-xs" />
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {language === 'es'
                      ? 'Coloca este póster con código QR en tu mostrador o entrada. ¡Los clientes lo escanean con su app OmniLoyalty para ganar 1 punto instantáneo!'
                      : 'Display this QR code poster at your counter or entrance door. Members scan it with their OmniLoyalty app to claim 1 instant point!'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Member Pass ID */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {language === 'es' ? 'ID de Pase de Miembro / Código QR' : 'Member Pass ID / QR Code Payload'}
                    </label>
                    <input
                      type="text"
                      value={passIdInput}
                      onChange={(e) => setPassIdInput(e.target.value)}
                      placeholder="e.g. PASS-XXXX-SF"
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-hidden"
                    />
                  </div>

                  {/* Issue Points Fields */}
                  {actionType === 'earn' ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">
                          {language === 'es' ? 'Monto de la Venta (Cg)' : 'Sale Checkout Amount (Cg)'}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={saleAmount}
                          onChange={(e) => setSaleAmount(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm font-extrabold text-slate-900 focus:outline-hidden"
                        />
                      </div>

                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-between text-xs">
                        <span className="font-bold text-blue-900">
                          {language === 'es' ? 'Puntos a emitir:' : 'Points to issue:'}
                        </span>
                        <span className="font-extrabold text-blue-700 text-base">
                          +{calculatedPoints} pts
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        {language === 'es' ? 'Código de Cupón de Recompensa / QR' : 'Reward Voucher Code / QR Payload'}
                      </label>
                      <input
                        type="text"
                        value={voucherCodeInput}
                        onChange={(e) => setVoucherCodeInput(e.target.value)}
                        placeholder="VOUCH-METRO-BEV-88219"
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-hidden"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3 text-white font-extrabold rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-xs bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    {isProcessing
                      ? (language === 'es' ? 'Procesando Terminal...' : 'Processing Terminal...')
                      : (language === 'es' ? 'Ejecutar Cobro POS' : 'Execute POS Checkout')}
                  </button>
                </form>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
