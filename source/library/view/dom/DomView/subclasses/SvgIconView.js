/**
 * @module library.view.dom.DomView.subclasses
 */

/**
 * @class SvgIconView
 * @extends FlexDomView
 * @classdesc A view to render scalable SVG within a view that can be 
 * synced to match the color of the parent view's text color by
 * getting the computed color and applying it to the fill or stroke of the
 * svg views.
 * 
 * TODO: support disabled/uneditable color style?
 * 
 * Example use:
 * 
 * SvgIconView.clone().setIconName("add")
 */
"use strict";

(class SvgIconView extends FlexDomView {
    
    /**
     * @static
     * @description Initializes the class by creating a new class slot.
     */
    static initClass () {
        this.newClassSlot("sharedSvgMap", new Map()) // svgStringHash -> hidden svg element defined in document
    }

    /**
     * @description Initializes the prototype slots for the SvgIconView.
     */
    initPrototypeSlots () {
        /**
         * @property {Element} svgElement
         */
        {
            const slot = this.newSlot("svgElement", null);
            slot.setSlotType("Element");
        }
        /**
         * @property {String} svgString
         */
        {
            const slot = this.newSlot("svgString", "");
            slot.setSlotType("String");
        }
        /**
         * @property {URL} url
         */
        {
            const slot = this.newSlot("url", null);
            slot.setSlotType("URL");
        }
        /**
         * @property {String} iconName
         */
        {
            const slot = this.newSlot("iconName", null);
            slot.setSlotType("String");
        }
        /**
         * @property {Boolean} doesMatchParentColor
         */
        {
            const slot = this.newSlot("doesMatchParentColor", false);
            slot.setDoesHookSetter(true);
            slot.setSlotType("Boolean");
        }
        /**
         * @property {String} strokeColor
         */
        {
            const slot = this.newSlot("strokeColor", "white");
            slot.setDoesHookSetter(true);
            slot.setSlotType("String");
        }
        /**
         * @property {String} fillColor
         */
        {
            const slot = this.newSlot("fillColor", "white");
            slot.setDoesHookSetter(true);
            slot.setSlotType("String");
        }
        /**
         * @property {Number} strokeWidth
         */
        {
            const slot = this.newSlot("strokeWidth", 1);
            slot.setDoesHookSetter(true);
            slot.setSlotType("Number");
        }
    }

    /**
     * @description Initializes the SvgIconView.
     * @returns {SvgIconView}
     */
    init () {
        super.init()
        this.setDisplay("flex")
        this.setPosition("relative")
        this.setElementClassName("SvgIconView")
        this.turnOffUserSelect()
        this.setOverflow("hidden")

        this.setPadding("0em")
        this.setMargin("0em")
        
        this.setOverflow("visible")
        this.syncColors()

        return this
    }

    /**
     * @description Returns a debug type ID for the icon.
     * @returns {string}
     */
    debugTypeId () {
        const name = this.iconName()
        return  super.debugTypeId() + (name ? " '" + name + "'" : "")
    }

    /**
     * @description Clears the SVG string and hides the display.
     */
    clear () {
        this.setSvgString(null)
        this.hideDisplay()
    }

    /**
     * @description Sets the icon name and updates the SVG string.
     * @param {string} name - The name of the icon.
     * @returns {SvgIconView}
     */
    setIconName (name) {
        if (this._iconName !== name) {
            this._iconName = name

            if (name === null) {
                this.clear()
                return this
            }

            const icons = BMIconResources.shared()
            const iconNode = icons.firstSubnodeWithTitle(name)

            if (iconNode) {
                this.setSvgString(iconNode.svgString())
                this.unhideDisplay()
            } else {
                const error = "can't find icon '" + name + "'"
                console.log(error)
                debugger;
                this.clear()
                return this
            }

            this.setElementId(this.debugTypeId() + " '" + this.svgId() + "'")
        }

        return this
    }

    /**
     * @description Returns the SVG ID.
     * @returns {string}
     */
    svgId () {
        return "svgid-" + this.iconName() 
    }

    /**
     * @description Sets the SVG string and updates the element.
     * @param {string} s - The SVG string.
     * @returns {SvgIconView}
     */
    setSvgString (s) {
        this._svgString = s

        if (s) {
            // remove and old svg element
            while (this.element().lastChild) {
                this.element().removeChild(this.element().lastChild);
            }

            // add svg element
            const e = SvgIconCache.shared().newLinkElementForSvgString(s)
            this.element().appendChild(e)
            this.setSvgElement(e)
        }

        return this
    }

    /**
     * @description Sets both fill and stroke colors.
     * @param {string} aColor - The color to set.
     * @returns {SvgIconView}
     */
    setColor (aColor) {
        this.setFillColor(aColor)
        this.setStrokeColor(aColor)
        return this
    }
        
    /**
     * @description Synchronizes the colors with the CSS properties.
     */
    syncColors () {
        const style = this.element().style
        style.setProperty("--fillColor", this.fillColor())
        style.setProperty("--strokeColor", this.strokeColor())
        style.setProperty("--strokeWidth", this.strokeWidth())
    }

    /**
     * @description Updates the fill color CSS property.
     * @param {string} oldValue - The old fill color.
     * @param {string} newValue - The new fill color.
     */
    didUpdateSlotFillColor (oldValue, newValue) {
        this.setCssProperty("--fillColor", newValue)
    }

    /**
     * @description Updates the stroke color CSS property.
     * @param {string} oldValue - The old stroke color.
     * @param {string} newValue - The new stroke color.
     */
    didUpdateSlotStrokeColor (oldValue, newValue) {
        this.setCssProperty("--strokeColor", newValue)
    }

    /**
     * @description Updates the stroke width CSS property.
     * @param {number} oldValue - The old stroke width.
     * @param {number} newValue - The new stroke width.
     */
    didUpdateSlotStrokeWidth (oldValue, newValue) {
        this.setCssProperty("--strokeWidth", newValue)
    }

    /**
     * @description Returns a map of variable attributes.
     * @returns {Map}
     */
    variableAttributeMap () {
        const m = new Map()
        m.set("fill", "var(--fillColor)")
        m.set("stroke", "var(--strokeColor)")
        m.set("strokeWidth", "var(--strokeWidth)")
        m.set("transition", "var(--transition)")
        return m
    }

    /**
     * @description Returns a map of parent variable attributes.
     * @returns {Map}
     */
    parentVariableAttributeMap () {
        const m = new Map()
        m.set("fill", "var(--color)")
        m.set("stroke", "var(--color)")
        m.set("strokeWidth", "var(--strokeWidth)")
        m.set("transition", "var(--transition)")
        return m
    }

}.initThisClass());