import { Leaf } from 'lucide-react';

/** The logo: a leaf in green + "NutriPlan" in Bricolage 700 (PRD §2.1). Always Latin. */
export default function Wordmark({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} dir="ltr">
      <span className="grid size-8 place-items-center rounded-full bg-brand-soft text-brand-ink">
        <Leaf aria-hidden="true" size={18} strokeWidth={2.25} />
      </span>
      <span className="font-display text-[22px] leading-none font-bold tracking-[-0.02em] text-ink">NutriPlan</span>
    </span>
  );
}
