import { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-12 text-center"
    >
      <div className="mb-6 rounded-full bg-[#23262f] p-6">
        <Icon className="h-12 w-12 text-[#9ca3af]" />
      </div>
      <h3 className="mb-2">{title}</h3>
      <p className="text-sm text-[#9ca3af] mb-6 max-w-md">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 rounded-lg bg-[#3b82f6] hover:bg-[#0ea5e9] transition-colors"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
