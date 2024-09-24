/**
 * @module library.view.dom.DomView
 */

"use strict";

/**
 * @class ResponderDomView
 * @extends GesturableDomView
 * @classdesc Dealing with controlling focus and handling focus events,
 * managing firstResponder, tabbing between key views
 */
(class ResponderDomView extends GesturableDomView {
    
    /**
     * @static
     * @description Initializes the class
     */
    static initClass () {
        this.newClassSlot("tabCount", 0)
    }

    /**
     * @description Initializes the prototype slots
     */
    initPrototypeSlots () {
        /**
         * @property {Boolean} acceptsFirstResponder
         */
        {
            const slot = this.newSlot("acceptsFirstResponder", false);
            slot.setSlotType("Boolean");
        }

        // browser looks at element.tabindex to find next element 
        // to focus on tab press, but we may want more behavior
        /*
        {
            const slot = this.newSlot("interceptsTab", true);
            slot.setSlotType("Boolean");
        }
        */
        /**
         * @property {ResponderDomView} nextKeyView
         */
        {
            const slot = this.newSlot("nextKeyView", null);
            slot.setSlotType("ResponderDomView");
        }
        /*
        {
            const slot = this.newSlot("canMakeKey", true);
            slot.setSlotType("Boolean");
        }
        */
    }

    // --- focus ---

    /**
     * @description Schedules registration for focus
     */
    scheduleRegisterForFocus () {
        if (this.element().parentElement) {
            this.setIsRegisteredForFocus(true);
        } else {
            // only need timeout when create dom element in same event?
            this.addTimeout(() => { 
                this.setIsRegisteredForFocus(true); 
            }, 0);
        }
    }

    /**
     * @description Checks if the view has a focused descendant view
     * @returns {Boolean}
     */
    hasFocusedDecendantView () {
        const focusedView = WebBrowserWindow.shared().activeDomView();
        if (focusedView) {
            return this.hasSubviewDescendant(focusedView);
        }
        return false;
    }

    /**
     * @description Focuses the view
     * @returns {ResponderDomView}
     */
    focus () {
        if (!this.isActiveElement()) {
            this.element().focus();
        }
        return this;
    }

    /**
     * @description Focuses the view after a specified delay
     * @param {number} seconds - Delay in seconds
     * @returns {ResponderDomView}
     */
    focusAfterDelay (seconds) {
        this.addTimeout(() => {
            const e = this.element()
            if (e) {
                // in case element has retired during the timeout
                e.focus()
            }
        }, seconds * 1000)
        return this
    }

    /**
     * @description Checks if the view has focus
     * @returns {Boolean}
     */
    hasFocus () {
        return this.isActiveElement()
    }

    /**
     * @description Blurs (unfocuses) the view
     * @returns {ResponderDomView}
     */
    blur () { 
        this.element().blur()
        return this
    }

    // --- active element ---

    /**
     * @description Checks if the view is the active element
     * @returns {Boolean}
     */
    isActiveElement () {
        return document.activeElement === this.element()
    }

    /**
     * @description Checks if the view is the active element and editable
     * @returns {Boolean}
     */
    isActiveElementAndEditable () {
        return this.isActiveElement() && this.contentEditable()
    }

    /**
     * @description Checks if the view is focused
     * @returns {Boolean}
     */
    isFocused () {
        return this.isActiveElement()
    }

    // --- inner html ---

    /**
     * @description Sets the inner HTML of the view
     * @param {string} v - HTML content
     * @returns {ResponderDomView}
     */
    setInnerHtml (v) {
        const oldValue = this.element().innerHTML;

        if (Type.isNullOrUndefined(v)) {
            v = "";
        }
        if (!Type.isString(v)) {
            v = "" + v; // coerce to string
        }

        const newValue = v.asNormalizedHtml();

        if (newValue === oldValue) {
            return this;
        }

        if (this.isActiveElementAndEditable()) {
            //debugger;
        }

        updateElementHTML(this.element(), newValue);

        return this
    }

    /**
     * @description Forces a redisplay of the view
     * @returns {ResponderDomView}
     */
    forceRedisplay () {
        // NOTE: not sure this works
        const p = this.parentView()
        if (p) {
            const d = p.display()
            p.setDisplay("none")
            p.setDisplay(d)  
        }
        return this
    }

    /**
     * @description Called when input occurs
     */
    didInput () {
        this.debugLog("didInput")
        this.tellParentViews("onDidInput", this)
        return this
    }

    /**
     * @description Called when editing occurs
     */
    didEdit () {
        this.debugLog("didEdit")
        this.tellParentViews("onDidEdit", this)
        return this
    }

    /**
     * @description Handles the Enter key up event
     * @param {Event} event - The key event
     * @returns {Boolean}
     */
    onEnterKeyUp (event) {
        return true
    }

    // --- tabs and next key view ----

    /**
     * @description Handles the Tab key down event
     * @param {Event} event - The key event
     * @returns {Boolean}
     */
    onTabKeyDown (event) {
        if (this.selectNextKeyView()) {
        }
        return false
    }

    /**
     * @description Handles the Tab key up event
     * @param {Event} event - The key event
     * @returns {Boolean}
     */
    onTabKeyUp (event) {
        return false
    }

    /**
     * @description Makes this view the key view
     * @returns {ResponderDomView}
     */
    becomeKeyView () { 
        this.focus()
        return this
    }

    /**
     * @description Selects the next key view
     * @returns {Boolean}
     */
    selectNextKeyView () {
        const nkv = this.nextKeyView()
        if (nkv) {
            nkv.becomeKeyView()
            return true
        } else {
            const p = this.parentView()
            if (p) {
                return p.selectNextKeyView()
            }
        }
        return false
    }

    // --- error checking ---

    /**
     * @description Checks if the view is valid
     * @returns {Boolean}
     */
    isValid () {
        return true
    }

    // --- focus and blur event handling ---

    /**
     * @description Called before accepting first responder status
     * @returns {ResponderDomView}
     */
    willAcceptFirstResponder () {
        return this
    }

    /**
     * @description Called after releasing first responder status
     * @returns {ResponderDomView}
     */
    didReleaseFirstResponder () {
        return this
    }

    // --- firstResponder --- 

    /**
     * @description Checks if this view is the first responder
     * @returns {Boolean}
     */
    isFirstResponder () {
        return document.activeElement === this.element()
    }

    /**
     * @description Called before becoming the first responder
     */
    willBecomeFirstResponder () {
    }

    /**
     * @description Makes this view the first responder
     * @returns {ResponderDomView}
     */
    becomeFirstResponder () {
        if (this.acceptsFirstResponder()) {
            this.willBecomeFirstResponder()
            this.focus()
        } else if (this.parentView()) {
            this.parentView().becomeFirstResponder()
        }
        return this
    }

    /**
     * @description Releases first responder status
     * @returns {ResponderDomView}
     */
    releaseFirstResponder () {
        if (this.isFocused()) { 
            this.blur()
        }

        this.tellParentViews("decendantReleasedFocus", this)
        return this
    }

    // ------------------------------------------------

    /**
     * @description Disables pointer events for a specified time
     * @param {number} ms - Timeout in milliseconds
     * @returns {ResponderDomView}
     */
    disablePointerEventsUntilTimeout (ms) {
        this.setPointerEvents("none")
        this.debugLog(" disabling pointer events")

        this.addTimeout(() => {
            this.debugLog(" enabling pointer events")
            this.setPointerEvents("inherit")
        }, ms)

        return this
    }

}.initThisClass());

/**
 * @description Updates the HTML content of an element while preserving focus and selection
 * @param {HTMLElement} element - The element to update
 * @param {string} htmlContent - The new HTML content
 */
function updateElementHTML(element, htmlContent) {
    let isFocused = (document.activeElement === element);

    let isEditable = element.contentEditable === 'true' || element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';

    if (isEditable && isFocused) {
        let selectionStart = element.selectionStart;
        let selectionEnd = element.selectionEnd;

        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.value = htmlContent;
        } else {
            element.innerHTML = htmlContent;
        }

        element.selectionStart = selectionStart;
        element.selectionEnd = selectionEnd;
    } else {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.value = htmlContent;
        } else {
            element.innerHTML = htmlContent;
        }
    }

    if (isFocused) {
        element.focus();
    }
}