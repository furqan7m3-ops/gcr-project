import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  // Selects the StorageProvider implementation (see src/lib/storage) - "local"
  // (development default) is the only driver today; a future cloud backend
  // adds itself as another enum value here and a matching case in
  // getStorageProvider(), nothing else in the app needs to change.
  STORAGE_DRIVER: z.enum(["local"]).default("local"),
});

export const env = envSchema.parse(process.env);
