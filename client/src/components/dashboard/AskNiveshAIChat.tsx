import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AskNiveshAIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello, this is NiveshAI 👋\nAsk any questions about this startup's report, risks, valuation, or next steps.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const suggestedQuestions = [
    "Why is the risk score high?",
    "What should I ask the founder next?",
    "Summarize top concerns in 3 bullets.",
  ];

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      let response = '';
      if (userMessage.toLowerCase().includes('risk')) {
        response = "The risk score is elevated due to:\n\n1. **Limited Runway**: 8 months of runway at current burn rate\n2. **Key Person Risk**: CTO owns core IP with no succession plan\n3. **Market Concentration**: 65% revenue from top 3 customers\n\nRecommend discussing fundraising timeline and team expansion plans.";
      } else if (userMessage.toLowerCase().includes('founder') || userMessage.toLowerCase().includes('ask')) {
        response = "Based on the analysis, here are key questions for the founder:\n\n1. What's your path to profitability if fundraising is delayed?\n2. How are you mitigating key person risk around the CTO?\n3. What's your customer diversification strategy?\n4. Can you share cohort retention data?";
      } else if (userMessage.toLowerCase().includes('concern') || userMessage.toLowerCase().includes('bullet')) {
        response = "**Top 3 Concerns:**\n\n• **Financial Risk**: 8-month runway with high burn rate and no clear path to profitability\n• **Concentration Risk**: Heavy dependence on CTO for technical direction and top 3 customers for revenue\n• **Scalability Question**: Current unit economics may not support aggressive growth targets";
      } else {
        response = "Based on our analysis of TechFlow AI, the startup shows strong product-market fit with 40% MoM growth and solid founder credentials. However, the limited runway and key person dependencies are notable concerns. Would you like me to elaborate on any specific aspect?";
      }
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestionClick = (question: string) => {
    setInput(question);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-xl z-40 flex items-center justify-center"
        whileHover={{ scale: 1.05, boxShadow: '0 20px 40px hsl(var(--primary) / 0.3)' }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageSquare className="h-6 w-6" />
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 w-[420px] max-w-[calc(100vw-3rem)] bg-card rounded-2xl border border-border shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <span className="font-semibold text-foreground">Ask NiveshAI</span>
                  <p className="text-xs text-muted-foreground">Context-aware investment advisor</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-xl text-sm whitespace-pre-line ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted p-3 rounded-xl">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions */}
            {messages.length <= 2 && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(q)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about risks, team, traction..."
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1"
                />
                <Button size="icon" onClick={handleSend} disabled={!input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AskNiveshAIChat;
