# Form-update
Interactive update of inputfields for ProcessWire

I had a need to interactively update the page choices in a multi-choice page select field. I chose to do this with a general-purpose piece of jQuery. By combining it with a InputfieldPage::getSelectablePages hook, you can get the trigger field to alter the selectable pages interactively.  I have also found this to be useful in a number of other situations - e.g. updating a RuntimeMarkup field for changes on a page. There may be more elegant ways of achieving this (I'm open to suggestions). Hopefully the comments in the script are self-explanatory and describe how to use it.

See the forum page at https://processwire.com/talk/topic/23226-interactive-updating-of-select-inputfields/ for support.
