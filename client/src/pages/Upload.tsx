import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Upload as UploadIcon,
  FileText,
  Globe,
  Users,
  DollarSign,
  Building2,
  Briefcase,
  MapPin,
  TrendingUp,
  MessageSquare,
  ArrowRight,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Layout from '@/components/layout/Layout';

interface UploadedFile {
  name: string;
  size: string;
  type: 'deck' | 'transcript' | 'email' | 'cv';
}

const Upload = () => {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Form state
  const [startupName, setStartupName] = useState("");
  const [location, setLocation] = useState("");
  const [stage, setStage] = useState("");
  const [sector, setSector] = useState("");
  const [businessModel, setBusinessModel] = useState("");
  const [website, setWebsite] = useState("");
  const [funding, setFunding] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [notes, setNotes] = useState("");
  const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null);
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [founderRole, setFounderRole] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (type: 'deck' | 'transcript' | 'email' | 'cv') => {
    // Trigger hidden file input; set accept based on type
    if (!fileInputRef.current) return;
    if (type === 'deck') fileInputRef.current.accept = '.pdf,.pptx';
    else if (type === 'transcript') fileInputRef.current.accept = '.txt,.pdf,.mp3,.wav';
    else if (type === 'cv') fileInputRef.current.accept = '.pdf';
    else fileInputRef.current.accept = '.eml,.txt';
    fileInputRef.current.dataset.type = type;
    fileInputRef.current.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const type = (e.target.dataset.type as UploadedFile['type']) || 'deck';
    const uploaded: UploadedFile = { name: file.name, size: `${(file.size / 1024 / 1024).toFixed(1)} MB`, type };
    setUploadedFiles([...uploadedFiles, uploaded]);
    if (type === 'deck') setPitchDeckFile(file);
    if (type === 'transcript') setTranscriptFile(file);
    if (type === 'cv') setCvFile(file);
    // Reset input so same file can be selected again if needed
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build FormData to match backend expectations
    const form = new FormData();
    form.append('startupName', startupName);
    form.append('location', location);
    form.append('stage', stage);
    form.append('sector', sector);
    form.append('businessModel', businessModel);
    form.append('website', website);
    form.append('fundingRaised', funding);
    form.append('teamSize', teamSize);
    form.append('additionalNotes', notes);
    if (pitchDeckFile) form.append('pitchDeck', pitchDeckFile);
    if (transcriptFile) form.append('transcript', transcriptFile);
    if (cvFile) {
      form.append('cv', cvFile);
      form.append('role', founderRole || 'Founder');
    }

    setIsAnalyzing(true);
    try {
      const resp = await fetch('/api/analyze', { method: 'POST', body: form });
      const data = await resp.json();
      if (resp.ok) {
        // Navigate to dashboard with the returned startupId
        const id = data.startupId || startupName.toLowerCase().replace(/\s+/g, '-') || 'techflow-ai';
        navigate(`/dashboard/${id}`);
      } else {
        console.error('Analyze error', data);
        setIsAnalyzing(false);
        alert(data.error || 'Failed to analyze startup');
      }
    } catch (err) {
      console.error(err);
      setIsAnalyzing(false);
      alert('Failed to contact the analysis server');
    }
  };

  if (isAnalyzing) {
    return (
      <Layout isLoggedIn>
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="relative mb-8">
              <div className="h-24 w-24 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <Loader2 className="h-12 w-12 text-secondary animate-spin" />
              </div>
              <div className="absolute inset-0 h-24 w-24 mx-auto rounded-full border-4 border-secondary/30 animate-ping" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Analyzing Startup...
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Generating deal report, calculating risk scores, and creating audio summary.
              This typically takes 30-60 seconds.
            </p>
            <div className="mt-8 flex items-center justify-center gap-2">
              {['Extracting data', 'Analyzing risks', 'Benchmarking', 'Generating report'].map((step, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}
                  className="px-3 py-1 rounded-full bg-muted text-xs text-muted-foreground"
                >
                  {step}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout isLoggedIn>
      <div className="py-12 relative">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-secondary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Analyze a New Startup
              </h1>
              <p className="text-lg text-muted-foreground">
                Upload founder materials and let NiveshAI generate your investment report.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section 1: Startup Details */}
              <div className="bg-card rounded-2xl border border-border shadow-lg p-6 md:p-8">
                <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-secondary" />
                  Startup Details
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="startupName">Startup Name *</Label>
                    <Input id="startupName" placeholder="e.g., TechFlow AI" required value={startupName} onChange={(e) => setStartupName(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="location" placeholder="e.g., San Francisco, CA" className="pl-9" value={location} onChange={(e) => setLocation(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Stage *</Label>
                    <Select required value={stage} onValueChange={(v) => setStage(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pre-seed">Pre-Seed</SelectItem>
                        <SelectItem value="seed">Seed</SelectItem>
                        <SelectItem value="series-a">Series A</SelectItem>
                        <SelectItem value="series-b">Series B</SelectItem>
                        <SelectItem value="series-c">Series C+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Sector *</Label>
                    <Select required value={sector} onValueChange={(v) => setSector(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sector" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="saas">SaaS</SelectItem>
                        <SelectItem value="fintech">Fintech</SelectItem>
                        <SelectItem value="healthtech">Healthtech</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Business Model</Label>
                    <Select value={businessModel} onValueChange={(v) => setBusinessModel(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="b2b">B2B</SelectItem>
                        <SelectItem value="b2c">B2C</SelectItem>
                        <SelectItem value="b2b2c">B2B2C</SelectItem>
                        <SelectItem value="marketplace">Marketplace</SelectItem>
                        <SelectItem value="subscription">Subscription</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="website" placeholder="https://example.com" className="pl-9" value={website} onChange={(e) => setWebsite(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="funding">Funding Raised</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="funding" placeholder="e.g., $2.5M" className="pl-9" value={funding} onChange={(e) => setFunding(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teamSize">Team Size</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="teamSize" placeholder="e.g., 15" className="pl-9" value={teamSize} onChange={(e) => setTeamSize(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Upload & Notes */}
              <div className="bg-card rounded-2xl border border-border shadow-lg p-6 md:p-8">
                <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                  <UploadIcon className="h-5 w-5 text-secondary" />
                  Upload Materials
                </h2>

                <div className="space-y-6">
                  {/* Upload Zones */}
                  <div className="grid md:grid-cols-3 gap-4">
                    {[
                      { type: 'deck' as const, label: 'Pitch Deck', icon: Briefcase, accept: '.pdf,.pptx' },
                      { type: 'email' as const, label: 'Founder Emails', icon: FileText, accept: '.eml,.txt' },
                      { type: 'cv' as const, label: 'Founder CV/Resume', icon: Users, accept: '.pdf' },
                    ].map(({ type, label, icon: Icon, accept }) => (
                      <div
                        key={type}
                        onClick={() => handleFileUpload(type)}
                        className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-secondary hover:bg-accent/50 transition-colors group"
                      >
                        <div className="h-12 w-12 mx-auto rounded-xl bg-muted flex items-center justify-center mb-3 group-hover:bg-secondary/10 transition-colors">
                          <Icon className="h-6 w-6 text-muted-foreground group-hover:text-secondary transition-colors" />
                        </div>
                        <p className="font-medium text-foreground mb-1">{label}</p>
                        <p className="text-xs text-muted-foreground">{accept}</p>
                      </div>
                    ))}
                  </div>

                  {/* Founder Role Input (shown when CV is uploaded) */}
                  {cvFile && (
                    <div className="space-y-2">
                      <Label htmlFor="founderRole">Founder Role</Label>
                      <Input 
                        id="founderRole" 
                        placeholder="e.g., CEO, CTO, Founder" 
                        value={founderRole}
                        onChange={(e) => setFounderRole(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Hidden file input used for both pitch deck and emails */}
                  <input ref={fileInputRef} type="file" onChange={onFileChange} style={{ display: 'none' }} />

                  {/* Uploaded Files */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label>Uploaded Files</Label>
                      <div className="flex flex-wrap gap-2">
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted"
                          >
                            <FileText className="h-4 w-4 text-secondary" />
                            <span className="text-sm text-foreground">{file.name}</span>
                            <span className="text-xs text-muted-foreground">({file.size})</span>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="ml-1 p-0.5 rounded-full hover:bg-background transition-colors"
                            >
                              <X className="h-3 w-3 text-muted-foreground" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any additional context about the startup, your initial impressions, or specific areas you'd like us to focus on..."
                      rows={4}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center">
                <Button
                  type="submit"
                  variant="hero"
                  size="xl"
                  className="min-w-64"
                >
                  <TrendingUp className="h-5 w-5" />
                  Run NiveshAI Analysis
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Upload;
