import { Script, Asset } from '../../../playcanvas-stable.min.mjs';

function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}

class SogAstcHotSwap extends Script {
    
    initialize() {
        console.log('SogAstcHotSwap initialized');
        
        // Find the gsplat entity and its material
        const gsplatEntity = this.entity.findByName('sogsGsplat');
        if (!gsplatEntity) {
            console.error('No gsplat entity found. Make sure SOG is loaded first.');
            return;
        }
        
        this.gsplatEntity = gsplatEntity;
        this.gsplatComponent = gsplatEntity.gsplat;
        
        if (!this.gsplatComponent) {
            console.error('No gsplat component found on entity.');
            return;
        }
        
        // Store reference to the gsplat instance
        this.gsplatInstance = this.gsplatComponent.instance;
        
        // Check for ASTC support
        const gl = this.app.graphicsDevice.gl;
        this.astcSupported = !!(
            gl.getExtension('WEBGL_compressed_texture_astc') ||
            gl.getExtension('WEBKIT_WEBGL_compressed_texture_astc')
        );
        
        if (!this.astcSupported) {
            console.warn('ASTC compression not supported on this device');
        } else {
            console.log('ASTC compression supported');
        }
        
        // Auto-load if baseUrl is provided
        if (this.autoLoad && this.baseUrl) {
            this.loadKtx2Textures(this.baseUrl);
        }
    }
    
    async _loadTexture(url, filename) {
        return new Promise((resolve, reject) => {
            this.app.assets.loadFromUrlAndFilename(url, filename, 'texture', (err, asset) => {
                if (err) {
                    console.error('Failed to load texture:', filename, err);
                    return reject(err);
                }
                
                // Configure texture for data (not images)
                const texture = asset.resource;
                texture.minFilter = pc.FILTER_NEAREST;
                texture.magFilter = pc.FILTER_NEAREST;
                texture.addressU = pc.ADDRESS_CLAMP_TO_EDGE;
                texture.addressV = pc.ADDRESS_CLAMP_TO_EDGE;
                
                console.log('Loaded texture:', filename);
                resolve(texture);
            });
        });
    }
    
    async loadKtx2Textures(baseUrl = null) {
        const url = baseUrl || this.baseUrl || '/files/assets/astc6x6';
        
        console.log('Loading KTX2 textures from:', url);
        
        try {
            // Load manifest
            const manifestUrl = `${url.replace(/\/$/, '')}/manifest_ktx2.json`;
            const response = await fetch(manifestUrl);
            if (!response.ok) {
                throw new Error(`Failed to load manifest: ${response.status}`);
            }
            const manifest = await response.json();
            
            console.log('Loaded manifest:', manifest);
            
            // Map texture names to gsplat data properties
            const textureMapping = {
                'means_l': 'means_l',
                'means_u': 'means_u',
                'scales': 'scales',
                'quats': 'quats',
                'sh0': 'sh0',
                'shN_labels': 'sh_labels',
                'shN_centroids': 'sh_centroids'
            };
            
            // Load all textures in parallel
            const loadPromises = [];
            const textureNames = [];
            
            for (const [manifestName, gsplatName] of Object.entries(textureMapping)) {
                if (manifest.images[manifestName]) {
                    const textureUrl = `${url}/${manifest.images[manifestName]}`;
                    loadPromises.push(this._loadTexture(textureUrl, manifest.images[manifestName]));
                    textureNames.push(gsplatName);
                }
            }
            
            const textures = await Promise.all(loadPromises);
            
            // Get the gsplat data object
            const gsplatData = this.gsplatInstance?.gsplatData;
            if (!gsplatData) {
                console.error('No gsplat data found on instance');
                return;
            }
            
            // Update textures on the gsplat data
            for (let i = 0; i < textures.length; i++) {
                const texture = textures[i];
                const propName = textureNames[i];
                
                if (gsplatData[propName]) {
                    // Store old texture for cleanup
                    const oldTexture = gsplatData[propName];
                    
                    // Replace with new texture
                    gsplatData[propName] = texture;
                    console.log(`Replaced texture: ${propName}`);
                    
                    // Clean up old texture if needed
                    if (oldTexture && oldTexture.destroy) {
                        // Delay destruction to ensure no frame is using it
                        setTimeout(() => oldTexture.destroy(), 100);
                    }
                }
            }
            
            // If the gsplat has a method to refresh/rebuild, call it
            if (this.gsplatInstance.rebuild) {
                this.gsplatInstance.rebuild();
            }
            
            // Force a render update
            this.app.renderNextFrame = true;
            
            console.log('✅ Successfully loaded and applied ASTC textures');
            
            // Dispatch event for other scripts
            this.app.fire('astc:loaded', manifest);
            
        } catch (error) {
            console.error('Failed to load KTX2 textures:', error);
            this.app.fire('astc:error', error);
        }
    }
    
    // Public method to trigger loading
    load(baseUrl) {
        return this.loadKtx2Textures(baseUrl);
    }
    
    constructor(...args){
        super(...args);
        
        /**
         * @attribute
         * @type {string}
         * @description Base URL for KTX2 textures
         */
        _define_property(this, "baseUrl", "/files/assets/astc6x6");
        
        /**
         * @attribute
         * @type {boolean}
         * @description Auto-load textures on initialize
         */
        _define_property(this, "autoLoad", false);
    }
}

_define_property(SogAstcHotSwap, "scriptName", "sogAstcHotSwap");

export { SogAstcHotSwap };