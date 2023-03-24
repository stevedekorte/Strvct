"use strict";

/*

    ObjectPool

        For persisting a object tree to a JSON formatted representation and back.
        Usefull for both persistence and exporting object out the the app/browser and onto desktop or other browsers.

        This is a parent class for PersistentObjectPool, which just swaps out the recordDict AtomicMap, 
        with a PersistentAtomicMap.

        An object pool can also be created by pointing at an object within another pool.

        JSON format of pool:

            {
                rootPid: "rootPid",
                puuidToDict: {
                    "<objPid>" : <Record>
                }
            }

        Example use:
    
            // converting a node to json
            const poolJson = ObjectPool.clone().setRoot(rootNode).asJson()
            
            // converting json to a node
            const rootObject = ObjectPool.clone().fromJson(poolJson).root()

        Notes:

        Objects to be stored must implement:

            // writing methods
            puuid
            recordForStore (aStore)

            // reading methods
            static instanceFromRecordInStore (aRecord, aStore)
            loadFromRecord (aRecord, aStore)

        These are implemented on Object, and other primitives such as Array, Set, etc.

*/

(class ObjectPool extends ProtoClass {
    
    initPrototypeSlots () {
        this.newSlot("name", "defaultDataStore")
        this.newSlot("rootObject", null)

        // AtomicMap
        this.newSlot("recordsMap", null) 

        // Map - objects known to the pool (previously loaded or referenced)
        this.newSlot("activeObjects", null) 

        // Map - subset of activeObjects containing objects with mutations that need to be stored
        this.newSlot("dirtyObjects", null)

        // Set - pids of objects that we're loading in this event loop
        this.newSlot("loadingPids", null)

        // Set - pids of objects that we're storing in this event loop
        this.newSlot("storingPids", null)

        // Date - WARNING: vulnerable to system time changes/differences
        this.newSlot("lastSyncTime", null)

        //this.newSlot("isReadOnly", false)

        // Set of puuids
        this.newSlot("markedSet", null) 

        // Notification - sent after pool opens - TODO: change name to objectPoolDidOpen?
        this.newSlot("nodeStoreDidOpenNote", null)

        // Bool - set to true during method didInitLoadingPids() - used to ignore mutations during this period
        this.newSlot("isFinalizing", false)

        // String or Error
        this.newSlot("error", null) // most recent error, if any

        this.newSlot("collectablePidSet", null) // used during collection to store keys before tx begins
    }

    init () {
        super.init()
        this.setRecordsMap(ideal.AtomicMap.clone())
        this.setActiveObjects(new Map())
        this.setDirtyObjects(new Map())
        this.setLoadingPids(new Set())
        this.setLastSyncTime(null)
        this.setMarkedSet(null)
        this.setNodeStoreDidOpenNote(this.newNoteNamed("nodeStoreDidOpen"))
        this.setIsDebugging(true)
        return this
    }

    setIsDebugging (b) {
        if (b === false && this.isDebugging() === true) {
            debugger;
        }
        super.setIsDebugging(b)
        return this
    }

    clearCache () {
        this.setActiveObjects(new Map())
        this.setDirtyObjects(new Map())
        this.readRoot()
        //this.setRootObject(this.objectForPid(this.rootObject().puuid()))
        return this
    }

    // --- open ---

    open () { // this class can also be used with synchronous AtomicMap
        this.recordsMap().setName(this.name())
        this.recordsMap().open()
        this.onPoolOpenSuccess()
        return this
    }

    promiseOpen () { 
        const map = this.recordsMap()
        map.setName(this.name())
        return map.promiseOpen().then(() => {
            this.onPoolOpenSuccess()
        }).catch((error) => {
            this.onPoolOpenFailure(error)
        })
    }

    onPoolOpenSuccess () {
        //debugger
        // here so subclasses can easily hook
        this.onRecordsDictOpen()
    }

    onPoolOpenFailure (error) {
        debugger
        // here so subclasses can easily hook
        throw error
    }

    /*
    postOpenNote () {
        this.postNoteNamed("objectPoolDidOpen")
    }
    */

    show (s) {
        const comment = s ? " " + s + " " : ""
        console.log("---" + comment + "---")
        const max = 40
        console.log(this.recordsMap().count() + " records: ")
        this.recordsMap().forEachKV((k, v) => {
            if (v.length > max) {
                v = v.slice(0, max) + "..."
            }
            console.log("   '" + k + "': '" + v + "'")
        })

        console.log("------")
    }

    onRecordsDictOpen () {
        //debugger
        //this.show("ON OPEN")
        this.promiseCollect()
        //this.show("AFTER COLLECT")
        this.nodeStoreDidOpenNote().post()
        return this
    }

    isOpen () {
        return this.recordsMap().isOpen()
    }

    // --- root ---

    rootKey () {
        return "root"
    }

    setRootPid (pid) { 
        // private - it's assumed we aren't already in storing-dirty-objects tx
        const map = this.recordsMap()
        if (map.at(this.rootKey()) !== pid) {
            map.atPut(this.rootKey(), pid)
            console.log("---- SET ROOT PID " + pid + " ----")
            //debugger;
        }
        assert(this.hasStoredRoot())
        return this
    }

    rootPid () {
        return this.recordsMap().at(this.rootKey())
    }

    hasStoredRoot () {
        return this.recordsMap().hasKey(this.rootKey())
    }

    rootOrIfAbsentFromClosure (aClosure) {
        //debugger;
        if (this.hasStoredRoot()) {
            this.readRoot()
        } else {
         //   debugger
            const newRoot = aClosure()
            assert(newRoot)
            this.setRootObject(newRoot)
        }
        return this.rootObject()
    }

    readRoot () {
        //console.log(" this.hasStoredRoot() = " + this.hasStoredRoot())
        if (this.hasStoredRoot()) {
            const root = this.objectForPid(this.rootPid()) // this call will actually internally set this._rootObject as we may need it while loading the root's refs
            assert(!Type.isNullOrUndefined(root))
            //this._rootObject = root
            //this.setRootObject(root) // this is for setting up new root
            return this.rootObject()
        }
        throw new Error("missing root object")
    }

    knowsObject (obj) { // private
        const puuid = obj.puuid()
        const foundIt = this.recordsMap().hasKey(puuid) ||
            this.activeObjects().has(puuid) ||
            this.dirtyObjects().has(puuid) // dirty objects check redundant with activeObjects?
        return foundIt
    }

    assertOpen () {
        assert(this.isOpen())
    }

    /*
    changeOldPidToNewPid (oldPid, newPid) {
        // flush and change pids on all activeObjects 
        // and pids and pidRefs in recordsMap 
        throw new Error("unimplemented")
        return this
    }
    */
    
    setRootObject (obj) { // only used for setting up a new root object
        this.assertOpen()
        if (this._rootObject) {
            // can support this if we change all stored and
            //this.changeOldPidToNewPid("root", Object.newUuid())
            throw new Error("can't change root object yet, unimplemented")
        }

        assert(!this.knowsObject(obj))

        //debugger;
        //this.setRootPid(obj.puuid()) // this is set when the dirty root object is stored
        this._rootObject = obj
        this.debugLog(" adding rootObject " + obj.debugTypeId())
        this.addActiveObject(obj)
        this.addDirtyObject(obj)
        return this
    }

    // ---  ---

    asJson () {
        return this.recordsMap().asJson()
    }

    updateLastSyncTime () {
        this.setLastSyncTime(Date.now())
        return this
    }

    // --- active and dirty objects ---

    hasActiveObject (anObject) {
        const puuid = anObject.puuid()
        return this.activeObjects().has(puuid)
    }
    
    addActiveObject (anObject) {
        assert(!anObject.isClass())

        if (!anObject.shouldStore()) {
            const msg = "attempt to addActiveObject '" + anObject.type() + "' but shouldStore is false"
            console.warn(msg)
            anObject.shouldStore()
            //throw new Error(msg)
            return false
        }

        if (!anObject.isInstance()) {
            const msg = "can't store non instance of type '" + anObject.type() + "'"
            console.log(msg)
            anObject.isKindOf(ProtoClass) 
            throw new Error(msg)
        }

        //debugger;

        if (!this.hasActiveObject(anObject)) {
            const title = anObject.title ? anObject.title() : "-";
            //this.debugLog(() => anObject.debugTypeId() + ".addMutationObserver(" + this.debugTypeId() + " '" + title + "')")
            anObject.addMutationObserver(this)
            this.activeObjects().set(anObject.puuid(), anObject)
            //this.addDirtyObject(anObject)
        }

        return true
    }

    close () {
        this.removeMutationObservations()
        this.setActiveObjects(new Map())
        this.setDirtyObjects(new Map())
        return this
    }

    removeMutationObservations () {
        this.activeObjects().forEachKV((puuid, obj) => obj.removeMutationObserver(this)) // activeObjects is super set of dirtyObjects
        return this
    }

    hasDirtyObjects () {
        return !this.dirtyObjects().isEmpty()
    }

    /*
    hasDirtyObject (anObject) {
        const puuid = anObject.puuid()
        return this.dirtyObjects().has(puuid)
    }
    */

    onObjectUpdatePid (anObject, oldPid, newPid) {
        // sanity check for debugging - could remove later
        if (this.hasActiveObject(anObject)) {
            const msg = "onObjectUpdatePid " + anObject.typeId() + " " + oldPid + " -> " + newPid
            console.log(msg)
            throw new Error(msg)
        }
    }

    onDidMutateObject (anObject) {
        //if (anObject.hasDoneInit() && ) {
        if (this.hasActiveObject(anObject) && !this.isLoadingObject(anObject)) {
            this.addDirtyObject(anObject)
        }
    }

    isStoringObject (anObject) {
        const puuid = anObject.puuid()
        if (this.storingPids()) {
            if (this.storingPids().has(puuid)) {
                return true
            }
        }
        return false
    }

    isLoadingObject (anObject) { // private
        if (this.loadingPids()) {
            if (this.loadingPids().has(anObject.puuid())) {
                return true
            }
        }
        return false
    }

    addDirtyObject (anObject) { // private
        if (!this.hasActiveObject(anObject)) {
            console.log("looks like it hasn't been referenced yet")
            throw new Error("not referenced yet")
        }

        const puuid = anObject.puuid()

        if (this.isStoringObject(anObject)) {
            return this
        }

        if (this.isLoadingObject(anObject)) {
            return this
        }

        if (!this.dirtyObjects().has(puuid)) {
            this.debugLog(() => "addDirtyObject(" + anObject.typeId() + ")" )
            debugger
            if (this.storingPids() && this.storingPids().has(puuid)) {
                throw new Error("attempt to double store? did object change after store? is there a loop?")
            }
            this.dirtyObjects().set(puuid, anObject)
            this.scheduleStore()
        }

        return this
    }

    scheduleStore () {
        if (!this.isOpen()) {
            console.log(this.typeId() + " can't schedule store yet, not open")
            return this
        }
        assert(this.isOpen())
        const scheduler = SyncScheduler.shared()
        const methodName = "commitStoreDirtyObjects"
        console.log("--- scheduleStore ---")
        if (!scheduler.isSyncingTargetAndMethod(this, methodName)) {
            if (!scheduler.hasScheduledTargetAndMethod(this, methodName)) {
                //console.warn("scheduleStore currentAction = ", SyncScheduler.currentAction() ? SyncScheduler.currentAction().description() : null)
                scheduler.scheduleTargetAndMethod(this, methodName, 1000)
            }
        }
        return this
    }

    // --- storing ---

    commitStoreDirtyObjects () {
        if (this.hasDirtyObjects()) {
            console.log("--- commitStoreDirtyObjects ---")

            //this.debugLog("--- commitStoreDirtyObjects begin ---")
            //debugger;
            this.recordsMap().begin()
            const storeCount = this.storeDirtyObjects()
            this.recordsMap().promiseCommit()
            this.debugLog("--- commitStoreDirtyObjects end --- stored " + storeCount + " objects")
            this.debugLog("--- commitStoreDirtyObjects total objects: " + this.recordsMap().count())


            //this.show("AFTER commitStoreDirtyObjects")
        }
    }

    storeDirtyObjects () { // PRIVATE
        // store the dirty objects, if they contain references objects unknown to pool,
        // they'll be added as active + dirty objects which will be stored on next loop. 
        // We continue until there are no dirty objects left.

        let totalStoreCount = 0
        this.setStoringPids(new Set())

        while (true) { // easier to express clearly than do/while in this case
            let thisLoopStoreCount = 0
            const dirtyBucket = this.dirtyObjects()
            this.setDirtyObjects(new Map())

            dirtyBucket.forEachKV((puuid, obj) => {
                //console.log("  storing pid " + puuid)

                if (this.storingPids().has(puuid)) {
                    const msg = "ERROR: attempt to double store " + obj.typeId()
                    console.log(msg)
                    throw new Error(msg)
                }

                this.storingPids().add(puuid)
                //debugger;
                this.storeObject(obj)

                thisLoopStoreCount ++
            })

            if (thisLoopStoreCount === 0) {
                break
            }

            totalStoreCount += thisLoopStoreCount
            //this.debugLog(() => "totalStoreCount: " + totalStoreCount)
        }

        this.setStoringPids(null)
        return totalStoreCount
    }

    // --- reading ---

    classNameConversionMap () {
        const m = new Map()
        /*
        m.set("BMMenuNode", "BMFolderNode")
        */
       return m;
    }

    classForName (className) { 
        const m = this.classNameConversionMap()
        if (m.has(className)) {
            return Object.getClassNamed(m.get(className))
        } 

        return Object.getClassNamed(className)
    }

    objectForRecord (aRecord) { // private
        const className = aRecord.type
        //console.log("loading " + className + " " + aRecord.id)
        const aClass = this.classForName(className)

        if (!aClass) {
            const error = "missing class '" + className + "'"
            console.warn(error)
            //throw new Error(error)
            debugger
            return null
        }
        
        assert(!Type.isNullOrUndefined(aRecord.id))
        const obj = aClass.instanceFromRecordInStore(aRecord, this)
        assert(!this.hasActiveObject(obj))
        obj.setPuuid(aRecord.id)
        this.addActiveObject(obj)
        if (obj.puuid() === this.rootPid()) {
            this._rootObject = obj; // bit of a hack to make sure root ref is set before we load root contents
            // might want to split this method into one to get ref and another to load contents instead
        }
        obj.loadFromRecord(aRecord, this)
        return obj
    }

    activeObjectForPid (puuid) {
        return this.activeObjects().get(puuid)
    }

    objectForPid (puuid) { // PRIVATE (except also used by StoreRef)
        //console.log("objectForPid " + puuid)

        // return active object for pid, if there is one
        const activeObj = this.activeObjectForPid(puuid)
        if (activeObj) {
            return activeObj
        }

        // schedule didInitLoadingPids to occur at end of event loop 

        if (!this.isFinalizing() && this.loadingPids().count() === 0) {
            SyncScheduler.shared().scheduleTargetAndMethod(this, "didInitLoadingPids")
        }

        this.loadingPids().add(puuid)
        
        const aRecord = this.recordForPid(puuid)
        if (Type.isUndefined(aRecord)) {
            return undefined
        }
        const loadedObj = this.objectForRecord(aRecord)
        return loadedObj
    }

    didInitLoadingPids () {
        assert(!this.isFinalizing()) // sanity check
        this.setIsFinalizing(true)
        while (!this.loadingPids().isEmpty()) { // while there are still loading pids
            const lastSet = this.loadingPids()
            this.setLoadingPids(new Set())

            lastSet.forEach(loadedPid => { // sends didLoadFromStore to each matching object
                const obj = this.activeObjectForPid(loadedPid)
                if (Type.isUndefined(obj)) {
                    const errorMsg = "missing activeObjectForPid " + loadedPid
                    console.warn(errorMsg)
                    //throw new Error(errorMsg)
                } else if (obj.didLoadFromStore) {
                    obj.didLoadFromStore() // should this be able to trigger an objectForPid() that would add to loadingPids?
                }
            })
        }
        this.setIsFinalizing(false)
    }

    //

    headerKey () {
        return "header" // no other key looks like this as they all use PUUID format
    }

    allPidsSet () {
        const keySet = this.recordsMap().keysSet()
        keySet.delete(this.headerKey())
        return keySet
    }

    allPids () {
        const keys = this.recordsMap().keysArray()
        keys.remove(this.rootKey())
        return keys
    }

    activeLazyPids () { // returns a set of pids
        const pids = new Set()
        this.activeObjects().forEachKV((pid, obj) => {
            if (obj.lazyPids) {
                obj.lazyPids(pids)
            }
        })
        return pids
    }

    // --- references ---

    refForPid (aPid) {
        return { "*": this.pid() }
    }

    pidForRef (aRef) {
        return aRef.getOwnProperty("*")
    }

    unrefValueIfNeeded (v) {
        return this.unrefValue(v)
    }

    unrefValue (v) {
        if (Type.isLiteral(v)) {
            return v
        }
        const puuid = v.getOwnProperty("*")
        assert(puuid)
        const obj = this.objectForPid(puuid)
        return obj
    }

    refValue (v) {
        if (Type.isLiteral(v)) {
            return v
        }

        assert(!v.isClass())

        if (!v.shouldStore()) {
            console.log("WARNING: called refValue on " + v.type() + " which has shouldStore=false")
            return null
        }

        if (!this.hasActiveObject(v)) {
            this.addActiveObject(v)
            this.addDirtyObject(v)
        }
        const ref = { "*": v.puuid() }
        return ref
    }

    // read a record

    recordForPid (puuid) { // private
        if (!this.recordsMap().hasKey(puuid)) {
            return undefined
        }
        const jsonString = this.recordsMap().at(puuid)
        assert(Type.isString(jsonString))
        const aRecord = JSON.parse(jsonString)
        aRecord.id = puuid
        return aRecord
    }

    // write an object

    storeObject (obj) {
        assert(obj.shouldStore())
        const puuid = obj.puuid()
        assert(!Type.isNullOrUndefined(puuid))

        if (obj === this.rootObject()) {
            this.setRootPid(puuid)
        }

        const record = obj.recordForStore(this)
        const jsonString = JSON.stringify(record)
        this.debugLog(() => "store " + puuid + " <- " + record.type )
        this.recordsMap().set(puuid, jsonString)
        return this
    }

    // -------------------------------------

    flushIfNeeded () {
        if (this.hasDirtyObjects()) {
            this.storeDirtyObjects()
            assert(!this.hasDirtyObjects())
        }
        return this
    }

    promiseCollect () {
        if (Type.isUndefined(this.rootPid())) {
            console.log("---- NO ROOT PID FOR COLLECT - clearing! ----")
            //debugger
            this.recordsMap().begin()
            this.recordsMap().clear()
            this.recordsMap().promiseCommit()
            //debugger;
            return 0;
        }
        //debugger;
        // this is an on-disk collection
        // in-memory objects aren't considered
        // so we make sure they're flushed to the db first 
        //debugger
        this.recordsMap().begin()
        this.flushIfNeeded() // store any dirty objects

        this.debugLog(() => "--- begin collect --- with " + this.recordsMap().count() + " pids")
        this.setMarkedSet(new Set())
        this.markedSet().add(this.rootKey()) // so rootKey->rootPid entry isn't swept
        this.markPid(this.rootPid())
        this.activeObjects().forEachK(pid => this.markPid(pid))
        this.activeLazyPids().forEachK(pid => this.markPid(pid))
        const deleteCount = this.sweep()
        this.setMarkedSet(null)

        this.debugLog(() => "--- end collect --- collecting " + deleteCount + " pids ---")
       // debugger
        const promise = this.recordsMap().promiseCommit()

        const remainingCount = this.recordsMap().count()
        this.debugLog(() => " ---- keys count after commit: " + remainingCount + " ---")
        return promise
    }

    markPid (pid) { // private
        //this.debugLog(() => "markPid(" + pid + ")")
        if (!this.markedSet().has(pid)) {
            this.markedSet().add(pid)
            const refPids = this.refSetForPuuid(pid)
        //    debugger
            //this.debugLog(() => "markPid " + pid + " w refs " + JSON.stringify(refPids.asArray()))
            refPids.forEach(refPid => this.markPid(refPid))
            return true
        }
        return false
    }

    refSetForPuuid (puuid) {
        const record = this.recordForPid(puuid)
        const puuids = new Set()

        if (record) {
            Object.keys(record).forEach(k => this.puuidsSetFromJson(record[k], puuids))
        }

        return puuids
    }

    puuidsSetFromJson (json, puuids = new Set()) {
        // json can only contain array's, dictionaries, and literals.
        // We store dictionaries as an array of entries, 
        // and reserve dicts in the json for pointers with the format { "*": "<puuid>" }

        //console.log(" json: ", JSON.stringify(json, null, 2))

        if (Type.isLiteral(json)) {
            // we could call refsPidsForJsonStore but none will add any pids,
            // and null raises exception, so we can just skip it for now
        } else if (Type.isObject(json) && json.refsPidsForJsonStore) {
            json.refsPidsForJsonStore(puuids)
        } else {
            throw new Error("unable to handle json type: " + typeof(json) + " missing refsPidsForJsonStore() method?")
        }
        
        return puuids
    }

    // ------------------------

    sweep () {
        const unmarkedPidSet = this.allPidsSet().difference(this.markedSet()) // allPids doesn't contain rootKey

        // delete all unmarked records
        let deleteCount = 0
        const recordsMap = this.recordsMap()
        recordsMap.keysArray().forEach(pid => {
            if (!this.markedSet().has(pid)) {
                this.debugLog("--- sweeping --- deletePid(" + pid + ") " + JSON.stringify(recordsMap.at(pid)))
                const count = recordsMap.count()
                recordsMap.removeKey(pid)
                assert(recordsMap.count() === count - 1)
                deleteCount ++
            }
        })
        return deleteCount
    }

    promiseDeleteAll () {
        assert(this.isOpen())
        // assert not loading or storing?
        const map = this.recordsMap()
        map.begin()
        map.forEachK(pid => {
            map.removeKey(pid)
        }) // the remove applies to the changeSet
        debugger
        return map.promiseCommit()
    }

    promiseClear () {
        return this.recordsMap().promiseClear(resolve, reject)
    }

    // ---------------------------

    rootSubnodeWithTitleForProto (aTitle, aProto) {
        return this.rootObject().subnodeWithTitleIfAbsentInsertProto(aTitle, aProto)
    }

    totalBytes () {
        return this.recordsMap().totalBytes()
    }

    // ---------------------------

    /*
    activeObjectsReferencingObject (anObject) {
        // useful for seeing if we can unload an object
        // BUT, to do full collect, do a mark/sweep on active objects
        // where sweep only removes unmarked from activeObjects and records cache?

        assert(this.hasActiveObject(anObject)) 

        const referencers = new Set()
        const pid = anObject.puuid()

        this.activeObjects().forEachKV((pid, obj) => {
            const refPids = this.refSetForPuuid(obj.puuid())
            if (refPids.has(pid)) {
                referencers.add(obj)
            }
        })

        return referencers
    }
    */

    /*
    static selfTestRoot () {
        const aTypedArray = Float64Array.from([1.2, 3.4, 4.5])
        const aSet = new Set("sv1", "sv2")
        const aMap = new Map([ ["mk1", "mv1"], ["mk2", "mv2"] ])
        const aNode = BMStorableNode.clone()
        const a = [1, 2, [3, null], { foo: "bar", b: true }, aSet, aMap, new Date(), aTypedArray, aNode]
        return a
    }

    static selfTest () {
        console.log(this.type() + " --- self test start --- ")
        const store = ObjectPool.clone()
        store.open()

        store.rootOrIfAbsentFromClosure(() => BMStorableNode.clone())
        store.flushIfNeeded()
        console.log("store:", store.asJson())
        console.log(" --- ")
        store.promiseCollect()
        store.clearCache()
        const loadedNode = store.rootObject()
        console.log("loadedNode = ", loadedNode)
        console.log(this.type() + " --- self test end --- ")
    }
    */

}.initThisClass());



