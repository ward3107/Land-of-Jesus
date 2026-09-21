'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { MapPin, Search, Filter, List, Map as MapIcon } from 'lucide-react';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import Link from 'next/link';

// Demo data - will be replaced with Supabase data
const DEMO_CHURCHES = [
  {
    slug: 'basilica-annunciation-nazareth',
    name: 'Basilica of the Annunciation',
    name_ar: 'كنيسة البشارة',
    name_he: 'בזיליקת הבשורה',
    location: 'Nazareth',
    latitude: 32.7003,
    longitude: 35.3030,
    tradition: 'Roman Catholic',
    isOpen: true,
    hasProjects: true
  },
  {
    slug: 'church-nativity-bethlehem',
    name: 'Church of the Nativity',
    name_ar: 'كنيسة المهد',
    name_he: 'כנסיית המולד',
    location: 'Bethlehem',
    latitude: 31.7044,
    longitude: 35.2078,
    tradition: 'Greek Orthodox',
    isOpen: true,
    hasProjects: false
  },
  {
    slug: 'holy-sepulchre-jerusalem',
    name: 'Church of the Holy Sepulchre',
    name_ar: 'كنيسة القيامة',
    name_he: 'כנסיית הקבר',
    location: 'Jerusalem',
    latitude: 31.7784,
    longitude: 35.2294,
    tradition: 'Multiple',
    isOpen: true,
    hasProjects: false
  }
];

export default function ExplorePage() {
  const t = useTranslations();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredChurches = DEMO_CHURCHES.filter(church =>
    church.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    church.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-stone-200">
        <div className="max-w-[1920px] mx-auto">
          {/* Search and Controls */}
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="relative flex-1 max-w-2xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                <input
                  type="text"
                  placeholder={t('Explore.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  {t('Explore.filters')}
                </Button>
                
                <div className="flex bg-stone-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-white shadow-sm text-stone-900' 
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <List className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('Explore.listView')}</span>
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                      viewMode === 'map' 
                        ? 'bg-white shadow-sm text-stone-900' 
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <MapIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('Explore.mapView')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-4 p-6 bg-stone-50 rounded-xl border border-stone-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      {t('Explore.location')}
                    </label>
                    <select className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                      <option value="">All Locations</option>
                      <option value="nazareth">Nazareth</option>
                      <option value="bethlehem">Bethlehem</option>
                      <option value="jerusalem">Jerusalem</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      {t('Explore.tradition')}
                    </label>
                    <select className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                      <option value="">All Traditions</option>
                      <option value="catholic">Roman Catholic</option>
                      <option value="orthodox">Greek Orthodox</option>
                      <option value="armenian">Armenian Apostolic</option>
                      <option value="anglican">Anglican</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      {t('Explore.type')}
                    </label>
                    <select className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                      <option value="">All Types</option>
                      <option value="church">Church</option>
                      <option value="chapel">Chapel</option>
                      <option value="monastery">Monastery</option>
                      <option value="archaeological">Archaeological Site</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm text-stone-700">{t('Explore.openToVisitors')}</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto">
        {viewMode === 'list' ? (
          /* List View */
          <div className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredChurches.map((church) => (
                <Card key={church.slug} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <Link href={`/churches/${church.slug}`}>
                    <div className="aspect-[16/10] bg-stone-200 overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-stone-300 to-stone-400 flex items-center justify-center">
                        <MapPin className="h-12 w-12 text-stone-500" />
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-stone-900 mb-1">{church.name}</h3>
                      <p className="text-stone-600 text-sm mb-3">{church.location}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-block px-2.5 py-1 bg-stone-100 text-stone-700 text-xs rounded-full">
                          {church.tradition}
                        </span>
                        {church.isOpen && (
                          <span className="inline-block px-2.5 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            Open to visitors
                          </span>
                        )}
                        {church.hasProjects && (
                          <span className="inline-block px-2.5 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                            Has projects
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
            
            {filteredChurches.length === 0 && (
              <div className="text-center py-24">
                <MapPin className="h-16 w-16 text-stone-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-stone-900 mb-2">No churches found</h3>
                <p className="text-stone-600">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        ) : (
          /* Map View */
          <div className="grid lg:grid-cols-5 h-[calc(100vh-280px)]">
            {/* Results Panel */}
            <div className="lg:col-span-2 overflow-y-auto p-6 border-r border-stone-200">
              <div className="space-y-4">
                {filteredChurches.map((church) => (
                  <Card key={church.slug} className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href={`/churches/${church.slug}`}>
                      <div className="flex gap-4 p-4">
                        <div className="w-24 h-24 bg-stone-200 rounded-lg flex-shrink-0 overflow-hidden">
                          <div className="w-full h-full bg-gradient-to-br from-stone-300 to-stone-400 flex items-center justify-center">
                            <MapPin className="h-8 w-8 text-stone-500" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-stone-900 mb-1 truncate">{church.name}</h3>
                          <p className="text-stone-600 text-sm mb-2">{church.location}</p>
                          <div className="flex flex-wrap gap-1.5">
                            <span className="inline-block px-2 py-0.5 bg-stone-100 text-stone-700 text-xs rounded">
                              {church.tradition}
                            </span>
                            {church.isOpen && (
                              <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                Open
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>
            </div>
            
            {/* Map Placeholder */}
            <div className="hidden lg:block lg:col-span-3 bg-stone-100 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <MapIcon className="h-24 w-24 text-stone-300 mx-auto mb-4" />
                  <p className="text-stone-500 text-lg">Map integration coming soon</p>
                  <p className="text-stone-400 text-sm mt-2">Mapbox provider abstraction ready</p>
                </div>
              </div>
              
              {/* Demo map markers */}
              {filteredChurches.map((church, idx) => (
                <div
                  key={church.slug}
                  className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-full"
                  style={{
                    left: `${20 + (idx * 30)}%`,
                    top: `${30 + (idx * 20)}%`
                  }}
                >
                  <Link href={`/churches/${church.slug}`}>
                    <div className="bg-amber-600 text-white px-3 py-1.5 rounded-full shadow-lg text-sm font-medium hover:bg-amber-700 transition-colors">
                      {church.name.split(' ').pop()}
                    </div>
                    <div className="w-3 h-3 bg-amber-600 rotate-45 transform -translate-y-2 mx-auto" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
