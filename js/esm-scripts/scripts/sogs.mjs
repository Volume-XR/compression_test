import { Script, Asset, GSplatSogsResource, Entity, GSplatSogsData } from '../../playcanvas-stable.min.mjs';

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
class Sogs extends Script {
    initialize() {
        console.log('initialize');
        const data = new GSplatSogsData();
        data.meta = this.meta.resource;
        data.numSplats = this.meta.resource.means.shape[0];
        data.means_l = this.means_l.resource;
        data.means_u = this.means_u.resource;
        data.quats = this.quats.resource;
        data.scales = this.scales.resource;
        data.sh0 = this.sh0.resource;
        data.sh_centroids = this.sh_centroids?.resource;
        data.sh_labels = this.sh_labels?.resource;
        data.reorderData().then(()=>{
            const asset = new Asset('sogsGsplat', 'gsplat', {});
            asset.resource = new GSplatSogsResource(this.app.graphicsDevice, data);
            asset.loaded = true;
            this.app.assets.add(asset);
            const entity = new Entity('sogsGsplat');
            entity.setEulerAngles(0, 0, 0);
            entity.addComponent('gsplat', {
                asset
            });
            this.entity.addChild(entity);
        });
    }
    constructor(...args){
        super(...args);
        /**
     * @attribute
     * @type {Asset}
     * @resource json
     */ _define_property(this, "meta", void 0);
        /**
     * @attribute
     * @type {Asset}
     * @resource texture
     */ _define_property(this, "means_l", void 0);
        /**
     * @attribute
     * @type {Asset}
     * @resource texture
     */ _define_property(this, "means_u", void 0);
        /**
     * @attribute
     * @type {Asset}
     * @resource texture
     */ _define_property(this, "quats", void 0);
        /**
     * @attribute
     * @type {Asset}
     * @resource texture
     */ _define_property(this, "scales", void 0);
        /**
     * @attribute
     * @type {Asset}
     * @resource texture
     */ _define_property(this, "sh0", void 0);
        /**
     * @attribute
     * @type {Asset}
     * @resource texture
     */ _define_property(this, "sh_centroids", void 0);
        /**
     * @attribute
     * @type {Asset}
     * @resource texture
     */ _define_property(this, "sh_labels", void 0);
    }
}
_define_property(Sogs, "scriptName", "sogs");

export { Sogs };
