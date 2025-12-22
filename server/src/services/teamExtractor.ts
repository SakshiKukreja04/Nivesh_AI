import { TeamMember } from '../types/index.js';
/**
 * Extracts team member information from pitch deck text.
 * Looks for team sections, member names, roles, and backgrounds.
 */

// Use the shared TeamMember interface from types/index.ts

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
    // Debug: Log the first 1000 characters of the raw extracted text
    console.log('[TEAM-EXTRACTOR] Raw pitch deck text (first 1000 chars):', text.slice(0, 1000));
  const members: TeamMember[] = [];

  console.log(`[TEAM-EXTRACTOR] Extracting team info from ${text.length} characters`);

  // Common team section headers
  const teamSectionPatterns = [
    /(?:team|about\s+us|our\s+team|founders?|executive\s+team|leadership|management\s+team)/i,
  ];

  // Check if document has team-related sections
  const hasTeamSection = teamSectionPatterns.some(pattern => pattern.test(text));
  console.log(`[TEAM-EXTRACTOR] Team section detected: ${hasTeamSection}`);

  // Robust entity extraction: extract all name+role pairs, even if not under a team heading
  const nameRolePattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*[-–—,]\s*([A-Za-z&\.\s]+?)(?=\n|$)/g;
  const matches = Array.from(text.matchAll(nameRolePattern));
  for (const match of matches) {
    let name = match[1].trim();
    let role = match[2].trim();
    // Support for 'Key Hire' and similar roles
    if (/key\s+hire/i.test(role)) {
      role = 'Key Hire';
    }
    if (!members.some(m => m.name.toLowerCase() === name.toLowerCase())) {
      const memberIndex = text.indexOf(match[0]);
      const context = text.slice(Math.max(0, memberIndex - 200), Math.min(text.length, memberIndex + match[0].length + 300));
      let education = '';
      let experience = '';
      let background = '';
      // Only extract education if explicitly present in context
      // Accept any degree+institution pattern (e.g., M.Pharm (UIPS), ISB AMPH, etc.)
      const eduPattern = /([A-Z][A-Za-z\.']+)[\s']*(?:\(|from|at|,)?\s*([A-Z][A-Za-z&\.\s'\-\d]+)?\)?/g;
      const eduMatches = Array.from(context.matchAll(eduPattern)).map(m => m[0].trim()).filter(e => e.length > 5 && /[A-Za-z]/.test(e));
      if (eduMatches.length > 0) {
        // Only keep if it looks like a degree+institution, not just a name
        education = eduMatches.find(e => /[Mm][\.]?[Pp]harm|ISB|MBA|B\.?Tech|M\.?Tech|PhD|UIPS|AMPH|[Uu]niversity|[Ii]nstitute|[Cc]ollege/.test(e)) || '';
      }
      // Experience: Only extract if explicit (e.g., "Ex Alvarez & Marsal")
      const expPattern = /(Ex\s+[A-Z][A-Za-z&\s]+|\d+\+?\s*years?)/g;
      const expMatches = Array.from(context.matchAll(expPattern)).map(m => m[0].trim());
      if (expMatches.length > 0) experience = expMatches.join('; ');
      // Add member with explicit source
      members.push({
        name,
        role,
        education: education ? { value: education, source: 'pitch_deck' } : { value: 'Not disclosed in pitch deck', source: 'synthetic' },
        experience: experience ? { value: experience, source: 'pitch_deck' } : { value: 'Not disclosed in pitch deck', source: 'synthetic' },
        background: background || undefined,
      });
    }
  }

  // Advisors extraction (optional, for completeness)
  // ...existing code...

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

  const result = {
    members: limitedMembers,
    totalMembers: limitedMembers.length,
  };
  // Debug: Log the final structured output for team extraction
  console.log('[TEAM-EXTRACTOR] Final structured team output:', JSON.stringify(result, null, 2));
  return result;
}

