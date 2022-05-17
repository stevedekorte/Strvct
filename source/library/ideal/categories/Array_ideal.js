"use strict";

/*

    Array_ideal

    Some extra methods for the Javascript Array primitive.

*/

(class Array_ideal extends Array {

    static withArray (anArray) {
        return this.clone().copyFrom(anArray)
    }

    static fromIterator (iterator) {
        const values = []
        let result = iterator.next()
        while (!result.done) {
            values.push(result.value)
            result = iterator.next()
        }
        return values
    }

    /*
    init () {
        Object.prototype.init.apply(this)
     }
    */

    duplicate () {
        return this.shallowCopy()
    }

    clear () {
        while (this.length) {
            this.pop()
        }
        return this
    }

    copyFrom (anArray) {
        this.clear()
        anArray.forEach(v => this.push(v))
        return this
    }

    // --- read operations ---

    // foreach key value (key being the index)

    forEachKV (func) {
        let i = 0
        this.forEach((v) => {
            func(i, v)
            i++
        })
    }

    reverseForEachKV (func) {
        let i = 0
        this.forEach((v) => {
            func(i, v)
            i++
        })
    }

    isEmpty () {
        return this.length === 0;
    }

    isEqual (otherArray) {
        if (this.length !== otherArray.length) {
            return false;
        }

        for (let i = 0; i < this.length; i++) {
            if (this[i] !== otherArray[i]) {
                //if (this.at(i) !== otherArray.at(i)) {
                return false;
            }
        }

        return true;
    }

    size () {
        return this.length;
    }

    at (index) {
        if (index < 0) {
            return this[this.length + index];
        }

        return this[index];
    }

    removeAt (index) {
        // we need to hook this since delete can't be hooked
        const v = this[index]
        this.willMutate("removeAt", v)
        delete this[index]
        this.didMutate("removeAt", v)
        return this
    }

    atPut (index, v) {
        // we need to hook this since []= can't be hooked
        this.willMutate("atPut", v)
        this[index] = v
        this.didMutate("atPut", v)
        return this
    }

    first () {
        return this.at(0)
    }

    second () {
        return this.at(1)
    }

    rest () {
        return this.slice(1);
    }

    last () {
        return this.at(this.length - 1) // returns undefined for negative indexes
    }

    contains (element) {
        return this.indexOf(element) !== -1;
    }

    containsAny (anArray) {
        const match = anArray.detect(item => this.contains(item))
        return !Type.isNullOrUndefined(match)
    }

    hasPrefix (otherArray) {
        if (this.length < otherArray.length) {
            return false;
        }

        for (let i = 0; i < this.length; i++) {
            if (this.at(i) !== otherArray.at(i)) {
                return false;
            }
        }

        return true;
    }

    itemAfter (v) {
        let i = this.indexOf(v);

        if (i === -1) {
            return null;
        }

        i = i + 1;

        if (i > this.length - 1) {
            return null;
        }

        if (this.at(i) !== undefined) {
            return this.at(i);
        }

        return null;
    }

    itemBefore (v) {
        let i = this.indexOf(v);

        if (i === -1) {
            return null;
        }

        i = i - 1;

        if (i < 0) {
            return null;
        }

        if (this.at(i)) {
            return this.at(i)
        }

        return null;
    }

    shallowCopy () {
        return this.slice()
    }

    copy (copyDict) {
        // since not every object will implement copy:
        // we need to have a check for it
        return this.slice().map((v) => {
            if (v.copy) {
                return v.copy(copyDict)
            } else {
                return v
            }
        })
    }

    split (subArrayCount) {
        const subArrays = [];
        const subArraySize = Math.ceil(this.length / subArrayCount);

        for (let i = 0; i < this.length; i += subArraySize) {
            let subArray = this.slice(i, i + subArraySize);
            if (subArray.length < subArraySize) {
                let lastSubArray = subArrays.pop();
                if (lastSubArray) {
                    subArray = lastSubArray.concat(subArray);
                }
            }
            subArrays.push(subArray);
        }

        return subArrays;
    }

    // --- write operations ---

    atInsert (i, e) {
        this.splice(i, 0, e);
        return this
    }

    atInsertItems (i, items) {
        let n = i
        items.forEach(item => {
            this.atInsert(n, item)
            n++
        })
        return this
    }

    append () {
        this.appendItems.call(this, arguments);
        return this;
    }

    appendItems (elements) {
        this.push.apply(this, elements);
        return this;
    }

    appendItemsIfAbsent (elements) {
        this.appendIfAbsent.apply(this, elements);
        return this;
    }

    moveItemsToIndex (movedItems, anIndex) {
        const newArray = this.shallowCopy()
        let insertIndex = anIndex

        movedItems.forEach(item => assert(this.contains(item))) // sanity check

        //console.log("start: " + this.map(s => s.title()).join("-") + ".moveItemsToIndex("  + movedItems.map(s => s.title()).join("-") + ", " + anIndex + ")")

        movedItems.forEach(item => {
            const i = this.indexOf(item)
            if (i == -1) {
                throw new Error("this isn't handled yet")
            }

            if (i < insertIndex) {
                insertIndex--
            }
            newArray.remove(item)
        })

        movedItems.reversed().forEach(item => {
            newArray.atInsert(insertIndex, item)
        })

        this.copyFrom(newArray)
        return this
    }

    prepend (e) {
        this.unshift(e);
        return this;
    }

    appendIfAbsent () {
        this.slice.call(arguments).forEach((value) => {
            if (this.indexOf(value) === -1) {
                this.push(value);
                return true;
            }
        })

        return false;
    }

    removeAll () {
        while (this.length) {
            this.pop() // TODO: make more efficient?
        }
        return this
    }

    removeAt (i) {
        this.willMutate("removeAt")
        this.splice(i, 1);
        this.didMutate("removeAt")
        return this;
    }

    remove (e) {
        const i = this.indexOf(e);
        if (i !== -1) {
            this.removeAt(i);
        }
        return this;
    }

    emptiesRemoved () {
        return this.filter(v => !Type.isNullOrUndefined(v))
    }

    removeFirst () {
        // isMutator
        return this.shift();
    }

    removeLast () {
        // isMutator
        return this.pop();
    }

    removeItems (elements) {
        // isMutator
        elements.forEach(e => this.remove(e));
        return this;
    }

    empty () {
        this.splice(0, this.length);
        return this;
    }

    shuffle () {
        let i = this.length;

        if (i === 0) {
            return false;
        }

        while (--i) {
            const j = Math.floor(Math.random() * (i + 1));
            const tempi = this.at(i);
            const tempj = this.at(j);
            this.atPut(i, tempj)
            this.atPut(j, tempi)
        }

        return this;
    }

    atRandom () {
        const i = Math.floor(Math.random() * this.length)
        return this.at(i);
    }

    // --- enumeration ---

    /*
    forEachCall (functionName) {
        const args = this.slice.call(arguments).slice(1);
        args.push(0);
        this.forEach((e, i) => {
            args[args.length - 1] = i;
            if (e) {
                const fn = e[functionName];
                if (fn) {
                    fn.apply(e, args);
                } else {
                    console.warn("Array.forEachCall: No method " + functionName);
                }
            }
        });
        return this;
     }
    */

    forEachPerformIfResponds (methodName, arg1, arg2, arg3) {
        this.forEach((item) => {
            if (item) {
                const f = item[methodName]
                if (f) {
                    f.call(item, arg1, arg2, arg3)
                }
            }
        })
        return this
    }

    forEachPerform (methodName, arg1, arg2, arg3) {
        this.forEach((item) => {
            if (item) {
                const f = item[methodName]
                if (f) {
                    f.call(item, arg1, arg2, arg3)
                } else {
                    throw new Error(Type.typeName(item) + " does not respond to '" + methodName + "'")
                }
            }
        })
        return this
    }

    sortPerform (functionName) { // WARNING: sorts IN-PLACE
        const args = this.slice.call(arguments).slice(1);
        return this.sort(function (x, y) {
            const xRes = x[functionName].apply(x, args);
            const yRes = y[functionName].apply(y, args);
            if (xRes < yRes) {
                return -1;
            } else if (yRes < xRes) {
                return 1;
            }
            return 0;
        });
    }

    mapProperty (propertyName) {
        return this.map(e => e[propertyName]);
    }

    detect (callback) {
        for (let i = 0; i < this.length; i++) {
            const v = this.at(i)
            if (callback(v, i)) {
                return v;
            }
        }

        return null; // or should this be undefined?
    }

    detectPerform (functionName) {
        const args = this.slice.call(arguments).slice(1);
        return this.detect((value, index) => {
            return value[functionName].apply(value, args);
        });
    }

    detectProperty (slotName, slotValue) {
        for (let i = 0; i < this.length; i++) {
            const v = this.at(i)
            if (v[slotName] === slotValue) {
                return v;
            }
        }

        return null;
    }

    detectIndex (callback) {
        for (let i = 0; i < this.length; i++) {
            if (callback(this.at(i), i)) {
                return i;
            }
        }

        return null;
    }

    nullsRemoved () {
        return this.filter(v => !Type.isNull(v));
    }

    reject (callback) {
        return this.filter(v => !callback(v))
    }

    // max 

    maxEntry (optionalCallback) {
        // callback is optional
        const length = this.length;
        const mEntry = [undefined, undefined]

        for (let i = 0; i < length; i++) {
            let v = this.at(i);
            if (optionalCallback) {
                v = optionalCallback(v);
            }

            if (mEntry[1] === undefined || v > mEntry[1]) {
                mEntry[0] = i
                mEntry[1] = v
            }
        }

        return mEntry;
    }

    maxIndex (optionalCallback) {
        return this.maxEntry(optionalCallback)[0];
    }

    maxValue (optionalCallback, theDefault) {
        return this.maxEntry(optionalCallback)[1];
    }

    maxItem (optionalCallback) {
        return this.at(this.maxIndex(optionalCallback));
    }


    // min

    minEntry (optionalCallback) {
        // callback is optional
        const length = this.length;
        const mEntry = [undefined, undefined]

        for (let i = 0; i < length; i++) {
            let v = this[i];
            if (optionalCallback) {
                v = optionalCallback(v);
            }

            if (mEntry[1] === undefined || v < mEntry[1]) {
                mEntry[0] = i
                mEntry[1] = v
            }
        }

        return mEntry;
    }

    minIndex (optionalCallback) {
        return this.maxEntry(optionalCallback)[0];
    }

    minValue (optionalCallback) {
        return this.minEntry(optionalCallback)[1];
    }

    // sum

    sum (optionalCallback) {
        let sum = 0;
        const length = this.length;

        for (let i = 0; i < length; i++) {
            let v = this.at(i);
            if (optionalCallback) {
                v = optionalCallback(v);
            }

            sum = sum + v;
        }

        return sum;
    }

    average () {
        if (this.length === 0) {
            return 0
        }
        return this.sum() / this.length;
    }

    /*
    flatten (maxDepth = 1) {
        const result = [];
        let needsFlatten = true
        let depth = 0
        while (needsFlatten && depth < maxDepth) {
            depth ++
            needsFlatten = false
            this.forEach((item) {
                if (item === this) {
                    throw new Error("attempt to flatten recursive array")
                }
                if (Type.isArray(item)) { // TODO: generalize to enumerables?
                    result.appendItems(array)
                    needsFlatten = true
                } else {
                    result.append(item)
                }
            });
        }
        return result;
     }
    */


    unique () {
        return Array.from(new Set(this));
    }

    asSet () {
        return new Set(this)
    }

    reversed () {
        return this.shallowCopy().reverse();
    }

    asPath () {
        if (this.length === 1 && this.first() === "") {
            return "/";
        }
        else {
            return this.join("/");
        }
    }

    isAbsolutePath () {
        return this.first() === "";
    }

    isRelativePath () {
        return this.first() !== "";
    }

    filterInPlace (callback) {
        for (let i = this.length - 1; i >= 0; i--) {
            const v = this.at(i);
            if (!callback(v)) {
                this.removeAt(i)
            }
        }
        return this
    }

    select (callback) {
        return this.filter(callback)
    }

    after (v) {
        const index = this.indexOf(v);

        if (index === -1) {
            return [];
        }

        return this.slice(index + 1);
    }

    before (v) {
        const index = this.indexOf(v);

        if (index === -1) {
            return this.slice();
        }

        return this.slice(0, index);
    }

    replaceOccurancesOfWith (oldValue, newValue) {
        // isMutator
        for (let i = 0; i < this.length; i++) {
            if (this.at(i) === oldValue) {
                this.atPut(i, newValue);
            }
        }
        return this
    }

    removeOccurancesOf (e) {
        // isMutator
        for (let i = this.length - 1; i >= 0; i--) {
            const v = this.at(i);
            if (v === e) {
                this.removeAt(i)
            }
        }
        return this;
    }

    joinWithFunc (aFunc) {
        // not a mutator
        // like join, but calls aFunc with the array and index as arguments
        // to get each new item to insert between array items
        const joined = []
        for (let i = 0; i < this.length; i++) {
            const v = this[i]
            joined.push(v)
            if (i < this.length - 1) {
                const separator = aFunc(this, i)
                joined.push(separator)
            }
        }
        return joined
    }

    /*
    wrap (obj) {
        if (obj === null || obj === undefined) {
            return [];
        }
        else if (obj.isArray) {
            return obj;
        }
        else {
            return [obj];
        }
     }
    */

    itemsBefore (item) {
        const index = this.indexOf(item);
        if (index !== -1) {
            return this.slice(0, index);
        }
        return this
    }

    /*
    const setDifference = (a, b) => new Set([...a].filter(x => !b.has(x)));
    const setIntersection = (a, b) => new Set([...a].filter(x => b.has(x)));
    const setUnion = (a, b) => new Set([...a, ...b]);
    */

    union (other) {
        let r = this.concat(other).unique()
        return r;
    }

    intersection (other) {
        const thisSet = new Set(this)
        return other.filter((v) => {
            return thisSet.has(v);
        });
    }

    difference (other) {
        const thisSet = new Set(this)
        return other.filter(v => !thisSet.has(v));
    }

    symmetricDifference (other) {
        let all = this.concat(other)
        const thisSet = new Set(this)
        const otherSet = new Set(other)
        return all.filter(v => !thisSet.has(v) || !otherSet.has(v));
    }

    /*
    intersectionWithSelector (a, methodName) {
        return this.select((e1) => { 
            return a.detect(e2 => e1[methodName].apply(e1) === e2[methodName].apply(e2)) !== null 
        })
     }
     
    diffWithSelector (otherArray, methodName) {
        let thisIdSet = new Set(this.map(v => v[methodName].apply(v)))
        let otherIdSet = new Set(otherArray.map(v => v[methodName].apply(v)))
    
        return otherArray.select(v => !idSet.has(v.id()) )
     }
    */


    // --- equality ---

    equals (array /*, visited = new Set()*/) {
        // we want this to work on any object that confroms to the array protocol, 
        // not just objects of the same JS type
        // but how do we test for the [] accessor?
        // also, how do we deal with circular structures?

        /*
        if (visited.has(this)) {
            return true // ?
        }
        visited.add(this)
        */

        if (array.length === undefined) {
            return false;
        }

        // compare lengths - can save a lot of time 
        if (this.length !== array.length) {
            return false;
        }

        for (let i = 0, l = this.length; i < l; i++) {
            const a = this.at(i)
            const b = array.at(i)

            // Check if we have nested arrays
            /*
                if (this.at(i) instanceof Array && array[i] instanceof Array) {
                    // recurse into the nested arrays
                    if (!this.at(i).equals(array[i]))
                        return false;       
                }     
            */


            if (a.equals && !a.equals(b, visited)) {
                return false;
            } else if (a !== b) {
                // Warning - two different object instances will never be equal: {x:20} !== {x:20}
                return false;
            }
        }

        return true;
    }


    containsEquals (b) {
        for (let i = 0, l = this.length; i < l; i++) {
            let a = this.at(i)

            if (a.equals) {
                if (!a.equals(b)) {
                    return false;
                }
            } else if (a !== b) {
                return false;
            }
        }
        return true;
    }

    /*
    asImmutable () {
        // doesn't raise exception on write - they just fail silently - too dangerous to use
        //const obj = this.shallowCopy()
        //Object.freeze(obj)
        //return obj
     }
    */
}).initThisCategory();

