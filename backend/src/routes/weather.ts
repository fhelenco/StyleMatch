import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { adminSupabase } from '../services/supabaseService';
import { geocodeCity, getCurrentWeather, mapTempToSeason, describeWeatherCode } from '../services/weatherService';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('home_city')
      .eq('id', req.userId!)
      .single();

    if (profileError || !profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    if (!profile.home_city) {
      res.status(400).json({ error: 'No home city set' });
      return;
    }

    const geo = await geocodeCity(profile.home_city);
    if (!geo) {
      res.status(404).json({ error: `Could not find "${profile.home_city}"` });
      return;
    }

    const weather = await getCurrentWeather(geo.latitude, geo.longitude);

    res.json({
      city: geo.name,
      tempC: Math.round(weather.tempC),
      condition: describeWeatherCode(weather.weatherCode),
      suggestedSeason: mapTempToSeason(weather.tempC),
    });
  } catch (err) {
    console.error('get weather error:', err);
    res.status(500).json({ error: 'Failed to fetch weather' });
  }
});

export default router;
