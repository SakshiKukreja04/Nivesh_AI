
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, CheckCircle, AlertTriangle, Shield } from 'lucide-react';
import { useParams } from 'react-router-dom';


interface ProductTechSignals {
  sector: 'healthtech' | 'saas' | 'fintech' | 'unknown';
  productSummary: string;
  polishedSummary: string;
  keyMetrics: Record<string, string | number>;
  defensibility: { pros: string[]; cons: string[] };
  rawEvidence: Array<{ section: string; snippet: string }>;
  MVP?: string;
  metricsComparison?: Record<string, string>;
}

const ProductTechnologyCard = ({ productTech }: { productTech?: ProductTechSignals }) => {
  if (!productTech) {
    return (
      <motion.div className="bg-card rounded-2xl border border-border shadow-lg p-6 text-center text-muted-foreground">
        No product or technology data available for this startup.
      </motion.div>
    );
  }

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

      {/* MVP Status */}
      {productTech.MVP && (
        <div className="mb-2">
          <span className="text-xs font-semibold text-muted-foreground">MVP Status:</span>
          <span className="ml-2 font-medium text-foreground">{productTech.MVP}</span>
        </div>
      )}

      {/* Polished Product Summary */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {productTech.polishedSummary || productTech.productSummary || 'No product summary available.'}
        </p>
      </div>

      {/* Key Metrics Table */}
      {productTech.keyMetrics && Object.keys(productTech.keyMetrics).length > 0 && (
        <div className="mb-4 rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-medium text-foreground">Metric</th>
                <th className="text-right p-3 font-medium text-foreground">Value</th>
                <th className="text-right p-3 font-medium text-foreground">Comparison</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(productTech.keyMetrics).map(([metric, value]) => (
                <tr key={metric} className="border-t border-border">
                  <td className="p-3 text-muted-foreground">{metric}</td>
                  <td className="p-3 text-right text-foreground">{value}</td>
                  <td className="p-3 text-right text-muted-foreground">
                    {productTech.metricsComparison && productTech.metricsComparison[`${metric}VsAvg`] ? productTech.metricsComparison[`${metric}VsAvg`] : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Defensibility Pros/Cons */}
      <div className="mb-4 p-4 rounded-xl bg-muted/50 space-y-2">
        <p className="text-sm font-medium text-foreground flex items-center gap-2">
          <Shield className="h-4 w-4 text-secondary" />
          Defensibility
        </p>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <p className="text-xs font-semibold text-success mb-1 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Pros</p>
            <ul className="list-disc ml-5 space-y-1">
              {productTech.defensibility.pros.length > 0 ? productTech.defensibility.pros.map((pro, i) => (
                <li key={i} className="text-xs text-muted-foreground">{pro}</li>
              )) : <li className="text-xs text-muted-foreground">Not specified</li>}
            </ul>
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-destructive mb-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Cons</p>
            <ul className="list-disc ml-5 space-y-1">
              {productTech.defensibility.cons.length > 0 ? productTech.defensibility.cons.map((con, i) => (
                <li key={i} className="text-xs text-muted-foreground">{con}</li>
              )) : <li className="text-xs text-muted-foreground">Not specified</li>}
            </ul>
          </div>
        </div>
      </div>

      {/* Evidence (for explainability) */}
      {productTech.rawEvidence && productTech.rawEvidence.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">Evidence</p>
          <ul className="list-disc ml-5 space-y-1">
            {productTech.rawEvidence.map((ev, i) => (
              <li key={i} className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">[{ev.section}]</span> {ev.snippet}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
};

export default ProductTechnologyCard;
