// Thin client for the Lyfta API (https://my.lyfta.app/community/api).
// Bearer auth, 60 req/min + 5000 req/day server-side limits. Everything the
// domain does over the network goes through the LyftaClient interface so
// tests (and tools.ts) can inject a fake.

export interface ApiWorkoutSet {
  id?: string;
  weight?: string | number | null;
  reps?: string | number | null;
  rir?: string | number | null;
  duration?: string | number | null;
  distance?: string | number | null;
  set_type_id?: string | number | null;
  is_completed?: boolean | number | null;
  record_type?: string | null;
  record_level?: string | null;
  record_value?: string | null;
}

export interface ApiWorkoutExercise {
  exercise_id: number | string;
  excercise_name?: string; // sic — the API misspells it
  exercise_type?: string | null;
  exercise_image?: string | null;
  exercise_rest_time?: number | string | null;
  sets?: ApiWorkoutSet[];
}

export interface ApiWorkout {
  id: number | string;
  title?: string | null;
  body_weight?: number | string | null;
  workout_perform_date?: string | null; // "2025-07-15 06:42:09"
  total_volume?: number | string | null;
  exercises?: ApiWorkoutExercise[];
}

export interface ApiWorkoutsPage {
  status: boolean;
  total_records?: number;
  total_pages?: number;
  current_page?: number;
  workouts?: ApiWorkout[];
}

export interface ApiWorkoutSummary {
  id: number | string;
  title?: string | null;
  description?: string | null;
  workout_duration?: string | null; // "01:06:25"
  total_volume?: number | string | null;
  workout_perform_date?: string | null;
}

export interface ApiSummaryPage {
  status: boolean;
  total_pages?: number;
  workouts?: ApiWorkoutSummary[];
}

export interface ApiExercise {
  id: number | string;
  name?: string | null;
  image_name?: string | null;
  equipment_id?: unknown;
  body_part_id?: unknown;
  Target_muscles_id?: unknown;
  Synergist_muscles_id?: unknown;
  exercise_type?: string | null;
}

export interface ApiExercisesPage {
  status: boolean;
  count?: number;
  exercises?: ApiExercise[];
}

export interface ApiLibraryResult {
  status: boolean;
  data?: {
    results?: ApiExercise[];
    pagination?: { limit: number; offset: number; total: number; hasMore: boolean };
  };
}

export interface CreateCollectionInput {
  title: string;
  description?: string;
  goal?: string;
}

export interface TemplateSetInput {
  set_type_id?: number;
  reps?: string;
  from_reps?: string;
  to_reps?: string;
  weight?: string;
  rir?: string;
  duration?: string;
  distance?: string;
}

export interface TemplateExerciseInput {
  exercise_id: number;
  excercise_name: string;
  exercise_type: string;
  exercise_image: string;
  exercise_note?: string;
  exercise_rest_time?: number;
  exercise_superset_id?: number;
  sets: TemplateSetInput[];
}

export interface CreateTemplateInput {
  collectionId: number;
  workout: {
    title?: string;
    description?: string;
    note?: string;
    exercises: TemplateExerciseInput[];
  };
}

export interface LyftaClient {
  workouts(page: number, limit: number): Promise<ApiWorkoutsPage>;
  workoutsSummary(page: number, limit: number): Promise<ApiSummaryPage>;
  exercises(page: number, limit: number): Promise<ApiExercisesPage>;
  searchLibrary(search: string, limit: number, offset: number): Promise<ApiLibraryResult>;
  createCollection(input: CreateCollectionInput): Promise<{ id: number }>;
  createTemplate(input: CreateTemplateInput): Promise<{ id: number; title?: string }>;
}

export function createLyftaClient(opts: {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}): LyftaClient {
  const base = (opts.baseUrl ?? "https://my.lyfta.app").replace(/\/+$/, "");
  const doFetch = opts.fetchImpl ?? fetch;

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await doFetch(`${base}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${opts.apiKey}`,
        accept: "application/json",
        ...(init?.body ? { "content-type": "application/json" } : {}),
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (res.status === 401 || res.status === 403) throw new Error("Lyfta API rejected the key (401) — check LYFTA_API_KEY");
    if (res.status === 429) throw new Error("Lyfta API rate limit hit (429) — retry in a minute");
    if (!res.ok) throw new Error(`Lyfta API error: HTTP ${res.status}`);
    const body = (await res.json()) as T & { status?: boolean; message?: string };
    if (body && body.status === false) throw new Error(`Lyfta API error: ${body.message ?? "status false"}`);
    return body;
  }

  return {
    workouts: (page, limit) => request(`/api/v1/workouts?page=${page}&limit=${limit}`),
    workoutsSummary: (page, limit) => request(`/api/v1/workouts/summary?page=${page}&limit=${limit}`),
    exercises: (page, limit) => request(`/api/v1/exercises?page=${page}&limit=${limit}`),
    searchLibrary: (search, limit, offset) =>
      request(`/api/v1/exercises/library?search=${encodeURIComponent(search)}&limit=${limit}&offset=${offset}`),
    createCollection: async (input) => {
      const res = await request<{ data?: { id?: number } }>(`/api/v1/collections`, {
        method: "POST",
        body: JSON.stringify({ collection: input }),
      });
      const id = res.data?.id;
      if (typeof id !== "number") throw new Error("Lyfta API: collection created but no id returned");
      return { id };
    },
    createTemplate: async (input) => {
      const res = await request<{ data?: { id?: number; title?: string } }>(`/api/v1/templates`, {
        method: "POST",
        body: JSON.stringify(input),
      });
      const id = res.data?.id;
      if (typeof id !== "number") throw new Error("Lyfta API: template created but no id returned");
      return { id, ...(res.data?.title ? { title: res.data.title } : {}) };
    },
  };
}
