import * as playcanvasCustom from '../vendor/playcanvas-custom.min.mjs';
import * as playcanvasStable_min from './playcanvas-stable.min.mjs';
import { FILLMODE_NONE, FILLMODE_KEEP_ASPECT, AppBase, createGraphicsDevice, AppOptions, RigidBodyComponentSystem, CollisionComponentSystem, JointComponentSystem, AnimationComponentSystem, AnimComponentSystem, ModelComponentSystem, RenderComponentSystem, CameraComponentSystem, LightComponentSystem, ScriptComponentSystem, SoundComponentSystem, AudioListenerComponentSystem, ParticleSystemComponentSystem, ScreenComponentSystem, ElementComponentSystem, ButtonComponentSystem, ScrollViewComponentSystem, ScrollbarComponentSystem, SpriteComponentSystem, LayoutGroupComponentSystem, LayoutChildComponentSystem, ZoneComponentSystem, GSplatComponentSystem, RenderHandler, AnimationHandler, AnimClipHandler, AnimStateGraphHandler, ModelHandler, MaterialHandler, TextureHandler, TextHandler, JsonHandler, AudioHandler, ScriptHandler, SceneHandler, CubemapHandler, HtmlHandler, CssHandler, ShaderHandler, HierarchyHandler, FolderHandler, FontHandler, BinaryHandler, TextureAtlasHandler, SpriteHandler, TemplateHandler, ContainerHandler, GSplatHandler, ElementInput, Keyboard, Mouse, GamePads, platform, TouchDevice, SoundManager, Lightmapper, BatchManager, XrManager } from './playcanvas-stable.min.mjs';
import { loadModules } from './__modules__.mjs';
import { PRELOAD_MODULES, ASSET_PREFIX, INPUT_SETTINGS, SCRIPT_PREFIX, SCRIPTS, CONFIG_FILENAME, SCENE_PATH, CONTEXT_OPTIONS } from './__settings__.mjs';

