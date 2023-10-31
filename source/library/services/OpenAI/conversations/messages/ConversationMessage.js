"use strict";

/* 
    ConversationMessage

*/

(class ConversationMessage extends BMTextAreaField {
  initPrototypeSlots() {

    this.slotNamed("value").setAnnotation("shouldJsonArchive", true)

    {
      const slot = this.newSlot("conversation", null);
      slot.setShouldStoreSlot(false)
    }

    {
      const slot = this.newSlot("messageId", null);
      slot.setShouldStoreSlot(true)
      slot.setAnnotation("shouldJsonArchive", true)
    }

    {
      const slot = this.newSlot("senderId", null);
      slot.setShouldStoreSlot(true)
      slot.setAnnotation("shouldJsonArchive", true)
    }

    {
      const slot = this.newSlot("inReplyToMessageId", null);
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("String");
      slot.setAnnotation("shouldJsonArchive", true)
    }

    {
      const slot = this.newSlot("timestamp", null);
      slot.setShouldStoreSlot(true);
      slot.setDuplicateOp("duplicate");
      slot.setSlotType("Number");
      //slot.setAnnotation("shouldJsonArchive", true)
    }

    {
      const slot = this.newSlot("annotations", null); // a place for any sort of extra JSON info
      slot.setShouldStoreSlot(true)
      slot.setAnnotation("shouldJsonArchive", true)
    }

    {
      const slot = this.newSlot("isComplete", false);
      slot.setShouldStoreSlot(true)
      slot.setAnnotation("shouldJsonArchive", true)
    }

    {
      const slot = this.newSlot("error", null);
      slot.setShouldStoreSlot(true)
    }

    {
      const slot = this.newSlot("isVisibleToUser", true);
      slot.setShouldStoreSlot(true)
    }

    {
      const slot = this.newSlot("delegate", null);
      slot.setShouldStoreSlot(false)
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
  }

  init () {
    super.init();
    this.setContent("")
    this.setCanDelete(true)
    this.setAnnotations({})
  }

  finalInit () {
    super.finalInit();
    this.setNodeTileClassName("BMChatInputTile")
    //this.setOverrideSubviewProto(this.nodeTileClass())
    this.setKeyIsVisible(true)
    this.setKey("Speaker")
    this.createIdIfAbsent()
  }

  createIdIfAbsent () {
    if (!this.messageId()) {
      this.setMessageId(Object.newUuid())
    }
  }

  setIsComplete (aBool) {
    if (this._isComplete !== aBool) {
      if (aBool) {
        this.onComplete()
      }
      this._isComplete = aBool;
    }
    return this
  }

  onComplete () {
    // to be overridden by subclasses
    this.sendDelegate("onCompletedMessage")
  }

  setSendInConversation (v) {
    debugger;
  }

  valueIsEditable () {
    return true
  }

  content () {
    return this.value()
  }

  setValue (s) {
    super.setValue(s)
    this.directDidUpdateNode() // so updates trigger UI refresh
    return this
  }

  setContent (s) {
    this.setValue(s)
    //this.directDidUpdateNode()
    return this
  }

  subtitle () {
    let s = this.content()
    const max = 40
    if (s.length > max) {
      s = this.content().slice(0, max) + "..."
    }
    return this.speakerName() + "\n" + s
  }

  speakerName () {
    return this.key()
  }

  setSpeakerName (s) {
    return this.setKey(s)
  }

  conversation () {
    return this.parentNode()
  }

  // --- conversation history ---

  previousMessages () {
    const messages = this.conversation().messages()
    const i = messages.indexOf(this)
    assert(i !== -1)
    return messages.slice(0, i)
  }

  previousMessagesIncludingSelf () {
    const messages = this.conversation().messages()
    const i = messages.indexOf(this)
    assert(i !== -1)
    return messages.slice(0, i+1)
  }

  previousMessage () {
    const messages = this.conversation().messages()
    const i = messages.indexOf(this)
    if (i > -1) {
      return messages[i-1]
    }
    return null
  }

  conversationHistoryPriorToSelfJson () {
    // return json for all messages in conversation up to this point (unless they are marked as hidden?)
    const json = this.previousMessages().map(m => m.openAiJson())
    return json
  }

  // --- sending ---

  send () {
  }

  valueError () {
    const e = this.error()
    return e ? e.message : null
  }

  onValueInput () {
    this.sendInConversation()
  }

  cssVariableDict () {
    return {
      //"background-color": "var(--body-background-color)",
      //"color": "var(--body-color)",
      //"--body-background-color": "inherit"
    }
  }

  centerDotsHtml () {
    return `<span class="dots"><span class="dot dot3">.</span><span class="dot dot2">.</span><span class="dot dot1">.</span><span class="dot dot2">.</span><span class="dot dot3">.</span>`;
  }

  delegate () {
    if (!this._delegate) {
      return this.conversation()
    }
    return this._delegate
  }

  sendDelegate (methodName, args = [this]) {
    const d = this.delegate()
    if (d) {
      const f = d[methodName]
      if (f) {
        f.apply(d, args)
        return true
      }
    }
    return false
  }

  // --- json ---

  jsonArchive () {
    const jsonArchiveSlots = this.slotsWithAnnotation("shouldJsonArchive", true) 
    const dict = {
      type: this.type()
    }

    jsonArchiveSlots.forEach(slot => {
      const k = slot.getterName()
      const v = slot.onInstanceGetValue(this)
      dict[k] = v;
    })

    return dict

    /*
    // TODO: automate with a slot attribute?
    assert(Type.isString(this.senderId()) || null)
    assert(Type.isString(this.messageId()))
    assert(Type.isString(this.speakerName()))
    assert(Type.isString(this.content()))
    assert(Type.isBoolean(this.isComplete()))
    //assert(Type.isDictionary(this.annotations()))
    
    return {
      type: this.type(),
      messageId: this.messageId(),
      senderId: this.senderId(),
      speakerName: this.speakerName(),
      content: this.content(),
      isComplete: this.isComplete(),
      annotations: this.annotations()
    }
    */
  }

  setJsonArchive (json) {
    const keys = Object.keys(json);
    const jsonArchiveSlots = this.slotsWithAnnotation("shouldJsonArchive", true);
    assert(keys.length === jsonArchiveSlots.length); // or should we assume a diff if missing?

    keys.forEach(key => {
      if (key !== "type") {
        const slot = this.slotNamed(key);
        assert(slot);
        const value = json[key];
        slot.onInstanceSetValue(this, value);
      }
    })

    /*
    assert(Type.isString(json.messageId));
    this.setMessageId(json.messageId);

    //assert(Type.isString(json.senderId));
    this.setSenderId(json.senderId);

    assert(Type.isString(json.speakerName));
    this.setSpeakerName(json.speakerName);

    assert(Type.isString(json.content));
    this.setContent(json.content);

    assert(Type.isBoolean(json.isComplete));
    this.setIsComplete(json.isComplete);

    //assert(Type.isDictionary(json.annotations));
    this.setIsComplete(json.annotations);
    */

    return this
  }

  static fromJsonArchive (json) {
    const className = json.type;
    assert(className); // sanity check
    
    const aClass = getGlobalThis()[className];
    assert(aClass.isKindOf(this)); // sanity check

    const instance = aClass.clone().setJsonArchive(json)
    return instance
  }

}.initThisClass());
