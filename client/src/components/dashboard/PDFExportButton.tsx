import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';

interface StartupData {
  name: string;
  stage: string;
  sector: string;
  decision: 'proceed' | 'monitor' | 'reject';
  confidenceScore: number;
}

interface PDFExportButtonProps {
  startupData: StartupData;
}

const PDFExportButton = ({ startupData }: PDFExportButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const generatePDF = async () => {
    setIsExporting(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      let yPos = margin;

      // Helper functions
      const addHeading = (text: string, size: number = 16) => {
        pdf.setFontSize(size);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(31, 41, 55);
        pdf.text(text, margin, yPos);
        yPos += size * 0.5 + 4;
      };

      const addSubheading = (text: string) => {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(55, 65, 81);
        pdf.text(text, margin, yPos);
        yPos += 8;
      };

      const addParagraph = (text: string) => {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(75, 85, 99);
        const lines = pdf.splitTextToSize(text, contentWidth);
        pdf.text(lines, margin, yPos);
        yPos += lines.length * 5 + 4;
      };

      const addDivider = () => {
        pdf.setDrawColor(229, 231, 235);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 8;
      };

      const checkPageBreak = (needed: number) => {
        if (yPos + needed > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          yPos = margin;
        }
      };

      // Header
      pdf.setFillColor(31, 41, 55);
      pdf.rect(0, 0, pageWidth, 35, 'F');
      
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text('NiveshAI Investment Report', margin, 18);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 28);
      
      yPos = 50;

      // Decision Badge
      const decisionColors: Record<string, [number, number, number]> = {
        proceed: [34, 197, 94],
        monitor: [234, 179, 8],
        reject: [239, 68, 68],
      };
      const decisionColor = decisionColors[startupData.decision];
      
      pdf.setFillColor(...decisionColor);
      pdf.roundedRect(margin, yPos, 50, 12, 3, 3, 'F');
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(startupData.decision.toUpperCase(), margin + 25, yPos + 8, { align: 'center' });

      pdf.setFontSize(28);
      pdf.setTextColor(31, 41, 55);
      pdf.text(`${startupData.confidenceScore}%`, margin + 65, yPos + 10);
      pdf.setFontSize(10);
      pdf.text('Confidence', margin + 90, yPos + 10);
      
      yPos += 25;
      addDivider();

      // Startup Info
      addHeading(startupData.name, 20);
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      pdf.text(`${startupData.stage} • ${startupData.sector}`, margin, yPos);
      yPos += 12;
      addDivider();

      // Executive Summary
      checkPageBreak(60);
      addHeading('Executive Summary');
      addParagraph('TechFlow AI is a B2B SaaS platform that automates workflow management using proprietary machine learning models. The founding team has strong credentials with two prior exits in the enterprise software space. The company has demonstrated strong product-market fit with 40% month-over-month growth and 92% customer retention. Key risks include limited runway and concentration in the SMB segment.');
      yPos += 8;

      // Startup Snapshot
      checkPageBreak(50);
      addHeading('Startup Snapshot');
      const snapshotData = [
        ['Location', 'San Francisco, CA'],
        ['Founded', '2022'],
        ['Funding', '$2.5M Seed'],
        ['Team Size', '15 employees'],
      ];
      snapshotData.forEach(([label, value]) => {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(107, 114, 128);
        pdf.text(label + ':', margin, yPos);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(31, 41, 55);
        pdf.text(value, margin + 35, yPos);
        yPos += 6;
      });
      yPos += 8;
      addDivider();

      // Founder & Team
      checkPageBreak(70);
      addHeading('Founder & Team Assessment');
      addSubheading('Founder Strength Score: 8.5/10');
      addParagraph('CEO: Stanford MBA, 2 prior exits ($15M, $42M acquisitions). 10 years at Salesforce as VP Product.');
      addParagraph('CTO: MIT PhD in Machine Learning. 8 years at Google Brain team.');
      addSubheading('Red Flags:');
      addParagraph('• Key person risk: CTO owns all core IP and ML architecture');
      addParagraph('• No technical co-founder succession plan in place');
      yPos += 4;
      addDivider();

      // Market Opportunity
      checkPageBreak(60);
      addHeading('Market Opportunity');
      addParagraph('TAM (Validated): $45B | SAM: $8.5B | SOM (Year 3): $850M | Market Growth Rate: 23% CAGR');
      addParagraph('The workflow automation market is experiencing strong growth, driven by post-pandemic digital transformation initiatives. TechFlow\'s AI-first approach positions it well against legacy competitors.');
      yPos += 4;
      addDivider();

      // Product & Technology
      checkPageBreak(60);
      addHeading('Product & Technology');
      addParagraph('Tech Stack: React, Node.js, PostgreSQL, AWS, TensorFlow, Python, Redis, Kubernetes');
      addParagraph('Defensibility: Proprietary dataset of 10M+ workflow patterns. 2 patents pending on ML optimization algorithms.');
      addParagraph('MVP Built: Yes | Paying Users: Yes (120+) | AI Dependency: Medium | Differentiation: High');
      yPos += 4;
      addDivider();

      // Traction & Growth
      checkPageBreak(50);
      addHeading('Traction & Growth');
      addParagraph('MRR: $71K (+36% MoM) | Active Users: 6,100 (+35% MoM) | Churn Rate: 2.1% | NPS: 72');
      addParagraph('Strong growth trajectory with consistent 35%+ MoM growth and improving unit economics.');
      yPos += 4;
      addDivider();

      // Competitive Landscape
      checkPageBreak(50);
      addHeading('Competitive Landscape');
      addParagraph('Key Competitors: Zapier (No-code integrations), Monday.com (Visual workflows), Notion (All-in-one workspace)');
      addParagraph('Competitive Advantage: AI-native approach enables intelligent automation that learns from user behavior, unlike competitors\' rule-based systems.');
      yPos += 4;
      addDivider();

      // Risk Assessment
      checkPageBreak(60);
      addHeading('Risk Assessment');
      addSubheading('Top Risks:');
      addParagraph('• HIGH: Limited runway — 8 months at current burn');
      addParagraph('• MEDIUM: Key person dependency on CTO');
      addParagraph('• LOW: Competitive pressure from established players');
      addParagraph('Risk Distribution: Low (45%) | Medium (35%) | High (20%)');

      // Footer
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(156, 163, 175);
        pdf.text(
          `NiveshAI Investment Report | Page ${i} of ${pageCount} | Confidential`,
          pageWidth / 2,
          pdf.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      pdf.save(`NiveshAI-Report-${startupData.name.replace(/\s+/g, '-')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      onClick={generatePDF} 
      disabled={isExporting}
      variant="gradient"
      size="lg"
      className="gap-2"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Generating PDF...
        </>
      ) : (
        <>
          <FileDown className="h-5 w-5" />
          Download Full Report (PDF)
        </>
      )}
    </Button>
  );
};

export default PDFExportButton;
