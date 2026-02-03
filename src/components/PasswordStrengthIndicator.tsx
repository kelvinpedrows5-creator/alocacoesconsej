import { Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const requirements = [
    { 
      label: 'Pelo menos 8 caracteres', 
      met: password.length >= 8 
    },
    { 
      label: 'Uma letra maiúscula', 
      met: /[A-Z]/.test(password) 
    },
    { 
      label: 'Uma letra minúscula', 
      met: /[a-z]/.test(password) 
    },
    { 
      label: 'Um número', 
      met: /[0-9]/.test(password) 
    },
    { 
      label: 'Um caractere especial (!@#$%...)', 
      met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) 
    },
  ];

  const metCount = requirements.filter(r => r.met).length;
  const strengthPercentage = (metCount / requirements.length) * 100;

  const getStrengthColor = () => {
    if (strengthPercentage <= 20) return 'bg-destructive';
    if (strengthPercentage <= 40) return 'bg-orange-500';
    if (strengthPercentage <= 60) return 'bg-amber-500';
    if (strengthPercentage <= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-3 mt-2"
    >
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Força da senha</span>
          <span>{Math.round(strengthPercentage)}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${strengthPercentage}%` }}
            className={`h-full ${getStrengthColor()} transition-colors duration-300`}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="space-y-1.5">
        {requirements.map((req, index) => (
          <motion.div
            key={req.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center gap-2 text-xs ${
              req.met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
            }`}
          >
            {req.met ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <X className="w-3.5 h-3.5" />
            )}
            <span>{req.label}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
