import { motion } from 'framer-motion';
import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const growthData = [
  { month: 'Jan', users: 1200, revenue: 15000 },
  { month: 'Feb', users: 1800, revenue: 22000 },
  { month: 'Mar', users: 2400, revenue: 28000 },
  { month: 'Apr', users: 3200, revenue: 38000 },
  { month: 'May', users: 4500, revenue: 52000 },
  { month: 'Jun', users: 6100, revenue: 71000 },
];

const TractionGrowthCard = () => {
  const metrics = [
    { label: 'MRR', value: '$71K', change: '+36%', positive: true },
    { label: 'Active Users', value: '6,100', change: '+35%', positive: true },
    { label: 'Churn Rate', value: '2.1%', change: '-0.5%', positive: true },
    { label: 'NPS Score', value: '72', change: '+8', positive: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="bg-card rounded-2xl border border-border shadow-lg p-6"
    >
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-secondary" />
        Traction & Growth
      </h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {metrics.map((metric) => (
          <div key={metric.label} className="p-3 rounded-xl bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
            <p className="text-lg font-bold text-foreground">{metric.value}</p>
            <p className={`text-xs flex items-center gap-0.5 ${metric.positive ? 'text-success' : 'text-destructive'}`}>
              {metric.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {metric.change} MoM
            </p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={growthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Line
              type="monotone"
              dataKey="users"
              stroke="hsl(var(--secondary))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--secondary))' }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--success))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--success))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-secondary" />
          <span className="text-sm text-muted-foreground">Users</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="text-sm text-muted-foreground">Revenue ($)</span>
        </div>
      </div>

      {/* Growth Analysis */}
      <div className="mt-4 p-4 rounded-xl bg-success/5 border border-success/20">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-success">Strong growth trajectory.</span> The startup 
          demonstrates consistent 35%+ MoM growth with improving unit economics. Customer acquisition 
          cost has decreased 22% while LTV has increased 18% over the past quarter.
        </p>
      </div>
    </motion.div>
  );
};

export default TractionGrowthCard;
