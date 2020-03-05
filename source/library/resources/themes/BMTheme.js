"use strict"

/*

    BMTheme

*/

window.BMTheme = class BMTheme extends BMStorableNode {
    
    initPrototype () {

    }

    init () {
        super.init()
        this.setShouldStore(true)
        this.setShouldStoreSubnodes(true)
        this.setNodeCanEditTitle(true)
        this.setTitle("Untitled " + this.thisClass().visibleClassName())
        this.setNodeMinWidth(270)
        this.setCanDelete(true)
        this.addAction("add")
        this.setSubnodeClasses([BMThemeFolder, BMThemeAttribute])
        this.setNodeCanReorderSubnodes(true)

        //this.setupSubnodes()
    }

    /*
    didLoadFromStore () {
        super.didLoadFromStore()
        this.setupSubnodes()
    }

    setupSubnodes () {
        const viewClasses = DomView.descendantClasses()

        viewClasses = viewClasses.select((viewClass) => {
            return viewClass.hasOwnProperty("styles")
        }).select((viewClass) => { return !viewClass.styles().isEmpty() })

        //console.log("viewClasses:", viewClasses)
        const themeClasses = viewClasses.map((childProto) => {
            return BMThemeFolder.clone().setTitle(childProto.type());
        })

        this.copySubnodes(themeClasses);
        return this
    }
    */

   atPath (aPath) {
       
   }
}.initThisClass()
