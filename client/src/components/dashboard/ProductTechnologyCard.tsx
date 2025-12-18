import { motion } from 'framer-motion';
import { Cpu, CheckCircle, AlertTriangle, Shield } from 'lucide-react';

const ProductTechnologyCard = () => {
  const techStack = [
    'React', 'Node.js', 'PostgreSQL', 'AWS', 'TensorFlow', 'Python', 'Redis', 'Kubernetes'
  ];

  const readinessData = [
    { metric: 'MVP Built', status: 'Yes', positive: true },
    { metric: 'Paying Users', status: 'Yes (120+)', positive: true },
    { metric: 'AI Dependency', status: 'Medium', positive: null },
    { metric: 'Differentiation', status: 'High', positive: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card rounded-2xl border border-border shadow-lg p-6"
    >
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Cpu className="h-5 w-5 text-secondary" />
        Product & Technology
      </h2>

      {/* Product Overview */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          TechFlow AI is a cloud-based workflow automation platform that uses proprietary ML models 
          to learn and replicate complex business processes. The product features intelligent task 
          routing, predictive resource allocation, and automated compliance checking. Built on a 
          modern microservices architecture with 99.9% uptime SLA.
        </p>
      </div>

      {/* Tech Stack Pills */}
      <div className="mb-4">
        <p className="text-sm font-medium text-foreground mb-2">Tech Stack</p>
        <div className="flex flex-wrap gap-2">
          {techStack.map((tech) => (
            <span 
              key={tech}
              className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-medium"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Defensibility */}
      <div className="mb-4 p-4 rounded-xl bg-muted/50 space-y-2">
        <p className="text-sm font-medium text-foreground flex items-center gap-2">
          <Shield className="h-4 w-4 text-secondary" />
          Defensibility Notes
        </p>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
            <span className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Data Moat:</span> Proprietary dataset of 10M+ workflow patterns
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
            <span className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">IP Protection:</span> 2 patents pending on ML optimization algorithms
            </span>
          </li>
          <li className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <span className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">AI Dependency:</span> Core models require ongoing training investment
            </span>
          </li>
        </ul>
      </div>

      {/* Product Readiness Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-3 font-medium text-foreground">Metric</th>
              <th className="text-right p-3 font-medium text-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {readinessData.map((row, i) => (
              <tr key={i} className="border-t border-border">
                <td className="p-3 text-muted-foreground">{row.metric}</td>
                <td className="p-3 text-right">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                    row.positive === true ? 'bg-success/10 text-success' : 
                    row.positive === false ? 'bg-destructive/10 text-destructive' : 
                    'bg-warning/10 text-warning'
                  }`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default ProductTechnologyCard;
