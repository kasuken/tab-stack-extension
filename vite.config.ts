import { defineConfig } from 'vite'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs'

export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup.html'),
        dashboard: resolve(__dirname, 'src/dashboard.html'),
        background: resolve(__dirname, 'src/background.ts'),
        content: resolve(__dirname, 'src/content.ts'),
        injected: resolve(__dirname, 'src/injected.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return '[name].js'
        },
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.html')) {
            return '[name].[ext]'
          }
          return '[name].[ext]'
        },
      },
    },
  },
  plugins: [
    {
      name: 'copy-extension-files',
      writeBundle() {
        // Ensure dist directory exists
        if (!existsSync('dist')) {
          mkdirSync('dist', { recursive: true })
        }
        
        // Copy manifest.json to dist
        copyFileSync('src/manifest.json', 'dist/manifest.json')
        
        // Copy HTML files if they're not already in dist
        if (!existsSync('dist/dashboard.html') && existsSync('src/dashboard.html')) {
          copyFileSync('src/dashboard.html', 'dist/dashboard.html')
        }
        
        // Copy icons directory
        if (existsSync('src/icons')) {
          if (!existsSync('dist/icons')) {
            mkdirSync('dist/icons', { recursive: true })
          }
          
          const iconFiles = readdirSync('src/icons')
          iconFiles.forEach(file => {
            if (file !== 'README.md') { // Skip the README file
              try {
                copyFileSync(`src/icons/${file}`, `dist/icons/${file}`)
              } catch (e) {
                console.log(`Note: ${file} appears to be a placeholder - replace with actual PNG icons`)
              }
            }
          })
          
          // Copy README if it exists
          if (iconFiles.includes('README.md')) {
            copyFileSync('src/icons/README.md', 'dist/icons/README.md')
          }
        }
        
        console.log('Extension files copied to dist/')
        console.log('📁 Load the "dist" folder as an unpacked extension in Chrome/Edge')
      },
    },
  ],
})
