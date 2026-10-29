import type { ScreenCategory, ScreenFormat, TheatreCategory } from '@slate/domain';

// Option lists for planning screens. Interest dimensions are not modelled as inventory, so they are fixed lists here
// until the SAC's show schedule feed provides them.
export const THEATRE_CATEGORIES: TheatreCategory[] = ['Premium', 'Mainstream', 'Value'];
export const SCREEN_CATEGORIES: ScreenCategory[] = ['Gold', 'Silver', 'Standard'];
export const SCREEN_FORMATS: ScreenFormat[] = ['Standard', 'IMAX', '4DX', 'ScreenX', 'Recliner', 'Onyx LED'];
export const GENRES = ['Action', 'Comedy', 'Drama', 'Family', 'Horror', 'Romance', 'Sci-fi', 'Thriller', 'Animation', 'Documentary'];
export const RATINGS = ['U', 'UA', 'A'];
export const LANGUAGES = ['Hindi', 'English', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Marathi', 'Punjabi'];

export const uniq = (xs: string[]) => [...new Set(xs)].sort((a, b) => a.localeCompare(b));
