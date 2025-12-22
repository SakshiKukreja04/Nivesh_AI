import { FounderSignals, FounderVerificationResult } from '../types/index.js';

/**
 * Deterministic extraction of years of experience from resume text.
 * Looks for patterns like "10 years", "5+ years", "2010-2020", etc.
 */
function extractExperienceYears(text: string): number {
  // 1. Look for "X+ years" in summary and use as cap if found
  let capYears = 0;
  const capPattern = /(\d{1,2})\+?\s*years?\s+(?:of\s+)?(?:clinical|work|professional)?\s*experience/i;
  const capMatch = text.match(capPattern);
  if (capMatch) {
    capYears = parseInt(capMatch[1], 10);
  }

  // 2. Parse all job periods, sum only non-overlapping durations
  const jobPeriods: { start: number, end: number }[] = [];
  const jobPattern = /([A-Za-z ]+)\n([A-Za-z0-9 .,&-]+)\n([A-Za-z ]+)?\n?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\s?(\d{4})\s*[–-]\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Present|Current)?\s?(\d{4})?/gmi;
  let match;
  while ((match = jobPattern.exec(text)) !== null) {
    const startYear = parseInt(match[5], 10);
    let endYear = match[7] && match[7].toLowerCase().includes('present') ? new Date().getFullYear() : parseInt(match[7], 10);
    if (!isNaN(startYear)) {
      if (isNaN(endYear) || endYear < startYear) endYear = new Date().getFullYear();
      jobPeriods.push({ start: startYear, end: endYear });
    }
  }
  // Merge overlapping periods
  jobPeriods.sort((a, b) => a.start - b.start);
  const merged: { start: number, end: number }[] = [];
  for (const period of jobPeriods) {
    if (!merged.length || period.start > merged[merged.length - 1].end) {
      merged.push({ ...period });
    } else {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, period.end);
    }
  }
  let totalYears = merged.reduce((sum, p) => sum + (p.end - p.start), 0);
  // Use cap if found and less than sum
  if (capYears > 0 && capYears < totalYears) totalYears = capYears;
  return totalYears;
}

/**
 * Extracts company names from resume text.
 * Looks for patterns in experience/employment sections.
 */
