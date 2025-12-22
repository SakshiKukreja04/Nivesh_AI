import { motion } from 'framer-motion';
import { Users, CheckCircle, AlertTriangle, GraduationCap, Briefcase, Award, Flag } from 'lucide-react';

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
  experience?: string | { value: string; source: string };
  education?: string | { value: string; source: string };
  aiAnalysis?: string;
}

interface TeamInfo {
  members: TeamMember[];
  totalMembers: number;
}

interface FounderTeamCardProps {
  founderVerification?: FounderVerification | null;
  teamInfo?: TeamInfo | null;
}

/**
 * Generates explanation for founder score based on signals and red flags
 */
function generateFounderExplanation(founderVerification: FounderVerification | null): {
  explanation: string;
  flagType: 'green' | 'red' | 'neutral';
  reasons: string[];
} {
  if (!founderVerification) {
    return {
      explanation: 'Founder verification data not available.',
      flagType: 'neutral',
      reasons: [],
    };
  }

  const { founderStrengthScore, signals, redFlags, role } = founderVerification;
  const reasons: string[] = [];

  if (founderStrengthScore >= 7) {
    // Green flag - explain positive factors
    if (signals.experienceYears > 8) {
      reasons.push(`Strong experience: ${signals.experienceYears} years in the industry`);
    }
    if (signals.pastCompanies.length > 0) {
      const topTechCompanies = ['Google', 'Microsoft', 'Apple', 'Amazon', 'Facebook', 'Meta', 'Salesforce', 'Oracle', 'IBM', 'Adobe', 'Intel', 'Nvidia', 'Tesla', 'Uber', 'Airbnb', 'Stripe', 'Palantir', 'Snowflake', 'Databricks', 'OpenAI', 'Anthropic'];
      const hasTopTech = signals.pastCompanies.some(company => 
        topTechCompanies.some(top => company.toLowerCase().includes(top.toLowerCase()))
      );
      if (hasTopTech) {
        reasons.push(`Ex-top tech company experience: ${signals.pastCompanies.filter(c => topTechCompanies.some(t => c.toLowerCase().includes(t.toLowerCase()))).join(', ')}`);
      } else {
        reasons.push(`Previous companies: ${signals.pastCompanies.slice(0, 3).join(', ')}`);
      }
    }
    if (signals.roles.some(r => /(founder|co-founder|ceo|cto|vp|director|manager)/i.test(r))) {
      reasons.push(`Leadership roles: ${signals.roles.filter(r => /(founder|co-founder|ceo|cto|vp|director|manager)/i.test(r)).slice(0, 2).join(', ')}`);
    }
    if (signals.domainAlignment.length > 0) {
      reasons.push(`Domain alignment: ${signals.domainAlignment.join(', ')}`);
    }
    if (signals.education.length > 0) {
      reasons.push(`Education: ${signals.education.slice(0, 2).join(', ')}`);
    }

    return {
      explanation: `${role} demonstrates strong qualifications with a founder strength score of ${founderStrengthScore}/10. The assessment indicates a well-qualified candidate with relevant experience and credentials.`,
      flagType: 'green',
      reasons,
    };
  } else if (founderStrengthScore < 6) {
    // Red flag - explain concerns
    if (signals.experienceYears < 5) {
      reasons.push(`Limited experience: Only ${signals.experienceYears} years of experience`);
    }
    if (redFlags.length > 0) {
      redFlags.forEach(flag => {
        if (flag.includes('Average tenure < 1.2 years')) {
          reasons.push(`Short tenure: ${flag}`);
        } else if (flag.includes('Leadership joined < 6 months')) {
          reasons.push(`Recent hire: ${flag}`);
        } else if (flag.includes('Only Individual Contributor')) {
          reasons.push(`Lack of leadership: ${flag}`);
        } else {
          reasons.push(flag);
        }
      });
    }
    if (signals.pastCompanies.length === 0) {
      reasons.push('No previous company experience listed');
    }
    if (signals.roles.length === 0) {
      reasons.push('No clear role history');
    }
    if (signals.domainAlignment.length === 0) {
      reasons.push('No clear domain alignment');
    }

    return {
      explanation: `${role} has a founder strength score of ${founderStrengthScore}/10, which falls below the acceptable threshold. Several concerns have been identified that may impact the startup's success.`,
      flagType: 'red',
      reasons,
    };
  } else {
    // Neutral (6-7)
    const positiveReasons: string[] = [];
    const concerns: string[] = [];

    if (signals.experienceYears >= 5) {
      positiveReasons.push(`${signals.experienceYears} years of experience`);
    } else {
      concerns.push(`Limited experience: ${signals.experienceYears} years`);
    }

    if (signals.pastCompanies.length > 0) {
      positiveReasons.push(`Previous companies: ${signals.pastCompanies.slice(0, 2).join(', ')}`);
    }

    if (redFlags.length > 0) {
      concerns.push(...redFlags.slice(0, 2));
    }

    return {
      explanation: `${role} has a founder strength score of ${founderStrengthScore}/10, indicating moderate qualifications. The assessment shows a mix of positive factors and areas for improvement.`,
      flagType: 'neutral',
      reasons: [...positiveReasons, ...concerns],
    };
  }
}

