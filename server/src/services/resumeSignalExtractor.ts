import { FounderSignals, FounderVerificationResult } from '../types/index.js';

/**
 * Deterministic extraction of years of experience from resume text.
 * Looks for patterns like "10 years", "5+ years", "2010-2020", etc.
 */
function extractExperienceYears(text: string): number {
  let totalYears = 0;

  // Pattern 1: Direct mentions like "10 years of experience", "5+ years"
  const yearPatterns = [
    /(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp|work)/gi,
    /(?:experience|exp|work)\s*(?:of\s*)?(\d+)\+?\s*years?/gi,
  ];

  for (const pattern of yearPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const years = parseInt(match[1] || '0', 10);
      if (years > 0 && years < 50) {
        totalYears = Math.max(totalYears, years);
      }
    }
  }

  // Pattern 2: Calculate from date ranges (e.g., "2010-2020", "Jan 2015 - Present")
  const dateRangePattern = /(?:19|20)\d{2}[\s-]*(?:to|–|-|present|now|current)/gi;
  const dateMatches = Array.from(text.matchAll(dateRangePattern));
  
  if (dateMatches.length > 0) {
    // Extract all years from the text
    const yearPattern = /(19|20)\d{2}/g;
    const years: number[] = [];
    let match;
    while ((match = yearPattern.exec(text)) !== null) {
      const year = parseInt(match[0], 10);
      if (year >= 1970 && year <= new Date().getFullYear()) {
        years.push(year);
      }
    }

    if (years.length >= 2) {
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      const calculatedYears = maxYear - minYear;
      if (calculatedYears > 0 && calculatedYears < 50) {
        totalYears = Math.max(totalYears, calculatedYears);
      }
    }
  }

  // Pattern 3: Look for "since 2010" patterns
  const sincePattern = /since\s+(19|20)\d{2}/gi;
  const sinceMatch = text.match(sincePattern);
  if (sinceMatch) {
    const yearMatch = sinceMatch[0].match(/(19|20)\d{2}/);
    if (yearMatch) {
      const startYear = parseInt(yearMatch[0], 10);
      const currentYear = new Date().getFullYear();
      const yearsSince = currentYear - startYear;
      if (yearsSince > 0 && yearsSince < 50) {
        totalYears = Math.max(totalYears, yearsSince);
      }
    }
  }

  return totalYears;
}

/**
 * Extracts company names from resume text.
 * Looks for patterns in experience/employment sections.
 */
function extractPastCompanies(text: string): string[] {
  const companies: Set<string> = new Set();
  const lowerText = text.toLowerCase();

  // Well-known tech companies to look for (including Indian companies)
  const knownCompanies = [
    'Google', 'Microsoft', 'Apple', 'Amazon', 'Facebook', 'Meta', 'Netflix',
    'Salesforce', 'Oracle', 'IBM', 'Adobe', 'Intel', 'Nvidia', 'Tesla',
    'Uber', 'Airbnb', 'Stripe', 'Palantir', 'Snowflake', 'Databricks',
    'OpenAI', 'Anthropic', 'GitHub', 'LinkedIn', 'Twitter', 'X',
    'Razorpay', 'Flipkart', 'PayFlow', 'PayFlow Technologies', 'Infosys', 'TCS', 'Wipro',
    'Zomato', 'Swiggy', 'Ola', 'Oyo', 'Byju\'s', 'PhonePe', 'Cred', 'Groww',
  ];

  // Better patterns that look for company names in WORK EXPERIENCE sections
  // Pattern 1: Company name on its own line (often after role title)
  const workExpSection = text.match(/(?:WORK\s+EXPERIENCE|EXPERIENCE|EMPLOYMENT|CAREER|PROFESSIONAL\s+EXPERIENCE)[\s\S]*?(?=EDUCATION|SKILLS|PROJECTS|$)/i);
  const workExpText = workExpSection ? workExpSection[0] : text;

  // Pattern: Company name after role title, often on next line or same line
  // Example: "Senior Product Manager\nRazorpay Software Pvt Ltd"
  const roleCompanyPattern = /(?:^|\n)\s*([A-Z][A-Za-z0-9&\s-]{3,40}(?:Inc|LLC|Ltd|Corp|Corporation|Technologies|Tech|Software|Systems|Pvt\s+Ltd|Private\s+Limited)?)\s*(?:\n|$|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})/gm;
  const roleCompanyMatches = Array.from(workExpText.matchAll(roleCompanyPattern));
  
  for (const match of roleCompanyMatches) {
    const company = match[1]?.trim();
    if (company && company.length > 3 && company.length < 50) {
      // Filter out common false positives (names, roles, etc.)
      const excludePatterns = [
        /^(Founder|CEO|CTO|CFO|COO|VP|Director|Manager|Engineer|Developer|Product|Designer|Analyst|Consultant|Specialist|Lead|Senior|Junior|Associate)/i,
        /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/i,
        /^\d{4}/,
        /^(The|A|An|This|That|With|From|At|Worked|Employed|Company|Organization)$/i,
        /^(Present|Current|Previous|Past|Former)$/i,
      ];
      
      const isExcluded = excludePatterns.some(pattern => pattern.test(company));
      if (!isExcluded && !company.includes('Founder') && !company.includes('CEO') && !company.includes('CTO')) {
        companies.add(company);
      }
    }
  }

  // Pattern 2: Company name after "at" keyword in experience descriptions
  const atCompanyPattern = /(?:at|worked\s+at|employed\s+at)\s+([A-Z][A-Za-z0-9&\s-]{3,40}(?:Inc|LLC|Ltd|Corp|Corporation|Technologies|Tech|Software|Systems|Pvt\s+Ltd|Private\s+Limited)?)/gi;
  const atMatches = Array.from(workExpText.matchAll(atCompanyPattern));
  
  for (const match of atMatches) {
    const company = match[1]?.trim();
    if (company && company.length > 3 && company.length < 50) {
      // Filter out false positives
      if (!company.includes('Founder') && !company.includes('CEO') && !company.includes('CTO')) {
        companies.add(company);
      }
    }
  }

  // Check for known companies
  for (const company of knownCompanies) {
    if (lowerText.includes(company.toLowerCase())) {
      companies.add(company);
    }
  }

  return Array.from(companies).slice(0, 10); // Limit to top 10
}

