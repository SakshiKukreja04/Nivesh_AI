import { motion } from 'framer-motion';
import { Upload, Cpu, LayoutDashboard, ArrowRight } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    number: '01',
    title: 'Upload Founder Material',
    description: 'Drag and drop pitch decks, meeting transcripts, or founder emails. We support PDF, DOCX, and plain text.',
    iconColor: 'text-warning',
    bgColor: 'from-warning/10 to-warning/5',
  },
  {
    icon: Cpu,
    number: '02',
    title: 'AI Analyzes & Benchmarks',
    description: 'Our engine extracts key metrics, identifies risks, and compares against thousands of similar deals.',
    iconColor: 'text-destructive',
    bgColor: 'from-destructive/10 to-destructive/5',
  },
  {
    icon: LayoutDashboard,
    number: '03',
    title: 'Decision-Ready Dashboard',
    description: 'Review your complete deal report with confidence scores, risk charts, and actionable recommendations.',
    iconColor: 'text-success',
    bgColor: 'from-success/10 to-success/5',
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-20 lg:py-32">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three simple steps from raw founder data to investment clarity.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2" />

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative"
              >
                <div className="bg-card rounded-2xl border border-border p-8 relative z-10 h-full shadow-lg hover:shadow-xl transition-shadow">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-8 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground text-sm font-bold">
                    Step {step.number}
                  </div>

                  {/* Icon */}
                  <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${step.bgColor} flex items-center justify-center mb-6 mt-4`}>
                    <step.icon className={`h-8 w-8 ${step.iconColor}`} />
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow between steps */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-6 z-20 h-12 w-12 rounded-full bg-card border border-border items-center justify-center -translate-y-1/2 shadow-md">
                    <ArrowRight className="h-5 w-5 text-secondary" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
