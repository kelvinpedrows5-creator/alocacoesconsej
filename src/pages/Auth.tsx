import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
import logo from '@/assets/logo.png';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, loading: authLoading } = useAuthContext();
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(loginEmail, loginPassword);
    
    if (error) {
      setError(error.message === 'Invalid login credentials' 
        ? 'Email ou senha incorretos' 
        : error.message);
    } else {
      navigate('/');
    }
    
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Se esse email estiver cadastrado, você receberá um link para redefinir sua senha.');
    }
    setLoading(false);
  };

  const isPasswordValid = () => {
    if (signupPassword.length < 8) return false;
    if (!/[A-Z]/.test(signupPassword)) return false;
    if (!/[a-z]/.test(signupPassword)) return false;
    if (!/[0-9]/.test(signupPassword)) return false;
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(signupPassword)) return false;
    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (signupPassword !== signupConfirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (!isPasswordValid()) {
      setError('A senha não atende aos requisitos mínimos');
      return;
    }

    const commonPasswords = ['password', 'senha123', '12345678', 'qwerty12', 'abc12345'];
    if (commonPasswords.some(weak => signupPassword.toLowerCase().includes(weak))) {
      setError('Esta senha é muito comum. Por favor, escolha uma senha mais segura');
      return;
    }

    setLoading(true);

    const { error } = await signUp(signupEmail, signupPassword);
    
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Conta criada com sucesso! Você já pode fazer login.');
      setSignupEmail('');
      setSignupPassword('');
      setSignupConfirmPassword('');
    }
    
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background bg-dots-pattern">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-dots-pattern relative overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Animated background blobs */}
      <div className="absolute top-1/3 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-[120px] animate-blob" />
      <div className="absolute bottom-1/3 -right-40 w-80 h-80 bg-accent/8 rounded-full blur-[120px] animate-blob-delay" />
      <div className="absolute top-10 right-1/4 w-48 h-48 bg-primary/5 rounded-full blur-[80px] animate-blob-delay" />

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo section */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col items-center gap-3 mb-8"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-150" />
            <img src={logo} alt="CONSEJ Logo" className="w-16 h-16 object-contain relative z-10 drop-shadow-lg" />
          </div>
          <div className="text-center">
            <h1 className="font-bold text-3xl gradient-text tracking-tight">Alocações CONSEJ</h1>
            <p className="text-sm text-muted-foreground mt-1">Sistema de Gestão de Membros</p>
          </div>
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card-strong gradient-border rounded-xl overflow-hidden"
        >
          <div className="p-6">
            <AnimatePresence mode="wait">
              {forgotPassword ? (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <button
                    onClick={() => { setForgotPassword(false); setError(''); setSuccess(''); }}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao login
                  </button>

                  <h2 className="text-xl font-semibold text-foreground mb-1">Recuperar Senha</h2>
                  <p className="text-sm text-muted-foreground mb-5">
                    Informe seu email para receber o link de recuperação
                  </p>

                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    {success && (
                      <Alert className="border-primary/30 text-primary bg-primary/10">
                        <AlertDescription>{success}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="seu@email.com"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
                          required
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                      disabled={loading}
                    >
                      {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="main"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-xl font-semibold text-foreground mb-1">Bem-vindo</h2>
                  <p className="text-sm text-muted-foreground mb-5">
                    Entre com sua conta ou crie uma nova para acessar o sistema
                  </p>

                  <Tabs defaultValue="login" className="space-y-4" onValueChange={() => { setError(''); setSuccess(''); }}>
                    <TabsList className="grid w-full grid-cols-2 bg-background/50">
                      <TabsTrigger value="login" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Entrar</TabsTrigger>
                      <TabsTrigger value="signup" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Criar Conta</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                      <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="login-email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="login-email"
                              type="email"
                              placeholder="seu@email.com"
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="login-password">Senha</Label>
                            <button
                              type="button"
                              onClick={() => { setForgotPassword(true); setError(''); }}
                              className="text-xs text-primary hover:text-primary/80 transition-colors"
                            >
                              Esqueci minha senha
                            </button>
                          </div>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="login-password"
                              type="password"
                              placeholder="••••••••"
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
                              required
                            />
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                          disabled={loading}
                        >
                          {loading ? 'Entrando...' : 'Entrar'}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="signup">
                      <form onSubmit={handleSignup} className="space-y-4">
                        {error && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}
                        {success && (
                          <Alert className="border-primary/30 text-primary bg-primary/10">
                            <AlertDescription>{success}</AlertDescription>
                          </Alert>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="signup-email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="signup-email"
                              type="email"
                              placeholder="seu@email.com"
                              value={signupEmail}
                              onChange={(e) => setSignupEmail(e.target.value)}
                              className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Senha</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="signup-password"
                              type="password"
                              placeholder="••••••••"
                              value={signupPassword}
                              onChange={(e) => setSignupPassword(e.target.value)}
                              className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
                              required
                            />
                          </div>
                          <AnimatePresence>
                            {signupPassword && <PasswordStrengthIndicator password={signupPassword} />}
                          </AnimatePresence>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-confirm-password">Confirmar Senha</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="signup-confirm-password"
                              type="password"
                              placeholder="••••••••"
                              value={signupConfirmPassword}
                              onChange={(e) => setSignupConfirmPassword(e.target.value)}
                              className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
                              required
                            />
                          </div>
                          {signupConfirmPassword && signupPassword !== signupConfirmPassword && (
                            <p className="text-xs text-destructive">As senhas não coincidem</p>
                          )}
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity" 
                          disabled={loading || !isPasswordValid() || signupPassword !== signupConfirmPassword}
                        >
                          {loading ? 'Criando conta...' : 'Criar Conta'}
                          <User className="ml-2 h-4 w-4" />
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          © {new Date().getFullYear()} CONSEJ — Todos os direitos reservados
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
