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

// Dynamic risk and radar data
const getRiskLevel = (risk: string) => {
  // Simple heuristic: look for keywords
  if (/critical|lack|no|insufficient|major|severe|0 years|red flag|concentration|runway|burn|dependency|key person|founder|fraud|legal|compliance|high/.test(risk.toLowerCase())) return 'high';
  if (/inconsistent|moderate|some|partial|medium|competition|pressure|churn|attrition|education|credentials|team|experience/.test(risk.toLowerCase())) return 'medium';
  return 'low';
};

function getDynamicRadarData(ragAnalysis: any) {
  // Example: assign lower risk score if more risks
  const riskScore = ragAnalysis?.topRisks ? Math.max(100 - ragAnalysis.topRisks.length * 20, 40) : 65;
  return [
    { subject: 'Team', A: 85, fullMark: 100 },
    { subject: 'Market', A: 78, fullMark: 100 },
    { subject: 'Product', A: 92, fullMark: 100 },
    { subject: 'Traction', A: 70, fullMark: 100 },
    { subject: 'Risk', A: riskScore, fullMark: 100 },
  ];
}

function getDynamicRiskDistribution(ragAnalysis: any) {
  if (!ragAnalysis?.topRisks) return [
    { name: 'Low Risk', value: 45, color: 'hsl(var(--success))' },
    { name: 'Medium Risk', value: 35, color: 'hsl(var(--warning))' },
    { name: 'High Risk', value: 20, color: 'hsl(var(--destructive))' },
  ];
  let high = 0, medium = 0, low = 0;
  ragAnalysis.topRisks.forEach((risk: string) => {
    const lvl = getRiskLevel(risk);
    if (lvl === 'high') high++;
    else if (lvl === 'medium') medium++;
    else low++;
  });
  const total = Math.max(1, ragAnalysis.topRisks.length);
  return [
    { name: 'Low Risk', value: Math.round((low / total) * 100), color: 'hsl(var(--success))' },
    { name: 'Medium Risk', value: Math.round((medium / total) * 100), color: 'hsl(var(--warning))' },
    { name: 'High Risk', value: Math.round((high / total) * 100), color: 'hsl(var(--destructive))' },
  ];
}

