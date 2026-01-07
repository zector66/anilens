import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Gamepad2, Brain, TrendingUp } from 'lucide-react';

interface NavigationProps {
  activeTab: 'taste' | 'games' | 'recommendations' | 'personality';
  onTabChange: (tab: 'taste' | 'games' | 'recommendations' | 'personality') => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const tabs = [
    {
      id: 'taste',
      label: 'Taste Profile',
      icon: BarChart3,
      description: 'Analyze your anime and manga preferences and patterns',
    },
    {
      id: 'games',
      label: 'Games',
      icon: Gamepad2,
      description: 'Test your knowledge with interactive games',
    },
    {
      id: 'recommendations',
      label: 'Recommendations',
      icon: TrendingUp,
      description: 'Discover new titles based on your taste',
    },
    {
      id: 'personality',
      label: 'Personality',
      icon: Brain,
      description: 'Explore your unique personality type',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              onClick={() => onTabChange(tab.id as 'taste' | 'games' | 'recommendations' | 'personality')}
              className="flex items-center gap-2"
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-12 h-12 text-gray-400 mx-auto mb-4 flex items-center justify-center">
              {(() => {
                const IconComponent = tabs.find(t => t.id === activeTab)?.icon || BarChart3;
                return <IconComponent className="w-12 h-12" />;
              })()}
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {tabs.find(t => t.id === activeTab)?.label}
            </h3>
            <p className="text-gray-600">
              {tabs.find(t => t.id === activeTab)?.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
