import { motion } from 'framer-motion';
import { Globe, TrendingUp, CheckCircle } from 'lucide-react';


interface MarketMetric {
  metric: string;
  value: string;
  status?: string;
}

interface MarketOpportunityCardProps {
  metrics: MarketMetric[];
  problemClarity?: string;
  aiMarketAnalysis?: string;
}

const MarketOpportunityCard = ({ metrics, problemClarity, aiMarketAnalysis }: MarketOpportunityCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="bg-card rounded-2xl border border-border shadow-lg p-6"
    >
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Globe className="h-5 w-5 text-secondary" />
        Market Opportunity
      </h2>

      {/* Problem Clarity */}
      {problemClarity && (
        <div className="mb-4 p-4 rounded-xl bg-success/5 border border-success/20">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-success mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground text-sm">Problem Clarity: {problemClarity}</p>
            </div>
          </div>
        </div>
      )}

      {/* Market Data Table */}
      <div className="rounded-xl border border-border overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-3 font-medium text-foreground">Metric</th>
              <th className="text-right p-3 font-medium text-foreground">Value</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((row, i) => (
              <tr key={i} className="border-t border-border">
                <td className="p-3 text-muted-foreground">{row.metric}</td>
                <td className="p-3 text-right">
                  <span className={`font-medium ${
                    row.status === 'positive' ? 'text-success' : 
                    row.status === 'verified' ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {row.value}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI Commentary */}
      {aiMarketAnalysis && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-secondary/5 to-primary/5 border border-secondary/10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-sm font-medium text-foreground">AI Market Analysis</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {aiMarketAnalysis}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default MarketOpportunityCard;
