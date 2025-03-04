<draft>DRAFT</draft>

<top>

# <a href="../index.html">STRVCT</a> / Project Overview

<!--
# <div style="font-size: 0.5em; text-transform: none;"> / Project Overview </div>
-->

[TOC]

</top>

## Abstract

Naked objects [1] aimed to simplify and accelerate software development by exposing domain (business) objects directly to users and automatically generating user interfaces and handling storage. Despite these advantages, usability limitations have restricted its adoption to internal tools and prototypes.

While functionally complete, these systems often lack the interface patterns expected in end-user applications. This paper describes a new approach to help address these limitations and introduces an open-source JavaScript client-side framework called [Strvct](https://github.com/stevedekorte/strvct.net) that implements it.

<!--
## Introduction

### A Few Notes on Implementation

Strvct is different enough from other UI frameworks that it may be worth starting with a description of how it differs in order to over confusion when the reader makes a mental model of how the system works.
-->

<!--
<div class="no-markdown">

<div class="epigraph">
<i>"Everything has its pattern," Freddy put in.<br>
"If you find it, the great can be contained within the small."</i><br>
- Clive Barker, <i>Weaveworld</i>

</div>
</div>

In a naked objects system, as user interface components are no longer bespoke to the application, the major challenge is to find a small set of components which can efficiently express a large range of useful interface patterns.
-->

## Domain Model

In our system, the domain model is a cyclic graph of domain objects.
Each domain object has:

- **Properties** (instance variables) and **actions** (methods)
- a `subnodes` property containing an ordered unique collection of child domain objects
- a `parentNode` property pointing to its parent domain object
- property `annotations` [2] which allow for the automatic handling of UI and storage mechanisms
- `title` and `subtitle` properties
- a unique ID

The domain model can be seen as an ownership tree of domain objects, which may also contain non-ownership links between nodes.

### Collection Managers

Complex collections of domain objects use Collection Manager domain objects to encapsulate collection-specific logic and data. This pattern is essential for properly expressing domain models within Strvct.

For example, a Server class might have a guestConnections property referencing a GuestConnections instance (a DomainObject descendant) whose subnodes are GuestConnection instances.

### Indirect UI Coupling

The domain model operates independently of UI, allowing for "headless" execution. It can, however, use annotations to provide optional UI hints without direct coupling. This is possible because model objects hold no references to UI objects and can only communicate with them via notifications.

## User Interface

<i>Note: the following diagrams are designed to illustrate view layouts and not their actual appearance.</i>

### Tiles

The core navigational elements, referred to as **Tiles** are used to present a single domain object or a single domain property. Tile subclasses can be used to customize the appearance of and interaction with these. Domain objects annotations can be used to request specific tiles to be used to represent them or their properties.

#### Domain Object Tiles

**Summary Tiles** are the default tiles used to represent domain objects and to navigate the domain model. They typically display a title, subtitle, and optional left and right sidebars. More specialized tiles can be also used to represent domain objects.

<diagram>
Summary Tile
<object type="image/svg+xml" data="diagrams/svg/summary-tile.svg">[SVG diagram]</object>
</diagram>

<!--
For example, for a domain model representing a Markdown document, and composed of domain objects such as **Heading**, **Paragraph** objects, with corresponding **HeadingTile** and **ParagraphTile** objects to represent each element in the document.
-->

#### Property Tiles

**Property Tiles** present a property of a domain object and typically display a name and value, and optionally a note, and/or error (i.e. validation error).

<diagram>
Property Tile
<object type="image/svg+xml" data="diagrams/svg/property-tile.svg" style="width: 100%; height: auto;">[SVG diagram]</object>
</diagram>

Strvct includes a number of specialized property tiles for common property types, such as Strings, Numbers, Dates, Times, and Images.

#### Dynamic Inspectors

Properties with complex structures, such as Dates, Times, valid value pickers, may dynamically create a transient domain model objects when accessed which can be navigated and interacted with as if they were part of the model.

<!--
### Summary Customization

A notable feature of the Tiles is their ability to generate summaries that reflect deeper levels of the hierarchy. This is controlled by annotations on the Tiles' slots, which dictate whether or not sub-item summaries should be included. This provides a powerful way to condense information, giving users a quick overview of nested structures without requiring deep navigation.
-->

### Tile Stacks

A **Tile Stack** is a scrollable stacks of **Tiles** which are used to present the subnodes of a domain object. They support flexible orientation, and gestures for adding, removing, and reordering tiles. Optional support for grid or outline layouts could be added, but are not currently supported.

<diagram style="display: flex; flex-direction: column; align-items: center;">
<div style="display: flex;">Tile Stack</div>
<object type="image/svg+xml" data="diagrams/svg/tiles.svg" style="display: flex; height: auto; max-height: 100%; width: auto;">[SVG diagram]</object>
</diagram>

### Master-Detail Views

A **Master-Detail View** is used to present a domain object. Its master section contains a **Tile Stack** presenting the subnodes of the domain object and its detail section presents the domain object for the selected subnode tile, which itself may be a master-detail view. The master section supports optional header and footer views which can be used to flexibly implement features like search, message input, or group actions. The divider between the master and detail sections can also be dragged to resize the sections if the domain object allows it.

<diagram style="display: flex; flex-direction: column; align-items: center;">
<div>Master-Detail View</div>
<object type="image/svg+xml" data="diagrams/svg/master-detail.svg" style="display: flex; height: auto; max-height: 100%; width: auto;">[SVG diagram]</object>
</diagram>

#### Flexible Orientation

Detail Views can be oriented to be be right-of, or below the Master View (which contains theTiles Stack). Both can be requested by the related domain object or overridden by the user interface, offering adaptability based on the content, display size, and user preference.

<diagram style="display: flex; flex-direction: column; align-items: center;">
Master-Detail Orientations
<object type="image/svg+xml" data="diagrams/svg/orientations.svg" style="display: block; height: auto; max-height: 100%; width: auto;">[SVG diagram]</object>
</diagram>

#### Nesting

Nesting of master-detail views with flexible orientations allows for navigation structures which fit many common application design patterns.

<diagram>
  <div style="display: inline-block; height: fit-content; width: 30%;">
Vertical
  <object type="image/svg+xml" data="diagrams/svg/vertical-hierarchical-miller-columns.svg">[SVG diagram]</object>
  </div>
  <div style="display: inline-block; height: fit-content; width: 30%;">
  Horizontal<br>
  <object type="image/svg+xml" data="diagrams/svg/horizontal-hierarchical-miller-columns.svg">[SVG diagram]</object>
  </div>
  <div style="display: inline-block; height: fit-content; width: 30%;">
  Hybrid<br>
  <object type="image/svg+xml" data="diagrams/svg/hybrid-hierarchical-miller-columns.svg">[SVG diagram]</object>
  </div>
</diagram>

</div>

#### Auto Collapsing and Expanding

Chains of Master-Detail views automatically collapse/expand their tile views until there is space for the remaining master-details views. This allows for responsive and efficient use of display space across a wide range of viewport sizes.

<div style="width: 100%; max-width: 100vw; overflow: hidden;">
  <div style="padding: 0.2em; margin: 0; text-align: center; max-height: 1.7em;">
    Expanded
  </div>
  <div style="width: 100%; padding-bottom: 37.14%; position: relative;">
    <object type="image/svg+xml" data="diagrams/svg/expanded.svg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">[SVG diagram]</object>
  </div>
</div>
<br>

<div style="width: 100%; max-width: 100vw; overflow: hidden;">
  <div style="padding: 0.2em; margin: 0; text-align: center; max-height: 1.7em;">
    Collapsed
  </div>
  <div style="width: 100%; padding-bottom: 37.14%; position: relative;">
  <object type="image/svg+xml" data="diagrams/svg/collapsed.svg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">[SVG diagram]</object>
  </div>
</div>
<br>

#### Navigation Path

Tiles on the selected are highlighted, and the focused tile (which represents the most recently selected location) is distinguished with a unique highlight.

These highlights and other visual attributes are customizable via themes.

<div style="width: 100%; max-width: 100vw; overflow: hidden;">
  <div style="padding: 0.2em; margin: 0; text-align: center; max-height: 1.7em;">
    Navigation Path
  </div>
  <div style="width: 100%; padding-bottom: 37.14%; position: relative;">
  <object type="image/svg+xml" data="diagrams/svg/path.svg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">[SVG diagram]</object>
  </div>
</div>
<br>

#### Breadcrumbs

A BreadcrumbTile can be used to represent the current navigation path. It automatically compacts and expands to reveal more of the path based on the current viewport size, replacing the compacted path with a back arrow.

<div style="width: 100%; max-width: 100vw; overflow: hidden;">
  <div style="padding: 0.2em; margin: 0; text-align: center; max-height: 1.7em;">
    Breadcrumbs
  </div>
  <div style="width: 100%; padding-bottom: 37.14%; position: relative;">
  <object type="image/svg+xml" data="diagrams/svg/breadcrumbs.svg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">[SVG diagram]</object>
  </div>
</div>
<br>

#### Menus

Tile navigation is very similar to menu navigation, and multiple levels of traditional menus can be constructed using various orientations of master-detail views.

<div style="width: 100%; max-width: 100vw; overflow: hidden;">
  <div style="padding: 0.2em; margin: 0; text-align: center; max-height: 1.7em;">
    Horizontal Menus
  </div>
  <div style="width: 100%; padding-bottom: 37.14%; position: relative;">
  <object type="image/svg+xml" data="diagrams/svg/horizontal-menus.svg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">[SVG diagram]</object>
  </div>
</div>
<br>

### Screenshots

Strvct framework as used in an AI based interactive fiction game.

<a href="docs/resources/images/screenshot-1.png" target="_blank"><img src="docs/resources/images/screenshot-1.png" alt="Screenshot 1" style="width: 100%; height: auto;"></a>

### Themes

Themes can be used to customize the appearance of the UI. Domain objects can also request object specific styles to be applied to them.

### Importing and Exporting

Drag and drop of domain objects into the UI and out of it for export is also supported.
Domain objects can register for which MIME type they can exported to and imported from. For example, if a domain object supports it, it can be dragged out of one browser window onto a user's desktop, or even dropped into another Strvct app that accepts that MIME type. Domain objects have a standard property which lists its valid subnode types, and this can be used to validate drops and auto generate subnodes for imported data.

### JSON Schema

Domain objects can automatically generate JSON Schema for themselves based on their properties and annotations. These schemas are be used to export metadata about the domain model, which is particularly usefull when interacting with Large Language Models.

### UI Synchronization

Model-view synchronization is managed by views, which either pull or push changes to the domain objects they are presenting. Views push changes when a view property changes, and pull changes from domain objects when those objects post change notifications. Only properties in views and domain objects which have the "sync" annotation will trigger sync operations. Both domain object change notifications and view push messages are coalesced and sent at the end of the event loop. <!-- These have different ordering priorities to ensure safe execution. -->

#### Sync Loop Avoidance

Bidirectional sync stops automatically as property changes trigger sync operations only when values actually differ, preventing infinite loops. If secondary changes do occur, the notification system detects the loop, halts it, and identifies the source.

#### Reference Loop Avoidance

Observations use weak references, allowing garbage collection of both posters and listeners. The Notification system automatically removes observations when the listener is collected.

## Storage

### Annotations

Domain objects have a property which determines whether the object persisted, as well as property annotations which determine which properties are persisted. Using this information, the system automatically manages persistence.

### Transactions

Mutations on persistent properties auto-queue domain objects for storage. Queued objects are bundled into a transaction committed at the end of the current event loop.

### Garbage Collection

Automatic garbage collection of the stored object graph occurs on startup, or when requested. Only objects reachable from the root domain object remain after garbage collection.

### Native Collections

Native JavaScript collections (Array, ArrayBuffer, Map, Object, Set, and TypedArray) referenced by persistent properties of domain objects are also automatically persisted in their own records.

### Local Storage

Persistent domain objects are stored client side in IndexedDB in a single Object Store of records whose keys are the domain object unique ID and values are the domain objects JSON records. Currently, the only index is on the unique ID.

[1]: http://downloads.nakedobjects.net/resources/Pawson%20thesis.pdf "Pawson, R., & Matthews, R. (2000). Naked Objects (Technical Report)"
[2]: https://bluishcoder.co.nz/self/transporter.pdf "David Ungar. (OOPSLA 1995). Annotating Objects for Transport to Other Worlds. In Proceedings of the Tenth Annual Conference on Object-Oriented Programming Systems, Languages, and Applications (OOPSLA '95). Austin, TX, USA. ACM Press."
