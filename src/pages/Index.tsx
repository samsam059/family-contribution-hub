import { motion } from "framer-motion";
import { ShieldCheck, PenLine } from "lucide-react";
import { useNavigate } from "react-router-dom";

function RoleCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4, boxShadow: "0 12px 32px -8px rgba(88, 48, 182, 0.15)" }}
      whileTap={{ scale: 0.98 }}
      className="group relative flex flex-col items-center text-center p-10 border border-border rounded-xl bg-card shadow-sm transition-colors hover:border-primary/30 cursor-pointer w-full"
    >
      <div className="mb-5 p-4 rounded-xl bg-accent text-accent-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <h2 className="text-2xl font-semibold mb-2 tracking-tight text-foreground">{title}</h2>
      <p className="text-muted-foreground text-sm leading-relaxed max-w-[220px]">{description}</p>
    </motion.button>
  );
}

export default function Index() {
  const navigate = useNavigate();

  return (
    <main className="min-h-svh flex flex-col items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-10"
      >
        <h1 className="text-4xl font-bold tracking-tight mb-2 text-foreground">
          Family <span className="text-primary">Ledger</span>
        </h1>
        <p className="text-muted-foreground">Manage family contributions with clarity</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl"
      >
        <RoleCard
          title="Admin"
          description="Manage members, view reports, and configure contributions."
          icon={<ShieldCheck size={36} strokeWidth={1.5} />}
          onClick={() => navigate("/login/admin")}
        />
        <RoleCard
          title="Entry"
          description="Record daily contributions and update member profiles."
          icon={<PenLine size={36} strokeWidth={1.5} />}
          onClick={() => navigate("/login/entry")}
        />
      </motion.div>
    </main>
  );
}
