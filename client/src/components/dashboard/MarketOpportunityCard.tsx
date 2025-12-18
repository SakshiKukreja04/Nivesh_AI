import { motion } from 'framer-motion';
import { Globe, TrendingUp, CheckCircle } from 'lucide-react';

const MarketOpportunityCard = () => {
  const marketData = [
    { metric: 'TAM (Validated)', value: '$45B', status: 'verified' },
    { metric: 'SAM', value: '$8.5B', status: 'verified' },
    { metric: 'SOM (Year 3)', value: '$850M', status: 'projected' },
    { metric: 'Market Growth Rate', value: '23% CAGR', status: 'positive' },
  ];

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
      <div className="mb-4 p-4 rounded-xl bg-success/5 border border-success/20">
        <div className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-success mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-foreground text-sm">Problem Clarity: High</p>
            <p className="text-sm text-muted-foreground mt-1">
              Clear pain point identified: SMBs spend 15+ hours/week on manual workflow management. 
              TechFlow reduces this by 80% with AI automation.
            </p>
          </div>
        </div>
      </div>

      {/* Target Persona */}
      <div className="mb-4 p-4 rounded-xl bg-muted/50">
        <p className="text-sm font-medium text-foreground mb-1">Target Persona</p>
        <p className="text-sm text-muted-foreground">
          Operations managers and department heads at companies with 50-500 employees in tech, 
          finance, and professional services sectors. Decision makers with budget authority 
          seeking productivity tools.
        </p>
      </div>

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
            {marketData.map((row, i) => (
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
      <div className="p-4 rounded-xl bg-gradient-to-br from-secondary/5 to-primary/5 border border-secondary/10">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-success" />
          <span className="text-sm font-medium text-foreground">AI Market Analysis</span>
        </div>
        <p className="text-sm text-muted-foreground">
          The workflow automation market is experiencing strong growth, driven by post-pandemic 
          digital transformation initiatives. The sector is <span className="text-success font-medium">expanding</span>, 
          not saturated, with significant whitespace in the mid-market segment. TechFlow's 
          AI-first approach positions it well against legacy competitors.
        </p>
      </div>
    </motion.div>
  );
};

export default MarketOpportunityCard;
