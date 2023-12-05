"use strict";

/* 
    OpenAiResponseMessage

*/

(class OpenAiResponseMessage extends OpenAiMessage {
  initPrototypeSlots() {

    {
      const slot = this.newSlot("request", null);
      slot.setLabel("request")
      slot.setShouldStoreSlot(false)
      slot.setDuplicateOp("duplicate")
      slot.setSlotType("Pointer")
      slot.setCanInspect(false)
    }

    {
      const slot = this.newSlot("isResponse", false);
      slot.setSlotType("Boolean")
      slot.setShouldStoreSlot(true)
      slot.setCanInspect(true);
      slot.setInspectorPath("OpenAiMessage");
    }

    {
      const slot = this.newSlot("retryCount", 0);
      slot.setSlotType("Number");
      //slot.setShouldStoreSlot(true)
    }

    {
      const slot = this.newSlot("summaryMessage", null);
      slot.setSlotType("String");
      slot.setInspectorPath("OpenAiMessage");
      //slot.setShouldStoreSlot(true)
    }

    {
      // See: https://aipromptskit.com/openai-temperature-parameter/
      const slot = this.newSlot("temperature", 0.7); // 0-1, higher = more creative
      slot.setSlotType("Number");
      //slot.setShouldStoreSlot(true)
    }

    {
      // See: https://aipromptskit.com/openai-temperature-parameter/
      const slot = this.newSlot("topP", 0.8); // 0-1, higher = more diverse
      slot.setSlotType("Number");
      //slot.setShouldStoreSlot(true)
    }

    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
  }

  init () {
    super.init();
    this.setContent("")
    this.setCanDelete(true);
    this.setIsVisibleToAi(true);
    this.setRole("assistant");
  }

  isResponse () {
    return true;
  }

  /*
  finalInit () {
    super.finalInit();
  }
  */

  valueIsEditable () {
    return false;
  }

  aiSpeakerName () {
    return "OpenAI"
  }

  send () {
    throw new Error("shouldn't call send on a response");
    // NOTE: things like system messages for prompt are not response messages, so we can send them
  }

  requestResponse () {
    throw new Error("shouldn't call requestResponse on a response");
  }

  // --- send request -------------

  selectedModel () {
    return this.conversation().selectedModel()
  }

  service () {
    return this.conversation().service()
  }

  apiKey () {
    return this.service().apiKey()
  }

  // --- make a request --- 

  /*
  assertValidRequest () {
    assert(this.validRoles().includes(this.role()))
  }
  */

  makeRequest () {
    this.setError(null)
    const request = this.newRequest()
    this.setRequest(request)
    //request.asyncSend();
    request.setStreamTarget(this)
    request.asyncSendAndStreamResponse()
    return this
  }

  newRequest () {
    const messages = this.visiblePreviousMessages(); 
    const jsonHistory = messages.map(m => m.openAiJson());

    const request = OpenAiRequest.clone();
    request.setApiUrl("https://api.openai.com/v1/chat/completions");
    request.setApiKey(this.apiKey());
    request.setDelegate(this)
    request.setBodyJson({
      model: this.selectedModel(),
      messages: jsonHistory,
      temperature: this.temperature(), 
      top_p: this.topP() // more diverse
    });
    return request;
  }

  visiblePreviousMessages () {
    // give conversation a chance to control this
    // which may be useful for summaries
    const messages = this.conversation().aiVisibleHistoryForResponse(this); 
    return messages;
  }

  // --- handle request delegate messages ---

  onRequestBegin (aRequest) {
    const s = this.centerDotsHtml();
    this.setNote(s)
  }

  onRequestError (aRequest) {
    this.setError(aRequest.error())
    const msg = aRequest.error().message
    if (msg.includes("Please try again in 6ms.")) {
      this.setRetryCount(this.retryCount() + 1)
      const seconds = Math.pow(2, this.retryCount());
      console.warn("WARNING: retrying openai request in " + seconds + " seconds");
      this.addTimeout(() => this.makeRequest(), seconds*1000);
    }
  }

  valueError () {
    const e = this.error()
    return e ? e.message : null
  }

  onComplete () {
    super.onComplete() // sends a delegate message
    // to be overridden by subclasses
  }

  onRequestComplete (aRequest) {
    //this.setRequest(null)
    //this.setStatus("complete")
    this.cleanResult()
    this.setNote(null)
    this.setIsComplete(true)
    this.sendDelegate("onMessageComplete")
  }

  cleanResult () {
    const s = this.content().replace(/>\n+</g, '><'); // remove new lines between ">" and "<" e.g. ">\n<" -> "><"
    this.setContent(s);
    return this;
  }
  
  onStreamData (request, newContent) {
    this.sendDelegate("onMessageWillUpdate")

    this.setContent(request.fullContent())
    this.sendDelegate("onMessageUpdate")
  }
  
  onStreamComplete (request) {
    this.setContent(request.fullContent())
    this.setIsComplete(true)
    this.sendDelegate("onMessageUpdate")
  }

  onValueInput () {
    this.requestResponse()
  }

}.initThisClass());
