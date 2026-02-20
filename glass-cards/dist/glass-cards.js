function t(t,e,i,s){var n,o=arguments.length,a=o<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(t,e,i,s);else for(var r=t.length-1;r>=0;r--)(n=t[r])&&(a=(o<3?n(a):o>3?n(e,i,a):n(e,i))||a);return o>3&&a&&Object.defineProperty(e,i,a),a}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),n=new WeakMap;let o=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=n.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&n.set(e,t))}return t}toString(){return this.cssText}};const a=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new o(i,t,s)},r=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new o("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:c,defineProperty:l,getOwnPropertyDescriptor:h,getOwnPropertyNames:d,getOwnPropertySymbols:p,getPrototypeOf:g}=Object,u=globalThis,f=u.trustedTypes,m=f?f.emptyScript:"",v=u.reactiveElementPolyfillSupport,b=(t,e)=>t,_={toAttribute(t,e){switch(e){case Boolean:t=t?m:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},y=(t,e)=>!c(t,e),x={attribute:!0,type:String,converter:_,reflect:!1,useDefault:!1,hasChanged:y};Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;let $=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=x){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&l(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:n}=h(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const o=s?.call(this);n?.call(this,e),this.requestUpdate(t,o,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??x}static _$Ei(){if(this.hasOwnProperty(b("elementProperties")))return;const t=g(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(b("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(b("properties"))){const t=this.properties,e=[...d(t),...p(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(r(t))}else void 0!==t&&e.push(r(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(i)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of s){const s=document.createElement("style"),n=e.litNonce;void 0!==n&&s.setAttribute("nonce",n),s.textContent=i.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const n=(void 0!==i.converter?.toAttribute?i.converter:_).toAttribute(e,i.type);this._$Em=t,null==n?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),n="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:_;this._$Em=s;const o=n.fromAttribute(e,t.type);this[s]=o??this._$Ej?.get(s)??o,this._$Em=null}}requestUpdate(t,e,i,s=!1,n){if(void 0!==t){const o=this.constructor;if(!1===s&&(n=this[t]),i??=o.getPropertyOptions(t),!((i.hasChanged??y)(n,e)||i.useDefault&&i.reflect&&n===this._$Ej?.get(t)&&!this.hasAttribute(o._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:n},o){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,o??e??this[t]),!0!==n||void 0!==o)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[b("elementProperties")]=new Map,$[b("finalized")]=new Map,v?.({ReactiveElement:$}),(u.reactiveElementVersions??=[]).push("2.1.2");const w=globalThis,k=t=>t,C=w.trustedTypes,A=C?C.createPolicy("lit-html",{createHTML:t=>t}):void 0,E="$lit$",S=`lit$${Math.random().toFixed(9).slice(2)}$`,P="?"+S,z=`<${P}>`,O=document,T=()=>O.createComment(""),H=t=>null===t||"object"!=typeof t&&"function"!=typeof t,U=Array.isArray,M="[ \t\n\f\r]",R=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,N=/-->/g,j=/>/g,B=RegExp(`>|${M}(?:([^\\s"'>=/]+)(${M}*=${M}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),L=/'/g,D=/"/g,I=/^(?:script|style|textarea|title)$/i,G=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),F=Symbol.for("lit-noChange"),V=Symbol.for("lit-nothing"),q=new WeakMap,W=O.createTreeWalker(O,129);function Y(t,e){if(!U(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==A?A.createHTML(e):e}const X=(t,e)=>{const i=t.length-1,s=[];let n,o=2===e?"<svg>":3===e?"<math>":"",a=R;for(let e=0;e<i;e++){const i=t[e];let r,c,l=-1,h=0;for(;h<i.length&&(a.lastIndex=h,c=a.exec(i),null!==c);)h=a.lastIndex,a===R?"!--"===c[1]?a=N:void 0!==c[1]?a=j:void 0!==c[2]?(I.test(c[2])&&(n=RegExp("</"+c[2],"g")),a=B):void 0!==c[3]&&(a=B):a===B?">"===c[0]?(a=n??R,l=-1):void 0===c[1]?l=-2:(l=a.lastIndex-c[2].length,r=c[1],a=void 0===c[3]?B:'"'===c[3]?D:L):a===D||a===L?a=B:a===N||a===j?a=R:(a=B,n=void 0);const d=a===B&&t[e+1].startsWith("/>")?" ":"";o+=a===R?i+z:l>=0?(s.push(r),i.slice(0,l)+E+i.slice(l)+S+d):i+S+(-2===l?e:d)}return[Y(t,o+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class K{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let n=0,o=0;const a=t.length-1,r=this.parts,[c,l]=X(t,e);if(this.el=K.createElement(c,i),W.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=W.nextNode())&&r.length<a;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(E)){const e=l[o++],i=s.getAttribute(t).split(S),a=/([.?@])?(.*)/.exec(e);r.push({type:1,index:n,name:a[2],strings:i,ctor:"."===a[1]?et:"?"===a[1]?it:"@"===a[1]?st:tt}),s.removeAttribute(t)}else t.startsWith(S)&&(r.push({type:6,index:n}),s.removeAttribute(t));if(I.test(s.tagName)){const t=s.textContent.split(S),e=t.length-1;if(e>0){s.textContent=C?C.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],T()),W.nextNode(),r.push({type:2,index:++n});s.append(t[e],T())}}}else if(8===s.nodeType)if(s.data===P)r.push({type:2,index:n});else{let t=-1;for(;-1!==(t=s.data.indexOf(S,t+1));)r.push({type:7,index:n}),t+=S.length-1}n++}}static createElement(t,e){const i=O.createElement("template");return i.innerHTML=t,i}}function J(t,e,i=t,s){if(e===F)return e;let n=void 0!==s?i._$Co?.[s]:i._$Cl;const o=H(e)?void 0:e._$litDirective$;return n?.constructor!==o&&(n?._$AO?.(!1),void 0===o?n=void 0:(n=new o(t),n._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=n:i._$Cl=n),void 0!==n&&(e=J(t,n._$AS(t,e.values),n,s)),e}class Z{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??O).importNode(e,!0);W.currentNode=s;let n=W.nextNode(),o=0,a=0,r=i[0];for(;void 0!==r;){if(o===r.index){let e;2===r.type?e=new Q(n,n.nextSibling,this,t):1===r.type?e=new r.ctor(n,r.name,r.strings,this,t):6===r.type&&(e=new nt(n,this,t)),this._$AV.push(e),r=i[++a]}o!==r?.index&&(n=W.nextNode(),o++)}return W.currentNode=O,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class Q{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=V,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=J(this,t,e),H(t)?t===V||null==t||""===t?(this._$AH!==V&&this._$AR(),this._$AH=V):t!==this._$AH&&t!==F&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>U(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==V&&H(this._$AH)?this._$AA.nextSibling.data=t:this.T(O.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=K.createElement(Y(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new Z(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=q.get(t.strings);return void 0===e&&q.set(t.strings,e=new K(t)),e}k(t){U(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const n of t)s===e.length?e.push(i=new Q(this.O(T()),this.O(T()),this,this.options)):i=e[s],i._$AI(n),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=k(t).nextSibling;k(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class tt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,n){this.type=1,this._$AH=V,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=n,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=V}_$AI(t,e=this,i,s){const n=this.strings;let o=!1;if(void 0===n)t=J(this,t,e,0),o=!H(t)||t!==this._$AH&&t!==F,o&&(this._$AH=t);else{const s=t;let a,r;for(t=n[0],a=0;a<n.length-1;a++)r=J(this,s[i+a],e,a),r===F&&(r=this._$AH[a]),o||=!H(r)||r!==this._$AH[a],r===V?t=V:t!==V&&(t+=(r??"")+n[a+1]),this._$AH[a]=r}o&&!s&&this.j(t)}j(t){t===V?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class et extends tt{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===V?void 0:t}}class it extends tt{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==V)}}class st extends tt{constructor(t,e,i,s,n){super(t,e,i,s,n),this.type=5}_$AI(t,e=this){if((t=J(this,t,e,0)??V)===F)return;const i=this._$AH,s=t===V&&i!==V||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,n=t!==V&&(i===V||s);s&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class nt{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){J(this,t)}}const ot=w.litHtmlPolyfillSupport;ot?.(K,Q),(w.litHtmlVersions??=[]).push("3.3.2");const at=globalThis;class rt extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let n=s._$litPart$;if(void 0===n){const t=i?.renderBefore??null;s._$litPart$=n=new Q(e.insertBefore(T(),t),t,void 0,i??{})}return n._$AI(t),n})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return F}}rt._$litElement$=!0,rt.finalized=!0,at.litElementHydrateSupport?.({LitElement:rt});const ct=at.litElementPolyfillSupport;ct?.({LitElement:rt}),(at.litElementVersions??=[]).push("4.2.2");const lt=t=>(e,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},ht={attribute:!0,type:String,converter:_,reflect:!1,hasChanged:y},dt=(t=ht,e,i)=>{const{kind:s,metadata:n}=i;let o=globalThis.litPropertyMetadata.get(n);if(void 0===o&&globalThis.litPropertyMetadata.set(n,o=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),o.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const n=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,n,t,!0,i)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const n=this[s];e.call(this,i),this.requestUpdate(s,n,t,!0,i)}}throw Error("Unsupported decorator location: "+s)};function pt(t){return(e,i)=>"object"==typeof i?dt(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}function gt(t){return pt({...t,state:!0,attribute:!1})}const ut=a`
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    25% { background-position: 50% 100%; }
    50% { background-position: 100% 50%; }
    75% { background-position: 50% 0%; }
    100% { background-position: 0% 50%; }
  }

  @keyframes pulseGlow {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes slideDown {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(100%);
      opacity: 0;
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;let ft=class extends rt{constructor(){super(...arguments),this._cards=[]}setConfig(t){this._config=t,this._createCards()}set hass(t){this._hass=t,this._cards.forEach(e=>{void 0!==e.hass&&(e.hass=t)})}get hass(){return this._hass}_createCards(){this._config.cards&&(this._cards=this._config.cards.map(t=>{const e=t.type?.startsWith("custom:")?t.type.replace("custom:",""):`hui-${t.type}-card`,i=document.createElement(e);return"function"==typeof i.setConfig&&i.setConfig(t),i}),this.requestUpdate())}render(){return G`
      <div class="background"></div>
      <div class="content">
        ${this._cards.map(t=>t)}
      </div>
    `}getCardSize(){return 6}};ft.styles=[ut,a`
      :host {
        display: block;
        min-height: 100vh;
        position: relative;
      }
      .background {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, #0a0a2e 0%, #1a0a30 25%, #0a1a2e 50%, #0d0a25 75%, #0a0a2e 100%);
        background-size: 400% 400%;
        animation: gradientShift 30s ease infinite;
        z-index: -1;
      }
      .content {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 12px;
        padding-bottom: 80px;
        max-width: 500px;
        margin: 0 auto;
      }
    `],t([pt({attribute:!1})],ft.prototype,"_config",void 0),t([pt({attribute:!1})],ft.prototype,"_cards",void 0),ft=t([lt("glass-background")],ft);class mt extends rt{constructor(){super(...arguments),this._trackedEntities=[],this._previousStates={}}setConfig(t){this._config=t}setTrackedEntities(t){this._trackedEntities=t.filter(Boolean)}shouldUpdate(){if(!this.hass)return!1;if(0===this._trackedEntities.length)return!0;let t=!1;for(const e of this._trackedEntities){const i=this.hass.states[e]?.state;this._previousStates[e]!==i&&(this._previousStates[e]=i,t=!0)}return t}getEntity(t){return this.hass?.states[t]}getState(t){return this.hass?.states[t]?.state??"unavailable"}getEntityAttribute(t,e){return this.hass?.states[t]?.attributes[e]}isOn(t){return"on"===this.getState(t)}callService(t,e,i,s){this.hass?.callService(t,e,i,s?{entity_id:s}:void 0)}toggle(t){const[e]=t.split(".");this.callService(e,"toggle",void 0,t)}getCardSize(){return 1}static get glassStyles(){return a`
      :host {
        --glass-bg: rgba(255, 255, 255, 0.06);
        --glass-bg-hover: rgba(255, 255, 255, 0.10);
        --glass-bg-active: rgba(255, 255, 255, 0.14);
        --glass-border: rgba(255, 255, 255, 0.10);
        --glass-border-active: rgba(79, 195, 247, 0.30);
        --glass-accent: #4FC3F7;
        --glass-accent-light: #B3E5FC;
        --glass-accent-glow: rgba(79, 195, 247, 0.30);
        --glass-text-primary: rgba(255, 255, 255, 0.95);
        --glass-text-secondary: rgba(255, 255, 255, 0.55);
        --glass-text-dim: rgba(255, 255, 255, 0.35);
        --glass-radius: 16px;
        --glass-radius-sm: 10px;
        --glass-radius-pill: 50px;
        --glass-blur: 20px;
        --glass-transition: 0.3s ease;
        --glass-coral: #EF5350;
        --glass-green: #66BB6A;

        display: block;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: var(--glass-text-primary);
        -webkit-tap-highlight-color: transparent;
      }

      .glass {
        background: var(--glass-bg);
        backdrop-filter: blur(var(--glass-blur));
        -webkit-backdrop-filter: blur(var(--glass-blur));
        border: 1px solid var(--glass-border);
        border-radius: var(--glass-radius);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
      }

      .glass:hover {
        background: var(--glass-bg-hover);
      }

      .glass.active {
        background: var(--glass-bg-active);
        border-color: var(--glass-border-active);
        box-shadow:
          0 8px 32px rgba(0, 0, 0, 0.3),
          0 0 20px var(--glass-accent-glow),
          0 0 60px rgba(79, 195, 247, 0.1);
      }
    `}}t([pt({attribute:!1})],mt.prototype,"hass",void 0),t([pt({attribute:!1})],mt.prototype,"_config",void 0);let vt=class extends mt{get _buttonConfig(){return this._config}setConfig(t){super.setConfig(t),t.entity&&this.setTrackedEntities([t.entity])}_handleTap(){const t=this._buttonConfig.tap_action?.action??"toggle";"toggle"===t&&this._config.entity?this.toggle(this._config.entity):"navigate"===t&&this._buttonConfig.tap_action?.navigation_path&&(window.location.hash=this._buttonConfig.tap_action.navigation_path)}render(){if(!this.hass||!this._config)return G``;const t=this._config.entity?this.getEntity(this._config.entity):void 0,e=!!t&&this.isOn(this._config.entity),i=this._config.name??t?.attributes.friendly_name??"",s=this._config.icon??t?.attributes.icon??"mdi:help-circle";let n="";if(!1!==this._buttonConfig.show_state&&t){const e=t.attributes.unit_of_measurement;n=e?`${t.state} ${e}`:"on"===t.state?"Pa":"off"===t.state?"Av":t.state}return G`
      <div class="glass button ${e?"active":""}" @click=${this._handleTap}>
        <div class="icon-wrap">
          <ha-icon .icon=${s}></ha-icon>
        </div>
        <div class="info">
          <div class="name">${i}</div>
          ${n?G`<div class="state">${n}</div>`:""}
        </div>
      </div>
    `}};vt.styles=[mt.glassStyles,a`
      :host { display: block; }
      .button {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        cursor: pointer;
        user-select: none;
      }
      .button:active {
        background: var(--glass-bg-active);
        transform: scale(0.98);
      }
      .icon-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.06);
        flex-shrink: 0;
        transition: all var(--glass-transition);
      }
      .active .icon-wrap {
        background: rgba(79, 195, 247, 0.15);
        box-shadow: 0 0 16px rgba(79, 195, 247, 0.2);
      }
      .icon-wrap ha-icon {
        --mdc-icon-size: 22px;
        color: var(--glass-text-secondary);
        transition: color var(--glass-transition);
      }
      .active .icon-wrap ha-icon { color: var(--glass-accent); }
      .info { flex: 1; min-width: 0; }
      .name {
        font-size: 14px;
        font-weight: 500;
        color: var(--glass-text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .state {
        font-size: 12px;
        color: var(--glass-text-dim);
        margin-top: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .active .state { color: var(--glass-text-secondary); }
    `],vt=t([lt("glass-button")],vt);let bt=class extends mt{setConfig(t){super.setConfig(t),t.entity&&this.setTrackedEntities([t.entity])}get _chipConfig(){return this._config}render(){if(!this.hass||!this._config)return G``;const t=this._config.entity?this.getEntity(this._config.entity):void 0,e=this._chipConfig.chip_type??"custom";let i=this._config.icon??"",s="",n=!1;switch(e){case"person":{const e=t?.attributes.friendly_name??"",o=t?.state??"";i=i||"mdi:account",s=`${e} · ${"home"===o?"Hemma":"Borta"}`,n="home"===o;break}case"battery":{const e=t?.state??"?";i=i||"mdi:cellphone",s=`${e} %`,n=Number(e)>20;break}case"lights":{const e=t?.state??"0";i=i||"mdi:lightbulb-group",s=`${e} st`,n=Number(e)>0;break}default:i=i||"mdi:information",s=this._chipConfig.content??t?.state??""}return G`
      <div class="chip ${n?"active":""}">
        <ha-icon .icon=${i}></ha-icon>
        <span class="value">${s}</span>
      </div>
    `}};bt.styles=[mt.glassStyles,a`
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: var(--glass-radius-pill);
        font-size: 13px;
        font-weight: 500;
        color: var(--glass-text-secondary);
        white-space: nowrap;
        cursor: default;
        transition: all var(--glass-transition);
      }
      .chip.active {
        color: var(--glass-text-primary);
        background: rgba(79, 195, 247, 0.12);
        border-color: rgba(79, 195, 247, 0.2);
      }
      .chip ha-icon {
        --mdc-icon-size: 16px;
        display: flex;
      }
      .chip .value {
        font-variant-numeric: tabular-nums;
      }
    `],bt=t([lt("glass-chip")],bt);let _t=class extends mt{get _headerConfig(){return this._config}setConfig(t){super.setConfig(t);const e=[];t.weather_entity&&e.push(t.weather_entity),t.chips&&t.chips.forEach(t=>{t.entity&&e.push(t.entity)}),this.setTrackedEntities(e)}_renderChip(t){const e=this.getEntity(t.entity);if(!e)return G``;let i=t.icon??"",s="",n=!1;switch(t.chip_type){case"person":i=i||"mdi:account";s=`${e.attributes.friendly_name??""} · ${"home"===e.state?"Hemma":"Borta"}`,n="home"===e.state;break;case"battery":i=i||"mdi:cellphone",s=`${e.state} %`,n=Number(e.state)>20;break;case"lights":i=i||"mdi:lightbulb-group",s=`${e.state} st`,n=Number(e.state)>0;break;default:i=i||"mdi:information",s=e.state}return G`
      <div class="chip ${n?"active":""}">
        <ha-icon .icon=${i}></ha-icon>
        <span>${s}</span>
      </div>
    `}render(){if(!this.hass||!this._config)return G``;const t=this.hass.user?.name??"",e=!1!==this._headerConfig.greeting?function(t){const e=(new Date).getHours();return e>=5&&e<10?`God morgon, ${t}`:e>=10&&e<17?`Hej, ${t}`:e>=17&&e<22?`God kvall, ${t}`:`God natt, ${t}`}(t):t,i=this._headerConfig.weather_entity?this.getEntity(this._headerConfig.weather_entity):void 0,s=i?.state??"",n=i?.attributes.temperature??"",o=i?.attributes.temperature_unit??"°C",a={"clear-night":"mdi:weather-night",cloudy:"mdi:weather-cloudy",fog:"mdi:weather-fog",hail:"mdi:weather-hail",lightning:"mdi:weather-lightning","lightning-rainy":"mdi:weather-lightning-rainy",partlycloudy:"mdi:weather-partly-cloudy",pouring:"mdi:weather-pouring",rainy:"mdi:weather-rainy",snowy:"mdi:weather-snowy","snowy-rainy":"mdi:weather-snowy-rainy",sunny:"mdi:weather-sunny",windy:"mdi:weather-windy","windy-variant":"mdi:weather-windy-variant",exceptional:"mdi:alert-circle-outline"}[s]??"mdi:weather-cloudy";return G`
      <div class="glass header">
        <div class="top-row">
          <div class="home-icon">
            <ha-icon icon="mdi:home"></ha-icon>
          </div>
          <div class="greeting-section">
            <div class="greeting">${e}</div>
            ${i?G`
              <div class="weather">
                <ha-icon .icon=${a}></ha-icon>
                ${{"clear-night":"Klart",cloudy:"Molnigt",fog:"Dimma",partlycloudy:"Delvis molnigt",rainy:"Regn",snowy:"Sno",sunny:"Soligt",windy:"Blasigt"}[s]??s} \u2022 ${n}${o}
              </div>
            `:""}
          </div>
        </div>
        ${this._headerConfig.chips?.length?G`
          <div class="chips">
            ${this._headerConfig.chips.map(t=>this._renderChip(t))}
          </div>
        `:""}
      </div>
    `}};_t.styles=[mt.glassStyles,a`
      :host { display: block; }
      .header { padding: 16px; }
      .top-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }
      .home-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(79, 195, 247, 0.12);
        flex-shrink: 0;
      }
      .home-icon ha-icon {
        --mdc-icon-size: 22px;
        color: var(--glass-accent);
      }
      .greeting-section { flex: 1; min-width: 0; }
      .greeting {
        font-size: 18px;
        font-weight: 600;
        color: var(--glass-text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .weather {
        font-size: 13px;
        color: var(--glass-text-secondary);
        margin-top: 2px;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .weather ha-icon { --mdc-icon-size: 16px; }
      .chips {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: var(--glass-radius-pill);
        font-size: 13px;
        font-weight: 500;
        color: var(--glass-text-secondary);
        white-space: nowrap;
      }
      .chip.active {
        color: var(--glass-text-primary);
        background: rgba(79, 195, 247, 0.12);
        border-color: rgba(79, 195, 247, 0.2);
      }
      .chip ha-icon {
        --mdc-icon-size: 16px;
        display: flex;
      }
    `],_t=t([lt("glass-header")],_t);let yt=class extends mt{get _roomConfig(){return this._config}setConfig(t){super.setConfig(t);const e=[];t.entity&&e.push(t.entity),t.sub_buttons&&t.sub_buttons.forEach(t=>e.push(t.entity)),this.setTrackedEntities(e)}_handleCardTap(){this._roomConfig.popup_id&&(window.location.hash=this._roomConfig.popup_id)}_handleSubButtonTap(t,e){t.stopPropagation(),this.toggle(e)}render(){if(!this.hass||!this._config)return G``;const t=this._roomConfig.sub_buttons??[],e=t.map(t=>t.entity);this._config.entity&&!e.includes(this._config.entity)&&e.unshift(this._config.entity);const i=e.some(t=>this.isOn(t)),s=function(t,e){const i=function(t,e){return e.filter(e=>"on"===t[e]?.state).length}(t,e);return 0===i?"Av":1===i?"Pa":`${i} lampor pa`}(this.hass.states,e),n=this._config.icon??"mdi:home",o=this._config.name??"";return G`
      <div class="glass room-card ${i?"active":""}" @click=${this._handleCardTap}>
        <div class="top">
          <div class="room-icon">
            <ha-icon .icon=${n}></ha-icon>
          </div>
          <div class="room-info">
            <div class="room-name">${o}</div>
            <div class="room-status">${s}</div>
          </div>
        </div>
        ${t.length?G`
          <div class="sub-buttons">
            ${t.map(t=>{const e=this.isOn(t.entity),i=t.icon??this.getEntity(t.entity)?.attributes.icon??"mdi:lightbulb";return G`
                <div
                  class="sub-btn ${e?"on":""}"
                  @click=${e=>this._handleSubButtonTap(e,t.entity)}
                  title=${t.name??this.getEntity(t.entity)?.attributes.friendly_name??t.entity}
                >
                  <ha-icon .icon=${i}></ha-icon>
                </div>
              `})}
          </div>
        `:""}
      </div>
    `}};yt.styles=[mt.glassStyles,a`
      :host { display: block; }
      .room-card {
        padding: 16px;
        cursor: pointer;
        user-select: none;
        min-height: 80px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .room-card:active { transform: scale(0.97); }
      .top {
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }
      .room-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.06);
        flex-shrink: 0;
        transition: all var(--glass-transition);
      }
      .active .room-icon {
        background: rgba(79, 195, 247, 0.12);
        box-shadow: 0 0 12px rgba(79, 195, 247, 0.15);
      }
      .room-icon ha-icon {
        --mdc-icon-size: 22px;
        color: var(--glass-text-secondary);
        transition: color var(--glass-transition);
      }
      .active .room-icon ha-icon { color: var(--glass-accent); }
      .room-info { flex: 1; min-width: 0; }
      .room-name {
        font-size: 15px;
        font-weight: 600;
        color: var(--glass-text-primary);
      }
      .room-status {
        font-size: 12px;
        color: var(--glass-text-dim);
        margin-top: 2px;
      }
      .active .room-status { color: var(--glass-accent); }
      .sub-buttons {
        display: flex;
        gap: 6px;
        margin-top: 12px;
        flex-wrap: wrap;
      }
      .sub-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.06);
        cursor: pointer;
        transition: all var(--glass-transition);
      }
      .sub-btn:hover { background: rgba(255, 255, 255, 0.10); }
      .sub-btn.on {
        background: rgba(79, 195, 247, 0.15);
        border-color: rgba(79, 195, 247, 0.25);
      }
      .sub-btn ha-icon {
        --mdc-icon-size: 16px;
        color: var(--glass-text-dim);
      }
      .sub-btn.on ha-icon { color: var(--glass-accent); }
    `],yt=t([lt("glass-room-card")],yt);let xt=class extends mt{constructor(){super(...arguments),this._dragging=!1,this._dragValue=0}setConfig(t){super.setConfig(t),t.entity&&this.setTrackedEntities([t.entity])}_handleSliderInteraction(t){if(!this._config.entity)return;const e=this.getEntity(this._config.entity);if(!e||"off"===e.state)return void this.callService("light","turn_on",{brightness_pct:100},this._config.entity);const i=t.currentTarget.getBoundingClientRect(),s=t=>{const e=Math.max(0,Math.min(t-i.left,i.width)),s=Math.round(e/i.width*100);this._dragValue=Math.max(1,Math.min(100,s))},n="touches"in t?t.touches[0].clientX:t.clientX;s(n),this._dragging=!0;const o=t=>{const e="touches"in t?t.touches[0].clientX:t.clientX;s(e)},a=()=>{this._dragging=!1,this.callService("light","turn_on",{brightness_pct:this._dragValue},this._config.entity),document.removeEventListener("mousemove",o),document.removeEventListener("mouseup",a),document.removeEventListener("touchmove",o),document.removeEventListener("touchend",a)};document.addEventListener("mousemove",o),document.addEventListener("mouseup",a),document.addEventListener("touchmove",o,{passive:!0}),document.addEventListener("touchend",a)}render(){if(!this.hass||!this._config?.entity)return G``;const t=this.getEntity(this._config.entity);if(!t)return G``;const e="on"===t.state,i=this._dragging?this._dragValue:function(t){if(!t||"on"!==t.state)return 0;const e=t.attributes.brightness;return e?Math.round(e/255*100):100}(t),s=this._config.name??t.attributes.friendly_name??"",n=this._config.icon??t.attributes.icon??"mdi:lightbulb";return G`
      <div class="glass slider-card ${e?"on":"off"}">
        <div class="slider-header">
          <div class="slider-left">
            <div class="light-icon">
              <ha-icon .icon=${n}></ha-icon>
            </div>
            <span class="light-name">${s}</span>
          </div>
          <span class="brightness-value">${e?`${i}%`:"Av"}</span>
        </div>
        <div class="slider-track" @mousedown=${this._handleSliderInteraction} @touchstart=${this._handleSliderInteraction}>
          ${e?G`
            <div class="slider-fill ${this._dragging?"dragging":""}" style="width: ${i}%"></div>
            <div class="slider-glow" style="left: calc(${i}% - 12px)"></div>
          `:G`
            <div class="off-overlay" @click=${()=>this.callService("light","turn_on",{brightness_pct:100},this._config.entity)}>
              Tryck for att tanda
            </div>
          `}
        </div>
      </div>
    `}};xt.styles=[mt.glassStyles,a`
      :host { display: block; }
      .slider-card { padding: 16px; }
      .slider-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 14px;
      }
      .slider-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .light-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.06);
        transition: all var(--glass-transition);
      }
      .on .light-icon {
        background: rgba(79, 195, 247, 0.12);
        box-shadow: 0 0 12px rgba(79, 195, 247, 0.15);
      }
      .light-icon ha-icon {
        --mdc-icon-size: 20px;
        color: var(--glass-text-dim);
        transition: color var(--glass-transition);
      }
      .on .light-icon ha-icon { color: var(--glass-accent); }
      .light-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--glass-text-primary);
      }
      .brightness-value {
        font-size: 14px;
        font-weight: 600;
        color: var(--glass-text-dim);
        font-variant-numeric: tabular-nums;
        min-width: 36px;
        text-align: right;
      }
      .on .brightness-value { color: var(--glass-accent); }
      .slider-track {
        position: relative;
        height: 36px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.06);
        overflow: hidden;
        cursor: pointer;
        touch-action: none;
      }
      .slider-fill {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        border-radius: 18px;
        background: linear-gradient(90deg, var(--glass-accent), var(--glass-accent-light, #B3E5FC));
        transition: width 0.15s ease;
        pointer-events: none;
      }
      .slider-fill.dragging { transition: none; }
      .slider-glow {
        position: absolute;
        top: -4px;
        bottom: -4px;
        width: 24px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(79, 195, 247, 0.4), transparent);
        filter: blur(6px);
        pointer-events: none;
        transition: opacity var(--glass-transition);
        opacity: 0;
      }
      .on .slider-glow { opacity: 1; }
      .off-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        color: var(--glass-text-dim);
        cursor: pointer;
      }
    `],t([gt()],xt.prototype,"_dragging",void 0),t([gt()],xt.prototype,"_dragValue",void 0),xt=t([lt("glass-light-slider")],xt);let $t=class extends rt{constructor(){super(...arguments),this._isOpen=!1,this._isClosing=!1,this._cards=[],this._onHashChange=()=>{this._checkHash()}}connectedCallback(){super.connectedCallback(),window.addEventListener("hashchange",this._onHashChange),this._checkHash()}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("hashchange",this._onHashChange)}_checkHash(){if(!this._config?.hash)return;const t=window.location.hash.replace("#","");t!==this._config.hash||this._isOpen?t!==this._config.hash&&this._isOpen&&this._close():this._open()}_open(){this._isOpen=!0,this._isClosing=!1,this._createPopupCards()}_close(){this._isClosing=!0,setTimeout(()=>{this._isOpen=!1,this._isClosing=!1},350),window.location.hash.replace("#","")===this._config.hash&&history.replaceState(null,"",window.location.pathname+window.location.search)}_handleBackdropClick(){this._close()}setConfig(t){if(!t.hash)throw new Error('glass-popup requires a "hash" property');this._config=t}set hass(t){this._hass=t,this._cards.forEach(e=>{void 0!==e.hass&&(e.hass=t)})}get hass(){return this._hass}_createPopupCards(){this._config?.cards&&(this._cards=this._config.cards.map(t=>{const e=t.type?.startsWith("custom:")?t.type.replace("custom:",""):`hui-${t.type}-card`,i=document.createElement(e);return"function"==typeof i.setConfig&&i.setConfig(t),this.hass&&(i.hass=this.hass),i}),this.requestUpdate())}render(){return this._isOpen||this._isClosing?G`
      <div class="overlay ${this._isOpen&&!this._isClosing?"open":""} ${this._isClosing?"closing":""}">
        <div class="backdrop" @click=${this._handleBackdropClick}></div>
        <div class="panel">
          <div class="handle"></div>
          ${this._config.title?G`
            <div class="popup-header">
              ${this._config.icon?G`<ha-icon .icon=${this._config.icon}></ha-icon>`:""}
              <span class="popup-title">${this._config.title}</span>
            </div>
          `:""}
          <div class="popup-cards">
            ${this._cards.map(t=>t)}
          </div>
        </div>
      </div>
    `:G``}getCardSize(){return 0}};$t.styles=[ut,a`
      :host { display: block; }
      .overlay {
        position: fixed;
        inset: 0;
        z-index: 999;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      .overlay.open {
        pointer-events: auto;
        opacity: 1;
      }
      .backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }
      .panel {
        position: relative;
        width: 100%;
        max-width: 500px;
        max-height: 85vh;
        overflow-y: auto;
        background: rgba(20, 20, 40, 0.85);
        backdrop-filter: blur(30px);
        -webkit-backdrop-filter: blur(30px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 24px 24px 0 0;
        padding: 20px;
        padding-bottom: 40px;
        transform: translateY(100%);
        transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .overlay.open .panel { transform: translateY(0); }
      .overlay.closing .panel { transform: translateY(100%); }
      .handle {
        width: 40px;
        height: 4px;
        border-radius: 2px;
        background: rgba(255, 255, 255, 0.2);
        margin: 0 auto 16px;
      }
      .popup-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 16px;
      }
      .popup-header ha-icon {
        --mdc-icon-size: 24px;
        color: rgba(79, 195, 247, 0.8);
      }
      .popup-title {
        font-size: 18px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.95);
      }
      .popup-cards {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
    `],t([pt({attribute:!1})],$t.prototype,"_config",void 0),t([gt()],$t.prototype,"_isOpen",void 0),t([gt()],$t.prototype,"_isClosing",void 0),$t=t([lt("glass-popup")],$t);let wt=class extends rt{constructor(){super(...arguments),this._activeHash="",this._onHashChange=()=>{const t=window.location.hash.replace("#","");this._config.items.some(e=>e.hash===t)&&(this._activeHash=t)}}connectedCallback(){super.connectedCallback(),this._activeHash=window.location.hash.replace("#","")||this._config?.items?.[0]?.hash||"",window.addEventListener("hashchange",this._onHashChange)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("hashchange",this._onHashChange)}setConfig(t){if(!t.items?.length)throw new Error('glass-nav-bar requires "items"');this._config=t}_handleTap(t){this._activeHash=t,window.location.hash=t}render(){return this._config?.items?G`
      <div class="nav-bar">
        ${this._config.items.map(t=>G`
          <div class="nav-item ${this._activeHash===t.hash?"active":""}" @click=${()=>this._handleTap(t.hash)}>
            <ha-icon .icon=${t.icon}></ha-icon>
            <span class="nav-label">${t.label}</span>
          </div>
        `)}
      </div>
    `:G``}getCardSize(){return 0}};wt.styles=a`
    :host {
      display: block;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 100;
      padding: 0 12px 12px;
      pointer-events: none;
    }
    .nav-bar {
      display: flex;
      align-items: center;
      justify-content: space-around;
      max-width: 500px;
      margin: 0 auto;
      padding: 8px 4px;
      background: rgba(15, 15, 35, 0.75);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      pointer-events: auto;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }
    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      padding: 6px 14px;
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.25s ease;
      -webkit-tap-highlight-color: transparent;
      position: relative;
    }
    .nav-item:active { transform: scale(0.92); }
    .nav-item.active { background: rgba(79, 195, 247, 0.10); }
    .nav-item.active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 16px;
      height: 2px;
      border-radius: 1px;
      background: #4FC3F7;
      box-shadow: 0 0 8px rgba(79, 195, 247, 0.5);
    }
    .nav-item ha-icon {
      --mdc-icon-size: 22px;
      color: rgba(255, 255, 255, 0.35);
      transition: color 0.25s ease;
    }
    .nav-item.active ha-icon { color: #4FC3F7; }
    .nav-label {
      font-size: 10px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.35);
      transition: color 0.25s ease;
    }
    .nav-item.active .nav-label { color: rgba(255, 255, 255, 0.85); }
  `,t([pt({attribute:!1})],wt.prototype,"hass",void 0),t([pt({attribute:!1})],wt.prototype,"_config",void 0),t([gt()],wt.prototype,"_activeHash",void 0),wt=t([lt("glass-nav-bar")],wt);let kt=class extends mt{get _vacuumConfig(){return this._config}setConfig(t){super.setConfig(t),t.entity&&this.setTrackedEntities([t.entity])}_getStatusText(t){return{cleaning:"Stader",docked:"Dockad",paused:"Pausad",returning:"Atergar",idle:"Inaktiv",error:"Fel",unavailable:"Otillganglig"}[t]??t}_start(){this._config.entity&&this.callService("vacuum","start",void 0,this._config.entity)}_stop(){this._config.entity&&this.callService("vacuum","return_to_base",void 0,this._config.entity)}_cleanRoom(t){this._config.entity&&null!=t.room_id&&this.callService("vacuum","send_command",{command:"app_segment_clean",params:[t.room_id]},this._config.entity)}render(){if(!this.hass||!this._config?.entity)return G``;const t=this.getEntity(this._config.entity);if(!t)return G``;const e=t.state,i="cleaning"===e,s="error"===e,n=t.attributes.battery_level,o=this._config.name??t.attributes.friendly_name??"Vacuum",a=this._config.icon??"mdi:robot-vacuum";return G`
      <div
        class="glass vacuum-card ${i?"cleaning":""} ${s?"error":""}"
      >
        <div class="vacuum-header">
          <div class="vacuum-icon">
            <ha-icon .icon=${a}></ha-icon>
          </div>
          <div class="vacuum-info">
            <div class="vacuum-name">${o}</div>
            <div class="vacuum-status">${this._getStatusText(e)}</div>
          </div>
          ${null!=n?G`
                <div class="vacuum-battery">
                  <ha-icon
                    icon="mdi:battery${n>80?"":n>60?"-80":n>40?"-60":n>20?"-40":"-20"}"
                  ></ha-icon>
                  ${n}%
                </div>
              `:""}
        </div>
        <div class="controls">
          <div class="control-btn" @click=${this._start}>
            <ha-icon icon="mdi:play"></ha-icon> Starta
          </div>
          <div class="control-btn" @click=${this._stop}>
            <ha-icon icon="mdi:home"></ha-icon> Docka
          </div>
        </div>
        ${this._vacuumConfig.rooms?.length?G`
              <div class="rooms">
                ${this._vacuumConfig.rooms.map(t=>G`
                    <div class="room-btn" @click=${()=>this._cleanRoom(t)}>
                      ${t.name}
                    </div>
                  `)}
              </div>
            `:""}
      </div>
    `}};kt.styles=[mt.glassStyles,a`
      :host {
        display: block;
      }
      .vacuum-card {
        padding: 16px;
      }
      .vacuum-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 14px;
      }
      .vacuum-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.06);
        transition: all var(--glass-transition);
      }
      .cleaning .vacuum-icon {
        background: rgba(79, 195, 247, 0.12);
        animation: pulseGlow 2s ease infinite;
      }
      @keyframes pulseGlow {
        0%,
        100% {
          box-shadow: 0 0 8px rgba(79, 195, 247, 0.1);
        }
        50% {
          box-shadow: 0 0 16px rgba(79, 195, 247, 0.3);
        }
      }
      .vacuum-icon ha-icon {
        --mdc-icon-size: 24px;
        color: var(--glass-text-secondary);
        transition: all var(--glass-transition);
      }
      .cleaning .vacuum-icon ha-icon {
        color: var(--glass-accent);
      }
      .vacuum-info {
        flex: 1;
      }
      .vacuum-name {
        font-size: 15px;
        font-weight: 600;
        color: var(--glass-text-primary);
      }
      .vacuum-status {
        font-size: 12px;
        color: var(--glass-text-dim);
        margin-top: 2px;
      }
      .cleaning .vacuum-status {
        color: var(--glass-accent);
      }
      .error .vacuum-status {
        color: var(--glass-coral);
      }
      .vacuum-battery {
        font-size: 12px;
        color: var(--glass-text-dim);
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .vacuum-battery ha-icon {
        --mdc-icon-size: 16px;
      }
      .controls {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
      }
      .control-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 10px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.06);
        cursor: pointer;
        transition: all var(--glass-transition);
        font-size: 12px;
        font-weight: 500;
        color: var(--glass-text-secondary);
      }
      .control-btn:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      .control-btn:active {
        transform: scale(0.96);
      }
      .control-btn ha-icon {
        --mdc-icon-size: 18px;
      }
      .rooms {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .room-btn {
        padding: 8px 14px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.06);
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        color: var(--glass-text-secondary);
        transition: all var(--glass-transition);
      }
      .room-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.12);
      }
      .room-btn:active {
        transform: scale(0.96);
      }
    `],kt=t([lt("glass-vacuum-card")],kt);let Ct=class extends mt{get _infoConfig(){return this._config}setConfig(t){super.setConfig(t);const e=[];t.entity&&e.push(t.entity),t.secondary_entity&&e.push(t.secondary_entity),t.badge_entity&&e.push(t.badge_entity),this.setTrackedEntities(e)}render(){if(!this.hass||!this._config)return G``;const t=this._config.entity?this.getEntity(this._config.entity):void 0,e=this._config.name??t?.attributes.friendly_name??"",i=this._config.icon??t?.attributes.icon??"mdi:information";let s=t?.state??"";const n=t?.attributes.unit_of_measurement;n&&(s=`${s} ${n}`);const o=this._infoConfig.badge_entity?this.getEntity(this._infoConfig.badge_entity):void 0;return G`
      <div class="glass info-card">
        <div class="info-icon">
          <ha-icon .icon=${i}></ha-icon>
        </div>
        <div class="info-content">
          <div class="info-name">${e}</div>
          <div class="info-value">${s}</div>
        </div>
        ${o?G`
              <div class="badge">
                ${this._infoConfig.badge_icon?G`<ha-icon
                      .icon=${this._infoConfig.badge_icon}
                    ></ha-icon>`:""}
                ${o.state}
              </div>
            `:""}
      </div>
    `}};Ct.styles=[mt.glassStyles,a`
      :host {
        display: block;
      }
      .info-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
      }
      .info-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.06);
        flex-shrink: 0;
      }
      .info-icon ha-icon {
        --mdc-icon-size: 22px;
        color: var(--glass-text-secondary);
      }
      .info-content {
        flex: 1;
        min-width: 0;
      }
      .info-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--glass-text-primary);
      }
      .info-value {
        font-size: 12px;
        color: var(--glass-text-dim);
        margin-top: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .badge {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        border-radius: 50px;
        background: rgba(79, 195, 247, 0.12);
        border: 1px solid rgba(79, 195, 247, 0.2);
        font-size: 12px;
        font-weight: 600;
        color: #4fc3f7;
        flex-shrink: 0;
      }
      .badge ha-icon {
        --mdc-icon-size: 14px;
        color: #4fc3f7;
      }
    `],Ct=t([lt("glass-info-row")],Ct);const At=window;At.customCards=At.customCards||[],At.customCards.push({type:"glass-background",name:"Glass Background",description:"Animated gradient background"},{type:"glass-button",name:"Glass Button",description:"Toggle/info button"},{type:"glass-chip",name:"Glass Chip",description:"Small status pill"},{type:"glass-header",name:"Glass Header",description:"Greeting, weather, status chips"},{type:"glass-room-card",name:"Glass Room Card",description:"Room with sub-buttons and popup"},{type:"glass-light-slider",name:"Glass Light Slider",description:"Brightness slider with glow"},{type:"glass-popup",name:"Glass Popup",description:"Modal overlay"},{type:"glass-nav-bar",name:"Glass Nav Bar",description:"Bottom navigation"},{type:"glass-vacuum-card",name:"Glass Vacuum Card",description:"Vacuum controls"},{type:"glass-info-row",name:"Glass Info Row",description:"Information display"}),console.info("%c GLASS CARDS %c v0.1.0 ","color: white; background: #4FC3F7; font-weight: bold; padding: 2px 6px; border-radius: 4px 0 0 4px;","color: #4FC3F7; background: rgba(79,195,247,0.1); padding: 2px 6px; border-radius: 0 4px 4px 0;");
