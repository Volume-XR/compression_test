import * as playcanvasCustom from 'playcanvas';
import { FILLMODE_NONE, FILLMODE_KEEP_ASPECT, AppBase, createGraphicsDevice, AppOptions, RigidBodyComponentSystem, CollisionComponentSystem, JointComponentSystem, AnimationComponentSystem, AnimComponentSystem, ModelComponentSystem, RenderComponentSystem, CameraComponentSystem, LightComponentSystem, ScriptComponentSystem, SoundComponentSystem, AudioListenerComponentSystem, ParticleSystemComponentSystem, ScreenComponentSystem, ElementComponentSystem, ButtonComponentSystem, ScrollViewComponentSystem, ScrollbarComponentSystem, SpriteComponentSystem, LayoutGroupComponentSystem, LayoutChildComponentSystem, ZoneComponentSystem, GSplatComponentSystem, RenderHandler, AnimationHandler, AnimClipHandler, AnimStateGraphHandler, ModelHandler, MaterialHandler, TextureHandler, TextHandler, JsonHandler, AudioHandler, ScriptHandler, SceneHandler, CubemapHandler, HtmlHandler, CssHandler, ShaderHandler, HierarchyHandler, FolderHandler, FontHandler, BinaryHandler, TextureAtlasHandler, SpriteHandler, TemplateHandler, ContainerHandler, GSplatHandler, ElementInput, Keyboard, Mouse, GamePads, platform, TouchDevice, SoundManager, Lightmapper, BatchManager, XrManager } from 'playcanvas';
import { loadModules } from './__modules__.mjs';
import { PRELOAD_MODULES, ASSET_PREFIX, INPUT_SETTINGS, SCRIPT_PREFIX, SCRIPTS, CONFIG_FILENAME, SCENE_PATH, CONTEXT_OPTIONS } from './__settings__.mjs';

// Set global pc for legacy scripts
window.pc = playcanvasCustom;

// Debug: Capture all console output for mobile debugging
window.debugLogs = [];
const origLog = console.log;
const origWarn = console.warn;
const origError = console.error;

console.log = (...args) => {
    window.debugLogs.push({t: 'log', m: args.map(a => String(a)).join(' ')});
    origLog(...args);
};
console.warn = (...args) => {
    window.debugLogs.push({t: 'warn', m: args.map(a => String(a)).join(' ')});
    origWarn(...args);
};
console.error = (...args) => {
    window.debugLogs.push({t: 'error', m: args.map(a => a?.stack || String(a)).join(' ')});
    origError(...args);
};

