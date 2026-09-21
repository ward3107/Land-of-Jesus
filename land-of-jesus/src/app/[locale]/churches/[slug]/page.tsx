import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Clock, Calendar, Heart, Share2, Bookmark } from 'lucide-react';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';

// Types for demo data
interface ChurchDemoData {
  slug: string;
  name: string;
  name_ar: string;
  name_he: string;
  location: {
    address: string;
    city: string;
    region: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  tradition: string;
  denomination: string;
  status: 'LOJ_VERIFIED' | 'LISTED' | 'DISCOVERED';
  description: {
    overview: string;
    story: string;
    heritage: string;
    community: string;
  };
  visitingInfo: {
    isOpen: boolean | null;
    hours: Record<string, string> | null;
    admission: string | null;
    accessibility: string | null;
  };
  heritageItems: Array<{ title: string; type: string; period: string }>;
  projects: Array<{ slug: string; title: string; progress: number; goal: string; status: string }>;
  updates: Array<{ title: string; date: string; content: string }>;
}

// Fictional demo churches for development only
const DEMO_CHURCHES: Record<string, ChurchDemoData> = {
  'st-example-church-galilee': {
    slug: 'st-example-church-galilee',
    name: 'St. Example Church',
    name_ar: 'كنيسة القديس مثال',
    name_he: 'כנסיית סנט אקסמפל',
    location: {
      address: 'Example Street 12',
      city: 'Example City',
      region: 'Northern District',
      country: 'Israel',
      latitude: 32.7003,
      longitude: 35.3030
    },
    tradition: 'Roman Catholic',
    denomination: 'Latin Church',
    status: 'LOJ_VERIFIED' as const,
    description: {
      overview: 'St. Example Church is a fictional demo church used for testing the Land of Jesus platform. This entity does not represent any real church.',
      story: 'This is example content demonstrating how church stories will be displayed. In production, this would contain historically accurate information sourced from verified records.',
      heritage: 'Example heritage description. The actual platform will display verified heritage information about real churches once proper data is collected.',
      community: 'Example community description. Real community data will be provided by verified church representatives.'
    },
    visitingInfo: {
      isOpen: null, // Unknown - not verified
      hours: null,
      admission: 'Contact church for visiting information.',
      accessibility: null
    },
    heritageItems: [],
    projects: [
      {
        slug: 'example-roof-restoration',
        title: 'Example Roof Restoration Project',
        progress: 0,
        goal: '$50,000',
        status: 'DRAFT'
      }
    ],
    updates: []
  },
  'example-parish-galilee': {
    slug: 'example-parish-galilee',
    name: 'Example Parish of Galilee',
    name_ar: 'رعية مثال في الجليل',
    name_he: 'קהילת דוגמה בגליל',
    location: {
      address: 'Galilee Road 45',
      city: 'Example Village',
      region: 'Northern District',
      country: 'Israel',
      latitude: 32.8000,
      longitude: 35.4000
    },
    tradition: 'Greek Orthodox',
    denomination: 'Greek Orthodox Church',
    status: 'LISTED' as const,
    description: {
      overview: 'Example Parish of Galilee is a fictional demo church for testing purposes only.',
      story: 'This is placeholder content for the church story section.',
      heritage: 'This is placeholder content for heritage information.',
      community: 'This is placeholder content for community description.'
    },
    visitingInfo: {
      isOpen: null,
      hours: null,
      admission: 'Contact church for visiting information.',
      accessibility: null
    },
    heritageItems: [],
    projects: [
      {
        slug: 'example-community-center',
        title: 'Example Community Center Renovation',
        progress: 0,
        goal: '$75,000',
        status: 'SUBMITTED'
      }
    ],
    updates: []
  },
  'example-heritage-church': {
    slug: 'example-heritage-church',
    name: 'Example Heritage Church',
    name_ar: 'كنيسة التراث مثال',
    name_he: 'כנסיית מורשת דוגמה',
    location: {
      address: 'Heritage Lane 7',
      city: 'Example Town',
      region: 'Jerusalem District',
      country: 'Israel',
      latitude: 31.7784,
      longitude: 35.2294
    },
    tradition: 'Multiple',
    denomination: 'Various',
    status: 'DISCOVERED' as const,
    description: {
      overview: 'Example Heritage Church is a fictional demo church for testing purposes only.',
      story: 'This is placeholder content for the church story section.',
      heritage: 'This is placeholder content for heritage information.',
      community: 'This is placeholder content for community description.'
    },
    visitingInfo: {
      isOpen: null,
      hours: null,
      admission: 'Contact church for visiting information.',
      accessibility: null
    },
    heritageItems: [],
    projects: [],
    updates: []
  }
};

interface ChurchProfilePageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export default async function ChurchProfilePage({ params }: ChurchProfilePageProps) {
  const { slug } = await params;
  
  // Get church from demo data (will be replaced with Supabase query in production)
  const church = DEMO_CHURCHES[slug];
  
