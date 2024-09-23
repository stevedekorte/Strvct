"use strict";

/**
 * @module HomeAssistant.HomeAssistantFolder
 */

/**
 * @class HomeAssistantFolder
 * @extends BMSummaryNode
 * @classdesc Represents a folder in the Home Assistant structure.
 */
(class HomeAssistantFolder extends BMSummaryNode {
  /**
   * @description Initializes the prototype slots for the HomeAssistantFolder.
   */
  initPrototypeSlots () {
    this.setTitle("folder");
    this.setShouldStore(true);
    this.setShouldStoreSubnodes(true);
    this.setNodeCanReorderSubnodes(true);
    this.setSubnodeClasses([HomeAssistantFolder]);
    this.setNoteIsSubnodeCount(true);
    this.setNodeCanEditTitle(true);
    this.setNodeCanEditSubtitle(true);
    this.setNodeCanAddSubnode(true);
  }

  /**
   * @description Performs final initialization tasks for the HomeAssistantFolder.
   */
  finalInit () {
    super.finalInit();
    this.makeSortSubnodesByTitle();
  }

  /*
  setupSubnodeClasses () {
    const classes = []; 
    //HomeAssistantObject.subclasses().shallowCopy();
    classes.push(HomeAssistantFolder);
    this.setSubnodeClasses(classes);
  }
  */

}.initThisClass());