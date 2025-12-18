import { motion } from 'framer-motion';
import { Users, CheckCircle, AlertTriangle, GraduationCap, Briefcase, Award } from 'lucide-react';

const FounderTeamCard = () => {
  const founderScore = 8.5;
  
  const backgrounds = [
    { icon: GraduationCap, text: 'CEO: Stanford MBA, Berkeley CS undergrad', type: 'positive' },
    { icon: Briefcase, text: 'CEO: 10 years at Salesforce, VP Product', type: 'positive' },
    { icon: Award, text: 'CEO: 2 prior exits ($15M, $42M acquisitions)', type: 'positive' },
    { icon: GraduationCap, text: 'CTO: MIT PhD in Machine Learning', type: 'positive' },
    { icon: Briefcase, text: 'CTO: 8 years at Google Brain team', type: 'positive' },
  ];

  const redFlags = [
    { text: 'Key person risk: CTO owns all core IP and ML architecture', severity: 'high' },
    { text: 'No technical co-founder succession plan in place', severity: 'high' },
    { text: 'CFO joined 3 months ago, still onboarding', severity: 'medium' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card rounded-2xl border border-border shadow-lg p-6"
    >
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Users className="h-5 w-5 text-secondary" />
        Founder & Team Assessment
      </h2>

      {/* Founder Strength Score */}
      <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-secondary/5 to-primary/5 border border-secondary/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Founder Strength Score</span>
          <span className="text-2xl font-bold text-foreground">{founderScore}<span className="text-sm text-muted-foreground font-normal">/10</span></span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <motion.div 
            className="h-full rounded-full bg-gradient-to-r from-secondary to-success"
            initial={{ width: 0 }}
            animate={{ width: `${founderScore * 10}%` }}
            transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Weak</span>
          <span>Strong</span>
        </div>
      </div>

      {/* Background Bullets */}
      <div className="mb-6">
        <p className="text-sm font-medium text-foreground mb-3">Team Background</p>
        <ul className="space-y-2">
          {backgrounds.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
              <span className="text-sm text-muted-foreground">{item.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Red Flags */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          Red Flags
        </p>
        <div className="space-y-2">
          {redFlags.map((flag, i) => (
            <div 
              key={i}
              className={`flex items-start gap-2 p-3 rounded-lg border-l-4 ${
                flag.severity === 'high' 
                  ? 'bg-destructive/5 border-destructive' 
                  : 'bg-warning/5 border-warning'
              }`}
            >
              <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${
                flag.severity === 'high' ? 'text-destructive' : 'text-warning'
              }`} />
              <span className="text-sm text-foreground">{flag.text}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default FounderTeamCard;
