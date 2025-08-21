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
            (function installKtx2Remap(app) {
                const pc = playcanvasStable_min; // Use imported module
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
                if (texHandler.addParser) {
                    texHandler.addParser(parser);
                    console.log('[KTX2] Parser added via addParser');
                } else if (texHandler.parsers) {
                    texHandler.parsers.unshift(parser);
                    console.log('[KTX2] Parser added via parsers.unshift');
                } else {
                    console.error('[KTX2] Could not add parser - no addParser method or parsers array!');
                    return;
                }

                // DISABLED: Force KTX2 usage even without ASTC support for testing
                // if (!astcOK) {
                //     console.warn('[KTX2] No ASTC support on this device. Staying on WebP.');
                //     return;
                // }
                console.warn('[KTX2] ASTC check disabled - forcing KTX2 usage. ASTC support:', astcOK);

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
window.pc = playcanvasStable_min;
