/**
 * @module boot
 */

"use strict";

/**
 * @class IndexedDBTx
 * @extends Base
 * @classdesc Abstraction of a single IndexedDB transaction.
 */
(class IndexedDBTx extends Base {

    /** 
     * Initialize prototype slots
     */
    initPrototypeSlots () {
        /**
         * @property {object} dbFolder - Database folder object
         */
        this.newSlot("dbFolder", null)

        /**
         * @property {object} objectStore - IndexedDB object store
         */
        this.newSlot("objectStore", null)

        /**
         * @property {object} tx - IndexedDB transaction object
         */
        this.newSlot("tx", null)

        /**
         * @property {Array} requests - Array of transaction requests
         */
        this.newSlot("requests", [])

        /**
         * @property {boolean} isCommitted - Flag indicating if transaction is committed
         */
        this.newSlot("isCommitted", false) // set to true when tx.commit() is called

        /**
         * @property {boolean} isAborted - Flag indicating if transaction is aborted
         */
        this.newSlot("isAborted", false)

        /**
         * @property {boolean} isCompleted - Flag indicating if transaction is completed
         */
        this.newSlot("isCompleted", false) // set to true after tx commit onsuccess callback received 

        /**
         * @property {Error} txRequestStack - Stack trace of transaction request
         */
        this.newSlot("txRequestStack", null)

        /**
         * @property {object} options - Transaction options
         */
        this.newSlot("options", { "durability": "strict" })

        /**
         * @property {string} txId - Transaction ID
         */
        this.newSlot("txId", null)

        /**
         * @property {Promise} promiseForCommit - Promise for transaction commit
         */
        this.newSlot("promiseForCommit", null)

        /**
         * @property {Promise} promiseForFinished - Promise for transaction finish
         */
        this.newSlot("promiseForFinished", null)

        /**
         * @property {number} timeoutInMs - Transaction timeout in milliseconds
         */
        this.newSlot("timeoutInMs", 1000);
    }
  
    initPrototype () {
    }

    /**
     * Initialize the instance
     */
    init () {
        super.init()
        this.setPromiseForFinished(Promise.clone());
        //this.setIsDebugging(false) // this will be overwritten by db with it's own isDebugging setting
    }

    /**
     * Mark the transaction as completed
     * @returns {IndexedDBTx}
     */
    markCompleted () {
        assert(!this.isCompleted());
        this.setIsCompleted(true);
        this.markResolved();
        return this
    }

    /**
     * Mark the transaction as rejected
     * @param {Error} error - The error that caused the rejection
     * @returns {IndexedDBTx}
     */
    markRejected (error) {
        this.promiseForFinished().callRejectFunc(error);
        return this
    }

    /**
     * Mark the transaction as resolved
     * @returns {IndexedDBTx}
     */
    markResolved () {
        this.promiseForFinished().callResolveFunc();
        return this
    }

    /*
    isDebugging () {
        return true
    }
    */

    /**
     * Get the database object
     * @returns {object}
     */
    db () {
        return this.dbFolder().db()
    }
    
    /**
     * Get the store name
     * @returns {string}
     */
    storeName () {
        return this.dbFolder().storeName()
    }
	
    // --- being and commit ---

    /**
     * Assert that the transaction is not committed
     */
    assertNotCommitted () {
	    assert(this.isCommitted() === false)
    }

    /**
     * Create a new transaction
     * @returns {object}
     */
    newTx () {
        assert(this.tx() === null)
        const tx = this.db().transaction(this.storeName(), "readwrite", this.options())
        tx.onerror    = (error) => { 
            debugger
            throw new Error(error) 
        }
        this.setTx(tx)
        return tx
    }

    /**
     * Begin the transaction
     * @returns {IndexedDBTx}
     */
    begin () {
        this.debugLog(this.dbFolder().path() + " TX BEGIN ")
        this.assertNotCommitted()
        this.setTxRequestStack(new Error().stack)
	    const tx = this.newTx()
        const objectStore = tx.objectStore(this.storeName());
        this.setObjectStore(objectStore)
        return this
    }
	
    /**
     * Abort the transaction
     * @returns {IndexedDBTx}
     */
    abort () {
	    this.assertNotCommitted();
	    this.tx().abort(); // how does this get rejected?
        this.setIsAborted(true);
        this.markResolved();
	    return this
    }

    // --- debugging ---

    /**
     * Show transaction details
     */
    show () {
        console.log(this.description())
        this.showTxRequestStack()
    }

    /**
     * Get transaction description
     * @returns {string}
     */
    description () {
        let s = "db: " + this.dbFolder().path() + " tx:\n"
        this.requests().forEach(rq => {
            s += "    " + JSON.stringify({ action: rq._action, key: rq._key, value: rq._value })
        })
        return s
    }

    /**
     * Show transaction request stack
     */
    showTxRequestStack () {
        const rs = this.txRequestStack()
        if (rs) { 
            console.error("error stack ", rs)
        }
    }

    // ----------------------------------------

    /**
     * Check if the transaction is finished
     * @returns {boolean}
     */
    isFinished () {
        return this.isAborted() || this.isCompleted()
    }

    /**
     * Promise to commit the transaction
     * @returns {Promise}
     */
    promiseCommit () {
        assert(!this.isFinished())

        const tx = this.tx()
        
        tx.oncomplete = (event) => { 
            this.debugLog(" COMMIT COMPLETE")
            this.markCompleted()
        }

        tx.onerror = (error) => { 
            this.markRejected(error)
        }

        this.debugLog(" COMMITTING")
        tx.commit()

        return this.promiseForFinished()
    }

	
    // --- helpers ---

    /**
     * Push a request to the transaction
     * @param {object} aRequest - The request to push
     * @returns {IndexedDBTx}
     */
    pushRequest (aRequest) {
	    this.assertNotCommitted()

        const requestStack = this.isDebugging() ? new Error().stack : null;

        aRequest.onerror = (event) => {
		    const fullDescription = "objectStore:'" + this.dbFolder().path() + "' '" + aRequest._action + "' key:'" + aRequest._key + "' error: '" + event.target.error + "'";
		    this.debugLog(fullDescription)
		    if (requestStack) { 
                console.error("error stack ", requestStack)
            }
		  	throw new Error(fullDescription)
        }

        this.requests().push(aRequest)
	    return this
    }

    /**
     * Assert that the key and value are valid
     * @param {string} key - The key
     * @param {string|ArrayBuffer} value - The value
     */
    assertValidKeyValue (key, value) {
        assert(typeof(key) === "string")
        assert(typeof(value) === "string" || (typeof(value) === "object" && Object.getPrototypeOf(value) === ArrayBuffer.prototype))
    }
	
    /**
     * Create an entry object for key and value
     * @param {string} key - The key
     * @param {string|ArrayBuffer} value - The value
     * @returns {object}
     */
    entryForKeyAndValue (key, value) {
        this.assertValidKeyValue(key, value)
        return { key: key, value: value }
    }
	
    // --- operations ----
	
    /**
     * Add an entry to the object store
     * @param {string} key - The key
     * @param {string|ArrayBuffer} value - The value
     * @returns {IndexedDBTx}
     */
    atAdd (key, value) {
        this.assertValidKeyValue(key, value)
        this.assertNotCommitted()
        
        this.debugLog(() => "ADD " + key + " '...'")

        const entry = this.entryForKeyAndValue(key, value)
        const request = this.objectStore().add(entry);
        request._action = "add"
        request._key = key 
        request._value = value 
        this.pushRequest(request)
        return this
    }

    /**
     * Update an entry in the object store
     * @param {string} key - The key
     * @param {string|ArrayBuffer} value - The value
     * @returns {IndexedDBTx}
     */
    atUpdate (key, value) {
        this.assertValidKeyValue(key, value)
	    this.assertNotCommitted()

        this.debugLog(() => "UPDATE " + key)

        const entry = this.entryForKeyAndValue(key, value)
        const request = this.objectStore().put(entry);
        request._action = "put"
        request._key = key
        request._value = value 
        this.pushRequest(request)
        return this
    }
    
    /**
     * Remove an entry from the object store
     * @param {string} key - The key
     * @returns {IndexedDBTx}
     */
    removeAt (key) {
	    this.assertNotCommitted()

        this.debugLog(() => "REMOVE " + key)

        const request = this.objectStore().delete(key);
        request._action = "remove"
        request._key = key
        this.pushRequest(request)
        return this
    }

    /**
     * Get debug type ID
     * @returns {string}
     */
    debugTypeId () {
        return this.dbFolder().debugTypeId() + " " + this.txId() //super.debugTypeId()
    }
    
}.initThisClass());