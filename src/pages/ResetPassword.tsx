import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import logo from '@/assets/logo.png';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;

    // 1. Erro explícito do Supabase (link expirado/inválido)
    if (hash.includes('error=') || hash.includes('error_code=') || search.includes('error=')) {
      const source = hash.includes('error') ? hash.substring(1) : search.substring(1);
      const params = new URLSearchParams(source);
      const errCode = params.get('error_code');
      const errDesc = params.get('error_description') || params.get('error') || '';

      let friendly = 'Link de recuperação inválido ou expirado. Solicite um novo link na tela de login.';
      if (errCode === 'otp_expired') {
        friendly = 'O link de recuperação expirou. Solicite um novo na tela de login.';
      } else if (errDesc) {
        friendly = decodeURIComponent(errDesc.replace(/\+/g, ' '));
      }
      setError(friendly);
      setChecking(false);
      return;
    }

    // 2. Listener autoritativo do evento PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
        setError('');
        setChecking(false);
      }
    });

    // 3. Fallback após 2s para tokens já processados
    const hasRecoveryHash = hash.includes('type=recovery') || hash.includes('access_token');
    const timeout = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && hasRecoveryHash) {
        setIsValidSession(true);
      } else if (!hasRecoveryHash && !session) {
        setError('Link de recuperação inválido ou expirado. Solicite um novo link na tela de login.');
      } else if (session) {
        setIsValidSession(true);
      }
      setChecking(false);
    }, 2000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const isPasswordValid = () => {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (!isPasswordValid()) {
      setError('A senha não atende aos requisitos mínimos');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/auth'), 3000);
    }
    setLoading(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background bg-mesh">
        <div className="absolute inset-0 bg-noise pointer-events-none" />
        <div className="relative flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <span className="eyebrow">Validando link</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-mesh relative overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Noise + blobs editoriais */}
      <div className="absolute inset-0 bg-noise pointer-events-none" />
      <div className="absolute top-1/3 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-[120px] animate-blob" />
      <div className="absolute bottom-1/3 -right-40 w-80 h-80 bg-accent/10 rounded-full blur-[120px] animate-blob-delay" />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header editorial */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col items-center gap-4 mb-10"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-150" />
            <img src={logo} alt="CONSEJ Logo" className="w-14 h-14 object-contain relative z-10 drop-shadow-lg" />
          </div>
          <div className="text-center space-y-2">
            <span className="eyebrow block">Gestão CONSEJ · Segurança</span>
            <h1 className="display text-4xl text-foreground">Redefinir Senha</h1>
            <div className="editorial-divider w-24 mx-auto mt-3" />
          </div>
        </motion.div>

        {/* Card editorial */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="editorial-card card-shadow-elevated p-7"
        >
          {!isValidSession ? (
            <div className="text-center space-y-5 py-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 border border-destructive/30">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-2">
                <span className="eyebrow block">Acesso negado</span>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {error || 'Link de recuperação inválido ou expirado. Solicite um novo link na tela de login.'}
                </p>
              </div>
              <Button
                onClick={() => navigate('/auth')}
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              >
                Voltar para Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : success ? (
            <div className="text-center space-y-5 py-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/10 border border-success/30">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div className="space-y-2">
                <span className="eyebrow block">Sucesso</span>
                <p className="text-foreground font-medium">Senha redefinida</p>
                <p className="text-sm text-muted-foreground">Redirecionando para o login…</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-start gap-3 mb-1">
                <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h2 className="text-base font-semibold text-foreground">Defina sua nova senha</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Mínimo 8 caracteres com maiúsculas, minúsculas, números e símbolos.
                  </p>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="new-password" className="eyebrow text-[0.65rem]">Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-background/50 border-border/60 focus:border-primary/50 mono"
                    required
                  />
                </div>
                {password && <PasswordStrengthIndicator password={password} />}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-new-password" className="eyebrow text-[0.65rem]">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-new-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 bg-background/50 border-border/60 focus:border-primary/50 mono"
                    required
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-destructive">As senhas não coincidem</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                disabled={loading || !isPasswordValid() || password !== confirmPassword}
              >
                {loading ? 'Redefinindo...' : 'Redefinir Senha'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          )}
        </motion.div>

        {/* Footer editorial */}
        <p className="text-center text-[0.7rem] text-muted-foreground/60 mt-8 mono tracking-wider uppercase">
          Consultoria Jurídica Júnior · Segurança
        </p>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
