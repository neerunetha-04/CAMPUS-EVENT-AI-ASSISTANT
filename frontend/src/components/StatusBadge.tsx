import React from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  HelpCircle, 
  Clock, 
  FileText, 
  ShieldCheck, 
  Archive 
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toLowerCase();

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  if (normalized === 'mandatory' || normalized === 'critical') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 ${sizeClasses}`}>
        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
        Mandatory
      </span>
    );
  }

  if (normalized === 'conditional') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 ${sizeClasses}`}>
        <Clock className="w-3.5 h-3.5 text-purple-400" />
        Conditional
      </span>
    );
  }

  if (normalized === 'optional' || normalized === 'recommended') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 ${sizeClasses}`}>
        <FileText className="w-3.5 h-3.5 text-blue-400" />
        Optional
      </span>
    );
  }

  if (normalized === 'complete') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${sizeClasses}`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        Complete
      </span>
    );
  }

  if (normalized === 'ready for submission') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 ${sizeClasses}`}>
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        Ready for Submission
      </span>
    );
  }

  if (normalized === 'needs information') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 ${sizeClasses}`}>
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        Needs Information
      </span>
    );
  }

  if (normalized === 'conflict detected' || normalized === 'conflict') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-md bg-orange-500/15 text-orange-400 border border-orange-500/30 ${sizeClasses}`}>
        <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
        Conflict Detected
      </span>
    );
  }

  if (normalized === 'active') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20 ${sizeClasses}`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
        Active
      </span>
    );
  }

  if (normalized === 'superseded') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-md bg-slate-500/15 text-slate-400 border border-slate-500/30 ${sizeClasses}`}>
        <Archive className="w-3.5 h-3.5 text-slate-400" />
        Superseded
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md bg-slate-700/40 text-slate-300 border border-slate-600/30 ${sizeClasses}`}>
      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
      {status}
    </span>
  );
};
