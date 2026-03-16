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
      whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
      whileTap={{ scale: 0.98 }}
      className="group relative flex flex-col items-center text-center p-12 border border-border rounded-2xl bg-card transition-colors hover:border-primary/20 cursor-pointer w-full"
    >
      <div className="mb-6 p-4 rounded-full bg-muted text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <h2 className="text-3xl font-semibold mb-3 tracking-tight text-foreground">{title}</h2>
      <p className="text-muted-foreground leading-relaxed max-w-[240px]">{description}</p>
    </motion.button>
  );
}

export default function Index() {
  const navigate = useNavigate();

  return (
    <main className="min-h-svh flex flex-col items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl font-semibold tracking-tight text-foreground mb-3">Family Ledger</h1>
        <p className="text-lg text-muted-foreground">Manage family contributions with clarity</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl"
      >
        <RoleCard
          title="Admin"
          description="Manage members, view reports, and configure contributions."
          icon={<ShieldCheck size={40} strokeWidth={1.5} />}
          onClick={() => navigate("/login/admin")}
        />
        <RoleCard
          title="Entry"
          description="Record daily contributions and update member profiles."
          icon={<PenLine size={40} strokeWidth={1.5} />}
          onClick={() => navigate("/login/entry")}
        />
      </motion.div>
    </main>
  );
}