function getDynamicRisks(ragAnalysis: any) {
  if (!ragAnalysis?.topRisks) return [];
  return ragAnalysis.topRisks.map((risk: string) => ({ level: getRiskLevel(risk), text: risk }));
}

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

  // Extracted startup metadata and claims (replace with real API data)
  const [startupMetadata, setStartupMetadata] = useState<any>(null);
  const [startupClaims, setStartupClaims] = useState<any[]>([]);

  const [executiveSummary, setExecutiveSummary] = useState<string>("");
  const [ragAnalysis, setRagAnalysis] = useState<any>(null);
  const [marketOpportunity, setMarketOpportunity] = useState<any>(null);

  // Confidence/decision logic
  const [confidenceLevel, setConfidenceLevel] = useState<string>('N/A');
  const [decision, setDecision] = useState<string>('N/A');

  useEffect(() => {
    // Compute confidence and decision based on risks
    if (ragAnalysis && ragAnalysis.topRisks) {
      const totalRisks = ragAnalysis.topRisks.length;
      // Heuristic: 0-1 risks = High, 2 = Medium, 3+ = Low
      let conf = 'N/A';
      let dec = 'N/A';
      if (totalRisks === 0) {
        conf = 'High conviction';
        dec = 'PROCEED';
      } else if (totalRisks === 1) {
        conf = 'High conviction';
        dec = 'PROCEED';
      } else if (totalRisks === 2) {
        conf = 'Moderate';
        dec = 'PROCEED';
      } else if (totalRisks >= 3) {
        conf = 'Low';
        dec = 'REJECT';
      }
      setConfidenceLevel(conf);
      setDecision(dec);
    } else {
      setConfidenceLevel('N/A');
      setDecision('N/A');
    }
  }, [ragAnalysis]);
  useEffect(() => {
    if (startupId) {
      // Fetch startup metadata, claims, summary, and market opportunity from new S3-backed endpoint
      fetch(`/api/startup/${startupId}/metadata`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setStartupMetadata(data.metadata || data.metadata || data);
            setStartupClaims(data.claims || []);
            setExecutiveSummary(data.summary || '');
            setMarketOpportunity(data.marketOpportunity || null);
            setRagAnalysis(data.analysis || data.ragAnalysis || null);
          }
        })
        .catch(err => {
          console.error('[Dashboard] Error fetching startup metadata/claims:', err);
        });
    }
  }, [startupId]);

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
                  <h1 className="text-2xl font-bold text-foreground">
                    {startupMetadata?.startupName || startupMetadata?.name || 'Startup'}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {startupMetadata?.stage || 'N/A'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-xs font-medium text-secondary">
                      {startupMetadata?.sector || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                {/* PDF Export */}
                <PDFExportButton startupData={startupMetadata} />

                {/* Decision Badge */}
                <div className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground mb-1">Decision</span>
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className={`px-6 py-2 rounded-full font-bold shadow-success ${decision === 'PROCEED' ? 'bg-proceed text-proceed-foreground' : decision === 'REJECT' ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground'}`}
                  >
                    {decision}
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
                        stroke={confidenceLevel === 'High conviction' ? 'hsl(var(--success))' : confidenceLevel === 'Moderate' ? 'hsl(var(--warning))' : confidenceLevel === 'Low' ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))'}
                        strokeWidth="8"
                        strokeLinecap="round"
                        initial={{ strokeDasharray: '0 251' }}
                        animate={{ strokeDasharray: `${confidenceLevel === 'High conviction' ? 251 : confidenceLevel === 'Moderate' ? 180 : confidenceLevel === 'Low' ? 80 : 0} 251` }}
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
                        {confidenceLevel === 'High conviction' ? 'A' : confidenceLevel === 'Moderate' ? 'B' : confidenceLevel === 'Low' ? 'C' : 'N/A'}
                      </motion.span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Confidence</p>
                    <p className={`text-xs ${confidenceLevel === 'High conviction' ? 'text-success' : confidenceLevel === 'Moderate' ? 'text-warning' : confidenceLevel === 'Low' ? 'text-destructive' : 'text-muted-foreground'}`}>{confidenceLevel}</p>
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
                  {executiveSummary || "No summary available."}
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
                {/* RAG Analysis Section */}
                {ragAnalysis && (
                  <div className="mt-6">
                    <h3 className="text-md font-semibold text-foreground mb-2 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-secondary" />
                      RAG Analysis
                    </h3>
                    <div className="mb-2">
                      <span className="font-semibold">Summary:</span>
                      <span className="ml-2 text-muted-foreground">{ragAnalysis.summary}</span>
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Top Risks:</span>
                      <ul className="list-disc ml-6">
                        {ragAnalysis.topRisks && ragAnalysis.topRisks.map((risk: string, idx: number) => (
                          <li key={idx} className="text-xs text-destructive">{risk}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Team Assessment:</span>
                      <span className="ml-2 text-muted-foreground">{ragAnalysis.teamAssessment}</span>
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Market Outlook:</span>
                      <span className="ml-2 text-muted-foreground">{ragAnalysis.marketOutlook}</span>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Startup Snapshot - dynamic metadata and claims */}
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
                {startupMetadata ? (
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    {[
                      { label: 'Startup Name', value: startupMetadata.startupName },
                      { label: 'Location', value: startupMetadata.location },
                      { label: 'Stage', value: startupMetadata.stage },
                      { label: 'Sector', value: startupMetadata.sector },
                      { label: 'Business Model', value: startupMetadata.businessModel },
                      { label: 'Website', value: startupMetadata.website },
                      { label: 'Funding Raised', value: startupMetadata.fundingRaised },
                      { label: 'Team Size', value: startupMetadata.teamSize },
                      { label: 'Additional Notes', value: startupMetadata.additionalNotes },
                      { label: 'Role', value: startupMetadata.role },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <span className="text-xs text-muted-foreground font-semibold">{label}</span>
                        <span className="font-medium text-foreground">{value ? String(value) : 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">No metadata found.</div>
                )}
                <h3 className="text-sm font-semibold text-foreground mb-2 mt-2">Extracted Claims</h3>
                {startupClaims && startupClaims.length > 0 ? (
                  <ul className="list-disc ml-6">
                    {startupClaims.map((claim, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground">
                        <span className="font-semibold">{claim.claim}:</span> {claim.value ? claim.value : ''}
                        {claim.confidence && (
                          <span className="ml-2 text-[10px] text-success">(Confidence: {claim.confidence})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-muted-foreground">No claims extracted.</div>
                )}
              </motion.div>

              {/* Founder & Team - Expanded */}
              <FounderTeamCard founderVerification={founderVerification} teamInfo={teamInfo} />


              {/* Market Assessment & AI Analysis */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-2xl border border-border shadow-lg p-6"
              >
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-secondary" />
                  Market Assessment
                </h2>
                {marketOpportunity ? (
                  <>
                    <div className="grid sm:grid-cols-2 gap-4 mb-4">
                      {[
                        { label: 'TAM (Validated)', value: marketOpportunity.validatedTAM ? `$${marketOpportunity.validatedTAM.toLocaleString()}` : 'N/A' },
                        { label: 'SAM', value: marketOpportunity.SAM ? `$${marketOpportunity.SAM.toLocaleString()}` : 'N/A' },
                        { label: 'SOM (Year 3)', value: marketOpportunity.SOM ? `$${marketOpportunity.SOM.toLocaleString()}` : 'N/A' },
                        { label: 'Market Growth Rate', value: marketOpportunity.growthRate ? `${marketOpportunity.growthRate}% CAGR` : 'N/A' },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                          <span className="text-xs text-muted-foreground font-semibold">{label}</span>
                          <span className="font-medium text-foreground">{value}</span>
                        </div>
                      ))}
                    </div>
                    {marketOpportunity.aiMarketAnalysis && (
                      <div className="mt-2">
                        <h3 className="text-sm font-semibold text-foreground mb-1">AI Market Analysis</h3>
                        <p className="text-muted-foreground leading-relaxed">{marketOpportunity.aiMarketAnalysis}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground">No market opportunity data found.</div>
                )}
              </motion.div>

              {/* Product & Technology */}
              <ProductTechnologyCard productTech={startupMetadata?.productTech} />

              {/* Traction & Growth */}
              <TractionGrowthCard />

              {/* Competitive Landscape */}
              <CompetitiveLandscapeCard sector={startupMetadata?.sector} />
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
                    <RadarChart data={getDynamicRadarData(ragAnalysis)}>
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
                  {getDynamicRisks(ragAnalysis).map((risk, i) => (
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
                        data={getDynamicRiskDistribution(ragAnalysis)}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {getDynamicRiskDistribution(ragAnalysis).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  {getDynamicRiskDistribution(ragAnalysis).map((item) => (
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
                      onClick={async () => {
                        if (!isPlaying) {
                          setIsPlaying(true);
                          const audio = document.getElementById('audio-summary') as HTMLAudioElement;
                          if (audio) {
                            audio.play();
                            audio.onended = () => setIsPlaying(false);
                          }
                        } else {
                          setIsPlaying(false);
                          const audio = document.getElementById('audio-summary') as HTMLAudioElement;
                          if (audio) audio.pause();
                        }
                      }}
                      className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground hover:bg-secondary/80 transition-all hover:scale-105 active:scale-95"
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                    </button>
                    <div className="flex-1">
                      <audio id="audio-summary" src={startupId ? `/api/audio-summary/${startupId}` : undefined} preload="none" />
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
                      <p className="text-xs text-muted-foreground">Audio summary will play when you click the button.</p>
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
