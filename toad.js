/* toad.js */
;(function(win,doc){
  
  // first, extreme browser support
  if(!doc.querySelectorAll){
    Document.prototype.getElementsByAttribute 
    = Element.prototype.getElementsByAttribute 
    = function(attr){
      var nodeList = this.getElementsByTagName('*'),
          i = nodeList.length, j = 0, nodeArray = [];
      nodeArray.length = i;
      for(; i > j; j++) 
        if(nodeList[j].getAttribute(attr)) nodeArray[j] = nodeList[j];
      return nodeArray;
    };
  }
  
  // requestAnimationFrame shim
  if(!win.requestAnimationFrame){
    win.requestAnimationFrame = (function(){
      return win.webkitRequestAnimationFrame
          || win.mozRequestAnimationFrame
          || win.oRequestAnimationFrame
          || win.msRequestAnimationFrame
          || function(callback){return win.setTimeout(callback,1000/60)};
    })();
  }
  
  // cancelAnimationFrame shim
  if (!win.cancelAnimationFrame){
    win.cancelAnimationFrame = (function(){
      return win.cancelRequestAnimationFrame
          || win.mozCancelAnimationFrame
          || win.oCancelAnimationFrame
          || win.msCancelAnimationFrame
          || function(id){return win.cancelTimeout(id)};
    })();
  } 
  
  /**
    PRIVATE METHODS i.e. HELPER FUNCTIONS
  **/
  // Detect if the element an image for toad to load
  var isImg = function(el){
    if(!!el && 'img' === el.tagName.toLowerCase() && !el.src) return true;
    return false;
  };
  
  // Detect whether something is in an array of somethings
  // This is used to detect the presence of background-image in an element's attribute styles
  var isInArray = function (arr,i,item){
    while(i--)
      if(item === arr[i]) return true;
    return false;
  };
  
  // Detect if an element is in the viewport
  // This is really quite obvious really
  var isInViewport = function(el){
    if (!el || 1 !== el.nodeType) return false;
    var r = el.getBoundingClientRect();
    return r.top  >= 0 
        && r.left >= 0 
        && r.top  <= (win.innerHeight || doc.documentElement.clientHeight);
  };
  
  var addEventHandler = function(ev,h){
    win.addEventListener ?
      win.addEventListener(ev,h,!1) : 
        win.attachEvent ? 
          win.attachEvent('on'+ev,h) : 
            win['on'+ev] = h
  };
  
  var removeEventHandler = function(ev,h){
    win.removeEventListener ?
      win.removeEventListener(ev,h,!1) : 
        win.detachEvent ? 
          win.detachEvent('on'+ev,h) : 
            win['on'+ev] = null;
  };
  
  // Use requestAnimationFrame to throttle the execution of a function
  // This is our drop-in alternative to _.debounce or _.throttle to leverage
  // the new requestAnimationFrame API
  var rebounce = function(f){
    var scheduled, context, args, len, i;
    return function(){
      context = this;
      args = [];
      len = args.length = arguments.length;
      i = 0;
      for(; i < len; ++i) args[i] = arguments[i];
      win.cancelAnimationFrame(scheduled);
      scheduled = win.requestAnimationFrame(function(){
        f.apply(context, args);
        scheduled = null;
      });
    }
  };
  
  /**
    PUBLIC METHODS
  **/
  win.toad = {
    // Load images & background images
    load : function(){
      // get everything with data-src attribute, prepare to iterate
      // getElementsByAttribute in case querySelectorAll is not supported
      var elements  = doc.querySelectorAll( '[data-src]' ) || doc.getElementsByAttribute( 'data-src' ),
          i         = elements.length,
          j         = 0;
          
      if(!i){
        removeEventHandler('load',win.toad.load);
      }
          
      for(; i > j; j++){
        // iterate over retrieved elements
        var styles = elements[j].getAttribute('style') ? elements[j].getAttribute('style').split(':') : false,
            k = styles ? styles.length : 0,
            shouldBeLoaded = elements[j].getAttribute('data-src') && !!isInViewport(elements[j]),
            type = !!shouldBeLoaded && 
                     (!!isImg(elements[j]) ? 'image' :
                       (!styles || !isInArray(styles,k,'background-image')) ? 'bg' : 'none');
        switch(type){
          case 'image':
            elements[j].src = elements[j].getAttribute('data-src');
            break;
          case 'bg':
            elements[j].style.backgroundImage = 'url('+elements[j].getAttribute('data-src')+')';
            break;
          default:
            elements[j].removeAttribute('data-src');
        }
      }
    },
    
    rebouncedLoad : function(){
      return rebounce(win.toad.load);
    },
    
    // Start listening for events to trigger loads
    startListening : function(){
      // Setup event listeners, load anything in the viewport
        addEventHandler('load',win.toad.load);
        addEventHandler('scroll',win.toad.rebouncedLoad);
        addEventHandler('resize',win.toad.rebouncedLoad);
    },
    
    // Stop listening for events to trigger loads
    // This is automatically triggered when all of the elements with a data-src attribute
    // are loaded. If you intend to add content to the page, using this would be ill-advised.
    stopListening : function(){
      // Remove events
      removeEventHandler('scroll',win.toad.rebouncedLoad);
      removeEventHandler('resize',win.toad.rebouncedLoad);
    }
  };
})(window,window.document);