function extractPastCompanies(text: string): string[] {
  const companies: Set<string> = new Set();
  // Only extract companies actually present in the resume
  // Pattern: Company name after role title, often on next line or same line
  const roleCompanyPattern = /\n([A-Z][A-Za-z0-9&.,'\s-]{3,40}(?:Inc|LLC|Ltd|Corp|Corporation|Technologies|Tech|Software|Systems|Pvt\s*Ltd|Private\s*Limited)?)(?:\n|\s|,)/gm;
  const matches = Array.from(text.matchAll(roleCompanyPattern));
  for (const match of matches) {
    const company = match[1]?.trim();
    if (company && company.length > 3 && company.length < 50 && !/Founder|CEO|CTO|Manager|Engineer|Director|Consultant|Advisor|Resident|Intern/i.test(company)) {
      companies.add(company);
    }
  }
  // Pattern: "at <Company>"
  const atCompanyPattern = /at\s+([A-Z][A-Za-z0-9&.,'\s-]{3,40}(Inc|LLC|Ltd|Corp|Corporation|Technologies|Tech|Software|Systems|Pvt\s*Ltd|Private\s*Limited)?)/gi;
  const atMatches = Array.from(text.matchAll(atCompanyPattern));
  for (const match of atMatches) {
    const company = match[1]?.trim();
    if (company && company.length > 3 && company.length < 50) {
      companies.add(company);
    }
  }
  return Array.from(companies).slice(0, 5); // Limit to top 5
}

/**
 * Extracts roles and seniority levels from resume text.
 */
function extractRoles(text: string): string[] {
  const roles: Set<string> = new Set();

  // Role patterns with seniority and flexible separators
  const rolePatterns = [
    // Senior roles
    /(?:senior|sr\.?|lead|principal|staff|distinguished)\s+([a-z\s]+?)(?:\s+engineer|\s+developer|\s+manager|\s+director|\s+architect)/gi,
    // Standard roles
    /(?:software|senior|junior|associate|mid-level)?\s*(engineer|developer|programmer|architect|manager|director|vp|vice\s+president|ceo|cto|cfo|coo|founder|co-founder|product\s+manager|project\s+manager|designer|analyst|consultant|specialist)/gi,
    // Executive roles
    /(ceo|cto|cfo|coo|founder|co-founder|president|vice\s+president|vp)/gi,
    // Flexible: Role before company with dash or en dash
    /([A-Za-z\s&]+)\s*[–-]\s*[A-Za-z][A-Za-z0-9&\s-]{3,40}(?:Inc|LLC|Ltd|Corp|Corporation|Technologies|Tech|Software|Systems|Pvt\s*Ltd|Private\s*Limited)?/gi,
  ];

  const knownRoles = [
    'Founder', 'CEO', 'CTO', 'COO', 'CFO', 'VP', 'Vice President', 'Director', 'Manager', 'Engineer', 'Product Manager', 'Project Manager', 'Architect', 'Analyst', 'Consultant', 'Specialist', 'Lead', 'President', 'Developer', 'Designer', 'Head'
  ];
  for (const pattern of rolePatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      // For flexible pattern, match[1] is the role
      let role = match[1] ? match[1].trim() : match[0]?.trim();
      if (role && role.length > 2) {
        // Normalize role names
        let normalized = role
          .replace(/\s+/g, ' ')
          .replace(/\bvp\b/gi, 'VP')
          .replace(/\bceo\b/gi, 'CEO')
          .replace(/\bcto\b/gi, 'CTO')
          .replace(/\bcfo\b/gi, 'CFO')
          .replace(/\bcoo\b/gi, 'COO');
        // Only add if in knownRoles or matches a known role pattern
        if (knownRoles.some(kr => normalized.toLowerCase().includes(kr.toLowerCase()))) {
          roles.add(normalized);
        }
      }
    }
  }

  return Array.from(roles).slice(0, 10); // Limit to top 10
}

/**
 * Extracts education information from resume text.
 */
function extractEducation(text: string): string[] {
  // Find EDUCATION section
  const eduSection = text.match(/(?:EDUCATION|ACADEMIC|QUALIFICATIONS)[\s\S]*?(?=WORK|EXPERIENCE|SKILLS|PROJECTS|$)/i);
  const eduText = eduSection ? eduSection[0] : text;
  // Pattern: Degree, Field, University, Year
  const pattern = /(Bachelor|Master|PhD|Doctorate|MBA|MS|BS|BA|MA|B\.?Tech|M\.?Tech|B\.?E|M\.?E|B\.?Sc|M\.?Sc)[^\n,]*?(?:in|of)?\s*([A-Za-z &]+)?[^\n,]*?(?:from|at)?\s*([A-Za-z0-9 .,&-]+)?[^\n,]*?(\d{4})?/gi;
  const results: string[] = [];
  let match;
  while ((match = pattern.exec(eduText)) !== null) {
    let str = match[1] || '';
    if (match[2]) str += ` in ${match[2].trim()}`;
    if (match[3]) str += ` from ${match[3].trim()}`;
    if (match[4]) str += ` (${match[4]})`;
    if (str.length > 8) results.push(str);
  }
  if (results.length === 0) return ["Not disclosed in pitch deck or resume"];
  return results.slice(0, 3);
}

/**
 * Detects domain keywords related to startup sectors.
 */
function extractDomainAlignment(text: string, sectorHint?: string): string[] {
  const domains: Set<string> = new Set();
  const lowerText = text.toLowerCase();
  const domainKeywords: Record<string, string[]> = {
    'SaaS': ['saas', 'software as a service', 'cloud software', 'subscription', 'recurring revenue'],
    'AI/ML': ['artificial intelligence', 'machine learning', 'deep learning', 'neural network', 'ai', 'ml', 'llm', 'gpt'],
    'Fintech': ['fintech', 'financial technology', 'payment', 'banking', 'crypto', 'blockchain', 'trading'],
    'Healthtech': ['healthtech', 'health tech', 'healthcare', 'medical', 'pharma', 'biotech'],
    'Edtech': ['edtech', 'education technology', 'learning platform', 'online learning'],
    'E-commerce': ['e-commerce', 'ecommerce', 'marketplace', 'retail', 'shopping'],
    'Climate': ['climate', 'sustainability', 'green tech', 'renewable energy', 'carbon'],
  };
  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        domains.add(domain);
        break;
      }
    }
  }
  // If nothing found, fallback to sector hint
  if (domains.size === 0 && sectorHint && domainKeywords[sectorHint]) {
    domains.add(sectorHint);
  }
  return Array.from(domains);
}

/**
 * Calculates average tenure at companies from resume text.
 * Returns average tenure in years, or null if cannot be calculated.
 */
function calculateAverageTenure(text: string, companies: string[]): number | null {
  if (companies.length === 0) return null;

  const yearPattern = /(19|20)\d{2}/g;
  const years: number[] = [];
  let match;
  
  while ((match = yearPattern.exec(text)) !== null) {
    const year = parseInt(match[0], 10);
    if (year >= 1970 && year <= new Date().getFullYear()) {
      years.push(year);
    }
  }

  if (years.length < 2) return null;

  // Calculate tenure periods
  const tenures: number[] = [];
  for (let i = 0; i < years.length - 1; i += 2) {
    const startYear = years[i];
    const endYear = years[i + 1] || new Date().getFullYear();
    const tenure = endYear - startYear;
    if (tenure > 0 && tenure < 50) {
      tenures.push(tenure);
    }
  }

  if (tenures.length === 0) return null;

  const avgTenure = tenures.reduce((a, b) => a + b, 0) / tenures.length;
  return avgTenure;
}

