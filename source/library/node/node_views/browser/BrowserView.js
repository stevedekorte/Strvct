"use strict";

/*
    
    BrowserView

    A StackView with the top node used as a horizontal breadcrumb path node.

    To do this, we create a top wrapper node, which has one subnode which is the actual root node.
    Somehow we will set the root node tile view to display the path selected in the UI...
    

    browserNode:
        subnodes:
            headerNode -> HeaderTile 
            subnodes:
                appRootNode -> BreadCrumbTile 


*/

(class BrowserView extends StackView {
    
    initPrototypeSlots () {
        this.newSlot("headerNode", null)
        this.newSlot("baseNode", null)
    }

    init () {
        super.init()
        this.setupBrowserNode()
        this.setupHeaderNode()
        return this
    }

    setupBrowserNode () {
        const node = BaseNode.clone()
        node.setNodeMinTileHeight(55)
        node.setTitle("browser")
        node.setNodeIsVertical(false) // not setting BrowserView to down direction - why?
        this.setNode(node)
        return this
    }

    setupHeaderNode () {
        const node = BaseNode.clone()
        node.setNodeTileClassName("HeaderTile")
        node.setNodeMinTileHeight(55)
        node.setTitle("header")
        node.setNodeIsVertical(false) 
        this.setHeaderNode(node)
        this.node().addSubnode(node)
        return this
    }

    didUpdateSlotBaseNode (oldValue, newValue) {
        // baseNode is the ObjectPool rootNode
        // tell the node to hint to UI to use BreadCrumbTile view to display itself
        newValue.setNodeTileClassName("BreadCrumbTile")
        newValue.setTitle("BreadCrumbTile")

        // make sure it's the only thing under the header
        this.headerNode().removeAllSubnodes()
        this.headerNode().addSubnode(newValue)

        // this should set up header view (and bread crumb view?)
        this.syncFromNode()
        

        // select the bread crumb tile
        // this should cause it's child stack view to get rendered (Notes, Settings, Resources)
        this.scheduleMethod("moveToBase")
        return this
    }

    moveToBase () {
        //this.selectNodePathArray([this.node(), this.headerNode(), this.baseNode()])
        this.selectNodePathArray([this.headerNode(), this.baseNode()])
        return this
    }

}.initThisClass());
