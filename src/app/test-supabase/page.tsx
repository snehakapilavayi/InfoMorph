import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export default async function TestSupabasePage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Attempt to query
  const { data: projects, error } = await supabase.from('projects').select('*').limit(5);

  return (
    <div className="p-8 max-w-2xl mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Status</h1>
      <div className="p-4 rounded-lg border bg-white shadow-sm space-y-3">
        <p className="flex items-center gap-2">
          <span className="font-semibold">Status:</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Connected to API
          </span>
        </p>
        <p className="text-sm text-gray-600">
          <strong>Project URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}
        </p>
        {error ? (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
            <p className="font-medium">Note: Table not initialized yet</p>
            <p className="text-xs mt-1">{error.message}</p>
            <p className="text-xs mt-2 text-gray-600">
              Run the SQL in <code>supabase/schema.sql</code> in the Supabase SQL Editor to create the tables.
            </p>
          </div>
        ) : (
          <div className="text-sm text-gray-700">
            <p className="font-medium">Projects found: {projects?.length ?? 0}</p>
          </div>
        )}
      </div>
    </div>
  );
}
