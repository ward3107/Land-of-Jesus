'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowRight, MapPin, BookOpen, Users, Heart, Calendar } from 'lucide-react';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center bg-stone-50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-100 to-stone-200 opacity-50" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 text-center">
          <h1 className="text-5xl md:text-7xl font-serif font-medium text-stone-900 leading-tight mb-8">
            {t('HomePage.heroHeadline')}
          </h1>
          <p className="text-xl md:text-2xl text-stone-600 max-w-3xl mx-auto mb-12 leading-relaxed">
            {t('HomePage.heroSubheadline')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/explore">
              <Button size="lg" className="w-full sm:w-auto">
                {t('HomePage.ctaExplore')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/explore?view=map">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <MapPin className="mr-2 h-5 w-5" />
                {t('HomePage.ctaOpenMap')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Explore the Land Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif text-stone-900 mb-4">
              {t('HomePage.sectionExploreTitle')}
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Discover sacred places across the Holy Land
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/explore?tradition=catholic">
                <div className="aspect-[4/3] bg-stone-200 rounded-lg mb-4 overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-amber-700" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-stone-900 mb-2">Catholic Churches</h3>
                <p className="text-stone-600">Latin and Eastern Catholic traditions</p>
              </Link>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/explore?tradition=orthodox">
                <div className="aspect-[4/3] bg-stone-200 rounded-lg mb-4 overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-blue-700" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-stone-900 mb-2">Orthodox Churches</h3>
                <p className="text-stone-600">Greek Orthodox and Oriental Orthodox</p>
              </Link>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/explore?tradition=armenian">
                <div className="aspect-[4/3] bg-stone-200 rounded-lg mb-4 overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-red-700" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-stone-900 mb-2">Armenian Heritage</h3>
                <p className="text-stone-600">Armenian Apostolic churches and sites</p>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Churches Section */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif text-stone-900 mb-4">
              {t('HomePage.sectionFeaturedChurches')}
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Iconic sanctuaries of Christian faith
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Demo Church Cards - will be replaced with dynamic data */}
            {[
              { 
                slug: 'basilica-annunciation-nazareth',
                name: 'Basilica of the Annunciation',
                location: 'Nazareth, Israel',
                tradition: 'Roman Catholic'
              },
              { 
                slug: 'church-nativity-bethlehem',
                name: 'Church of the Nativity',
                location: 'Bethlehem, Palestine',
                tradition: 'Greek Orthodox'
              },
              { 
                slug: 'holy-sepulchre-jerusalem',
                name: 'Church of the Holy Sepulchre',
                location: 'Jerusalem',
                tradition: 'Multiple Denominations'
              }
            ].map((church) => (
              <Card key={church.slug} className="overflow-hidden hover:shadow-lg transition-shadow">
                <Link href={`/churches/${church.slug}`}>
                  <div className="aspect-[16/10] bg-stone-200 overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-stone-300 to-stone-400 flex items-center justify-center">
                      <MapPin className="h-12 w-12 text-stone-500" />
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-stone-900 mb-2">{church.name}</h3>
                    <p className="text-stone-600 mb-3">{church.location}</p>
                    <span className="inline-block px-3 py-1 bg-stone-100 text-stone-700 text-sm rounded-full">
                      {church.tradition}
                    </span>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/explore">
              <Button variant="outline" size="lg">
                View All Churches
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stories Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif text-stone-900 mb-4">
              {t('HomePage.sectionStories')}
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Discover the rich history and heritage of Christian holy places
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'Ancient Pilgrimage Routes',
                excerpt: 'Follow the footsteps of millions of pilgrims who have journeyed to the Holy Land over two millennia.',
                icon: BookOpen
              },
              {
                title: 'Living Communities',
                excerpt: 'Meet the faithful communities who maintain these sacred spaces and keep ancient traditions alive.',
                icon: Users
              }
            ].map((story, idx) => (
              <Card key={idx} className="p-8 hover:shadow-lg transition-shadow">
                <Link href="/stories">
                  <div className="flex items-start gap-6">
                    <div className="p-4 bg-stone-100 rounded-full">
                      <story.icon className="h-8 w-8 text-stone-700" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-stone-900 mb-3">{story.title}</h3>
                      <p className="text-stone-600 leading-relaxed">{story.excerpt}</p>
                    </div>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif text-stone-900 mb-4">
              {t('HomePage.sectionProjects')}
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Support preservation efforts for future generations
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                slug: 'basilica-restoration-phase1',
                title: 'Basilica Restoration - Phase 1',
                church: 'Basilica of the Annunciation',
                progress: 18,
                goal: '$250,000'
              },
              {
                slug: 'heritage-documentation-project',
                title: 'Holy Land Heritage Documentation',
                church: null,
                progress: 52,
                goal: '$150,000'
              }
            ].map((project) => (
              <Card key={project.slug} className="p-6 hover:shadow-lg transition-shadow">
                <Link href={`/projects/${project.slug}`}>
                  <h3 className="text-xl font-semibold text-stone-900 mb-2">{project.title}</h3>
                  {project.church && (
                    <p className="text-stone-600 mb-4">{project.church}</p>
                  )}
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
                    <span className="text-amber-700 font-medium text-sm flex items-center">
                      Learn more
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/projects">
              <Button variant="outline" size="lg">
                View All Projects
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Visit Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-serif text-stone-900 mb-6">
                {t('HomePage.sectionVisitTitle')}
              </h2>
              <p className="text-lg text-stone-600 mb-8 leading-relaxed">
                Plan your pilgrimage to the Holy Land. Find practical information about visiting hours, 
                accessibility, guided tours, and nearby accommodations.
              </p>
              <div className="space-y-4">
                {[
                  'Opening hours and mass times',
                  'Accessibility information',
                  'Guided tour availability',
                  'Nearby accommodations and services'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-amber-600 rounded-full" />
                    <span className="text-stone-700">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link href="/visit">
                  <Button size="lg">
                    Plan Your Visit
                    <Calendar className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="aspect-square bg-stone-100 rounded-2xl overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-amber-100 to-stone-200 flex items-center justify-center">
                <MapPin className="h-24 w-24 text-amber-700" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Follow Journey Section */}
      <section className="py-24 bg-stone-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Heart className="h-16 w-16 mx-auto mb-8 text-amber-500" />
          <h2 className="text-4xl font-serif mb-6">
            {t('HomePage.sectionFollowJourney')}
          </h2>
          <p className="text-xl text-stone-300 mb-10 leading-relaxed">
            Stay connected with ongoing preservation efforts, community stories, 
            and ways to support Christian heritage in the Holy Land.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="lg">
              Create Account
            </Button>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-stone-900">
              Learn More
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