// Shared Lib
const CANVAS_ID = 'application-canvas';
// Needed as we will have edge cases for particular versions of iOS
// returns null if not iOS
const getIosVersion = ()=>{
    if (/iP(hone|od|ad)/.test(navigator.platform)) {
        const v = navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);
        return [
            parseInt(v[1], 10),
            parseInt(v[2], 10),
            parseInt(v[3] || 0, 10)
        ];
    }
    return null;
};
let lastWindowHeight = window.innerHeight;
let lastWindowWidth = window.innerWidth;
let windowSizeChangeIntervalHandler = null;
const pcBootstrap = {
    reflowHandler: null,
    iosVersion: getIosVersion(),
    createCanvas: function() {
        const canvas = document.createElement('canvas');
        canvas.setAttribute('id', CANVAS_ID);
        canvas.setAttribute('tabindex', 0);
        // Disable I-bar cursor on click+drag
        canvas.onselectstart = function() {
            return false;
        };
        // Disable long-touch select on iOS devices
        canvas.style['-webkit-user-select'] = 'none';
        document.body.appendChild(canvas);
        return canvas;
    },
    resizeCanvas: function(app, canvas) {
        canvas.style.width = '';
        canvas.style.height = '';
        app.resizeCanvas(canvas.width, canvas.height);
        const fillMode = app._fillMode;
        if (fillMode === FILLMODE_NONE || fillMode === FILLMODE_KEEP_ASPECT) {
            if (fillMode === FILLMODE_NONE && canvas.clientHeight < window.innerHeight || canvas.clientWidth / canvas.clientHeight >= window.innerWidth / window.innerHeight) {
                canvas.style.marginTop = Math.floor((window.innerHeight - canvas.clientHeight) / 2) + 'px';
            } else {
                canvas.style.marginTop = '';
            }
        }
        lastWindowHeight = window.innerHeight;
        lastWindowWidth = window.innerWidth;
        // Work around when in landscape to work on iOS 12 otherwise
        // the content is under the URL bar at the top
        if (this.iosVersion && this.iosVersion[0] <= 12) {
            window.scrollTo(0, 0);
        }
    },
    reflow: function(app, canvas) {
        this.resizeCanvas(app, canvas);
        // Poll for size changes as the window inner height can change after the resize event for iOS
        // Have one tab only, and rotate from portrait -> landscape -> portrait
        if (windowSizeChangeIntervalHandler === null) {
            windowSizeChangeIntervalHandler = setInterval(()=>{
                if (lastWindowHeight !== window.innerHeight || lastWindowWidth !== window.innerWidth) {
                    this.resizeCanvas(app, canvas);
                }
            }, 100);
            // Don't want to do this all the time so stop polling after some short time
            setTimeout(function() {
                if (!!windowSizeChangeIntervalHandler) {
                    clearInterval(windowSizeChangeIntervalHandler);
                    windowSizeChangeIntervalHandler = null;
                }
            }, 2000);
        }
    }
};
// Expose the reflow to users so that they can override the existing
// reflow logic if need be
window.pcBootstrap = pcBootstrap;
// template variants 
const LTC_MAT_1 = [];
const LTC_MAT_2 = [];
// variants
const canvas = pcBootstrap.createCanvas();
const app = new AppBase(canvas);
function initCSS() {
    if (document.head.querySelector) {
        // css media query for aspect ratio changes
        // TODO: Change these from private properties
        var css = `@media screen and (min-aspect-ratio: ${app._width}/${app._height}) {
            #application-canvas.fill-mode-KEEP_ASPECT {
                width: auto;
                height: 100%;
                margin: 0 auto;
            }
        }`;
        document.head.querySelector('style').innerHTML += css;
    }
    // Configure resolution and resize event
    if (canvas.classList) {
        canvas.classList.add(`fill-mode-${app.fillMode}`);
    }
}
function displayError(html) {
    const div = document.createElement('div');
    div.innerHTML = `<table style="background-color: #8CE; width: 100%; height: 100%;">
    <tr>
        <td align="center">
            <div style="display: table-cell; vertical-align: middle;">
                <div style="">${html}</div>
            </div>
        </td>
    </tr>
</table>`;
    document.body.appendChild(div);
}
function createLocalGraphicsDevice() {
    const deviceOptions = CONTEXT_OPTIONS ?? {};
    var LEGACY_WEBGL = 'webgl';
    var deviceTypes = [
        ...deviceOptions.deviceTypes,
        LEGACY_WEBGL
    ];
    const gpuLibPath = '';
    // new graphics device creation function with promises
    const gfxOptions = {
        deviceTypes: deviceTypes,
        glslangUrl: gpuLibPath + 'glslang.js',
        twgslUrl: gpuLibPath + 'twgsl.js',
        powerPreference: deviceOptions.powerPreference,
        antialias: deviceOptions.antialias !== false,
        alpha: deviceOptions.alpha === true,
        preserveDrawingBuffer: !!deviceOptions.preserveDrawingBuffer
    };
    return createGraphicsDevice(canvas, gfxOptions);
}
function initApp(device) {
    try {
        var createOptions = new AppOptions();
        createOptions.graphicsDevice = device;
        createOptions.componentSystems = [
            RigidBodyComponentSystem,
            CollisionComponentSystem,
            JointComponentSystem,
            AnimationComponentSystem,
            AnimComponentSystem,
            ModelComponentSystem,
            RenderComponentSystem,
            CameraComponentSystem,
            LightComponentSystem,
            ScriptComponentSystem,
            SoundComponentSystem,
            AudioListenerComponentSystem,
            ParticleSystemComponentSystem,
            ScreenComponentSystem,
            ElementComponentSystem,
            ButtonComponentSystem,
            ScrollViewComponentSystem,
            ScrollbarComponentSystem,
            SpriteComponentSystem,
            LayoutGroupComponentSystem,
            LayoutChildComponentSystem,
            ZoneComponentSystem,
            GSplatComponentSystem
        ];
        createOptions.resourceHandlers = [
            RenderHandler,
            AnimationHandler,
            AnimClipHandler,
            AnimStateGraphHandler,
            ModelHandler,
            MaterialHandler,
            TextureHandler,
            TextHandler,
            JsonHandler,
            AudioHandler,
            ScriptHandler,
            SceneHandler,
            CubemapHandler,
            HtmlHandler,
            CssHandler,
            ShaderHandler,
            HierarchyHandler,
            FolderHandler,
            FontHandler,
            BinaryHandler,
            TextureAtlasHandler,
            SpriteHandler,
            TemplateHandler,
            ContainerHandler,
            GSplatHandler
        ];
        createOptions.elementInput = new ElementInput(canvas, {
            useMouse: INPUT_SETTINGS.useMouse,
            useTouch: INPUT_SETTINGS.useTouch
        });
        createOptions.keyboard = INPUT_SETTINGS.useKeyboard ? new Keyboard(window) : null;
        createOptions.mouse = INPUT_SETTINGS.useMouse ? new Mouse(canvas) : null;
        createOptions.gamepads = INPUT_SETTINGS.useGamepads ? new GamePads() : null;
        createOptions.touch = INPUT_SETTINGS.useTouch && platform.touch ? new TouchDevice(canvas) : null;
        createOptions.assetPrefix = ASSET_PREFIX ?? '';
        createOptions.scriptPrefix = SCRIPT_PREFIX ?? '';
        createOptions.scriptsOrder = SCRIPTS ?? [];
        createOptions.soundManager = new SoundManager();
        createOptions.lightmapper = Lightmapper;
        createOptions.batchManager = BatchManager;
        createOptions.xr = XrManager;
        app.init(createOptions);
        return true;
    } catch (e) {
        displayError('Could not initialize application. Error: ' + e);
        console.error(e);
        return false;
    }
}
function configure() {
    app.configure(CONFIG_FILENAME, (err)=>{
        if (err) {
            console.error(err);
            return;
        }
        initCSS(canvas, app._fillMode, app._width, app._height);
        if (LTC_MAT_1.length && LTC_MAT_2.length && app.setAreaLightLuts.length === 2) {
            app.setAreaLightLuts(LTC_MAT_1, LTC_MAT_2);
        }
        // do the first reflow after a timeout because of
        // iOS showing a squished iframe sometimes
        setTimeout(()=>{
            pcBootstrap.reflow(app, canvas);
            pcBootstrap.reflowHandler = function() {
                pcBootstrap.reflow(app, canvas);
            };
            window.addEventListener('resize', pcBootstrap.reflowHandler, false);
            window.addEventListener('orientationchange', pcBootstrap.reflowHandler, false);
            
            // ---- KTX2 / ASTC enable + hard remap ----
            console.log('[KTX2] Starting KTX2 remapping...');
            console.log('[KTX2] Checking playcanvasCustom exports:', Object.keys(playcanvasCustom).length, 'exports');
            console.log('[KTX2] playcanvasCustom.Ktx2Parser:', !!playcanvasCustom.Ktx2Parser);
            console.log('[KTX2] window.pc?.Ktx2Parser:', !!window.pc?.Ktx2Parser);
            
            (function installKtx2Remap(app) {
                const pc = playcanvasCustom; // Use custom engine with KTX2 support
                const gd = app.graphicsDevice;
                const gl = gd.gl;
                
                console.log('[KTX2] Checking prerequisites...');

                const astcOK = !!(gl.getExtension('WEBGL_compressed_texture_astc') ||
                                  gl.getExtension('WEBKIT_WEBGL_compressed_texture_astc'));

                // 1) Register KTX2 parser (must exist in your engine build)
                if (!pc.Ktx2Parser) {
                    console.warn('[KTX2] pc.Ktx2Parser missing in this engine build. Staying on WebP.');
                    return;
                }
                console.log('[KTX2] pc.Ktx2Parser found, registering...');
                const texHandler = app.loader.getHandler('texture');
                const parser = new pc.Ktx2Parser(gd);
                
                // Debug what's available
                console.log('[KTX2] texHandler methods:', Object.keys(texHandler).filter(k => typeof texHandler[k] === 'function'));
                console.log('[KTX2] texHandler.parsers type:', typeof texHandler.parsers, texHandler.parsers);
                
                if (texHandler.addParser && typeof texHandler.addParser === 'function') {
                    texHandler.addParser(parser);
                    console.log('[KTX2] Parser added via addParser');
                } else if (texHandler.parsers && Array.isArray(texHandler.parsers)) {
                    texHandler.parsers.unshift(parser);
                    console.log('[KTX2] Parser added via parsers array');
                } else if (texHandler._parsers && Array.isArray(texHandler._parsers)) {
                    texHandler._parsers.unshift(parser);
                    console.log('[KTX2] Parser added via _parsers array');
                } else {
                    // Try direct assignment as fallback
                    console.warn('[KTX2] Standard parser registration failed, attempting direct override');
                    if (texHandler.parsers) {
                        texHandler.parsers = [parser];
                    } else if (texHandler._parsers) {
                        texHandler._parsers = [parser];
                    } else {
                        console.error('[KTX2] Could not add parser - no suitable method found!');
                        return;
                    }
                }

                // DISABLED: Force KTX2 usage even without ASTC support for testing
                // if (!astcOK) {
                //     console.warn('[KTX2] No ASTC support on this device. Staying on WebP.');
                //     return;
                // }
                console.warn('[KTX2] ASTC check disabled - forcing KTX2 usage. ASTC support:', astcOK);
                
                // Log which path will be used
                if (astcOK) {
                    console.log('[KTX2] ✓ NATIVE ASTC: Hardware will decode ASTC directly (fast path)');
                } else {
                    console.log('[KTX2] ⚠ FALLBACK: Engine will decompress ASTC to RGBA (slow path)');
                }

                // 2) Remap: find texture assets by their current filename and swap to .ktx2
                const KTX2_BASE = 'files/assets/astc6x6';
                const mapping = new Map([
                    ['means_l.webp',        `${KTX2_BASE}/means_l.ktx2`],
                    ['means_u.webp',        `${KTX2_BASE}/means_u.ktx2`],
                    ['quats.webp',          `${KTX2_BASE}/quats.ktx2`],
                    ['scales.webp',         `${KTX2_BASE}/scales.ktx2`],
                    ['sh0.webp',            `${KTX2_BASE}/sh0.ktx2`],
                    ['shN_centroids.webp',  `${KTX2_BASE}/shN_centroids.ktx2`],
                    ['shN_labels.webp',     `${KTX2_BASE}/shN_labels.ktx2`],
                ]);

                // utility: rewrite a texture asset in-place
                function rewriteAsset(a, newUrl) {
                    a.file.url = newUrl;
                    a.file.filename = newUrl.split('/').pop();
                    a.loaded = false;
                    a.resource = null;
                    a.preload = true;
                    // If your engine caches by 'hash' query, strip it so we don't hit the old URL
                    if (a.file.hash) a.file.hash = '';
                }

                // find candidates by filename suffix (works with /id/rev/…/name.webp?t=hash)
                const texAssets = app.assets.list().filter(a => a.type === 'texture' && a.file && a.file.filename);
                console.log(`[KTX2] Found ${texAssets.length} texture assets to check`);
                let count = 0;
                for (const a of texAssets) {
                    for (const [from, to] of mapping) {
                        if (a.file.filename.endsWith(from)) {
                            console.log(`[KTX2] Remapping: ${a.name} (${a.file.filename}) -> ${to}`);
                            rewriteAsset(a, to);
                            count++;
                            break;
                        }
                    }
                }
                console.log(`[KTX2] remapped ${count} texture assets to .ktx2`);
                
                // Add load event listeners to verify KTX2 loading
                texAssets.forEach(asset => {
                    if (asset.file.url.includes('.ktx2')) {
                        asset.on('load', () => {
                            console.log(`[KTX2] ✓ Successfully loaded KTX2: ${asset.name} from ${asset.file.url}`);
                        });
                        asset.on('error', (err) => {
                            console.error(`[KTX2] ✗ Failed to load: ${asset.name}`, err);
                        });
                    } else if (asset.file.url.includes('.webp')) {
                        console.warn(`[KTX2] WARNING: Still loading WebP: ${asset.name} from ${asset.file.url}`);
                    }
                });
                
                // Log final asset URLs to confirm KTX2 usage
                console.log('[KTX2] Final texture URLs after remapping:');
                texAssets.forEach(asset => {
                    if (asset.type === 'texture') {
                        console.log(`  - ${asset.name}: ${asset.file.url}`);
                    }
                });
            })(app);
            // ---- end KTX2 / ASTC block ----
            
            app.preload(()=>{
                app.scenes.loadScene(SCENE_PATH, (err)=>{
                    if (err) {
                        console.error(err);
                        return;
                    }
                    app.start();
                });
            });
        });
    });
}
async function main() {
    try {
        const device = await createLocalGraphicsDevice();
        if (initApp(device)) {
            await loadModules(PRELOAD_MODULES, ASSET_PREFIX);
            
            // Hook into asset loading BEFORE configure
            setupKtx2Remapping();
            
            configure();
        }
    } catch (e) {
        console.error('Device creation error:', e);
    }
}

