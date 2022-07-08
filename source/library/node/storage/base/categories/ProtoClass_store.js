"use strict";


(class ProtoClass_store extends ProtoClass {

    recordForStore (aStore) { // should only be called by Store
        const aRecord = {
            type: this.type(), 
            entries: [], 
        }

        this.allSlots().ownForEachKV((slotName, slot) => {
            //if (slot.shouldStoreSlot()) {
            if (slot.shouldStoreSlotOnInstance(this)) {
                const v = slot.onInstanceGetValue(this)
                //assert(!Type.isUndefined(v))
                aRecord.entries.push([slotName, aStore.refValue(v)])
            }
        })

        return aRecord
    }

    lazyPids (puuids = new Set()) {
        // when doing Store.collect() will need to check for lazy slot pids on active objects
        this.allSlots().ownForEachKV((slotName, slot) => {
            // only need to do this on unloaded store refs in instances
            const storeRef = slot.onInstanceGetValueRef(this)
            if (storeRef) {
                puuids.add(storeRef.pid())
            }
        })
        return puuids
    }

    loadFromRecord (aRecord, aStore) {
        aRecord.entries.forEach((entry) => {
            const k = entry[0]
            const v = entry[1]

            const slot = this.thisPrototype().ownSlotNamed(k)

            if (slot) {
                if (!slot.hasSetterOnInstance(this)) {
                    // looks like the schema has changed 
                    // so schedule to store again, which will remove missing slot in the record
                    this.scheduleSyncToStore()
                } else {
                    if (slot.isLazy()) {
                        const pid = v["*"]
                        assert(pid)
                        const storeRef = StoreRef.clone().setPid(pid).setStore(aStore)
                        //console.log(this.typeId() + "." + slot.name() + " [" + this.title() + "] - setting up storeRef ")
                        slot.onInstanceSetValueRef(this, storeRef)
                    } else {
                        const unrefValue = aStore.unrefValue(v)
                        slot.onInstanceSetValue(this, unrefValue)
                    }
                }
            }
        })

        //this.didLoadFromStore() // done in ObjectPool.didInitLoadingPids() instead
        return this
    }

    scheduleDidInit () {
        //console.log(this.typeId() + ".scheduleDidInit()")
        // Object scheduleDidInit just calls this.didInit()
        assert(!this.hasDoneInit())
        //debugger;
        SyncScheduler.shared().scheduleTargetAndMethod(this, "didInit")
    }

    scheduleDidLoadFromStore () {
        SyncScheduler.shared().scheduleTargetAndMethod(this, "didLoadFromStore")
    }

    /*
    didLoadFromStore () {
        // Object.didLoadFromStore handles this
    }
    */

}).initThisCategory();
