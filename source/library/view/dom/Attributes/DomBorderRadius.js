"use strict";

/**
 * @module library.view.dom.Attributes
 */

/**
 * @class DomBorderRadius
 * @extends ProtoClass
 * @classdesc Represents the border radius of a DOM element.
 * 
 * Usage example:
 * this.titleView().setBorderRadius("8px 8px 0px 8px") // top-left, top-right, bottom-right, bottom-left
 * TODO: em vs px support?
 */
(class DomBorderRadius extends ProtoClass {
    /**
     * @description Initializes the prototype slots for the DomBorderRadius class.
     */
    initPrototypeSlots () {
        /**
         * @property {DomView} divView - The associated DomView.
         */
        {
            const slot = this.newSlot("divView", null);
            slot.setSlotType("DomView");
        }
        /**
         * @property {Number} topLeft - The top-left border radius.
         */
        {
            const slot = this.newSlot("topLeft", 0);
            slot.setSlotType("Number");
        }
        /**
         * @property {Number} topRight - The top-right border radius.
         */
        {
            const slot = this.newSlot("topRight", 0);
            slot.setSlotType("Number");
        }
        /**
         * @property {Number} bottomRight - The bottom-right border radius.
         */
        {
            const slot = this.newSlot("bottomRight", 0);
            slot.setSlotType("Number");
        }
        /**
         * @property {Number} bottomLeft - The bottom-left border radius.
         */
        {
            const slot = this.newSlot("bottomLeft", 0);
            slot.setSlotType("Number");
        }
        /**
         * @property {Array} partNames - The names of the border radius parts.
         */
        {
            const slot = this.newSlot("partNames", ["topLeft", "topRight", "bottomRight", "bottomLeft"]);
            slot.setSlotType("Array");
        }
    }

    /*
    init () {
        super.init()
    }
    */

    /**
     * @description Clears all border radius values.
     * @returns {DomBorderRadius} The current instance.
     */
    clear () {
        this.setAll(0)
        return this
    }

    /**
     * @description Sets all border radius values to the specified value.
     * @param {Number} v - The value to set for all border radii.
     * @returns {DomBorderRadius} The current instance.
     */
    setAll (v) {
        if (!v) {
            v = 0
        }

        this.partSetters().forEach((setter) => {
            this[setter].apply(this, [v])
        })
        return this
    }

    /**
     * @description Gets an array of setter method names for all parts.
     * @returns {Array} An array of setter method names.
     */
    partSetters () {
        return this.partNames().map(k => k.asSetter())
    }

    /**
     * @description Gets an array of current values for all parts.
     * @returns {Array} An array of current border radius values.
     */
    partValues () {
        return this.partNames().map(k => this[k].apply(this))
    }

    /**
     * @description Converts the border radius values to a string representation.
     * @returns {string} A string representation of the border radius values.
     */
    asString (aString) {
        return this.partValues().map(v => v + "px").join(" ")
    }

    /**
     * @description Sets the border radius values from a string representation.
     * @param {string} aString - The string representation of border radius values.
     * @returns {DomBorderRadius} The current instance.
     */
    setFromString (aString) {
        const parts = aString.split(" ").select(part => part !== "")

        this.clear()

        if (parts.length === 1) {
            this.setAll(Number(parts[0]))
        }

        let v;

        v = parts.removeFirst()
        if (Type.isString(v)) {
            this.setTopLeft(Number(v))
        }

        v = parts.removeFirst()
        if (Type.isString(v)) {
            this.setTopRight(Number(v))
        }

        v = parts.removeFirst()
        if (Type.isString(v)) {
            this.setBottomRight(Number(v))
        }

        v = parts.removeFirst()
        if (Type.isString(v)) {
            this.setBottomLeft(Number(v))
        }

        return this
    }

    /**
     * @description Synchronizes the border radius values to the associated DomView.
     * @returns {DomBorderRadius} The current instance.
     */
    syncToDomView () {
        this.divView().setBorderRadius(this.asString())
        return this
    }

    /**
     * @description Synchronizes the border radius values from the associated DomView.
     * @returns {DomBorderRadius} The current instance.
     */
    syncFromDomView () {
        const s = this.divView().borderRadius()

        if (s) {
            this.setFromString(s)
        } else {
            this.clear()
        }

        return this
    }
}.initThisClass());