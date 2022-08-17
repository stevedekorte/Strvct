"use strict";

/*

    TextField
    
    A view for a single line of text. 
    For multi-line text, use TextArea.
    
    Behavior:
    On Return/Enter key, it passes focus to the nextResponder/parent.

    Notes:
    To watch for changes during editable content editing, we could use:

*/

(class TextField extends StyledDomView {
    
    initPrototypeSlots () {
        this.newSlot("selectedColor", null)
        this.newSlot("unselectedColor", null)
        this.newSlot("doesClearOnReturn", false)
        this.newSlot("doesHoldFocusOnReturn", false)
        this.newSlot("doesTrim", false)
        this.newSlot("didTextInputNote", null)
        this.newSlot("didTextEditNote", null)
        this.newSlot("doesInput", false)
        this.newSlot("allowsSetStringWhileFocused", false)
        //this.newSlot("hasBackground", false)

        // has to start false for proper state setup
        this.newSlot("usesDoubleTapToEdit", false) 

        // need to separate from contentEditable since we want to override when usesDoubleTapToEdit is true.
        this.newSlot("isEditable", false).setOwnsSetter(true).setDoesHookSetter(true)

        this.newSlot("editableBorder", "1px solid rgba(255, 255, 255, 0.2)")
        this.newSlot("uneditableBorder", "none")
        this.newSlot("showsBorderWhenEditable", false)
        this.newSlot("mutationObserver", null)
    }

    init () {
        super.init()
        this.setDisplay("flex")
        this.setJustifyContent("flex-start")
        this.setAlignItems("flex-start")
        this.turnOffUserSelect()
        this.setWhiteSpace("pre-wrap")
        this.setWordWrap("normal")
        this.setOverflow("hidden")
        this.setOverflowWrap("normal")
        this.setTextOverflow("ellipsis")
        this.setWordBreak("keep-all")
        this.setSpellCheck(false)
        this.setMinWidth(10)
        this.setPaddingLeft("0.5em")
        this.setPaddingRight("0.5em")
        this.setPaddingTop("0.3em")
        this.setPaddingBottom("0.3em")
        this.setLineHeight("1.15em")
        this.setMinHeight("1em")
		
        //this.setUnfocusOnEnterKey(true)
        //this.setIsRegisteredForKeyboard(true) // gets set by setContentEditable()
        this.formatValue()

        //this.setDidTextInputNote(this.newNoteNamed("didTextInput"))
        //this.setDidTextEditNote(this.newNoteNamed("didTextEdit"))

        //this.setIsDebugging(true)
        //this.lockedStyleAttributeSet().add("backgroundColor")

        return this
    }

    // --- sub-element mutation observer ---

    startMutationObserver () {
        if (!this.mutationObserver()) {
            const config = { 
                subtree: true,
                childList: true, 
                attributes: true, 
                attributeOldValue: true, 
                //characterDataOldValue: true,
                characterData: true
            };

            const obs = new MutationObserver((mutationList, observer) => this.onDomMutation(mutationList, observer));
            obs.observe(this.element(), config);
            this.setMutationObserver(obs)
        }
        return this
    }

    stopMutationObserver () {
        const obs = this.mutationObserver()
        if (obs) {
            obs.disconnect()
            this.setMutationObserver(null)
        }
        return this
    }

    onDomMutation (mutationList, observer) {
     //   console.log("onDomMutation --------------> ", mutationList)

        for(const mutation of mutationList) {
            if (mutation.type === 'characterData') {
                this.onCharacterDataMutation(mutation)
            }
            /*
            if (mutation.type === 'childList') {
                console.log('A child node has been added or removed.');
            }
            else if (mutation.type === 'attributes') {
                console.log('The ' + mutation.attributeName + ' attribute was modified.');
            }
            */
        }
    }

    onCharacterDataMutation (mutation) {
        //console.log("onCharacterDataMutation --------------> ", mutation)
    }

    setContentEditable (aBool) {
        super.setContentEditable(aBool)

        /*
        if (aBool) {
            this.startMutationObserver()
        } else {
            this.stopMutationObserver()
        }
        */

        //this.debugLog(".setContentEditable(" + aBool + ") = ", this.contentEditable())
        //this.setIsRegisteredForClicks(this.contentEditable())  // is this needed after move to tap?

        return this
    }

    // ---

    setPaddingTop (v) {
        if (v === "0.6em") {
            console.log(this.value() + " setPaddingTop " + v)
        }
        return super.setPaddingTop(v)
    }

    // editing control

    /*
    setIsEditable (aBool) {
        if (this._isEditable !== aBool) {
            this._isEditable = aBool
            this.syncEditingControl()
        }
        return this
    }

    
    isEditable () {
        return this._isEditable
    }
    */
    
    didUpdateSlotIsEditable () {
        this.syncEditingControl()
    }

    setUsesDoubleTapToEdit (aBool) {
        if (this._usesDoubleTapToEdit !== aBool) {
            this._usesDoubleTapToEdit = aBool
            this.syncEditingControl()
        }
        return this
    }

    syncBorder () {
        let b = this.uneditableBorder()

        if (this.isEditable()) {
            if (this.showsBorderWhenEditable()) {
                b = this.editableBorder()
            }
        }
        this.setBorder(b)
        return this
    }

    syncEditingControl () {
        this.syncBorder()

        if (this.isEditable()) {
            if (this.usesDoubleTapToEdit()) {
                //debugger;
                this.addDefaultDoubleTapGesture()
                this.setContentEditable(false)
            } else {
                this.setContentEditable(true)
            }
        } else {
            if (this.usesDoubleTapToEdit()) {
                this.removeDefaultDoubleTapGesture()
            }
            this.setContentEditable(false)
        }

        return this
    }

    onDoubleTapCancelled (aGesture) {
        console.log(this.value() + " onDoubleTapCancelled")
    }

    onDoubleTapComplete (aGesture) {
        //debugger;
        //console.log(this.value() + " onDoubleTapComplete")
        // make content editable and select text
        //this.debugLog(".onDoubleTapComplete()")
        if (this.contentEditable()) {
            return this
        }
        this.setContentEditable(true)
        this.focus()
        this.selectAll()
        this.pauseGestures()
        //this.focus()
        //this.setBorder("1px dashed white")
        return this
    }

    pauseGestures () {
        GestureManager.shared().setIsPaused(true) // so things like text selection don't trigger gestures
    }

    onFocusIn () {
        super.onFocusIn()
        //console.log(this.typeId() + " '" + this.string() + "' onFocusIn")
        if (this.contentEditable()) {
            this.pauseGestures()
        }
    }

    onFocusOut () {
        super.onFocusOut()
        //console.log(this.typeId() + " '" + this.string() + "' onFocusOut")
        GestureManager.shared().setIsPaused(false)
    }

    onBlur () {
        //console.log(this.value() + " onBlur")
        super.onBlur()
        if (this.usesDoubleTapToEdit()) {
            this.setContentEditable(false)
            this.setBorder("none")
            this.turnOffUserSelect()
        }
    }

    setPxFontSize (aNumber) {
        super.setPxFontSize(aNumber)
        this.setMinAndMaxHeight(aNumber + 2) // make sure TextfField can fit font size
        this.didEdit()
        return this
    }
	
    returnStrings () {
        return ["<div><br></div>", "<br><br>"]
    }
	
    containsReturns () {
        const value = this.value() // correct?
        return returnStrings.detect(returnString => value.contains(returnString))		
    }
	
    // ------------------

    setValue (newValue) {
        return this.setString(newValue)
    }

    value () {
        // this.element().text ?
        return this.string()
    }

    
    setString (newValue) {
        if (Type.isNullOrUndefined(newValue)) {
            newValue = ""
        }

        const oldValue = this.string()
        //let newValue = this.visibleValue()
        if (oldValue !== newValue) {

            if (this.isFocused()) {
                if (this.allowsSetStringWhileFocused()) {
                    super.setString(newValue)
                } 
                //throw new Error("attempt to call TextField.setString while it's focused")

            } else {
                //this.isFocused()
                super.setString(newValue)
            }
            
            /*
            this.debugLog(" setString(")
            console.log("    old: '" + oldValue + "'")
            console.log("    new: '" + newValue + "'")
            console.log("---")
            */
            
        }
        return this
    }

    // ------------------

    adjustFontSizeWithKeyboard () {
        const kb = BMKeyboard.shared()
        const controlDown   = kb.controlKey().isDown()
        const equalSignDown = kb.equalsSignKey().isDown()
        const minusDown     = kb.minusKey().isDown()

        // adjust font size (testing this out)
        if (controlDown) {
            const fontSize = this.computedFontSize()

            if (equalSignDown) {
                this.setPxFontSize(fontSize + 1)
            } else if (minusDown) {
                if (fontSize > 1) { 
                    this.setPxFontSize(fontSize - 1)
                }
            }
        }
        return this
    }


    onAlternateEnterKeyUp (event) {
        console.log(this.typeId() + " onAlternateEnterKeyDown")
        //this.insertEnterAtCursor()
        //this.afterEnter()
    }

    insertEnterAtCursor (event) {
        if (this.isFocused()) {
            this.insertTextAtCursor("\n")
        }   
    }


    onKeyDown (event) {
        let result = super.onKeyDown(event)

        //console.log(this.debugTypeId() + " onKeyDown event.keyCode = ", event.keyCode)
        
        /*
        if (this.isContentEditable()) {
            return false // stop propogation
        }
        */
       //debugger;
        return true
    }

        
    /*
    onKeyUp (event) {
        //this.debugLog(" onKeyUp ", event)
        //this.adjustFontSizeWithKeyboard()
        super.onKeyUp(event)
        //this.debugLog(" onKeyUp value: [" + this.value() + "]")
        this.didEdit()
        return false
    }
    */
    
    onKeyUp (event) {
        let result = super.onKeyUp(event)
        this.didEdit()

        //event.preventDefault()
       // return result

        //console.log(this.debugTypeId() + " onKeyUp event.keyCode = ", event.keyCode)

        /*
        if (this.isContentEditable()) {
            return false // stop propogation
        }
        */
        //debugger;

        return false
    }
    
    
    onEnterKeyDown (event) {    
        // insert 2 returns as cursor won't go to the second line with 1
        //document.execCommand('insertHTML', false, "\n\n");
        // prevent the default behaviour of return key pressed
        return false;
    }
    

    onEnterKeyUp (event) {
        if (!this.isContentEditable()) {
            return 
        }
        /*
        if (!this.doesInput()) {
            //this.insertEnterAtCursor()
            return
        }
        */
	    //this.debugLog(".onEnterKeyUp()")
	    //this.didEdit()

        this.formatValue()
        this.afterEnter()
    }


    onEscapeKeyDown (event) {
        this.releaseFirstResponder()
        event.stopPropagation()
        return false
    }

    afterEnter (event) {
        this.tellParentViews("didInput", this) 
            
        if (!this.doesHoldFocusOnReturn()) {
            this.releaseFirstResponder()
        }
        
        if (this.doesClearOnReturn()) {
            this.setInnerHtml("")
            //this.focusAfterDelay(.125) // hack to get focus back after chat view scrolling - TODO: fix this
        }

        if (this.didTextInputNote()) {
            this.didTextInputNote().post()
        }
        
        if (event) {
            event.stopPropagation()
        }

        return false
    }
	
    formatValue () {
	    const oldValue = this.innerHtml()
	    let newValue = this.innerText() // removes returns
        
        if (this.doesTrim()) {
            newValue = newValue.trim()
        } 

        if (true) {
            //newValue.replaceAll("\n", "<br>")
        }
        
        
        if (newValue !== oldValue) {
            this.debugLog("formatValue newValue !== oldValue")
            this.debugLog(" newValue: [" + newValue + "]")
            this.setInnerHtml(newValue)
            this.didEdit()
        }
	    //console.trace(this.type() + " formatValue '" + oldValue + "' -> '" + this.innerHtml() + "'")
        //this.debugLog(" after formatValue: '" + this.innerHtml() + "'")
        return this
    }
    
    /*
    setInput (s) {
        const n = this.node()
        if (n) {
            const m = n.nodeInputFieldMethod()
            if (m) {
                n[m].apply(n, [s])
            }
        }
        return this
    }
    
    */

    activate () {
        if (this.usesDoubleTapToEdit()) {
            this.onDoubleTapComplete()
        } else {
            this.focus()
        }
        return this
    }
    
    onClick (event) {
        // needed to prevent click-to-edit event from selecting the background row
        //this.debugLog(".onClick()")

        if (this.contentEditable()) {
            this.sendActionToTarget()
            event.stopPropagation()
            return false
        }

        return super.onClick(event)
    }
    
    setBorder (v) {
        /*
        if (this.value() === "a") {
            console.log("break")
        }
        */
        return super.setBorder(v)
    }

    setBackgroundColor (aColor) {
        super.setBackgroundColor(aColor)
        return this
    }

}.initThisClass());
