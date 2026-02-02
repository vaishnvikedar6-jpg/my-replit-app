import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { GraduationCap, ShieldCheck, MessageSquareText, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b py-4 px-6 md:px-12 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 text-primary">
          <GraduationCap className="h-8 w-8" />
          <span className="font-display font-bold text-xl tracking-tight">SGMS</span>
        </div>
        <div className="flex gap-4">
          <Link href="/auth">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/auth?tab=register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative py-20 md:py-32 px-6 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-white to-white"></div>
          
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-in slide-in-from-bottom-8 duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              24/7 Grievance Support System
            </div>
            
            <h1 className="font-display text-5xl md:text-7xl font-bold text-slate-900 leading-tight">
              A Voice for Every <span className="text-primary">Student</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Our secure, transparent, and efficient grievance redressal system ensures your concerns are heard and resolved with the utmost priority.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Link href="/auth?tab=register">
                <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                  Submit a Grievance <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                  Track Status
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-6 bg-slate-50">
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={ShieldCheck}
              title="Secure & Confidential"
              description="Your privacy is our priority. Submit grievances anonymously or track them securely with your student ID."
            />
            <FeatureCard 
              icon={MessageSquareText}
              title="Transparent Process"
              description="Real-time updates at every step. Know exactly who is handling your case and when it will be resolved."
            />
            <FeatureCard 
              icon={GraduationCap}
              title="University Standards"
              description="Adhering to the highest standards of academic integrity and student welfare guidelines."
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-500 text-sm border-t bg-white">
        © {new Date().getFullYear()} Student Grievance Management System. All rights reserved.
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-md transition-all duration-300">
      <div className="h-12 w-12 bg-blue-50 text-primary rounded-xl flex items-center justify-center mb-6">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-display font-bold text-xl mb-3 text-slate-900">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}
