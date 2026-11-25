/** @type {import('next').NextConfig} */
const nextConfig = { poweredByHeader: false, outputFileTracingIncludes: { "/api/game": ["./assets/scene-art/*.webp"] } };
export default nextConfig;
