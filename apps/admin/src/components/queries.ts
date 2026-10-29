import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@slate/api';

/** Every SAC, for pickers, the overview and the SAC page. The SACs list screen pages through `adminApi.sacs` itself. */
export const useSacs = () => useQuery({ queryKey: ['admin', 'sacs', 'all'], queryFn: adminApi.allSacs });
export const useExhibitors = () => useQuery({ queryKey: ['admin', 'exhibitors'], queryFn: adminApi.exhibitors });
export const useAdminUsers = () => useQuery({ queryKey: ['admin', 'users'], queryFn: adminApi.users });
export const useIngestion = () => useQuery({ queryKey: ['admin', 'ingestion'], queryFn: adminApi.ingestion });
