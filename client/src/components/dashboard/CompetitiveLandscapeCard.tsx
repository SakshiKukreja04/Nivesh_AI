import { motion } from 'framer-motion';
import { Swords, TrendingUp, AlertTriangle } from 'lucide-react';

const CompetitiveLandscapeCard = () => {
  const competitors = [
    { name: 'Zapier', region: 'Global', pricing: '$20-$750/mo', differentiation: 'No-code integrations' },
    { name: 'Monday.com', region: 'Global', pricing: '$8-$16/seat', differentiation: 'Visual workflows' },
    { name: 'Notion', region: 'Global', pricing: '$8-$15/seat', differentiation: 'All-in-one workspace' },
    { name: 'Process Street', region: 'US/EU', pricing: '$25-$100/mo', differentiation: 'Checklist automation' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="bg-card rounded-2xl border border-border shadow-lg p-6"
    >
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Swords className="h-5 w-5 text-secondary" />
        Competitive Landscape
      </h2>

      {/* Competitor Table */}
      <div className="rounded-xl border border-border overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-3 font-medium text-foreground">Competitor</th>
              <th className="text-left p-3 font-medium text-foreground">Region</th>
              <th className="text-left p-3 font-medium text-foreground">Pricing</th>
              <th className="text-left p-3 font-medium text-foreground">Differentiation</th>
            </tr>
          </thead>
          <tbody>
            {competitors.map((comp, i) => (
              <tr key={i} className="border-t border-border hover:bg-muted/30 transition-colors">
                <td className="p-3 font-medium text-foreground">{comp.name}</td>
                <td className="p-3 text-muted-foreground">{comp.region}</td>
                <td className="p-3 text-muted-foreground">{comp.pricing}</td>
                <td className="p-3 text-muted-foreground">{comp.differentiation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Positioning Analysis */}
      <div className="space-y-3">
        <div className="p-4 rounded-xl bg-success/5 border border-success/20">
          <div className="flex items-start gap-2">
            <TrendingUp className="h-5 w-5 text-success mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground text-sm">Competitive Advantage</p>
              <p className="text-sm text-muted-foreground mt-1">
                TechFlow's AI-native approach enables <span className="font-medium text-success">intelligent automation</span> that 
                learns from user behavior, unlike competitors' rule-based systems. This creates 
                a significant moat as the ML models improve with scale.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-warning/5 border border-warning/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground text-sm">Competitive Risk</p>
              <p className="text-sm text-muted-foreground mt-1">
                Large incumbents (Zapier, Monday) have significant resources to build AI features. 
                TechFlow needs to <span className="font-medium text-warning">move fast</span> to establish market 
                position before competitive response materializes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CompetitiveLandscapeCard;
