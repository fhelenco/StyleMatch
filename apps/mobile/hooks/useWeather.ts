import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { useProfile } from './useProfile';

export interface WeatherSuggestion {
  city: string;
  tempC: number;
  condition: string;
  suggestedSeason: 'spring' | 'summer' | 'fall' | 'winter';
}

export function useWeather() {
  const { data: profile } = useProfile();

  return useQuery<WeatherSuggestion>({
    queryKey: ['weather', profile?.home_city],
    queryFn: () => apiRequest<WeatherSuggestion>('/api/weather'),
    enabled: !!profile?.home_city,
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });
}