  if (!church) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] bg-stone-200 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-300 to-stone-400 flex items-center justify-center">
          <MapPin className="h-32 w-32 text-stone-500" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-8 md:p-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm rounded-full">
                {church.tradition}
              </span>
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm rounded-full">
                {church.denomination}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-serif text-white mb-4">{church.name}</h1>
            <div className="flex items-center gap-2 text-white/90">
              <MapPin className="h-5 w-5" />
              <span className="text-lg">{church.location.city}, {church.location.country}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Actions Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <div className="flex flex-wrap gap-3">
              <Link href={`/churches/${church.slug}/visit`}>
                <Button size="lg">
                  <Calendar className="mr-2 h-5 w-5" />
                  Plan Visit
                </Button>
              </Link>
              <Button variant="outline" size="lg">
                <Heart className="mr-2 h-5 w-5" />
                Follow
              </Button>
              <Button variant="ghost" size="lg">
                <Bookmark className="mr-2 h-5 w-5" />
                Save
              </Button>
            </div>
            <Button variant="ghost" size="lg">
              <Share2 className="mr-2 h-5 w-5" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-12">
            {/* Overview */}
            <section>
              <h2 className="text-2xl font-serif text-stone-900 mb-4">Overview</h2>
              <p className="text-lg text-stone-700 leading-relaxed">{church.description.overview}</p>
            </section>

            {/* Story */}
            <section>
              <h2 className="text-2xl font-serif text-stone-900 mb-4">Story</h2>
              <p className="text-stone-700 leading-relaxed">{church.description.story}</p>
            </section>

            {/* Heritage */}
            <section>
              <h2 className="text-2xl font-serif text-stone-900 mb-6">Heritage</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {church.heritageItems.map((item, idx) => (
                  <Card key={idx} className="p-6">
                    <h3 className="font-semibold text-stone-900 mb-2">{item.title}</h3>
                    <div className="space-y-1 text-sm text-stone-600">
                      <p>Type: {item.type}</p>
                      <p>Period: {item.period}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* Community */}
            <section>
              <h2 className="text-2xl font-serif text-stone-900 mb-4">Community</h2>
              <p className="text-stone-700 leading-relaxed">{church.description.community}</p>
            </section>

            {/* Projects */}
            <section>
              <h2 className="text-2xl font-serif text-stone-900 mb-6">Projects</h2>
              <div className="space-y-4">
                {church.projects.map((project) => (
                  <Card key={project.slug} className="p-6">
                    <Link href={`/projects/${project.slug}`}>
                      <h3 className="text-xl font-semibold text-stone-900 mb-3">{project.title}</h3>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-stone-600">Progress</span>
                          <span className="font-medium text-stone-900">{project.progress}%</span>
                        </div>
                        <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-600 rounded-full"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-stone-600">Goal: {project.goal}</span>
                        <span className="text-amber-700 font-medium text-sm">Learn more →</span>
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>
            </section>

            {/* Updates */}
            <section>
              <h2 className="text-2xl font-serif text-stone-900 mb-6">Updates</h2>
              <div className="space-y-4">
                {church.updates.map((update, idx) => (
                  <Card key={idx} className="p-6">
                    <div className="flex items-center gap-2 text-sm text-stone-500 mb-2">
                      <Clock className="h-4 w-4" />
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
            {/* Quick Facts */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">Quick Facts</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-stone-500">Tradition</dt>
                  <dd className="font-medium text-stone-900">{church.tradition}</dd>
                </div>
                <div>
                  <dt className="text-sm text-stone-500">Denomination</dt>
                  <dd className="font-medium text-stone-900">{church.denomination}</dd>
                </div>
                <div>
                  <dt className="text-sm text-stone-500">Location</dt>
                  <dd className="font-medium text-stone-900">{church.location.city}</dd>
                </div>
                <div>
                  <dt className="text-sm text-stone-500">Status</dt>
                  <dd className="font-medium text-green-700 flex items-center gap-1">
                    <span className="h-2 w-2 bg-green-500 rounded-full" />
                    Open to visitors
                  </dd>
                </div>
              </dl>
            </Card>

            {/* Visit Info */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">Visit Information</h3>
              <div className="space-y-4">
                {church.visitingInfo.hours ? (
                  <div>
                    <h4 className="font-medium text-stone-900 mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Opening Hours
                    </h4>
                    <dl className="space-y-1 text-sm">
                      {Object.entries(church.visitingInfo.hours).map(([day, hours]) => (
                        <div key={day} className="flex justify-between">
                          <dt className="text-stone-600 capitalize">{day.slice(0, 3)}</dt>
                          <dd className="text-stone-900">{hours}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ) : (
                  <p className="text-sm text-stone-600">Opening hours not available. Please contact the church directly.</p>
                )}
                
                <div className="pt-4 border-t border-stone-200">
                  <h4 className="font-medium text-stone-900 mb-2">Admission</h4>
                  <p className="text-sm text-stone-700">{church.visitingInfo.admission || 'Not specified'}</p>
                </div>
                
                <div className="pt-4 border-t border-stone-200">
                  <h4 className="font-medium text-stone-900 mb-2">Accessibility</h4>
                  <p className="text-sm text-stone-700">{church.visitingInfo.accessibility || 'Not specified'}</p>
                </div>
              </div>
            </Card>

            {/* Location Map Placeholder */}
            <Card className="overflow-hidden">
              <div className="aspect-square bg-stone-100 flex items-center justify-center">
                <div className="text-center p-6">
                  <MapPin className="h-12 w-12 text-stone-300 mx-auto mb-3" />
                  <p className="text-stone-500 text-sm">Interactive map coming soon</p>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
