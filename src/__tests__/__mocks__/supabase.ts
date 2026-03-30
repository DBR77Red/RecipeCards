// Minimal Supabase client stub for unit tests.
// Tests that exercise syncToCloud or cloud paths should mock these further.
export const supabase = {
  storage: {
    from: () => ({
      upload: jest.fn().mockResolvedValue({ error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/photo.jpg' } }),
    }),
  },
  from: () => ({
    upsert: jest.fn().mockResolvedValue({ error: null }),
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    }),
  }),
  rpc: jest.fn().mockResolvedValue({ error: null }),
};
