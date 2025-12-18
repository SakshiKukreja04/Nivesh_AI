import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, TrendingUp, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl blob-animation" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl blob-animation animation-delay-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/30 rounded-full blur-3xl" />
      </div>

      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-border mb-6">
              <Zap className="h-4 w-4 text-secondary" />
              <span className="text-sm font-medium text-accent-foreground">
                AI-Powered Deal Analysis
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Invest With{' '}
              <span className="gradient-text">Intelligence</span>,{' '}
              <br className="hidden sm:block" />
              Not Guesswork.
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
              NiveshAI turns pitch decks, emails, and transcripts into investor-ready 
              deal notes, risk scores, and audio summaries — in minutes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="xl" asChild>
                <Link to="/signup">
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="hero-outline" size="xl">
                <Play className="h-5 w-5" />
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-border">
              {[
                { value: '500+', label: 'Startups Analyzed' },
                { value: '85%', label: 'Time Saved' },
                { value: '50+', label: 'VC Firms' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                  className="text-center lg:text-left"
                >
                  <p className="text-2xl md:text-3xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right - Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative float-animation">
              {/* Main Dashboard Card */}
              <div className="bg-card rounded-2xl shadow-xl border border-border p-6 relative overflow-hidden">
                {/* Decision Badge */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">TechFlow AI</p>
                      <p className="text-sm text-muted-foreground">Series A · SaaS</p>
                    </div>
                  </div>
                  <div className="px-4 py-2 rounded-full bg-proceed text-proceed-foreground font-semibold text-sm shadow-success">
                    PROCEED
                  </div>
                </div>

                {/* Confidence Score */}
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="hsl(var(--muted))"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="hsl(var(--success))"
                        strokeWidth="8"
                        strokeDasharray={`${87 * 2.51} ${100 * 2.51}`}
                        strokeLinecap="round"
                        className="drop-shadow-lg"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-foreground">87</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Confidence Score</p>
                    <p className="text-sm text-success font-medium">High conviction investment</p>
                  </div>
                </div>

                {/* Mini Radar Chart Placeholder */}
                <div className="bg-muted/50 rounded-xl p-4 mb-4">
                  <div className="grid grid-cols-5 gap-2">
                    {['Team', 'Market', 'Product', 'Traction', 'Risk'].map((label, i) => (
                      <div key={label} className="flex flex-col items-center gap-1">
                        <div
                          className="w-full bg-secondary/20 rounded-full overflow-hidden"
                          style={{ height: '60px' }}
                        >
                          <div
                            className="w-full bg-gradient-to-t from-secondary to-secondary/60 rounded-full"
                            style={{ height: `${[85, 78, 92, 70, 65][i]}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Executive Summary</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    Strong founding team with prior exits. Clear product-market fit 
                    demonstrated by 40% MoM growth. Competitive moat through proprietary AI...
                  </p>
                </div>

                {/* Decorative gradient */}
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br from-secondary/20 to-transparent rounded-full blur-2xl" />
              </div>

              {/* Floating Elements */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="absolute -left-6 top-20 bg-card rounded-xl shadow-lg border border-border p-4 flex items-center gap-3"
              >
                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Low Risk</p>
                  <p className="text-xs text-muted-foreground">3 minor flags</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="absolute -right-4 bottom-20 bg-card rounded-xl shadow-lg border border-border p-4"
              >
                <p className="text-xs text-muted-foreground mb-1">Audio Summary</p>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-secondary rounded-full"
                        style={{ height: `${Math.random() * 20 + 8}px` }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">2:34</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
