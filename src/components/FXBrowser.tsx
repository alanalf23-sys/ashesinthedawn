import { useState, useRef, useCallback, useMemo } from 'react';
import {
  Search,
  X,
  Star,
  Filter,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronDown,
  Sliders,
  Music2,
  Waves,
  Sparkles,
  Volume2,
  Timer,
  Zap,
  Activity,
} from 'lucide-react';
import { useDAW } from '../contexts/DAWContext';

interface FXPlugin {
  id: string;
  name: string;
  manufacturer: string;
  category: FXCategory;
  description?: string;
  isFavorite?: boolean;
  tags?: string[];
}

type FXCategory = 
  | 'eq'
  | 'dynamics'
  | 'reverb'
  | 'delay'
  | 'modulation'
  | 'distortion'
  | 'filter'
  | 'utility'
  | 'mastering'
  | 'synthesis';

interface FXBrowserProps {
  className?: string;
  isPopout?: boolean;
  onPopout?: () => void;
  onClose?: () => void;
}

const CATEGORY_ICONS: Record<FXCategory, React.ReactNode> = {
  eq: <Sliders className="w-4 h-4" />,
  dynamics: <Activity className="w-4 h-4" />,
  reverb: <Waves className="w-4 h-4" />,
  delay: <Timer className="w-4 h-4" />,
  modulation: <Sparkles className="w-4 h-4" />,
  distortion: <Zap className="w-4 h-4" />,
  filter: <Filter className="w-4 h-4" />,
  utility: <Music2 className="w-4 h-4" />,
  mastering: <Volume2 className="w-4 h-4" />,
  synthesis: <Music2 className="w-4 h-4" />,
};

const CATEGORY_LABELS: Record<FXCategory, string> = {
  eq: 'EQ',
  dynamics: 'Dynamics',
  reverb: 'Reverb',
  delay: 'Delay',
  modulation: 'Modulation',
  distortion: 'Distortion',
  filter: 'Filter',
  utility: 'Utility',
  mastering: 'Mastering',
  synthesis: 'Synthesis',
};

/**
 * FXBrowser - REAPER-style plugin browser with pop-out capability
 * 
 * Features:
 * - Plugin categories with icons
 * - Search and filter
 * - Favorites system
 * - Drag-to-insert on tracks
 * - Pop-out to separate window
 * - Real-time plugin scanning
 */