/**
 * Detects if leadership joined recently (< 6 months).
 */
function detectRecentLeadershipHire(text: string): boolean {
  const patterns = [
    /(?:joined|hired|started|since)\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+(?:2024|2025)/i,
    /(?:joined|hired|started)\s+(?:recently|this\s+year|this\s+month|last\s+month)/i,
    /(?:joined|hired|started)\s+(\d{1,2})\s+(?:months?|weeks?)\s+ago/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Check if it's less than 6 months
      if (match[1]) {
        const monthsAgo = parseInt(match[1], 10);
        if (monthsAgo < 6) return true;
      }
      // Check if it's 2024/2025 (recent)
      if (pattern.test(text) && (text.includes('2024') || text.includes('2025'))) {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        // If mentioned 2024/2025, check if it's within last 6 months
        if (text.includes(String(currentYear)) || text.includes(String(currentYear - 1))) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Detects if person has only Individual Contributor (IC) roles.
 */
function hasOnlyICRoles(roles: string[]): boolean {
  if (roles.length === 0) return false;
  
  const leadershipKeywords = [
    'manager', 'director', 'vp', 'vice president', 'ceo', 'cto', 'cfo', 'coo',
    'head', 'lead', 'principal', 'founder', 'co-founder', 'executive'
  ];
  
  const hasLeadership = roles.some(role => 
    leadershipKeywords.some(keyword => role.toLowerCase().includes(keyword))
  );
  
  return !hasLeadership;
}

/**
 * Detects red flags in the resume with enhanced logic.
 */
function detectRedFlags(text: string, signals: FounderSignals): string[] {
  const redFlags: string[] = [];

  // Calculate average tenure
  const avgTenure = calculateAverageTenure(text, signals.pastCompanies);
  if (avgTenure !== null && avgTenure < 1.2) {
    redFlags.push(`Average tenure < 1.2 years (${avgTenure.toFixed(1)} years)`);
  }

  // Detect recent leadership hire (< 6 months)
  if (detectRecentLeadershipHire(text)) {
    redFlags.push('Leadership joined < 6 months ago');
  }

  // Check for only IC roles
  if (hasOnlyICRoles(signals.roles)) {
    redFlags.push('Only Individual Contributor (IC) roles - no leadership experience');
  }

  // Existing red flag patterns
  const redFlagPatterns = [
    {
      pattern: /(?:key\s+person|single\s+point|sole\s+owner|only\s+person)/i,
      message: 'Key person dependency',
    },
    {
      pattern: /(?:no\s+technical|lack\s+of\s+technical|non-technical\s+founder)/i,
      message: 'No technical co-founder',
    },
    {
      pattern: /(?:no\s+prior\s+startup|no\s+startup\s+experience|first\s+time\s+founder)/i,
      message: 'No prior startup experience',
    },
    {
      pattern: /(?:gap\s+in\s+employment|employment\s+gap|unexplained\s+gap)/i,
      message: 'Employment gap detected',
    },
  ];

  for (const { pattern, message } of redFlagPatterns) {
    if (pattern.test(text) && !redFlags.includes(message)) {
      redFlags.push(message);
    }
  }

  return redFlags;
}

/**
 * Checks if person worked at top tech companies.
 */
function hasTopTechCompany(companies: string[]): boolean {
  const topTechCompanies = [
    'Google', 'Microsoft', 'Apple', 'Amazon', 'Facebook', 'Meta', 'Netflix',
    'Salesforce', 'Oracle', 'IBM', 'Adobe', 'Intel', 'Nvidia', 'Tesla',
    'Uber', 'Airbnb', 'Stripe', 'Palantir', 'Snowflake', 'Databricks',
    'OpenAI', 'Anthropic', 'GitHub', 'LinkedIn', 'Twitter', 'X',
    'Razorpay', 'Flipkart', 'PayFlow', 'Infosys', 'TCS', 'Wipro',
    'Zomato', 'Swiggy', 'Ola', 'Oyo', 'Byju\'s', 'PhonePe', 'Cred', 'Groww',
  ];
  
  return companies.some(company => 
    topTechCompanies.some(topCompany => 
      company.toLowerCase().includes(topCompany.toLowerCase()) ||
      topCompany.toLowerCase().includes(company.toLowerCase())
    )
  );
}

/**
 * Checks if person has prior startup role.
 */
function hasPriorStartupRole(roles: string[], text: string): boolean {
  const startupKeywords = ['founder', 'co-founder', 'startup', 'entrepreneur'];
  const hasStartupRole = roles.some(role => 
    startupKeywords.some(keyword => role.toLowerCase().includes(keyword))
  );
  
  if (hasStartupRole) return true;
  
  // Also check text for startup-related terms
  const lowerText = text.toLowerCase();
  return startupKeywords.some(keyword => lowerText.includes(keyword));
}

/**
 * Calculates founder strength score based on extracted signals.
 * Updated scoring logic:
 * Base Score = 5.0
 * + Experience > 8 years → +1.5
 * + Ex-Top Tech Company → +1.0
 * + Prior startup role → +1.0
 * + Domain match → +1.0
 * - Avg tenure < 1.2 years → -1.5
 * - Leadership joined < 6 months → -1.0
 * - Only IC roles → -1.0
 */
function calculateFounderStrengthScore(signals: FounderSignals, redFlags: string[]): number {
  let score = 5.0; // Base score

  // Experience > 8 years → +1.5
  if (signals.experienceYears > 8) {
    score += 1.5;
  }

  // Ex-Top Tech Company → +1.0
  if (hasTopTechCompany(signals.pastCompanies)) {
    score += 1.0;
  }

  // Prior startup role → +1.0
  if (hasPriorStartupRole(signals.roles, '')) {
    score += 1.0;
  }

  // Domain match → +1.0
  if (signals.domainAlignment.length > 0) {
    score += 1.0;
  }

  // Red flags penalties
  for (const flag of redFlags) {
    if (flag.includes('Average tenure < 1.2 years')) {
      score -= 1.5;
    } else if (flag.includes('Leadership joined < 6 months')) {
      score -= 1.0;
    } else if (flag.includes('Only Individual Contributor')) {
      score -= 1.0;
    } else if (flag.includes('dependency') || flag.includes('no technical')) {
      score -= 1.5; // High severity flags
    } else {
      score -= 0.5; // Other flags
    }
  }

  // Clamp score between 0 and 10
  return Math.max(0, Math.min(10, score));
}

/**
 * Main function to extract all signals from resume text.
 */

export async function extractResumeSignals(
  resumeText: string,
  startupId: string,
  role: string = 'Founder',
  sectorHint?: string
): Promise<FounderVerificationResult & { name?: string }> {
  if (!resumeText || resumeText.trim().length === 0) {
    return {
      startupId,
      role,
      founderStrengthScore: 0,
      signals: {
        experienceYears: 0,
        pastCompanies: [],
        roles: [],
        education: [],
        domainAlignment: [],
      },
      redFlags: ['Empty or invalid resume'],
      name: 'Unknown',
    };
  }

  const signals: FounderSignals = {
    experienceYears: extractExperienceYears(resumeText),
    pastCompanies: extractPastCompanies(resumeText),
    roles: extractRoles(resumeText),
    education: extractEducation(resumeText),
    domainAlignment: extractDomainAlignment(resumeText, sectorHint),
  };
  // Debug log for extracted signals
  console.log('[Resume Extraction] Extracted signals:', JSON.stringify(signals, null, 2));


  // Try to extract founder name from resume text (simple heuristic: first line with 'Founder' or 'CEO')
  let name = '';
  const lines = resumeText.split(/\r?\n/);
  for (const line of lines) {
    if (/founder|ceo|co-founder|managing director|director/i.test(line) && line.match(/[A-Z][a-z]+/g)) {
      // Try to extract name (first two capitalized words)
      const match = line.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/);
      if (match) {
        name = match[1];
        break;
      }
    }
  }
  if (!name || /resume|unknown/i.test(name)) {
    // Fallback: try to extract from pitch deck team section if available
    try {
      // Dynamically import teamExtractor to avoid circular deps
      const { extractTeamInfo } = await import('./teamExtractor.js');
      // Assume global.pitchDeckText is set by the main pipeline before calling this function
      const pitchDeckText = (global as any).pitchDeckText as string | undefined;
      if (pitchDeckText && pitchDeckText.length > 0) {
        const teamInfo = extractTeamInfo(pitchDeckText);
        const founder = teamInfo.members.find(m => /founder|ceo|cmo|chief/i.test(m.role));
        if (founder && founder.name) {
          name = founder.name;
        }
      }
    } catch (err) {
      // ignore
    }
  }
  if (!name) name = 'Not disclosed in pitch deck or resume';

  // Detect red flags (pass signals for enhanced detection)
  const redFlags = detectRedFlags(resumeText, signals);
  const founderStrengthScore = calculateFounderStrengthScore(signals, redFlags);

  return {
    startupId,
    role,
    founderStrengthScore: Math.round(founderStrengthScore * 10) / 10, // Round to 1 decimal
    signals,
    redFlags,
    name,
  };
}

