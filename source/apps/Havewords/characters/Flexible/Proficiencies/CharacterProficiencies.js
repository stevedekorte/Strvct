"use strict";

/* 
    CharacterProficiencies

*/

(class CharacterProficiencies extends CharacterFlex {

  metaInfo () {
    return {
    }
  }

  /*
  initPrototypeSlots() {

  }
  */

  init() {
    super.init();
    this.setCanDelete(false);
    this.setShouldStoreSubnodes(true);
    //this.setupSubnodes()
  }

  finalInit () {
    super.finalInit()
    this.setNodeSubtitleIsChildrenSummary(true);
  }

  setupSubnodes () {
    const dict = this.metaInfo()
    
    Object.keys(dict).forEach(k => {
      const v = dict[k];
      const sn = BMJsonDictionaryNode.clone();
      sn.setSummaryFormat("key value")
      sn.setTitle(k); 
      sn.setNodeSubtitleIsChildrenSummary(true);
      sn.setJson(v);
      this.addSubnode(sn);
    })
  }

  subtitle () {
    return this.childrenSummary()
  }
 
}).initThisClass();
