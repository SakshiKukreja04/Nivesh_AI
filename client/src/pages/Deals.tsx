import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileText, Calendar, TrendingUp, Eye, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';

const mockDeals = [
  {
    id: 'techflow-ai',
    name: 'TechFlow AI',
    date: '2025-01-10',
    stage: 'Series A',
    sector: 'SaaS',
    decision: 'proceed',
    confidence: 87,
  },
  {
    id: 'healthpulse',
    name: 'HealthPulse',
    date: '2025-01-08',
    stage: 'Seed',
    sector: 'Healthtech',
    decision: 'monitor',
    confidence: 62,
  },
  {
    id: 'edulearn',
    name: 'EduLearn Pro',
    date: '2025-01-05',
    stage: 'Pre-Seed',
    sector: 'Edtech',
    decision: 'reject',
    confidence: 34,
  },
  {
    id: 'greentech',
    name: 'GreenTech Solutions',
    date: '2024-12-28',
    stage: 'Series A',
    sector: 'Climate',
    decision: 'proceed',
    confidence: 79,
  },
];

const Deals = () => {
  return (
    <Layout isLoggedIn>
      <div className="py-12 relative">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-secondary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">My Deal Reports</h1>
            <p className="text-muted-foreground">
              Review and access all your analyzed startups.
            </p>
          </motion.div>

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">
                      Startup
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-foreground hidden sm:table-cell">
                      Date
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-foreground hidden md:table-cell">
                      Stage
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-foreground hidden md:table-cell">
                      Sector
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">
                      Decision
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-foreground hidden sm:table-cell">
                      Confidence
                    </th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockDeals.map((deal, index) => (
                    <motion.tr
                      key={deal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-secondary" />
                          </div>
                          <span className="font-medium text-foreground">{deal.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 hidden sm:table-cell">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">{deal.date}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 hidden md:table-cell">
                        <span className="px-2 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                          {deal.stage}
                        </span>
                      </td>
                      <td className="py-4 px-6 hidden md:table-cell">
                        <span className="px-2 py-1 rounded-full bg-secondary/10 text-xs font-medium text-secondary">
                          {deal.sector}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            deal.decision === 'proceed'
                              ? 'bg-proceed text-proceed-foreground'
                              : deal.decision === 'monitor'
                              ? 'bg-monitor text-monitor-foreground'
                              : 'bg-reject text-reject-foreground'
                          }`}
                        >
                          {deal.decision}
                        </span>
                      </td>
                      <td className="py-4 px-6 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                deal.confidence >= 70
                                  ? 'bg-success'
                                  : deal.confidence >= 50
                                  ? 'bg-warning'
                                  : 'bg-destructive'
                              }`}
                              style={{ width: `${deal.confidence}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {deal.confidence}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/dashboard/${deal.id}`}>
                            <Eye className="h-4 w-4" />
                            View
                          </Link>
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Empty State */}
          {mockDeals.length === 0 && (
            <div className="text-center py-16">
              <div className="h-16 w-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No deals yet</h3>
              <p className="text-muted-foreground mb-6">
                Start by analyzing your first startup.
              </p>
              <Button variant="gradient" asChild>
                <Link to="/upload">
                  <TrendingUp className="h-5 w-5" />
                  Analyze a Startup
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Deals;
