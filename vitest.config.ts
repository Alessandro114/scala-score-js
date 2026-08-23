import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        coverage: {
            provider: 'v8',
            include: ['src/index.ts'],
            reporter: ['text', 'lcov'],
            // L'SDK e 154 righe e ogni ramo e raggiungibile stubbando fetch:
            // qui il 100% non e una posa, e il minimo verificabile. La soglia
            // serve a impedire che una funzione nuova entri senza test.
            thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
        },
    },
});
