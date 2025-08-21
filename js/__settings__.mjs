import { script } from './playcanvas-stable.min.mjs';

const ASSET_PREFIX = "";
const SCRIPT_PREFIX = "";
const SCENE_PATH = "2289656.json";
const CONTEXT_OPTIONS = {
    'antialias': true,
    'alpha': false,
    'preserveDrawingBuffer': false,
    'deviceTypes': [
        `webgl2`,
        `webgl1`
    ],
    'powerPreference': "default"
};
const SCRIPTS = [
    243269524,
    243269528,
    243269521,
    243269531
];
const CONFIG_FILENAME = "config.json";
const INPUT_SETTINGS = {
    useKeyboard: true,
    useMouse: true,
    useGamepads: false,
    useTouch: true
};
const PRELOAD_MODULES = [];
script.legacy = false;

export { ASSET_PREFIX, CONFIG_FILENAME, CONTEXT_OPTIONS, INPUT_SETTINGS, PRELOAD_MODULES, SCENE_PATH, SCRIPTS, SCRIPT_PREFIX };