// Export function - call from console: exportDebugLogs()
window.exportDebugLogs = () => {
    const text = window.debugLogs.map(l => `[${l.t}] ${l.m}`).join('\n');
    const blob = new Blob([text], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    return 'Check downloads folder';
};

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
        
        // ---- ASTC / KTX2 initialization with load interceptor ----
        (function () {
            window.app = app; // for debugging

            // Device capability (ASTC) - required for KTX2 hardware acceleration
            const gl = app.graphicsDevice.gl;
            const astcOK = !!(gl.getExtension('WEBGL_compressed_texture_astc') ||
                            gl.getExtension('WEBKIT_WEBGL_compressed_texture_astc'));
            if (!astcOK) { 
                console.warn('[ASTC] Extension missing - KTX2 will use software decompression (slower)'); 
            }

            // Parser exists in this engine; required for KTX2
            const pc = playcanvasCustom;
            if (!pc.Ktx2Parser) { 
                console.error('[KTX2] Ktx2Parser missing in this build - cannot load KTX2 textures'); 
                return; 
            }

            const KTX2_BASE = 'files/assets/astc6x6';
            const SOG_TEXTURES = ['means_l', 'means_u', 'quats', 'scales', 'sh0', 'shN_centroids', 'shN_labels'];
            
            // Install texture load interceptor BEFORE asset configuration
            // This catches ALL texture load requests and redirects .webp to .ktx2
            const texHandler = app.loader.getHandler('texture');
            const origLoad = texHandler.load.bind(texHandler);
            
            texHandler.load = function(url, callback, asset) {
                const urlStr = (typeof url === 'string') ? url : (url?.url || '');
                
                // Check if this is a SOG texture that needs redirection
                for (const textureName of SOG_TEXTURES) {
                    if (urlStr.includes(`${textureName}.webp`)) {
                        const ktx2Url = `${KTX2_BASE}/${textureName}.ktx2`;
                        
                        // Update asset metadata if present
                        if (asset?.file) {
                            asset.file.url = ktx2Url;
                            asset.file.filename = `${textureName}.ktx2`;
                            if (asset.file.hash) asset.file.hash = '';
                        }
                        
                        console.log(`[KTX2] Intercepted load: ${textureName}.webp -> ${textureName}.ktx2`);
                        return origLoad(ktx2Url, callback, asset);
                    }
                }
                
                // Not a SOG texture, load normally
                return origLoad(url, callback, asset);
            };
            
            // Update all texture assets to use KTX2 files
            let configured = 0;
            for (const a of app.assets.list()) {
                if (a.type !== 'texture' || !a.file) continue;
                
                // Check if this is one of our SOG textures
                const textureName = SOG_TEXTURES.find(name => 
                    a.file.filename?.includes(name) || a.name?.includes(name)
                );
                
                if (textureName) {
                    const ktx2Url = `${KTX2_BASE}/${textureName}.ktx2`;
                    
                    a.file.url = ktx2Url;
                    a.file.filename = `${textureName}.ktx2`;
                    a.loaded = false;
                    a.resource = null;
                    a.preload = true;
                    if (a.file.hash) a.file.hash = '';
                    
                    configured++;
                    console.log(`[KTX2] Configured ${textureName} -> ${ktx2Url}`);
                }
            }

            console.log(`[KTX2] Configured ${configured} textures for KTX2 loading with load interceptor`);
            
            if (astcOK) {
                console.log('[KTX2] ✓ ASTC hardware acceleration available');
            } else {
                console.log('[KTX2] ⚠ Using software decompression (no ASTC support)');
            }
        })();
        // ---- end KTX2 initialization ----
        
        // do the first reflow after a timeout because of
        // iOS showing a squished iframe sometimes
        setTimeout(()=>{
            pcBootstrap.reflow(app, canvas);
            pcBootstrap.reflowHandler = function() {
                pcBootstrap.reflow(app, canvas);
            };
            window.addEventListener('resize', pcBootstrap.reflowHandler, false);
            window.addEventListener('orientationchange', pcBootstrap.reflowHandler, false);
            
            app.preload(()=>{
                // --- Fix KTX2 texture filters for iOS/Android compatibility ---
                // KTX2 textures without mipmaps need non-mipmap filters to be "complete"
                (function fixKtx2TextureFilters() {
                    const SOG_TEXTURES = ['means_l','means_u','quats','scales','sh0','shN_centroids','shN_labels'];
                    let fixed = 0;

                    app.assets.list().forEach(a => {
                        if (a.type !== 'texture' || !a.resource || !a.file?.url) return;
                        
                        // Check if this is a KTX2 SOG texture
                        const isKtx2Sog = a.file.url.endsWith('.ktx2') && 
                                          SOG_TEXTURES.some(name => a.file.url.includes(`/${name}.ktx2`));
                        if (!isKtx2Sog) return;

                        const texture = a.resource;
                        // Use non-mipmap filters for textures without mipmaps
                        texture.minFilter = playcanvasCustom.FILTER_NEAREST;
                        texture.magFilter = playcanvasCustom.FILTER_NEAREST;
                        texture.addressU  = playcanvasCustom.ADDRESS_CLAMP_TO_EDGE;
                        texture.addressV  = playcanvasCustom.ADDRESS_CLAMP_TO_EDGE;
                        texture.anisotropy = 1;
                        texture.upload();
                        fixed++;
                    });

                    console.log(`[KTX2] Fixed texture filters on ${fixed} KTX2 textures`);
                })();
                
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
            
            configure();
        }
    } catch (e) {
        console.error('Device creation error:', e);
    }
}
main();
// The `pc.script.createLoadingScreen()` in `__loading__.js` is invoked immediately 
// when the module is imported. This depends upon the `app` object being defined.
// Therefore we must import the loading screen module after the `app` object is defined.
import('./__loading__.mjs');