const FounderTeamCard = ({ founderVerification, teamInfo }: FounderTeamCardProps) => {
  const founderScore = founderVerification?.founderStrengthScore ?? 0;
  const explanation = generateFounderExplanation(founderVerification);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card rounded-2xl border border-border shadow-lg p-6"
    >
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Users className="h-4 w-5 text-secondary" />
        Founder & Team Assessment
      </h2>

      {/* Founder Strength Score */}
      <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-secondary/5 to-primary/5 border border-secondary/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Founder Strength Score</span>
          <span className="text-2xl font-bold text-foreground">{founderScore.toFixed(1)}<span className="text-sm text-muted-foreground font-normal">/10</span></span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <motion.div 
            className="h-full rounded-full bg-gradient-to-r from-secondary to-success"
            initial={{ width: 0 }}
            animate={{ width: `${founderScore * 10}%` }}
            transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Weak</span>
          <span>Strong</span>
        </div>
      </div>

      {/* Founder Explanation */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Flag className={`h-4 w-4 ${
            explanation.flagType === 'green' 
              ? 'text-success' 
              : explanation.flagType === 'red' 
              ? 'text-destructive' 
              : 'text-muted-foreground'
          }`} />
          <p className="text-sm font-medium text-foreground">
            {explanation.flagType === 'green' 
              ? 'Green Flag - Strong Founder' 
              : explanation.flagType === 'red' 
              ? 'Red Flag - Concerns Identified' 
              : 'Neutral Assessment'}
          </p>
        </div>
        
        <div className={`p-4 rounded-lg border-l-4 ${
          explanation.flagType === 'green'
            ? 'bg-success/5 border-success'
            : explanation.flagType === 'red'
            ? 'bg-destructive/5 border-destructive'
            : 'bg-muted/50 border-muted-foreground'
        }`}>
          <p className="text-sm text-foreground mb-3">{explanation.explanation}</p>
          
          {explanation.reasons.length > 0 && (
            <div className="space-y-2">
              {explanation.reasons.map((reason, i) => (
                <div key={i} className="flex items-start gap-2">
                  {explanation.flagType === 'green' ? (
                    <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  ) : explanation.flagType === 'red' ? (
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground mt-0.5 shrink-0" />
                  )}
                  <span className="text-sm text-muted-foreground">{reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team Members Section (always show, even if empty) */}
      <div className="mt-6">
        <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-secondary" />
          Team Members{teamInfo && teamInfo.totalMembers ? ` (${teamInfo.totalMembers})` : ''}
        </p>
        <div className="space-y-3">
          {teamInfo && teamInfo.members.length > 0 ? (
            teamInfo.members.map((member, i) => (
              <div 
                key={i}
                className="p-3 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase className="h-4 w-4 text-secondary shrink-0" />
                      <span className="font-medium text-foreground">{member.name}</span>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm font-medium text-secondary">{member.role}</span>
                    </div>
                    {/* AI-generated role importance analysis */}
                    {member.aiAnalysis && (
                      <p className="text-xs text-primary ml-6 font-semibold">AI Analysis: {member.aiAnalysis}</p>
                    )}
                    {member.background && (
                      <p className="text-xs text-muted-foreground ml-6">{member.background}</p>
                    )}
                    {/* Experience: Only show if pitch_deck or synthetic */}
                    {member.experience && typeof member.experience === 'object' && member.experience.source === 'pitch_deck' && (
                      <p className="text-xs text-muted-foreground ml-6">Experience: {member.experience.value}</p>
                    )}
                    {member.experience && typeof member.experience === 'object' && member.experience.source === 'synthetic' && (
                      <p className="text-xs text-muted-foreground ml-6"><i>Experience: Not disclosed in pitch deck</i></p>
                    )}
                    {/* Education: Only show if pitch_deck or synthetic */}
                    {member.education && typeof member.education === 'object' && member.education.source === 'pitch_deck' && (
                      <p className="text-xs text-muted-foreground ml-6">Education: {member.education.value}</p>
                    )}
                    {member.education && typeof member.education === 'object' && member.education.source === 'synthetic' && (
                      <p className="text-xs text-muted-foreground ml-6"><i>Education: Not disclosed in pitch deck</i></p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground ml-6">No team members found.</div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default FounderTeamCard;
