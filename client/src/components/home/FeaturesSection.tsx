import { motion } from 'framer-motion';
import { 
  FileText, 
  AlertTriangle, 
  BarChart3, 
  Headphones, 
  Download,
  Sparkles
} from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Auto-Generated Deal Reports',
    description: 'Transform pitch decks and transcripts into comprehensive investment memos with structured insights.',
    iconColor: 'text-success',
    bgColor: 'from-success/10 to-success/5',
  },
  {
    icon: AlertTriangle,
    title: 'Risk Visualization',
    description: 'Color-coded risk matrices and radar charts highlight red flags before they become deal-breakers.',
    iconColor: 'text-destructive',
    bgColor: 'from-destructive/10 to-destructive/5',
  },
  {
    icon: BarChart3,
    title: 'Benchmarking Engine',
    description: 'Compare startups against industry standards and similar deals in your portfolio.',
    iconColor: 'text-warning',
    bgColor: 'from-warning/10 to-warning/5',
  },
  {
    icon: Headphones,
    title: 'AI Audio Summary',
    description: 'Listen to 2-minute audio briefs on-the-go. Perfect for busy investors between meetings.',
    iconColor: 'text-success',
    bgColor: 'from-success/10 to-success/5',
  },
  {
    icon: Download,
    title: 'PDF + WAV Export',
    description: 'Download polished reports and audio files to share with your investment committee.',
    iconColor: 'text-warning',
    bgColor: 'from-warning/10 to-warning/5',
  },
  {
    icon: Sparkles,
    title: 'Follow-up Chatbot',
    description: 'Ask deeper questions about any startup. Get instant answers backed by your uploaded data.',
    iconColor: 'text-destructive',
    bgColor: 'from-destructive/10 to-destructive/5',
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 lg:py-32 relative">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-accent/20 to-background" />

      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Everything You Need to{' '}
            <span className="gradient-text">Evaluate Smarter</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From document analysis to decision support, NiveshAI provides the complete 
            toolkit for modern investment professionals.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card-premium p-6 group"
            >
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.bgColor} flex items-center justify-center mb-4 transition-all group-hover:scale-110`}>
                <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
