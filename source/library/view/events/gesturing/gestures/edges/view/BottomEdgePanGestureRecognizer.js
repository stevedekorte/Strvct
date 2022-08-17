"use strict";

/*

    BottomEdgePanGestureRecognizer

    Delegate messages:

        onBottomEdgePanBegin
        onBottomEdgePanMove
        onBottomEdgePanComplete
        onBottomEdgePanCancelled

*/

(class BottomEdgePanGestureRecognizer extends EdgePanGestureRecognizer {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()
        this.setEdgeName("bottom")
        //this.setIsDebugging(true)
        return this
    }
    
    
}.initThisClass());
