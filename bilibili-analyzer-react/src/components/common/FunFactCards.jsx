import { motion } from 'framer-motion';
import { Trophy, Sprout, Zap, Calendar, Type, AlertTriangle } from 'lucide-react';

const iconMap = {
  Trophy,
  Sprout,
  Zap,
  Calendar,
  Type,
  AlertTriangle,
};

const typeColors = {
  stability: { bg: 'bg-amber-50', border: 'border-amber-100', icon: 'text-amber-500', tag: 'bg-amber-100 text-amber-700' },
  late_bloomer: { bg: 'bg-emerald-50', border: 'border-emerald-100', icon: 'text-emerald-500', tag: 'bg-emerald-100 text-emerald-700' },
  efficiency: { bg: 'bg-blue-50', border: 'border-blue-100', icon: 'text-blue-500', tag: 'bg-blue-100 text-blue-700' },
  weekday: { bg: 'bg-violet-50', border: 'border-violet-100', icon: 'text-violet-500', tag: 'bg-violet-100 text-violet-700' },
  ellipsis: { bg: 'bg-emerald-50', border: 'border-emerald-100', icon: 'text-emerald-500', tag: 'bg-emerald-100 text-emerald-700' },
  engagement_gap: { bg: 'bg-amber-50', border: 'border-amber-100', icon: 'text-amber-500', tag: 'bg-amber-100 text-amber-700' },
};

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } },
};

function FunFactCards({ facts = [] }) {
  if (facts.length === 0) return null;

  return (
    <motion.div
      className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {facts.map((fact, index) => {
        const colors = typeColors[fact.type] || typeColors.stability;
        const IconComp = iconMap[fact.icon] || Trophy;

        return (
          <motion.div
            key={index}
            variants={item}
            className={`flex-shrink-0 w-[280px] p-4 rounded-xl border ${colors.bg} ${colors.border}`}
          >
            <div className="flex items-center gap-2 mb-2.5">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${colors.tag}`}
                style={fact.upColor ? { backgroundColor: `${fact.upColor}15`, color: fact.upColor } : {}}
              >
                {fact.upName}
              </span>
              <IconComp size={14} className={colors.icon} />
            </div>
            <h4 className="text-sm font-semibold text-neutral-900 mb-1 leading-snug">
              {fact.headline}
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              {fact.detail}
            </p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export default FunFactCards;
