import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@slate/api';

export const useSacs = () => useQuery({ queryKey: ['admin', 'sacs'], queryFn: adminApi.sacs });
export const useExhibitors = () => useQuery({ queryKey: ['admin', 'exhibitors'], queryFn: adminApi.exhibitors });
export const useAdminUsers = () => useQuery({ queryKey: ['admin', 'users'], queryFn: adminApi.users });
export const useIngestion = () => useQuery({ queryKey: ['admin', 'ingestion'], queryFn: adminApi.ingestion });