/**
 * Extracts roles and seniority levels from resume text.
 */
function extractRoles(text: string): string[] {
  const roles: Set<string> = new Set();

  // Role patterns with seniority
  const rolePatterns = [
    // Senior roles
    /(?:senior|sr\.?|lead|principal|staff|distinguished)\s+([a-z\s]+?)(?:\s+engineer|\s+developer|\s+manager|\s+director|\s+architect)/gi,
    // Standard roles
    /(?:software|senior|junior|associate|mid-level)?\s*(engineer|developer|programmer|architect|manager|director|vp|vice\s+president|ceo|cto|cfo|coo|founder|co-founder|product\s+manager|project\s+manager|designer|analyst|consultant|specialist)/gi,
    // Executive roles
    /(ceo|cto|cfo|coo|founder|co-founder|president|vice\s+president|vp)/gi,
  ];

  for (const pattern of rolePatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const role = match[0]?.trim();
      if (role && role.length > 2) {
        // Normalize role names
        const normalized = role
          .replace(/\s+/g, ' ')
          .replace(/\bvp\b/gi, 'VP')
          .replace(/\bceo\b/gi, 'CEO')
          .replace(/\bcto\b/gi, 'CTO')
          .replace(/\bcfo\b/gi, 'CFO')
          .replace(/\bcoo\b/gi, 'COO');
        roles.add(normalized);
      }
    }
  }

  return Array.from(roles).slice(0, 10); // Limit to top 10
}

/**
 * Extracts education information from resume text.
 */
