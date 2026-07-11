/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // content/ is read with fs at request time (assistant guidance corpus,
    // guides/sectors on revalidate). Vercel's file tracer can't see dynamic
    // readdir/readFile calls, so without this the files are missing from the
    // serverless bundle and reads throw ENOENT in production only.
    outputFileTracingIncludes: {
      "/**": ["./content/**/*"],
    },
  },
};

export default nextConfig;
