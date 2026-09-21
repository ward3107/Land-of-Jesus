import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Calendar, FileText, Shield, TrendingUp, Users } from 'lucide-react';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';

// Demo data - will be replaced with Supabase data
const DEMO_PROJECT = {
  slug: 'basilica-restoration-phase1',
  title: 'Basilica Restoration - Phase 1',
  title_ar: 'ترميم البازيليكا - المرحلة الأولى',
  title_he: 'שיקום הבזיליקה - שלב 1',
  church: {
    slug: 'basilica-annunciation-nazareth',
    name: 'Basilica of the Annunciation'
  },
  shortDescription: 'Restoration of the main nave and facade of the Basilica of the Annunciation.',
  fullDescription: 'This project focuses on the critical restoration needs of the basilica, including structural repairs, cleaning of the facade, and preservation of original architectural elements. The work will ensure the building remains safe and accessible for future generations.',
  category: 'Restoration',
  status: 'APPROVED',
  budget: {
    total: 250000,
    raised: 45000,
    currency: 'USD'
  },
  progress: 18,
  timelines: [
    { phase: 'Assessment', startDate: '2025-01-01', endDate: '2025-03-31', completed: true },
    { phase: 'Facade Work', startDate: '2025-04-01', endDate: '2025-08-31', completed: false },
    { phase: 'Interior Restoration', startDate: '2025-09-01', endDate: '2025-12-31', completed: false }
  ],
  budgetItems: [
    { item: 'Structural assessment', amount: 25000 },
    { item: 'Facade cleaning', amount: 80000 },
    { item: 'Stone repair', amount: 100000 },
    { item: 'Roof waterproofing', amount: 45000 }
  ],
  verification: {
    status: 'VERIFIED',
    type: 'PROJECT_DOCUMENTS',
    reviewedAt: '2025-01-15'
  },
  updates: [
    { 
      title: 'Assessment Complete',
      content: 'The structural assessment phase has been completed successfully. Engineers have identified key areas requiring attention.',
      type: 'milestone',
      date: '10 days ago'
    }
  ]
};

interface ProjectProfilePageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export default async function ProjectProfilePage({ params }: ProjectProfilePageProps) {
  const { slug } = await params;
  
  // In production, fetch from Supabase
  const project = DEMO_PROJECT;
  
  if (!project || project.slug !== slug) {
    notFound();
  }

  const progressPercent = (project.budget.raised / project.budget.total) * 100;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-stone-900 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/30 to-stone-900" />
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm rounded-full">
              {project.category}
            </span>
            <span className="px-3 py-1 bg-green-600/80 backdrop-blur-sm text-white text-sm rounded-full flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Verified
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif mb-4">{project.title}</h1>
          <p className="text-xl text-stone-300 max-w-3xl mb-6">{project.shortDescription}</p>
          <Link href={`/churches/${project.church.slug}`}>
            <span className="inline-flex items-center text-amber-400 hover:text-amber-300 transition-colors">
              <Users className="mr-2 h-5 w-5" />
              {project.church.name}
              <ArrowRight className="ml-2 h-4 w-4" />
            </span>
          </Link>
        </div>
      </section>

      {/* Progress Bar */}
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-2">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-stone-700">Funding Progress</span>
                <span className="font-semibold text-amber-700">{progressPercent.toFixed(0)}%</span>
              </div>
              <div className="h-4 bg-stone-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-600 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-stone-600">Raised: ${project.budget.raised.toLocaleString()}</span>
                <span className="text-stone-600">Goal: ${project.budget.total.toLocaleString()}</span>
              </div>
            </div>
            <div className="text-center md:text-right">
              <div className="inline-block text-left">
                <p className="text-sm text-stone-600 mb-1">Prototype Notice</p>
                <p className="text-xs text-amber-700 font-medium bg-amber-100 px-3 py-1.5 rounded-lg">
                  Prototype — no payment will be processed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-12">
            {/* Why This Matters */}
            <section>
              <h2 className="text-2xl font-serif text-stone-900 mb-4">Why This Matters</h2>
              <p className="text-lg text-stone-700 leading-relaxed">{project.fullDescription}</p>
            </section>

            {/* Current Condition */}
            <section>
              <h2 className="text-2xl font-serif text-stone-900 mb-4">Current Condition</h2>
              <Card className="p-6">
                <p className="text-stone-700 leading-relaxed">
                  The basilica shows signs of weathering and structural stress after decades of exposure. 
                  The facade requires careful cleaning and repointing, while the roof needs waterproofing 
                  to prevent water damage to the interior. This restoration will preserve this sacred site 
                  for future generations of pilgrims and worshippers.
                </p>
              </Card>
            </section>

