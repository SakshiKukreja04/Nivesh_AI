import { motion } from 'framer-motion';
import { Swords, TrendingUp, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

interface Competitor {
  name: string;
  region?: string;
  pricing_summary?: string;
  differentiator?: string;
}

const CompetitiveLandscapeCard = ({ sector }: { sector?: string }) => {
  const { startupId } = useParams();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLandscape = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = sector ? `?sector=${encodeURIComponent(sector)}` : '';
        const res = await fetch(`/api/competitive-landscape${query}`);
        const data = await res.json();
        if (data.success) {
          if (data.entries) setCompetitors(data.entries);
          else if (data.data && sector) {
            // when API returns whole document under `data`
            const key = Object.keys(data.data).find(k => k.toLowerCase() === sector?.toLowerCase());
            setCompetitors(key ? data.data[key] : []);
          } else if (Array.isArray(data.data)) {
            setCompetitors(data.data);
          } else {
            setCompetitors([]);
          }
        } else if (res.ok) {
          // fallback parsed response
          const entries = (data && data.entries) || [];
          setCompetitors(entries);
        } else {
          setError(data.error || 'Failed to load competitive landscape');
        }
      } catch (err) {
        console.error('[CompetitiveLandscapeCard] fetch error:', err);
        setError('Failed to fetch competitive landscape');
      } finally {
        setLoading(false);
      }
    };

    fetchLandscape();
  }, [sector, startupId]);

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

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading competitors...</div>
      ) : error ? (
        <div className="text-sm text-destructive">{error}</div>
      ) : competitors && competitors.length > 0 ? (
        <>
          <div className="rounded-xl border border-border overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-3 font-medium text-foreground">Competitor</th>
                  <th className="text-left p-3 font-medium text-foreground">Region</th>
                  <th className="text-left p-3 font-medium text-foreground">Pricing</th>
                  <th className="text-left p-3 font-medium text-foreground">Differentiator</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((comp, i) => (
                  <tr key={i} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium text-foreground">{comp.name}</td>
                    <td className="p-3 text-muted-foreground">{comp.region || comp.region}</td>
                    <td className="p-3 text-muted-foreground">{comp.pricing_summary || '-'}</td>
                    <td className="p-3 text-muted-foreground">{comp.differentiator || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-success/5 border border-success/20">
              <div className="flex items-start gap-2">
                <TrendingUp className="h-5 w-5 text-success mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-sm">Competitive Advantage</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    The competitors shown are automatically retrieved for the sector. Compare positioning, pricing, and differentiators to identify whitespace and product gap.
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
                    Review competitors' differentiators and pricing to assess routes to market and key risks from incumbents.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-sm text-muted-foreground">No competitors found for this sector.</div>
      )}
    </motion.div>
  );
};

export default CompetitiveLandscapeCard;
