"use strict";

/*

    NumberFormatter
    
	NumberFormatter takes a number and returns a string with a more human readable format.

	Example use:

	const stringVersion = NumberFormatter.clone().setValue(1234).setSignificantDigits(2).formattedValue();

    stringVersion will be "1.2K"

*/

(class NumberFormatter extends ProtoClass {
    initPrototypeSlots () {

        {
            const slot = this.newSlot("value", 0)
            slot.setShouldStoreSlot(false)
            slot.setSlotType("Number")
            slot.setCanInspect(false)
        }

        {
            const slot = this.newSlot("significantDigits", 2)
            slot.setShouldStoreSlot(true)
            slot.setSlotType("Number")
            slot.setCanInspect(true)
        }
    }
  
    initPrototype () {
    }

    formattedValue () {
        const number = this.value();
        const significantDigits = this.significantDigits();

        const suffixes = ["", "K", "M", "B", "T"];
        const magnitude = Math.floor(Math.log10(Math.abs(number)) / 3);
        const scaled = number / Math.pow(10, magnitude * 3);
      
        if (magnitude === 0) {
          return number.toString();
        } else {
          const roundedScaled = Number(scaled.toPrecision(significantDigits));
          return roundedScaled + suffixes[magnitude];
        }
    }

}.initThisClass());
