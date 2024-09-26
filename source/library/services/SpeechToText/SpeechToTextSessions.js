"use strict";

/**
 * @module library.services.SpeechToText
 */

/**
 * @class SpeechToTextSessions
 * @extends BMSummaryNode
 * @classdesc Manages sessions for speech-to-text conversion.
 */
(class SpeechToTextSessions extends BMSummaryNode {
  
  /**
   * @description Initializes the prototype slots for the SpeechToTextSessions class.
   * @private
   */
  initPrototypeSlots () {
    /**
     * @member {Array} subnodeClasses - The classes of subnodes.
     */
    this.setSubnodeClasses([SpeechToTextSession]);

    /**
     * @member {boolean} shouldStore - Whether the instance should be stored.
     */
    this.setShouldStore(true);

    /**
     * @member {boolean} shouldStoreSubnodes - Whether subnodes should be stored.
     */
    this.setShouldStoreSubnodes(true);

    /**
     * @member {boolean} nodeCanAddSubnode - Whether the node can add subnodes.
     */
    this.setNodeCanAddSubnode(true);

    /**
     * @member {boolean} nodeCanReorderSubnodes - Whether subnodes can be reordered.
     */
    this.setNodeCanReorderSubnodes(true);

    /**
     * @member {boolean} noteIsSubnodeCount - Whether the note represents the subnode count.
     */
    this.setNoteIsSubnodeCount(false);

    /**
     * @member {string} title - The title of the sessions.
     */
    this.setTitle("Web Speech to Text");

    /**
     * @member {string} subtitle - The subtitle of the sessions.
     */
    this.setSubtitle("speech-to-text service");
  }

}.initThisClass());