function setupKtx2Remapping() {
    console.log('[KTX2] Setting up asset remapping hook...');
    
    const pc = playcanvasCustom;
    if (!pc.Ktx2Parser) {
        console.warn('[KTX2] Ktx2Parser not found - WebP will be used');
        return;
    }
    
    // First, register KTX2 parser BEFORE any hooks
    const gd = app.graphicsDevice;
    const texHandler = app.loader.getHandler('texture');
    const parser = new pc.Ktx2Parser(gd);
    
    // Force the parser to be first
    if (!texHandler.parsers) {
        texHandler.parsers = [];
    }
    if (Array.isArray(texHandler.parsers)) {
        // Remove any existing KTX2 parser
        texHandler.parsers = texHandler.parsers.filter(p => !(p instanceof pc.Ktx2Parser));
        // Add our parser first
        texHandler.parsers.unshift(parser);
    }
    
    console.log('[KTX2] Parser registered. Parsers available:', texHandler.parsers.length);
    
    // Override the texture handler's load method to use KTX2 parser for .ktx2 files
    const originalLoad = texHandler.load.bind(texHandler);
    texHandler.load = function(url, callback, asset) {
        if (url && (url.original || url.load || url).includes('.ktx2')) {
            console.log('[KTX2] Loading KTX2 file:', url.original || url.load || url);
            // Use KTX2 parser directly
            parser.load(url, callback, asset);
        } else {
            // Use original loader
            originalLoad(url, callback, asset);
        }
    };
    
    // Hook into the asset registry's add function to remap URLs
    const originalAdd = app.assets.add.bind(app.assets);
    app.assets.add = function(asset) {
        if (asset.type === 'texture' && asset.file) {
            const remapTable = {
                'means_l.webp': 'files/assets/astc6x6/means_l.ktx2',
                'means_u.webp': 'files/assets/astc6x6/means_u.ktx2',
                'quats.webp': 'files/assets/astc6x6/quats.ktx2',
                'scales.webp': 'files/assets/astc6x6/scales.ktx2',
                'sh0.webp': 'files/assets/astc6x6/sh0.ktx2',
                'shN_centroids.webp': 'files/assets/astc6x6/shN_centroids.ktx2',
                'shN_labels.webp': 'files/assets/astc6x6/shN_labels.ktx2'
            };
            
            for (const [webpName, ktx2Path] of Object.entries(remapTable)) {
                if (asset.file.filename === webpName || asset.file.url.includes(webpName)) {
                    console.log(`[KTX2] Remapping ${asset.name} from ${asset.file.url} to ${ktx2Path}`);
                    asset.file.url = ktx2Path;
                    asset.file.filename = ktx2Path.split('/').pop();
                    // Clear any cached hash to force reload
                    if (asset.file.hash) delete asset.file.hash;
                    break;
                }
            }
        }
        return originalAdd(asset);
    };
    
    console.log('[KTX2] Parser registered and asset remapping hook installed');
}
main();
// The `pc.script.createLoadingScreen()` in `__loading__.js` is invoked immediately 
// when the module is imported. This depends upon the `app` object being defined.
// Therefore we must import the loading screen module after the `app` object is defined.
import('./__loading__.mjs');
window.pc = playcanvasStable_min;
