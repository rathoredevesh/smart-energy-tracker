export default function GlassCard({ children, className = "" }) {
  return <div className={`glass-panel rounded-[28px] ${className}`}>{children}</div>;
}

