/**
 * @module library.node.nodes.BMImagesNode
 * @class BMImageResourcesNode
 * @extends BMStorableNode
 * @classdesc Represents a node for managing image resources.
 */
(class BMImageResourcesNode extends BMStorableNode {
    
    /**
     * @description Initializes the prototype slots for the node.
     * @method
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype of the node.
     * @method
     */
    initPrototype () {
        this.setNodeViewClassName("ImageView")
        this.setSubnodeProto("ImageNode")
        
        this.setNodeCanEditTitle(true)
        this.setNodeCanEditSubtitle(false)
        this.setTitle(null)
        this.setSubtitle(null)
        
        //this.setNodeCanAddSubnode(true);
        //this.setCanDelete(true)
    }
    
}.initThisClass());