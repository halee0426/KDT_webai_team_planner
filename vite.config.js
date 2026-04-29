import { defineConfig } from 'vite';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { qrcode } from 'vite-plugin-qrcode';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        qrcode(),
        VitePWA({
            registerType: 'autoUpdate',
            // 아이폰 홈에 추가했을 때 풀스크린 앱처럼 보이게
            manifest: {
                name: 'Haru:on',
                short_name: 'Haru:on',
                description: '1년의 흐름부터 10분의 집중까지, 함께 채우는 AI 플래너',
                theme_color: '#0066cc',
                background_color: '#000000',
                display: 'standalone',
                orientation: 'portrait',
                scope: '/',
                start_url: '/',
                lang: 'ko',
                icons: [
                    {
                        src: '/icons/icon-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: '/icons/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                    {
                        src: '/icons/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                ],
            },
            // iOS 메타 태그 자동 주입
            includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
            workbox: {
                globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
            },
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    assetsInclude: ['**/*.svg', '**/*.csv'],
    server: { port: 5173 },
});
