export default function StatCard({ label, value, tone = 'blue' }) {
  return (
    <div className={`card stat-card stat-${tone}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
