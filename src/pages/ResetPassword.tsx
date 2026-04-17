import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
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
    // Check URL hash for explicit error from Supabase (expired/invalid link)
    const hash = window.location.hash;
    if (hash.includes('error=') || hash.includes('error_code=')) {
      const params = new URLSearchParams(hash.substring(1));
      const errDesc = params.get('error_description') || params.get('error') || 'Link inválido ou expirado';
      setError(decodeURIComponent(errDesc.replace(/\+/g, ' ')));
      setChecking(false);
      return;
    }

    // Listen for PASSWORD_RECOVERY event (fired when Supabase processes the recovery hash)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setIsValidSession(true);
        setChecking(false);
      }
    });

    // Fallback: give Supabase time to process the URL hash, then check session
    const timeout = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      }
      setChecking(false);
    }, 1500);

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
      <div className="min-h-screen flex items-center justify-center bg-background bg-dots-pattern">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-dots-pattern relative overflow-hidden flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="absolute top-1/4 -left-32 w-72 h-72 bg-primary/10 rounded-full blur-[100px] animate-blob" />
      <div className="absolute bottom-1/4 -right-32 w-72 h-72 bg-accent/10 rounded-full blur-[100px] animate-blob-delay" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src={logo} alt="CONSEJ Logo" className="w-14 h-14 object-contain drop-shadow-lg" />
          <div className="text-center">
            <h1 className="font-bold text-2xl text-foreground">Redefinir Senha</h1>
            <p className="text-sm text-muted-foreground">Gestão CONSEJ</p>
          </div>
        </div>

        <div className="glass-card-strong gradient-border rounded-xl p-6">
          {!isValidSession ? (
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <p className="text-muted-foreground">
                {error || 'Link de recuperação inválido ou expirado. Solicite um novo link na tela de login.'}
              </p>
              <Button onClick={() => navigate('/auth')} className="w-full bg-gradient-to-r from-primary to-accent">
                Voltar para Login
              </Button>
            </div>
          ) : success ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-success mx-auto" />
              <p className="text-foreground font-medium">Senha redefinida com sucesso!</p>
              <p className="text-sm text-muted-foreground">Redirecionando para o login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Digite sua nova senha abaixo.
              </p>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-background/50 border-border/50"
                    required
                  />
                </div>
                {password && <PasswordStrengthIndicator password={password} />}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-new-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 bg-background/50 border-border/50"
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
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