export function FXBrowser({
  className = '',
  isPopout = false,
  onPopout,
  onClose,
}: FXBrowserProps) {
  const { tracks } = useDAW();
  
  // UI state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<FXCategory | 'all' | 'favorites'>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<FXCategory>>(new Set());
  const [selectedPlugin, setSelectedPlugin] = useState<FXPlugin | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  // Mock plugin database (in production, this would come from plugin scanning service)
  const mockPlugins: FXPlugin[] = useMemo(() => [
    // EQ
    { id: 'eq-parametric', name: 'Parametric EQ', manufacturer: 'CoreLogic', category: 'eq', description: '8-band parametric equalizer with spectrum analyzer' },
    { id: 'eq-graphic', name: 'Graphic EQ', manufacturer: 'CoreLogic', category: 'eq', description: '31-band graphic equalizer' },
    { id: 'eq-linear', name: 'Linear Phase EQ', manufacturer: 'CoreLogic', category: 'eq', description: 'Zero-phase distortion EQ' },
    
    // Dynamics
    { id: 'comp-vintage', name: 'Vintage Compressor', manufacturer: 'CoreLogic', category: 'dynamics', description: 'Classic tube-style compression' },
    { id: 'comp-multiband', name: 'Multiband Compressor', manufacturer: 'CoreLogic', category: 'dynamics', description: '4-band dynamics processor' },
    { id: 'limiter-brick', name: 'Brickwall Limiter', manufacturer: 'CoreLogic', category: 'dynamics', description: 'True peak limiting' },
    { id: 'gate-expander', name: 'Gate/Expander', manufacturer: 'CoreLogic', category: 'dynamics', description: 'Noise gate and expander' },
    
    // Reverb
    { id: 'reverb-hall', name: 'Concert Hall', manufacturer: 'CoreLogic', category: 'reverb', description: 'Large hall reverb simulation' },
    { id: 'reverb-plate', name: 'Plate Reverb', manufacturer: 'CoreLogic', category: 'reverb', description: 'Classic plate reverb emulation' },
    { id: 'reverb-spring', name: 'Spring Reverb', manufacturer: 'CoreLogic', category: 'reverb', description: 'Vintage spring reverb' },
    { id: 'reverb-shimmer', name: 'Shimmer Reverb', manufacturer: 'CoreLogic', category: 'reverb', description: 'Ethereal shimmer effect' },
    
    // Delay
    { id: 'delay-stereo', name: 'Stereo Delay', manufacturer: 'CoreLogic', category: 'delay', description: 'Synchronized stereo delay' },
    { id: 'delay-tape', name: 'Tape Echo', manufacturer: 'CoreLogic', category: 'delay', description: 'Vintage tape delay emulation' },
    { id: 'delay-ping', name: 'Ping Pong Delay', manufacturer: 'CoreLogic', category: 'delay', description: 'Stereo ping-pong delay' },
    
    // Modulation
    { id: 'chorus-ensemble', name: 'Ensemble Chorus', manufacturer: 'CoreLogic', category: 'modulation', description: 'Rich stereo chorus' },
    { id: 'flanger-jet', name: 'Jet Flanger', manufacturer: 'CoreLogic', category: 'modulation', description: 'Through-zero flanging' },
    { id: 'phaser-vintage', name: 'Vintage Phaser', manufacturer: 'CoreLogic', category: 'modulation', description: 'Classic phase shifter' },
    { id: 'tremolo-tube', name: 'Tube Tremolo', manufacturer: 'CoreLogic', category: 'modulation', description: 'Warm amplitude modulation' },
    
    // Distortion
    { id: 'dist-tube', name: 'Tube Saturator', manufacturer: 'CoreLogic', category: 'distortion', description: 'Analog tube warmth' },
    { id: 'dist-overdrive', name: 'Overdrive', manufacturer: 'CoreLogic', category: 'distortion', description: 'Smooth overdrive' },
    { id: 'dist-fuzz', name: 'Fuzz Box', manufacturer: 'CoreLogic', category: 'distortion', description: 'Vintage fuzz distortion' },
    
    // Filter
    { id: 'filter-vcf', name: 'Voltage Controlled Filter', manufacturer: 'CoreLogic', category: 'filter', description: 'Analog-style resonant filter' },
    { id: 'filter-auto', name: 'Auto Filter', manufacturer: 'CoreLogic', category: 'filter', description: 'Envelope-following filter' },
    
    // Utility
    { id: 'util-gain', name: 'Gain Utility', manufacturer: 'CoreLogic', category: 'utility', description: 'Precision gain staging' },
    { id: 'util-pan', name: 'Stereo Pan', manufacturer: 'CoreLogic', category: 'utility', description: 'Advanced panning control' },
    { id: 'util-width', name: 'Stereo Width', manufacturer: 'CoreLogic', category: 'utility', description: 'Stereo field adjustment' },
    { id: 'util-phase', name: 'Phase Alignment', manufacturer: 'CoreLogic', category: 'utility', description: 'Phase correction tool' },
    
    // Mastering
    { id: 'master-suite', name: 'Mastering Suite', manufacturer: 'CoreLogic', category: 'mastering', description: 'Complete mastering chain' },
    { id: 'master-maximizer', name: 'Loudness Maximizer', manufacturer: 'CoreLogic', category: 'mastering', description: 'Final stage maximizer' },
  ], []);
  
  // Toggle category expansion
  const toggleCategory = useCallback((category: FXCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  }, [expandedCategories]);
  
  // Toggle favorite
  const toggleFavorite = useCallback((pluginId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(pluginId)) {
      newFavorites.delete(pluginId);
    } else {
      newFavorites.add(pluginId);
    }
    setFavorites(newFavorites);
  }, [favorites]);
  
  // Filter plugins
  const filteredPlugins = useMemo(() => {
    return mockPlugins.filter((plugin) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          plugin.name.toLowerCase().includes(query) ||
          plugin.manufacturer.toLowerCase().includes(query) ||
          plugin.description?.toLowerCase().includes(query) ||
          plugin.tags?.some(tag => tag.toLowerCase().includes(query));
        
        if (!matchesSearch) return false;
      }
      
      // Category filter
      if (selectedCategory === 'favorites') {
        return favorites.has(plugin.id);
      }
      if (selectedCategory !== 'all') {
        return plugin.category === selectedCategory;
      }
      
      return true;
    });
  }, [mockPlugins, searchQuery, selectedCategory, favorites]);
  
  // Group plugins by category
  const pluginsByCategory = useMemo(() => {
    const grouped: Partial<Record<FXCategory, FXPlugin[]>> = {};
    
    filteredPlugins.forEach((plugin) => {
      if (!grouped[plugin.category]) {
        grouped[plugin.category] = [];
      }
      grouped[plugin.category]!.push(plugin);
    });
    
    return grouped;
  }, [filteredPlugins]);
  
  // Handle plugin drag
  const handlePluginDrag = useCallback((e: React.DragEvent, plugin: FXPlugin) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', plugin.id);
    e.dataTransfer.setData('application/x-corelogic-fx', JSON.stringify(plugin));
  }, []);
  
  // Handle plugin double-click (insert on selected track)
  const handlePluginDoubleClick = useCallback((plugin: FXPlugin) => {
    console.log('Insert plugin on selected track:', plugin);
    // In production: tracks.selectedTrack?.addEffect(plugin.id);
  }, [tracks]);
  
  const categories = Object.keys(CATEGORY_LABELS) as FXCategory[];
  
  return (
    <div className={`flex flex-col bg-slate-950 border border-slate-800 rounded-md shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 p-2 bg-slate-900 border-b border-slate-800 flex-shrink-0">
        <Music2 className="w-4 h-4 text-cyan-400" />
        <span className="text-sm font-medium text-slate-200">FX Browser</span>
        
        <div className="flex-1" />
        
        {/* Pop-out/Pop-in button */}
        {!isPopout && onPopout && (
          <button
            onClick={onPopout}
            className="p-1 hover:bg-slate-800 rounded transition-colors"
            title="Pop out to window"
          >
            <Maximize2 className="w-4 h-4 text-slate-400" />
          </button>
        )}
        
        {isPopout && onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </div>
      
      {/* Search bar */}
      <div className="p-2 bg-slate-900 border-b border-slate-800 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plugins..."
            className="w-full pl-7 pr-7 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-600"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-slate-300"
            >
              <X className="w-3 h-3 text-slate-500" />
            </button>
          )}
        </div>
      </div>
      
      {/* Category filters */}
      <div className="flex gap-1 p-2 bg-slate-900 border-b border-slate-800 flex-shrink-0 overflow-x-auto">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-2 py-1 text-xs rounded whitespace-nowrap transition-colors ${
            selectedCategory === 'all'
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setSelectedCategory('favorites')}
          className={`flex items-center gap-1 px-2 py-1 text-xs rounded whitespace-nowrap transition-colors ${
            selectedCategory === 'favorites'
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Star className="w-3 h-3" />
          Favorites
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded whitespace-nowrap transition-colors ${
              selectedCategory === category
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {CATEGORY_ICONS[category]}
            {CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>
      
      {/* Plugin list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredPlugins.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs p-4">
            <Filter className="w-8 h-8 mb-2 opacity-50" />
            <p>No plugins found</p>
          </div>
        ) : selectedCategory === 'all' || selectedCategory === 'favorites' ? (
          // Grouped by category
          <div>
            {categories.map((category) => {
              const plugins = pluginsByCategory[category] || [];
              if (plugins.length === 0) return null;
              
              const isExpanded = expandedCategories.has(category);
              
              return (
                <div key={category} className="border-b border-slate-800">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-slate-900/50 hover:bg-slate-800/50 transition-colors text-xs font-medium text-slate-200"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    )}
                    {CATEGORY_ICONS[category]}
                    <span>{CATEGORY_LABELS[category]}</span>
                    <span className="text-slate-500">({plugins.length})</span>
                  </button>
                  
                  {isExpanded && (
                    <div className="divide-y divide-slate-800">
                      {plugins.map((plugin) => (
                        <div
                          key={plugin.id}
                          draggable
                          onDragStart={(e) => handlePluginDrag(e, plugin)}
                          onDoubleClick={() => handlePluginDoubleClick(plugin)}
                          onClick={() => setSelectedPlugin(plugin)}
                          className={`flex items-center gap-2 px-4 py-2 cursor-pointer transition-colors ${
                            selectedPlugin?.id === plugin.id
                              ? 'bg-cyan-900/30'
                              : 'hover:bg-slate-800/50'
                          }`}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(plugin.id);
                            }}
                            className="flex-shrink-0"
                          >
                            <Star
                              className={`w-3 h-3 transition-colors ${
                                favorites.has(plugin.id)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-600 hover:text-slate-400'
                              }`}
                            />
                          </button>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-200 truncate">{plugin.name}</p>
                            <p className="text-xs text-slate-500 truncate">{plugin.manufacturer}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // Flat list for specific category
          <div className="divide-y divide-slate-800">
            {filteredPlugins.map((plugin) => (
              <div
                key={plugin.id}
                draggable
                onDragStart={(e) => handlePluginDrag(e, plugin)}
                onDoubleClick={() => handlePluginDoubleClick(plugin)}
                onClick={() => setSelectedPlugin(plugin)}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                  selectedPlugin?.id === plugin.id
                    ? 'bg-cyan-900/30'
                    : 'hover:bg-slate-800/50'
                }`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(plugin.id);
                  }}
                  className="flex-shrink-0"
                >
                  <Star
                    className={`w-3 h-3 transition-colors ${
                      favorites.has(plugin.id)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-600 hover:text-slate-400'
                    }`}
                  />
                </button>
                
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-200 truncate">{plugin.name}</p>
                  <p className="text-xs text-slate-500 truncate">{plugin.manufacturer}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Plugin details panel */}
      {selectedPlugin && (
        <div className="border-t border-slate-800 bg-slate-900 p-3 flex-shrink-0">
          <div className="flex items-start gap-2 mb-2">
            {CATEGORY_ICONS[selectedPlugin.category]}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200">{selectedPlugin.name}</p>
              <p className="text-xs text-slate-400">{selectedPlugin.manufacturer}</p>
            </div>
            <span className="px-2 py-0.5 bg-cyan-900/30 text-cyan-400 text-xs rounded">
              {CATEGORY_LABELS[selectedPlugin.category]}
            </span>
          </div>
          
          {selectedPlugin.description && (
            <p className="text-xs text-slate-400 mb-2">{selectedPlugin.description}</p>
          )}
          
          <div className="text-xs text-slate-500">
            Double-click or drag to insert on track
          </div>
        </div>
      )}
    </div>
  );
}

export default FXBrowser;
