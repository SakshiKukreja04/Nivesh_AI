import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  Target,
  Lightbulb,
  BarChart3,
  Shield,
  Download,
  Play,
  Pause,
  Bookmark,
  ArrowRight,
  Globe,
  Calendar,
  DollarSign,
  Building2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Dashboard Components
import AskNiveshAIChat from '@/components/dashboard/AskNiveshAIChat';
import PDFExportButton from '@/components/dashboard/PDFExportButton';
import FounderTeamCard from '@/components/dashboard/FounderTeamCard';
import MarketOpportunityCard from '@/components/dashboard/MarketOpportunityCard';
import ProductTechnologyCard from '@/components/dashboard/ProductTechnologyCard';
import CompetitiveLandscapeCard from '@/components/dashboard/CompetitiveLandscapeCard';
import TractionGrowthCard from '@/components/dashboard/TractionGrowthCard';

const radarData = [
  { subject: 'Team', A: 85, fullMark: 100 },
  { subject: 'Market', A: 78, fullMark: 100 },
  { subject: 'Product', A: 92, fullMark: 100 },
  { subject: 'Traction', A: 70, fullMark: 100 },
  { subject: 'Risk', A: 65, fullMark: 100 },
];

const riskDistribution = [
  { name: 'Low Risk', value: 45, color: 'hsl(var(--success))' },
  { name: 'Medium Risk', value: 35, color: 'hsl(var(--warning))' },
  { name: 'High Risk', value: 20, color: 'hsl(var(--destructive))' },
];

const risks = [
  { level: 'high', text: 'Limited runway — 8 months at current burn' },
  { level: 'medium', text: 'Key person dependency on CTO' },
  { level: 'low', text: 'Competitive pressure from established players' },
];

interface FounderVerification {
  startupId: string;
  role: string;
  founderStrengthScore: number;
  signals: {
    experienceYears: number;
    pastCompanies: string[];
    roles: string[];
    education: string[];
    domainAlignment: string[];
  };
  redFlags: string[];
}

interface TeamMember {
  name: string;
  role: string;
  background?: string;
  experience?: string;
  education?: string;
}

interface TeamInfo {
  members: TeamMember[];
  totalMembers: number;
}

