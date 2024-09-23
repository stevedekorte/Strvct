"use strict";

/**
 * @module Peer.RzSigServers
 */

/**
 * @class RzSigServerPeers
 * @extends BMSummaryNode
 * @classdesc Represents a collection of RzSigServer peers.
 */
(class RzSigServerPeers extends BMSummaryNode {
  
  /**
   * Initializes the prototype slots for the RzSigServerPeers class.
   * @method
   */
  initPrototypeSlots () {
    /**
     * @property {string} title - The title of the peers collection.
     */
    this.setTitle("peers");
    /**
     * @property {boolean} shouldStore - Indicates whether the peers should be stored.
     */
    this.setShouldStore(false);
    /**
     * @property {boolean} shouldStoreSubnodes - Indicates whether subnodes should be stored.
     */
    this.setShouldStoreSubnodes(false);
    //this.setSubnodeClasses([RzSigServer]);
    /**
     * @property {boolean} nodeCanAddSubnode - Indicates whether subnodes can be added.
     */
    this.setNodeCanAddSubnode(false);
    /**
     * @property {boolean} nodeCanReorderSubnodes - Indicates whether subnodes can be reordered.
     */
    this.setNodeCanReorderSubnodes(false);
    /**
     * @property {boolean} noteIsSubnodeCount - Indicates whether the note is the subnode count.
     */
    this.setNoteIsSubnodeCount(true);
  }

  /**
   * Sets the peer ID array and updates the subnodes accordingly.
   * @method
   * @param {Array} peerIds - An array of peer IDs.
   * @returns {RzSigServerPeers} The updated RzSigServerPeers instance.
   */
  setPeerIdArray (peerIds) {
    /*
    const idSet = peerIds.asSet()
    const subnodesToRemove = this.subnodes().shallowCopy().filter(sn => !idSet.has(sn.peerId()))
    this.removeSubnodes(subnodesToRemove)
    */

    // TODO: switch to merge
    this.removeAllSubnodes()
    peerIds.sort()
    peerIds.forEach(peerId => {
      const rzPeer = RzPeer.clone().setPeerId(peerId)
      this.addSubnode(rzPeer)
    })
    return this
  }

}.initThisClass());