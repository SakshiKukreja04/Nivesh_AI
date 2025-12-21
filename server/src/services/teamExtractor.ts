/**
 * Extracts team member information from pitch deck text.
 * Looks for team sections, member names, roles, and backgrounds.
 */

export interface TeamMember {
  name: string;
  role: string;
  background?: string;
  experience?: string;
  education?: string;
}

export interface TeamInfo {
  members: TeamMember[];
  totalMembers: number;
}

/**
 * Extracts team member information from document text.
 * Looks for common patterns in pitch decks:
 * - Team/About Us sections
 * - Name + Role patterns
 * - Executive team listings
 */
export function extractTeamInfo(text: string): TeamInfo {
  const members: TeamMember[] = [];

  console.log(`[TEAM-EXTRACTOR] Extracting team info from ${text.length} characters`);

  // Common team section headers
  const teamSectionPatterns = [
    /(?:team|about\s+us|our\s+team|founders?|executive\s+team|leadership|management\s+team)/i,
  ];

  // Check if document has team-related sections
  const hasTeamSection = teamSectionPatterns.some(pattern => pattern.test(text));
  console.log(`[TEAM-EXTRACTOR] Team section detected: ${hasTeamSection}`);

  // Pattern 1: Name followed by role (e.g., "John Doe - CEO" or "John Doe, CEO")
  const nameRolePatterns = [
    // "Name - Role" or "Name, Role"
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*[-–—,]\s*([A-Z][A-Za-z\s&]+(?:CEO|CTO|CFO|COO|VP|Vice\s+President|Director|Manager|Founder|Co-Founder|Head|Lead|Chief|President))/gi,
    // "Role: Name" or "Role - Name"
    /(?:CEO|CTO|CFO|COO|VP|Vice\s+President|Director|Manager|Founder|Co-Founder|Head|Lead|Chief|President|Chief\s+[A-Z][a-z]+)\s*[-–—:]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi,
    // Bullet points with names and roles
    /(?:^|\n|•|\*|-)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*[-–—,]\s*([A-Z][A-Za-z\s&]+)/gm,
  ];

  for (const pattern of nameRolePatterns) {
    const matches = Array.from(text.matchAll(pattern));
    console.log(`[TEAM-EXTRACTOR] Found ${matches.length} potential matches with pattern`);
    
    for (const match of matches) {
      let name = '';
      let role = '';

      if (match[1] && match[2]) {
        // Pattern: Name - Role
        name = match[1].trim();
        role = match[2].trim();
      } else if (match[1] && !match[2]) {
        // Pattern: Role - Name (reversed)
        role = match[0].split(/[-–—:]/)[0].trim();
        name = match[1].trim();
      }

      // Validate name (should be 2+ words, proper case)
      if (name && name.split(/\s+/).length >= 2 && /^[A-Z]/.test(name)) {
        // Validate role (should contain common role keywords)
        if (!role || !/(?:CEO|CTO|CFO|COO|VP|Director|Manager|Founder|Head|Lead|Chief|President|Engineer|Developer|Designer|Product|Marketing|Sales|Operations)/i.test(role)) {
          // Try to extract role from context
          const context = text.slice(Math.max(0, match.index! - 100), match.index! + match[0].length + 100);
          const roleMatch = context.match(/(?:CEO|CTO|CFO|COO|VP|Vice\s+President|Director|Manager|Founder|Co-Founder|Head|Lead|Chief|President|Engineer|Developer|Designer|Product|Marketing|Sales|Operations)/i);
          if (roleMatch) {
            role = roleMatch[0];
          } else {
            role = 'Team Member';
          }
        }

        // Avoid duplicates
        if (!members.some(m => m.name.toLowerCase() === name.toLowerCase())) {
          // Extract background/experience from surrounding context
          const memberIndex = text.indexOf(match[0]);
          const context = text.slice(Math.max(0, memberIndex - 200), Math.min(text.length, memberIndex + match[0].length + 300));
          
          let background = '';
          let experience = '';
          let education = '';

          // Look for experience indicators
          const experienceMatch = context.match(/(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|at|in)/i);
          if (experienceMatch) {
            experience = `${experienceMatch[1]} years`;
          }

          // Look for education
          const educationMatch = context.match(/(?:MBA|MS|BS|BA|MA|PhD|Master|Bachelor|from)\s+([A-Z][A-Za-z\s&]+(?:University|College|Institute|School|MIT|Stanford|Harvard|Berkeley))/i);
          if (educationMatch) {
            education = educationMatch[0];
          }

          // Look for company background
          const companyMatch = context.match(/(?:previously|formerly|ex-|worked\s+at|at)\s+([A-Z][A-Za-z0-9&\s-]+(?:Inc|LLC|Ltd|Corp|Technologies|Tech)?)/i);
          if (companyMatch) {
            background = `Previously at ${companyMatch[1]}`;
          }

          members.push({
            name,
            role,
            background: background || undefined,
            experience: experience || undefined,
            education: education || undefined,
          });

          console.log(`[TEAM-EXTRACTOR] Extracted team member: ${name} - ${role}`);
        }
      }
    }
  }

  // Pattern 2: Look for structured team listings (e.g., "Founders: John Doe, Jane Smith")
  const structuredPatterns = [
    /(?:Founders?|Co-Founders?|Team|Executive\s+Team):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+(?:\s*,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)*)/gi,
  ];

  for (const pattern of structuredPatterns) {
    const matches = Array.from(text.matchAll(pattern));
    for (const match of matches) {
      const names = match[1].split(',').map(n => n.trim());
      const sectionTitle = match[0].split(':')[0].trim();
      
      names.forEach(name => {
        if (name && name.split(/\s+/).length >= 2 && /^[A-Z]/.test(name)) {
          if (!members.some(m => m.name.toLowerCase() === name.toLowerCase())) {
            members.push({
              name,
              role: sectionTitle.includes('Founder') ? 'Founder' : 'Team Member',
            });
            console.log(`[TEAM-EXTRACTOR] Extracted team member from structured list: ${name}`);
          }
        }
      });
    }
  }

  // Limit to reasonable number (max 10 team members)
  const limitedMembers = members.slice(0, 10);

  console.log(`[TEAM-EXTRACTOR] Total team members extracted: ${limitedMembers.length}`);
  console.log(`[TEAM-EXTRACTOR] Team members JSON:`, JSON.stringify(limitedMembers, null, 2));

  return {
    members: limitedMembers,
    totalMembers: limitedMembers.length,
  };
}