const Dashboard = () => {
  const { startupId } = useParams();
  const [isPlaying, setIsPlaying] = useState(false);
  const [founderVerification, setFounderVerification] = useState<FounderVerification | null>(null);
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);

  const startupData = {
    name: 'TechFlow AI',
    stage: 'Series A',
    sector: 'SaaS',
    decision: 'proceed' as const,
    confidenceScore: 87,
  };

  useEffect(() => {
    if (startupId) {
      // Fetch founder verification
      console.log(`[Dashboard] Fetching founder verification for startupId: ${startupId}`);
      fetch(`/api/founder-verification/${startupId}`)
        .then(res => {
          console.log(`[Dashboard] Founder verification response status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          console.log(`[Dashboard] Founder verification data:`, JSON.stringify(data, null, 2));
          if (data.success && data.verification) {
            setFounderVerification(data.verification);
            console.log(`[Dashboard] Founder verification loaded successfully`);
          } else {
            console.warn(`[Dashboard] No founder verification found for ${startupId}`);
          }
        })
        .catch(err => {
          console.error('[Dashboard] Error fetching founder verification:', err);
        });

      // Fetch team info
      console.log(`[Dashboard] Fetching team info for startupId: ${startupId}`);
      fetch(`/api/team-info/${startupId}`)
        .then(res => {
          console.log(`[Dashboard] Team info response status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          console.log(`[Dashboard] Team info data:`, JSON.stringify(data, null, 2));
          if (data.success && data.teamInfo) {
            setTeamInfo(data.teamInfo);
            console.log(`[Dashboard] Team info loaded successfully`);
          } else {
            console.warn(`[Dashboard] No team info found for ${startupId}`);
          }
        })
        .catch(err => {
          console.error('[Dashboard] Error fetching team info:', err);
        });
    }
  }, [startupId]);

  return (
    <Layout isLoggedIn>
      <div className="py-8 relative">
        {/* Background */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-secondary/5 rounded-full blur-3xl blob-animation" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl blob-animation" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-success/3 rounded-full blur-3xl blob-animation" style={{ animationDelay: '4s' }} />
        </div>

        <div className="container">
          {/* Top Summary Bar */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border shadow-lg p-6 mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center">
                  <Building2 className="h-7 w-7 text-secondary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{startupData.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {startupData.stage}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-xs font-medium text-secondary">
                      {startupData.sector}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                {/* PDF Export */}
                <PDFExportButton startupData={startupData} />

                {/* Decision Badge */}
                <div className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground mb-1">Decision</span>
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className="px-6 py-2 rounded-full bg-proceed text-proceed-foreground font-bold shadow-success"
                  >
                    PROCEED
                  </motion.div>
                </div>

                {/* Confidence Score */}
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="hsl(var(--success))"
                        strokeWidth="8"
                        strokeLinecap="round"
                        initial={{ strokeDasharray: '0 251' }}
                        animate={{ strokeDasharray: `${startupData.confidenceScore * 2.51} 251` }}
                        transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.span 
                        className="text-2xl font-bold text-foreground"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                      >
                        {startupData.confidenceScore}
                      </motion.span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Confidence</p>
                    <p className="text-xs text-success">High conviction</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - 2 cols */}
            <div className="lg:col-span-2 space-y-6">
              {/* Executive Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-2xl border border-border shadow-lg p-6 card-premium"
              >
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-secondary" />
                  Executive Summary
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  TechFlow AI is a B2B SaaS platform that automates workflow management using 
                  proprietary machine learning models. The founding team has strong credentials 
                  with two prior exits in the enterprise software space. The company has demonstrated 
                  strong product-market fit with 40% month-over-month growth and 92% customer retention. 
                  Key risks include limited runway and concentration in the SMB segment.
                </p>
                <div className="mt-4 flex gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                    Strong PMF
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                    Proven Team
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium">
                    Runway Risk
                  </span>
                </div>
              </motion.div>

              {/* Startup Snapshot */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-card rounded-2xl border border-border shadow-lg p-6"
              >
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-secondary" />
                  Startup Snapshot
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { icon: Globe, label: 'Location', value: 'San Francisco, CA' },
                    { icon: Calendar, label: 'Founded', value: '2022' },
                    { icon: DollarSign, label: 'Funding', value: '$2.5M Seed' },
                    { icon: Users, label: 'Team Size', value: '15 employees' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="font-medium text-foreground">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Founder & Team - Expanded */}
              <FounderTeamCard founderVerification={founderVerification} />

              {/* Market Opportunity */}
              <MarketOpportunityCard />

              {/* Product & Technology */}
              <ProductTechnologyCard />

              {/* Traction & Growth */}
              <TractionGrowthCard />

              {/* Competitive Landscape */}
              <CompetitiveLandscapeCard />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Risk Visualization */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-2xl border border-border shadow-lg p-6"
              >
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-secondary" />
                  Risk Assessment
                </h2>
                <div className="h-48 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="subject" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <PolarRadiusAxis stroke="hsl(var(--border))" />
                      <Radar
                        name="Score"
                        dataKey="A"
                        stroke="hsl(var(--secondary))"
                        fill="hsl(var(--secondary))"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Risk Chips */}
                <div className="space-y-2">
                  {risks.map((risk, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className={`flex items-start gap-2 p-3 rounded-lg border-l-4 ${
                        risk.level === 'high'
                          ? 'bg-destructive/5 border-destructive'
                          : risk.level === 'medium'
                          ? 'bg-warning/5 border-warning'
                          : 'bg-muted border-success'
                      }`}
                    >
                      <AlertTriangle
                        className={`h-4 w-4 mt-0.5 shrink-0 ${
                          risk.level === 'high'
                            ? 'text-destructive'
                            : risk.level === 'medium'
                            ? 'text-warning'
                            : 'text-success'
                        }`}
                      />
                      <span className="text-sm text-foreground">{risk.text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Risk Distribution Pie */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-card rounded-2xl border border-border shadow-lg p-6"
              >
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-secondary" />
                  Risk Distribution
                </h2>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {riskDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  {riskDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-muted-foreground">{item.name}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Audio & Downloads */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card rounded-2xl border border-border shadow-lg p-6"
              >
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Audio Summary
                </h2>
                <div className="bg-muted rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground hover:bg-secondary/80 transition-all hover:scale-105 active:scale-95"
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                    </button>
                    <div className="flex-1">
                      <div className="flex gap-0.5 mb-1">
                        {[...Array(30)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-1 bg-secondary/40 rounded-full"
                            initial={{ height: 8 }}
                            animate={{ height: isPlaying ? Math.random() * 20 + 8 : 8 }}
                            transition={{ duration: 0.2, repeat: isPlaying ? Infinity : 0 }}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">2:34 / 5:12</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <Download className="h-4 w-4" />
                    WAV
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <Download className="h-4 w-4" />
                    PDF
                  </Button>
                </div>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="space-y-3"
              >
                <Button variant="gradient" className="w-full gap-2" size="lg">
                  <Bookmark className="h-5 w-5" />
                  Save to My Deals
                </Button>
                <Button variant="outline" className="w-full gap-2" size="lg" asChild>
                  <Link to="/upload">
                    Evaluate Another Startup
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Floating Chatbot */}
        <AskNiveshAIChat />
      </div>
    </Layout>
  );
};

export default Dashboard;
