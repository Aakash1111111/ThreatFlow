const RiskBadge = ({ level, score = null }) => {
  const styles = {
    critical: 'bg-risk-critical/20 text-risk-critical border border-risk-critical/30',
    high: 'bg-risk-high/20 text-risk-high border border-risk-high/30',
    medium: 'bg-risk-medium/20 text-risk-medium border border-risk-medium/30',
    low: 'bg-risk-low/20 text-risk-low border border-risk-low/30',
    clean: 'bg-risk-clean/20 text-risk-clean border border-risk-clean/30',
  };

  const currentStyle = styles[level?.toLowerCase()] || styles.clean;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${currentStyle}`}>
      {level}
      {score !== null && <span className="ml-1.5 pl-1.5 border-l border-current/30">{Number(score).toFixed(1)}</span>}
    </span>
  );
};

export default RiskBadge;
