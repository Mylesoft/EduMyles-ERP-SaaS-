import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Calculator, 
  MessageSquare, 
  BarChart3, 
  Shield, 
  Puzzle,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'EduMyles - Modern School Management Platform',
  description: 'Comprehensive, modular school management system with multi-tenant architecture. Manage academics, finances, communications, and more.',
};

const features = [
  {
    icon: GraduationCap,
    title: 'Academic Management',
    description: 'Complete student information system with grades, attendance, and curriculum management.',
    modules: ['Student Records', 'Gradebook', 'Attendance', 'Curriculum'],
  },
  {
    icon: Calculator,
    title: 'Financial Management',
    description: 'Fee structures, payment processing, invoicing, and financial reporting.',
    modules: ['Fee Management', 'Payments', 'Invoicing', 'Reports'],
  },
  {
    icon: MessageSquare,
    title: 'Communication Hub',
    description: 'Unified messaging, announcements, and notification system.',
    modules: ['Messages', 'Announcements', 'Notifications', 'Parent Portal'],
  },
  {
    icon: BookOpen,
    title: 'Learning Management',
    description: 'Course delivery, assignments, assessments, and online learning tools.',
    modules: ['Course Management', 'Assignments', 'Assessments', 'Digital Library'],
  },
  {
    icon: Users,
    title: 'HR Management',
    description: 'Staff management, payroll, scheduling, and performance tracking.',
    modules: ['Staff Records', 'Payroll', 'Scheduling', 'Performance'],
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Comprehensive reporting and analytics for data-driven decisions.',
    modules: ['Academic Reports', 'Financial Reports', 'Performance Analytics', 'Dashboards'],
  },
];

const benefits = [
  'Multi-tenant architecture for multiple schools',
  'Modular system - install only what you need',
  'Real-time data synchronization',
  'Mobile-responsive design',
  'Enterprise-grade security',
  'Third-party integrations',
  'Customizable workflows',
  'Scalable infrastructure',
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-24 lg:py-32">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200">
              <Puzzle className="mr-1 h-3 w-3" />
              Modular App Store Architecture
            </Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Modern School Management
              <br />
              <span className="bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent">
                Built for Success
              </span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-blue-100 sm:text-xl">
              EduMyles is a comprehensive, modular school management platform designed for modern educational institutions. 
              Scale from small schools to large districts with our flexible, multi-tenant architecture.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="border-blue-200 text-white hover:bg-blue-800">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Shield className="mr-1 h-3 w-3" />
              Enterprise Ready
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Everything Your School Needs
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our modular approach means you only pay for what you use, while maintaining the ability to scale as your institution grows.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <feature.icon className="h-6 w-6 text-blue-700" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {feature.modules.map((module, moduleIndex) => (
                      <Badge key={moduleIndex} variant="secondary" className="text-xs">
                        {module}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <Badge variant="outline" className="mb-4">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Why Choose EduMyles
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
                Built for Modern Education
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                EduMyles combines the power of modern technology with deep understanding of educational workflows. 
                Our platform grows with your institution and adapts to your unique needs.
              </p>
              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <Card className="p-6">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">Ready to Get Started?</CardTitle>
                  <CardDescription>
                    Join hundreds of schools already using EduMyles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <Link href="/auth/register" className="w-full">
                      <Button className="w-full" size="lg">
                        Start Your Free Trial
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/contact" className="w-full">
                      <Button variant="outline" className="w-full" size="lg">
                        Schedule a Demo
                      </Button>
                    </Link>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    No credit card required • 30-day free trial • Cancel anytime
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <GraduationCap className="h-6 w-6" />
                <span className="text-lg font-bold">EduMyles</span>
              </div>
              <p className="text-sm text-gray-400">
                Modern school management platform built for educational excellence.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Product</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-white">Demo</Link></li>
                <li><Link href="/integrations" className="hover:text-white">Integrations</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/status" className="hover:text-white">Status</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-sm text-gray-400">
              © 2024 Myles Corp Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}