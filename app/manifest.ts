import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Board Game Hub',
        short_name: 'Game Hub',
        description: 'Die zentrale Plattform für deine Brettspiel-Gruppen',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#3b82f6',
        icons: [
            {
                src: '/icon.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