function extractEducation(text: string): string[] {
  const education: Set<string> = new Set();
  const lowerText = text.toLowerCase();

  // Well-known universities (including Indian)
  const knownUniversities = [
    'MIT', 'Stanford', 'Harvard', 'Berkeley', 'Caltech', 'CMU', 'Carnegie Mellon',
    'Princeton', 'Yale', 'Columbia', 'Cornell', 'UPenn', 'Dartmouth', 'Brown',
    'UCLA', 'UC Berkeley', 'UC San Diego', 'Georgia Tech', 'UT Austin',
    'IIT', 'Indian Institute of Technology', 'IIT Bombay', 'IIT Delhi', 'IIT Madras',
    'IIT Kanpur', 'IIT Kharagpur', 'IIT Roorkee', 'IIT Guwahati', 'IIT Hyderabad',
    'IIM', 'Indian Institute of Management', 'BITS', 'NIT',
  ];

  // Find EDUCATION section
  const eduSection = text.match(/(?:EDUCATION|ACADEMIC|QUALIFICATIONS)[\s\S]*?(?=WORK|EXPERIENCE|SKILLS|PROJECTS|$)/i);
  const eduText = eduSection ? eduSection[0] : text;

  // Better degree patterns with word boundaries to avoid partial matches
  // Pattern 1: Full degree names (e.g., "Bachelor of Technology (B.Tech)")
  const fullDegreePattern = /\b(Bachelor|Master|PhD|Doctorate|MBA|MS|BS|BA|MA|B\.?Tech|M\.?Tech|B\.?E|M\.?E|B\.?Sc|M\.?Sc)\b(?:\s+(?:of|in)\s+)?([A-Z][A-Za-z\s&]+?)(?:\s*\([^)]+\))?(?:\s+from|\s+at|\s*,\s*|\s*$)/gi;
  const fullDegreeMatches = Array.from(eduText.matchAll(fullDegreePattern));
  
  for (const match of fullDegreeMatches) {
    const degree = match[0]?.trim();
    if (degree && degree.length > 5) {
      // Filter out partial matches like "ms at", "ms fo", "ms in"
      const testDegree = degree.toLowerCase();
      if (!/^(ms|bs|ba|ma)\s+(at|fo|in|on|to|of|the|a|an|ed)$/i.test(testDegree) && 
          !testDegree.match(/^(ms|bs|ba|ma)\s+(at|fo|in|on|to|of|the|a|an|ed)\s/i)) {
        education.add(degree);
      }
    }
  }

  // Pattern 2: Multi-line degree with university (e.g., "Bachelor of Technology (B.Tech)\nComputer Science\nIndian Institute of Technology (IIT), Bombay")
  const lines = eduText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  for (let i = 0; i < lines.length - 1; i++) {
    const line1 = lines[i];
    const line2 = lines[i + 1];
    const line3 = lines[i + 2];
    
    // Check if line1 is a degree, line2 is field, line3 is university
    const degreeMatch = line1.match(/\b(Bachelor|Master|PhD|Doctorate|MBA|MS|BS|BA|MA|B\.?Tech|M\.?Tech|B\.?E|M\.?E|B\.?Sc|M\.?Sc)\b(?:\s+(?:of|in)\s+)?([A-Z][A-Za-z\s&]+?)?/i);
    if (degreeMatch && line2 && line3) {
      const degree = degreeMatch[0];
      const field = line2.match(/^[A-Z][A-Za-z\s&]+$/) ? line2 : '';
      const universityMatch = line3.match(/([A-Z][A-Za-z\s&(),-]+(?:University|College|Institute|School|Tech|IIT|IIM|BITS|NIT|Bombay|Delhi|Madras|Kanpur|Kharagpur|Roorkee|Guwahati|Hyderabad))/);
      
      if (universityMatch) {
        const university = universityMatch[1];
        const fullEdu = field ? `${degree} ${field} from ${university}` : `${degree} from ${university}`;
        if (fullEdu.length > 10) {
          education.add(fullEdu);
        }
      }
    }
  }

  // Pattern 3: Degree with university on same line or next line
  const degreeUniPattern = /\b(Bachelor|Master|PhD|Doctorate|MBA|MS|BS|BA|MA|B\.?Tech|M\.?Tech|B\.?E|M\.?E|B\.?Sc|M\.?Sc)\b(?:\s+(?:of|in)\s+)?([A-Z][A-Za-z\s&]+?)\s*(?:\n|,|\s+from|\s+at)\s*([A-Z][A-Za-z\s&(),-]+(?:University|College|Institute|School|Tech|IIT|IIM|BITS|NIT|Bombay|Delhi|Madras|Kanpur|Kharagpur|Roorkee|Guwahati|Hyderabad))/gi;
  const degreeUniMatches = Array.from(eduText.matchAll(degreeUniPattern));
  
  for (const match of degreeUniMatches) {
    const degree = match[1]?.trim();
    const field = match[2]?.trim();
    const university = match[3]?.trim();
    if (degree && university) {
      // Filter out partial matches
      if (!/^(ms|bs|ba|ma)\s+(at|fo|in|on|to|of|the|a|an|ed)$/i.test(degree.toLowerCase())) {
        const fullEdu = field && field.length > 2 ? `${degree} ${field} from ${university}` : `${degree} from ${university}`;
        if (fullEdu.length > 10) {
          education.add(fullEdu);
        }
      }
    }
  }

  // Pattern 3: University names with context
  for (const university of knownUniversities) {
    if (lowerText.includes(university.toLowerCase())) {
      const universityIndex = lowerText.indexOf(university.toLowerCase());
      const context = text.slice(Math.max(0, universityIndex - 150), Math.min(text.length, universityIndex + 150));
      
      // Try to find degree associated with university
      const degreeMatch = context.match(/\b(Bachelor|Master|PhD|Doctorate|MBA|MS|BS|BA|MA|B\.?Tech|M\.?Tech|B\.?E|M\.?E|B\.?Sc|M\.?Sc)\b(?:\s+(?:of|in)\s+)?([A-Z][A-Za-z\s&]+?)?/i);
      if (degreeMatch) {
        const degree = degreeMatch[1];
        const field = degreeMatch[2] || '';
        const fullEdu = field ? `${degree} ${field} from ${university}` : `${degree} from ${university}`;
        if (fullEdu.length > 10) {
          education.add(fullEdu);
        }
      } else {
        education.add(university);
      }
    }
  }

  return Array.from(education).slice(0, 5); // Limit to top 5
}

/**
 * Detects domain keywords related to startup sectors.
 */
function extractDomainAlignment(text: string): string[] {
  const domains: Set<string> = new Set();
  const lowerText = text.toLowerCase();

  // Domain keyword mappings
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
export function extractResumeSignals(
  resumeText: string,
  startupId: string,
  role: string = 'Founder'
): FounderVerificationResult {
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
    };
  }

  const signals: FounderSignals = {
    experienceYears: extractExperienceYears(resumeText),
    pastCompanies: extractPastCompanies(resumeText),
    roles: extractRoles(resumeText),
    education: extractEducation(resumeText),
    domainAlignment: extractDomainAlignment(resumeText),
  };

  // Detect red flags (pass signals for enhanced detection)
  const redFlags = detectRedFlags(resumeText, signals);
  const founderStrengthScore = calculateFounderStrengthScore(signals, redFlags);

  return {
    startupId,
    role,
    founderStrengthScore: Math.round(founderStrengthScore * 10) / 10, // Round to 1 decimal
    signals,
    redFlags,
  };
}