            {/* Plan */}
            <section>
              <h2 className="text-2xl font-serif text-stone-900 mb-4">Plan</h2>
              <div className="space-y-4">
                {project.timelines.map((timeline, idx) => (
                  <Card key={idx} className={`p-4 ${timeline.completed ? 'bg-green-50 border-green-200' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${timeline.completed ? 'bg-green-600' : 'bg-amber-600'}`} />
                        <div>
                          <h3 className="font-semibold text-stone-900">{timeline.phase}</h3>
                          <p className="text-sm text-stone-600">
                            {new Date(timeline.startDate).toLocaleDateString()} - {new Date(timeline.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {timeline.completed && (
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                          Completed
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* Budget Breakdown */}
            <section>
              <h2 className="text-2xl font-serif text-stone-900 mb-4">Budget Breakdown</h2>
              <Card className="p-6">
                <dl className="space-y-3">
                  {project.budgetItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-stone-100 last:border-0">
                      <dt className="text-stone-700">{item.item}</dt>
                      <dd className="font-medium text-stone-900">${item.amount.toLocaleString()}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-4 mt-4 border-t-2 border-stone-200">
                    <dt className="text-lg font-semibold text-stone-900">Total</dt>
                    <dd className="text-lg font-bold text-amber-700">${project.budget.total.toLocaleString()}</dd>
                  </div>
                </dl>
              </Card>
            </section>

            {/* Verification */}
            <section>
              <h2 className="text-2xl font-serif text-stone-900 mb-4">Verification</h2>
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <Shield className="h-6 w-6 text-green-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900 mb-1">Project Documents Verified</h3>
                    <p className="text-sm text-stone-600 mb-2">
                      This project has undergone due diligence review. All documentation has been verified by our team.
                    </p>
                    <p className="text-xs text-stone-500">
                      Reviewed on {new Date(project.verification.reviewedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            </section>

            {/* Updates */}
            <section>
              <h2 className="text-2xl font-serif text-stone-900 mb-4">Updates</h2>
              <div className="space-y-4">
                {project.updates.map((update, idx) => (
                  <Card key={idx} className="p-6">
                    <div className="flex items-center gap-2 text-sm text-stone-500 mb-3">
                      <TrendingUp className="h-4 w-4" />
                      <span className="capitalize">{update.type}</span>
                      <span>•</span>
                      <span>{update.date}</span>
                    </div>
                    <h3 className="font-semibold text-stone-900 mb-2">{update.title}</h3>
                    <p className="text-stone-700">{update.content}</p>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* Support Action - PROTOTYPE ONLY */}
            <Card className="p-6 bg-amber-50 border-amber-200">
              <h3 className="text-lg font-semibold text-stone-900 mb-2">Support This Project</h3>
              <p className="text-sm text-stone-600 mb-4">
                Your contribution helps preserve Christian heritage for future generations.
              </p>
              <div className="p-3 bg-amber-100 rounded-lg mb-4">
                <p className="text-xs text-amber-800 font-medium">
                  ⚠️ Prototype — no payment will be processed.
                </p>
              </div>
              <Button className="w-full mb-3" size="lg" disabled>
                Support (Disabled)
              </Button>
              <p className="text-xs text-stone-500 text-center">
                Payment integration coming in future release
              </p>
            </Card>

            {/* Project Details */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">Project Details</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-stone-500">Category</dt>
                  <dd className="font-medium text-stone-900">{project.category}</dd>
                </div>
                <div>
                  <dt className="text-sm text-stone-500">Status</dt>
                  <dd className="font-medium text-green-700 capitalize">{project.status.toLowerCase().replace('_', ' ')}</dd>
                </div>
                <div>
                  <dt className="text-sm text-stone-500">Church</dt>
                  <dd className="font-medium text-stone-900">
                    <Link href={`/churches/${project.church.slug}`} className="text-amber-700 hover:underline">
                      {project.church.name}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-stone-500">Verification</dt>
                  <dd className="font-medium text-green-700 flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    Verified
                  </dd>
                </div>
              </dl>
            </Card>

            {/* Documents */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents
              </h3>
              <p className="text-sm text-stone-600 mb-4">
                Project documentation is available for review upon request.
              </p>
              <Button variant="outline" className="w-full" size="sm">
                Request Documents
              </Button>
            </Card>

            {/* Share */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">Share This Project</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Facebook
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Twitter
                </Button>
              </div>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
