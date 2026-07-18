import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['**/*.test.ts', '**/*.test.tsx'],
        exclude: ['node_modules', '.next'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['lib/**', 'actions/**', 'utils/**'],
            exclude: ['node_modules', '.next'],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        },
    },
})