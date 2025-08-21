# PlayCanvas SOG Viewer with ASTC Optimization

A high-performance 3D Gaussian Splatting viewer using PlayCanvas engine with custom ASTC texture compression support.

## Features

- **Spherical Gaussian (SOG) Rendering**: Single-frame 3D Gaussian Splat visualization
- **Custom PlayCanvas Engine**: Modified to support raw ASTC-in-KTX2 textures
- **Automatic Device Detection**: 
  - Uses ASTC compressed textures on mobile devices (iPhone, Android, Quest)
  - Falls back to WebP on desktop browsers
- **80% File Size Reduction**: ASTC compression reduces texture data from 1.66 MB to 340 KB
- **Zero CPU Decode**: Direct GPU texture sampling on supported devices

## Live Demo

Visit: [GitHub Pages URL will be here]

## Device Support

### ✅ ASTC Optimized (Mobile/VR)
- iPhone/iPad (iOS 12+, A8 chip and newer)
- Modern Android devices (2017+)
- Quest 2/3 VR headsets

### 🔄 WebP Fallback (Desktop)
- Chrome, Firefox, Edge on Windows/Linux/Mac
- Older mobile devices without ASTC support

## Technical Details

- **Splat Count**: 77,284 3D Gaussians
- **Texture Layers**: 7 (position, scale, rotation, spherical harmonics)
- **Compression**: ASTC 6x6 block size for optimal quality/size ratio
- **Engine**: Custom PlayCanvas v2.11.0-beta.2 with KTX2 parser modifications

## Local Development

```bash
# Clone the repository
git clone [your-repo-url]

# Start local server
python server.py

# Open in browser
http://localhost:9000/
```

## Console Debugging

```javascript
// Check ASTC support
!!(app.graphicsDevice.gl.getExtension('WEBGL_compressed_texture_astc'))

// Verify KTX2 parser
!!pc.Ktx2Parser

// Check loaded textures
app.assets.list().filter(a=>a.type==='texture').forEach(a=>{
    console.log(a.name, a.file?.url);
});
```

## Credits

- PlayCanvas Engine: https://playcanvas.com
- 3D Gaussian Splatting research
- KTX2/ASTC texture format by Khronos Group