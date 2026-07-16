function t(t,e,i,s){var n,a=arguments.length,o=a<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(t,e,i,s);else for(var r=t.length-1;r>=0;r--)(n=t[r])&&(o=(a<3?n(o):a>3?n(e,i,o):n(e,i))||o);return a>3&&o&&Object.defineProperty(e,i,o),o}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),n=new WeakMap;let a=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=n.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&n.set(e,t))}return t}toString(){return this.cssText}};const o=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new a(i,t,s)},r=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new a("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:c,defineProperty:l,getOwnPropertyDescriptor:h,getOwnPropertyNames:d,getOwnPropertySymbols:p,getPrototypeOf:g}=Object,u=globalThis,f=u.trustedTypes,m=f?f.emptyScript:"",b=u.reactiveElementPolyfillSupport,v=(t,e)=>t,_={toAttribute(t,e){switch(e){case Boolean:t=t?m:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},y=(t,e)=>!c(t,e),x={attribute:!0,type:String,converter:_,reflect:!1,useDefault:!1,hasChanged:y};Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;let w=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=x){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&l(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:n}=h(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const a=s?.call(this);n?.call(this,e),this.requestUpdate(t,a,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??x}static _$Ei(){if(this.hasOwnProperty(v("elementProperties")))return;const t=g(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(v("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(v("properties"))){const t=this.properties,e=[...d(t),...p(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(r(t))}else void 0!==t&&e.push(r(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(i)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of s){const s=document.createElement("style"),n=e.litNonce;void 0!==n&&s.setAttribute("nonce",n),s.textContent=i.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const n=(void 0!==i.converter?.toAttribute?i.converter:_).toAttribute(e,i.type);this._$Em=t,null==n?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),n="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:_;this._$Em=s;const a=n.fromAttribute(e,t.type);this[s]=a??this._$Ej?.get(s)??a,this._$Em=null}}requestUpdate(t,e,i,s=!1,n){if(void 0!==t){const a=this.constructor;if(!1===s&&(n=this[t]),i??=a.getPropertyOptions(t),!((i.hasChanged??y)(n,e)||i.useDefault&&i.reflect&&n===this._$Ej?.get(t)&&!this.hasAttribute(a._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:n},a){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,a??e??this[t]),!0!==n||void 0!==a)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};w.elementStyles=[],w.shadowRootOptions={mode:"open"},w[v("elementProperties")]=new Map,w[v("finalized")]=new Map,b?.({ReactiveElement:w}),(u.reactiveElementVersions??=[]).push("2.1.2");const $=globalThis,k=t=>t,C=$.trustedTypes,E=C?C.createPolicy("lit-html",{createHTML:t=>t}):void 0,A="$lit$",S=`lit$${Math.random().toFixed(9).slice(2)}$`,T="?"+S,z=`<${T}>`,P=document,F=()=>P.createComment(""),H=t=>null===t||"object"!=typeof t&&"function"!=typeof t,O=Array.isArray,U="[ \t\n\f\r]",D=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,M=/-->/g,B=/>/g,j=RegExp(`>|${U}(?:([^\\s"'>=/]+)(${U}*=${U}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),R=/'/g,I=/"/g,N=/^(?:script|style|textarea|title)$/i,L=t=>(e,...i)=>({_$litType$:t,strings:e,values:i}),X=L(1),V=L(2),G=Symbol.for("lit-noChange"),q=Symbol.for("lit-nothing"),W=new WeakMap,Y=P.createTreeWalker(P,129);function K(t,e){if(!O(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==E?E.createHTML(e):e}const J=(t,e)=>{const i=t.length-1,s=[];let n,a=2===e?"<svg>":3===e?"<math>":"",o=D;for(let e=0;e<i;e++){const i=t[e];let r,c,l=-1,h=0;for(;h<i.length&&(o.lastIndex=h,c=o.exec(i),null!==c);)h=o.lastIndex,o===D?"!--"===c[1]?o=M:void 0!==c[1]?o=B:void 0!==c[2]?(N.test(c[2])&&(n=RegExp("</"+c[2],"g")),o=j):void 0!==c[3]&&(o=j):o===j?">"===c[0]?(o=n??D,l=-1):void 0===c[1]?l=-2:(l=o.lastIndex-c[2].length,r=c[1],o=void 0===c[3]?j:'"'===c[3]?I:R):o===I||o===R?o=j:o===M||o===B?o=D:(o=j,n=void 0);const d=o===j&&t[e+1].startsWith("/>")?" ":"";a+=o===D?i+z:l>=0?(s.push(r),i.slice(0,l)+A+i.slice(l)+S+d):i+S+(-2===l?e:d)}return[K(t,a+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class Z{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let n=0,a=0;const o=t.length-1,r=this.parts,[c,l]=J(t,e);if(this.el=Z.createElement(c,i),Y.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=Y.nextNode())&&r.length<o;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(A)){const e=l[a++],i=s.getAttribute(t).split(S),o=/([.?@])?(.*)/.exec(e);r.push({type:1,index:n,name:o[2],strings:i,ctor:"."===o[1]?st:"?"===o[1]?nt:"@"===o[1]?at:it}),s.removeAttribute(t)}else t.startsWith(S)&&(r.push({type:6,index:n}),s.removeAttribute(t));if(N.test(s.tagName)){const t=s.textContent.split(S),e=t.length-1;if(e>0){s.textContent=C?C.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],F()),Y.nextNode(),r.push({type:2,index:++n});s.append(t[e],F())}}}else if(8===s.nodeType)if(s.data===T)r.push({type:2,index:n});else{let t=-1;for(;-1!==(t=s.data.indexOf(S,t+1));)r.push({type:7,index:n}),t+=S.length-1}n++}}static createElement(t,e){const i=P.createElement("template");return i.innerHTML=t,i}}function Q(t,e,i=t,s){if(e===G)return e;let n=void 0!==s?i._$Co?.[s]:i._$Cl;const a=H(e)?void 0:e._$litDirective$;return n?.constructor!==a&&(n?._$AO?.(!1),void 0===a?n=void 0:(n=new a(t),n._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=n:i._$Cl=n),void 0!==n&&(e=Q(t,n._$AS(t,e.values),n,s)),e}class tt{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??P).importNode(e,!0);Y.currentNode=s;let n=Y.nextNode(),a=0,o=0,r=i[0];for(;void 0!==r;){if(a===r.index){let e;2===r.type?e=new et(n,n.nextSibling,this,t):1===r.type?e=new r.ctor(n,r.name,r.strings,this,t):6===r.type&&(e=new ot(n,this,t)),this._$AV.push(e),r=i[++o]}a!==r?.index&&(n=Y.nextNode(),a++)}return Y.currentNode=P,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class et{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=q,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Q(this,t,e),H(t)?t===q||null==t||""===t?(this._$AH!==q&&this._$AR(),this._$AH=q):t!==this._$AH&&t!==G&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>O(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==q&&H(this._$AH)?this._$AA.nextSibling.data=t:this.T(P.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=Z.createElement(K(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new tt(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=W.get(t.strings);return void 0===e&&W.set(t.strings,e=new Z(t)),e}k(t){O(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const n of t)s===e.length?e.push(i=new et(this.O(F()),this.O(F()),this,this.options)):i=e[s],i._$AI(n),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=k(t).nextSibling;k(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class it{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,n){this.type=1,this._$AH=q,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=n,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=q}_$AI(t,e=this,i,s){const n=this.strings;let a=!1;if(void 0===n)t=Q(this,t,e,0),a=!H(t)||t!==this._$AH&&t!==G,a&&(this._$AH=t);else{const s=t;let o,r;for(t=n[0],o=0;o<n.length-1;o++)r=Q(this,s[i+o],e,o),r===G&&(r=this._$AH[o]),a||=!H(r)||r!==this._$AH[o],r===q?t=q:t!==q&&(t+=(r??"")+n[o+1]),this._$AH[o]=r}a&&!s&&this.j(t)}j(t){t===q?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class st extends it{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===q?void 0:t}}class nt extends it{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==q)}}class at extends it{constructor(t,e,i,s,n){super(t,e,i,s,n),this.type=5}_$AI(t,e=this){if((t=Q(this,t,e,0)??q)===G)return;const i=this._$AH,s=t===q&&i!==q||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,n=t!==q&&(i===q||s);s&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class ot{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Q(this,t)}}const rt=$.litHtmlPolyfillSupport;rt?.(Z,et),($.litHtmlVersions??=[]).push("3.3.2");const ct=globalThis;class lt extends w{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let n=s._$litPart$;if(void 0===n){const t=i?.renderBefore??null;s._$litPart$=n=new et(e.insertBefore(F(),t),t,void 0,i??{})}return n._$AI(t),n})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return G}}lt._$litElement$=!0,lt.finalized=!0,ct.litElementHydrateSupport?.({LitElement:lt});const ht=ct.litElementPolyfillSupport;ht?.({LitElement:lt}),(ct.litElementVersions??=[]).push("4.2.2");const dt=t=>(e,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},pt={attribute:!0,type:String,converter:_,reflect:!1,hasChanged:y},gt=(t=pt,e,i)=>{const{kind:s,metadata:n}=i;let a=globalThis.litPropertyMetadata.get(n);if(void 0===a&&globalThis.litPropertyMetadata.set(n,a=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),a.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const n=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,n,t,!0,i)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const n=this[s];e.call(this,i),this.requestUpdate(s,n,t,!0,i)}}throw Error("Unsupported decorator location: "+s)};function ut(t){return(e,i)=>"object"==typeof i?gt(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}function ft(t){return ut({...t,state:!0,attribute:!1})}let mt=class extends lt{constructor(){super(...arguments),this._cards=[],this._activeView=null,this._cardConfigs=[],this._boundHashChange=this._onHashChange.bind(this)}connectedCallback(){super.connectedCallback(),window.addEventListener("hashchange",this._boundHashChange),this._activeView=this._getViewFromHash()??this._config?.default_view??null}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("hashchange",this._boundHashChange)}_onHashChange(){const t=this._getViewFromHash();null!==t&&(this._activeView=t),location.hash&&"#"!==location.hash||(this._activeView=this._config?.default_view??null)}_getViewFromHash(){const t=location.hash.replace("#","");if(!t)return null;return(this._config?.views??[]).includes(t)?t:null}setConfig(t){this._config=t,this._activeView=this._getViewFromHash()??t.default_view??null,this._createCards()}set hass(t){this._hass=t,this._cards.forEach(e=>{e.hass=t})}get hass(){return this._hass}_createCards(){this._config.cards&&(this._cardConfigs=this._config.cards,this._cards=this._config.cards.map(t=>{const e=t.type?.startsWith("custom:")?t.type.replace("custom:",""):`hui-${t.type}-card`,i=document.createElement(e);return"function"==typeof i.setConfig&&i.setConfig(t),i}),this.requestUpdate())}render(){const t=this._cards.filter((t,e)=>{const i=this._cardConfigs[e];return!i||!i.view||i.view===this._activeView});return X`
      <div class="background"></div>
      <div class="content">
        ${t.map(t=>t)}
      </div>
    `}getCardSize(){return 6}};mt.styles=[o`
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
        background: #0b1120;
        z-index: -1;
      }
      .content {
        position: relative;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        padding: 8px;
        padding-bottom: 72px;
        max-width: 600px;
        margin: 0 auto;
      }
      /* Full-width cards */
      .content > glass-header,
      .content > glass-nav-bar,
      .content > glass-popup,
      .content > glass-info-row,
      .content > glass-section,
      .content > glass-light-slider,
      .content > glass-departure-card {
        grid-column: 1 / -1;
      }
      /* Buttons and room cards fill 1 column each */
      .content > glass-button,
      .content > glass-room-card {
        grid-column: span 1;
      }
      /* Responsive: wider screens get more breathing room */
      @media (min-width: 600px) {
        .content {
          gap: 12px;
          padding: 12px;
          padding-bottom: 80px;
          max-width: 700px;
        }
      }
      /* Desktop: allow 3 columns for buttons */
      @media (min-width: 900px) {
        .content {
          max-width: 900px;
          grid-template-columns: 1fr 1fr 1fr;
        }
      }
    `],t([ut({attribute:!1})],mt.prototype,"_config",void 0),t([ut({attribute:!1})],mt.prototype,"_cards",void 0),t([ft()],mt.prototype,"_activeView",void 0),mt=t([dt("glass-background")],mt);class bt extends lt{constructor(){super(...arguments),this._trackedEntities=[],this._previousStates={}}setConfig(t){this._config=t}setTrackedEntities(t){this._trackedEntities=t.filter(Boolean)}shouldUpdate(){if(!this.hass)return!1;if(0===this._trackedEntities.length)return!0;let t=!1;for(const e of this._trackedEntities){const i=this.hass.states[e]?.state;this._previousStates[e]!==i&&(this._previousStates[e]=i,t=!0)}return t}getEntity(t){return this.hass?.states[t]}getState(t){return this.hass?.states[t]?.state??"unavailable"}getEntityAttribute(t,e){return this.hass?.states[t]?.attributes[e]}isOn(t){return"on"===this.getState(t)}callService(t,e,i,s){this.hass?.callService(t,e,i,s?{entity_id:s}:void 0)}toggle(t){const[e]=t.split(".");this.callService(e,"toggle",void 0,t)}getCardSize(){return 1}static get glassStyles(){return o`
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
    `}}t([ut({attribute:!1})],bt.prototype,"hass",void 0),t([ut({attribute:!1})],bt.prototype,"_config",void 0);let vt=class extends bt{get _buttonConfig(){return this._config}setConfig(t){super.setConfig(t),t.entity&&this.setTrackedEntities([t.entity])}_handleTap(){const t=this._buttonConfig.tap_action?.action??"toggle";"toggle"===t&&this._config.entity?this.toggle(this._config.entity):"navigate"===t&&this._buttonConfig.tap_action?.navigation_path&&(window.location.hash=this._buttonConfig.tap_action.navigation_path)}render(){if(!this.hass||!this._config)return X``;const t=this._config.entity?this.getEntity(this._config.entity):void 0,e=!!t&&this.isOn(this._config.entity),i=this._config.name??t?.attributes.friendly_name??"",s=this._config.icon??t?.attributes.icon??"mdi:help-circle";let n="";if(!1!==this._buttonConfig.show_state&&t){const e=t.attributes.unit_of_measurement;n=e?`${t.state} ${e}`:"on"===t.state?"Pa":"off"===t.state?"Av":t.state}return X`
      <div class="glass button ${e?"active":""}" @click=${this._handleTap}>
        <div class="icon-wrap">
          <ha-icon .icon=${s}></ha-icon>
        </div>
        <div class="info">
          <div class="name">${i}</div>
          ${n?X`<div class="state">${n}</div>`:""}
        </div>
      </div>
    `}};vt.styles=[bt.glassStyles,o`
      :host { display: block; }
      .button {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px;
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
    `],vt=t([dt("glass-button")],vt);let _t=class extends bt{setConfig(t){super.setConfig(t),t.entity&&this.setTrackedEntities([t.entity])}get _chipConfig(){return this._config}render(){if(!this.hass||!this._config)return X``;const t=this._config.entity?this.getEntity(this._config.entity):void 0,e=this._chipConfig.chip_type??"custom";let i=this._config.icon??"",s="",n=!1;switch(e){case"person":{const e=t?.attributes.friendly_name??"",a=t?.state??"";i=i||"mdi:account",s=`${e} · ${"home"===a?"Hemma":"Borta"}`,n="home"===a;break}case"battery":{const e=t?.state??"?";i=i||"mdi:cellphone",s=`${e} %`,n=Number(e)>20;break}case"lights":{const e=t?.state??"0";i=i||"mdi:lightbulb-group",s=`${e} st`,n=Number(e)>0;break}default:i=i||"mdi:information",s=this._chipConfig.content??t?.state??""}return X`
      <div class="chip ${n?"active":""}">
        <ha-icon .icon=${i}></ha-icon>
        <span class="value">${s}</span>
      </div>
    `}};_t.styles=[bt.glassStyles,o`
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
    `],_t=t([dt("glass-chip")],_t);let yt=class extends bt{get _headerConfig(){return this._config}setConfig(t){super.setConfig(t);const e=[];t.weather_entity&&e.push(t.weather_entity),t.chips&&t.chips.forEach(t=>{t.entity&&e.push(t.entity)}),this.setTrackedEntities(e)}_renderChip(t){const e=this.getEntity(t.entity);if(!e)return X``;let i=t.icon??"",s="",n=!1;switch(t.chip_type){case"person":i=i||"mdi:account";s=`${e.attributes.friendly_name??""} · ${"home"===e.state?"Hemma":"Borta"}`,n="home"===e.state;break;case"battery":i=i||"mdi:cellphone",s=`${e.state} %`,n=Number(e.state)>20;break;case"lights":i=i||"mdi:lightbulb-group",s=`${e.state} st`,n=Number(e.state)>0;break;default:i=i||"mdi:information",s=e.state}return X`
      <div class="chip ${n?"active":""}">
        <ha-icon .icon=${i}></ha-icon>
        <span>${s}</span>
      </div>
    `}render(){if(!this.hass||!this._config)return X``;const t=this.hass.user?.name??"",e=!1!==this._headerConfig.greeting?function(t){const e=(new Date).getHours();return e>=5&&e<10?`God morgon, ${t}`:e>=10&&e<17?`Hej, ${t}`:e>=17&&e<22?`God kvall, ${t}`:`God natt, ${t}`}(t):t,i=this._headerConfig.weather_entity?this.getEntity(this._headerConfig.weather_entity):void 0,s=i?.state??"",n=i?.attributes.temperature??"",a=i?.attributes.temperature_unit??"°C",o={"clear-night":"mdi:weather-night",cloudy:"mdi:weather-cloudy",fog:"mdi:weather-fog",hail:"mdi:weather-hail",lightning:"mdi:weather-lightning","lightning-rainy":"mdi:weather-lightning-rainy",partlycloudy:"mdi:weather-partly-cloudy",pouring:"mdi:weather-pouring",rainy:"mdi:weather-rainy",snowy:"mdi:weather-snowy","snowy-rainy":"mdi:weather-snowy-rainy",sunny:"mdi:weather-sunny",windy:"mdi:weather-windy","windy-variant":"mdi:weather-windy-variant",exceptional:"mdi:alert-circle-outline"}[s]??"mdi:weather-cloudy";return X`
      <div class="glass header">
        <div class="top-row">
          <div class="home-icon">
            <ha-icon icon="mdi:home"></ha-icon>
          </div>
          <div class="greeting-section">
            <div class="greeting">${e}</div>
            ${i?X`
              <div class="weather">
                <ha-icon .icon=${o}></ha-icon>
                ${{"clear-night":"Klart",cloudy:"Molnigt",fog:"Dimma",partlycloudy:"Delvis molnigt",rainy:"Regn",snowy:"Sno",sunny:"Soligt",windy:"Blasigt"}[s]??s} \u2022 ${n}${a}
              </div>
            `:""}
          </div>
        </div>
        ${this._headerConfig.chips?.length?X`
          <div class="chips">
            ${this._headerConfig.chips.map(t=>this._renderChip(t))}
          </div>
        `:""}
      </div>
    `}};yt.styles=[bt.glassStyles,o`
      :host { display: block; }
      .header { padding: 12px 14px; }
      .top-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
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
    `],yt=t([dt("glass-header")],yt);let xt=class extends bt{get _roomConfig(){return this._config}setConfig(t){super.setConfig(t);const e=[];t.entity&&e.push(t.entity),t.sub_buttons&&t.sub_buttons.forEach(t=>e.push(t.entity)),this.setTrackedEntities(e)}_handleCardTap(){this._roomConfig.popup_id&&(window.location.hash=this._roomConfig.popup_id)}_handleSubButtonTap(t,e){t.stopPropagation(),this.toggle(e)}render(){if(!this.hass||!this._config)return X``;const t=this._roomConfig.sub_buttons??[],e=t.map(t=>t.entity);this._config.entity&&!e.includes(this._config.entity)&&e.unshift(this._config.entity);const i=e.some(t=>this.isOn(t)),s=function(t,e){const i=function(t,e){return e.filter(e=>"on"===t[e]?.state).length}(t,e);return 0===i?"Av":1===i?"Pa":`${i} lampor pa`}(this.hass.states,e),n=this._config.icon??"mdi:home",a=this._config.name??"";return X`
      <div class="glass room-card ${i?"active":""}" @click=${this._handleCardTap}>
        <div class="top">
          <div class="room-icon">
            <ha-icon .icon=${n}></ha-icon>
          </div>
          <div class="room-info">
            <div class="room-name">${a}</div>
            <div class="room-status">${s}</div>
          </div>
        </div>
        ${t.length?X`
          <div class="sub-buttons">
            ${t.map(t=>{const e=this.isOn(t.entity),i=t.icon??this.getEntity(t.entity)?.attributes.icon??"mdi:lightbulb";return X`
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
    `}};xt.styles=[bt.glassStyles,o`
      :host { display: block; }
      .room-card {
        padding: 12px;
        cursor: pointer;
        user-select: none;
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
        gap: 5px;
        margin-top: 8px;
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
    `],xt=t([dt("glass-room-card")],xt);let wt=class extends bt{constructor(){super(...arguments),this._dragging=!1,this._dragValue=0}setConfig(t){super.setConfig(t),t.entity&&this.setTrackedEntities([t.entity])}_handleSliderInteraction(t){if(!this._config.entity)return;const e=this.getEntity(this._config.entity);if(!e||"off"===e.state)return void this.callService("light","turn_on",{brightness_pct:100},this._config.entity);const i=t.currentTarget.getBoundingClientRect(),s=t=>{const e=Math.max(0,Math.min(t-i.left,i.width)),s=Math.round(e/i.width*100);this._dragValue=Math.max(1,Math.min(100,s))},n="touches"in t?t.touches[0].clientX:t.clientX;s(n),this._dragging=!0;const a=t=>{const e="touches"in t?t.touches[0].clientX:t.clientX;s(e)},o=()=>{this._dragging=!1,this.callService("light","turn_on",{brightness_pct:this._dragValue},this._config.entity),document.removeEventListener("mousemove",a),document.removeEventListener("mouseup",o),document.removeEventListener("touchmove",a),document.removeEventListener("touchend",o)};document.addEventListener("mousemove",a),document.addEventListener("mouseup",o),document.addEventListener("touchmove",a,{passive:!0}),document.addEventListener("touchend",o)}render(){if(!this.hass||!this._config?.entity)return X``;const t=this.getEntity(this._config.entity);if(!t)return X``;const e="on"===t.state,i=this._dragging?this._dragValue:function(t){if(!t||"on"!==t.state)return 0;const e=t.attributes.brightness;return e?Math.round(e/255*100):100}(t),s=this._config.name??t.attributes.friendly_name??"",n=this._config.icon??t.attributes.icon??"mdi:lightbulb";return X`
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
          ${e?X`
            <div class="slider-fill ${this._dragging?"dragging":""}" style="width: ${i}%"></div>
            <div class="slider-glow" style="left: calc(${i}% - 12px)"></div>
          `:X`
            <div class="off-overlay" @click=${()=>this.callService("light","turn_on",{brightness_pct:100},this._config.entity)}>
              Tryck for att tanda
            </div>
          `}
        </div>
      </div>
    `}};wt.styles=[bt.glassStyles,o`
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
    `],t([ft()],wt.prototype,"_dragging",void 0),t([ft()],wt.prototype,"_dragValue",void 0),wt=t([dt("glass-light-slider")],wt);const $t=o`
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
`;let kt=class extends lt{constructor(){super(...arguments),this._isOpen=!1,this._isClosing=!1,this._cards=[],this._onHashChange=()=>{this._checkHash()}}connectedCallback(){super.connectedCallback(),window.addEventListener("hashchange",this._onHashChange),this._checkHash()}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("hashchange",this._onHashChange)}_checkHash(){if(!this._config?.hash)return;const t=window.location.hash.replace("#","");t!==this._config.hash||this._isOpen?t!==this._config.hash&&this._isOpen&&this._close():this._open()}_open(){this._isOpen=!0,this._isClosing=!1,this._createPopupCards()}_close(){this._isClosing=!0,setTimeout(()=>{this._isOpen=!1,this._isClosing=!1},350),window.location.hash.replace("#","")===this._config.hash&&history.replaceState(null,"",window.location.pathname+window.location.search)}_handleBackdropClick(){this._close()}setConfig(t){if(!t.hash)throw new Error('glass-popup requires a "hash" property');this._config=t}set hass(t){this._hass=t,this._cards.forEach(e=>{e.hass=t})}get hass(){return this._hass}_createPopupCards(){this._config?.cards&&(this._cards=this._config.cards.map(t=>{const e=t.type?.startsWith("custom:")?t.type.replace("custom:",""):`hui-${t.type}-card`,i=document.createElement(e);return"function"==typeof i.setConfig&&i.setConfig(t),this.hass&&(i.hass=this.hass),i}),this.requestUpdate())}render(){return this._isOpen||this._isClosing?X`
      <div class="overlay ${this._isOpen&&!this._isClosing?"open":""} ${this._isClosing?"closing":""}">
        <div class="backdrop" @click=${this._handleBackdropClick}></div>
        <div class="panel">
          <div class="handle"></div>
          ${this._config.title?X`
            <div class="popup-header">
              ${this._config.icon?X`<ha-icon .icon=${this._config.icon}></ha-icon>`:""}
              <span class="popup-title">${this._config.title}</span>
            </div>
          `:""}
          <div class="popup-cards">
            ${this._cards.map(t=>t)}
          </div>
        </div>
      </div>
    `:X``}getCardSize(){return 0}};kt.styles=[$t,o`
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
    `],t([ut({attribute:!1})],kt.prototype,"_config",void 0),t([ft()],kt.prototype,"_isOpen",void 0),t([ft()],kt.prototype,"_isClosing",void 0),kt=t([dt("glass-popup")],kt);let Ct=class extends lt{constructor(){super(...arguments),this._activeHash="",this._onHashChange=()=>{const t=window.location.hash.replace("#","");this._config.items.some(e=>e.hash===t)&&(this._activeHash=t)}}connectedCallback(){super.connectedCallback(),this._activeHash=window.location.hash.replace("#","")||this._config?.items?.[0]?.hash||"",window.addEventListener("hashchange",this._onHashChange)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("hashchange",this._onHashChange)}setConfig(t){if(!t.items?.length)throw new Error('glass-nav-bar requires "items"');this._config=t}_handleTap(t){this._activeHash=t,window.location.hash=t}render(){return this._config?.items?X`
      <div class="nav-bar">
        ${this._config.items.map(t=>X`
          <div class="nav-item ${this._activeHash===t.hash?"active":""}" @click=${()=>this._handleTap(t.hash)}>
            <ha-icon .icon=${t.icon}></ha-icon>
            <span class="nav-label">${t.label}</span>
          </div>
        `)}
      </div>
    `:X``}getCardSize(){return 0}};Ct.styles=o`
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
  `,t([ut({attribute:!1})],Ct.prototype,"hass",void 0),t([ut({attribute:!1})],Ct.prototype,"_config",void 0),t([ft()],Ct.prototype,"_activeHash",void 0),Ct=t([dt("glass-nav-bar")],Ct);let Et=class extends bt{get _vacuumConfig(){return this._config}setConfig(t){super.setConfig(t),t.entity&&this.setTrackedEntities([t.entity])}_getStatusText(t){return{cleaning:"Stader",docked:"Dockad",paused:"Pausad",returning:"Atergar",idle:"Inaktiv",error:"Fel",unavailable:"Otillganglig"}[t]??t}_start(){this._config.entity&&this.callService("vacuum","start",void 0,this._config.entity)}_stop(){this._config.entity&&this.callService("vacuum","return_to_base",void 0,this._config.entity)}_cleanRoom(t){this._config.entity&&null!=t.room_id&&this.callService("vacuum","send_command",{command:"app_segment_clean",params:[t.room_id]},this._config.entity)}render(){if(!this.hass||!this._config?.entity)return X``;const t=this.getEntity(this._config.entity);if(!t)return X``;const e=t.state,i="cleaning"===e,s="error"===e,n=t.attributes.battery_level,a=this._config.name??t.attributes.friendly_name??"Vacuum",o=this._config.icon??"mdi:robot-vacuum";return X`
      <div
        class="glass vacuum-card ${i?"cleaning":""} ${s?"error":""}"
      >
        <div class="vacuum-header">
          <div class="vacuum-icon">
            <ha-icon .icon=${o}></ha-icon>
          </div>
          <div class="vacuum-info">
            <div class="vacuum-name">${a}</div>
            <div class="vacuum-status">${this._getStatusText(e)}</div>
          </div>
          ${null!=n?X`
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
        ${this._vacuumConfig.rooms?.length?X`
              <div class="rooms">
                ${this._vacuumConfig.rooms.map(t=>X`
                    <div class="room-btn" @click=${()=>this._cleanRoom(t)}>
                      ${t.name}
                    </div>
                  `)}
              </div>
            `:""}
      </div>
    `}};Et.styles=[bt.glassStyles,o`
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
    `],Et=t([dt("glass-vacuum-card")],Et);let At=class extends bt{get _infoConfig(){return this._config}setConfig(t){super.setConfig(t);const e=[];t.entity&&e.push(t.entity),t.secondary_entity&&e.push(t.secondary_entity),t.badge_entity&&e.push(t.badge_entity),this.setTrackedEntities(e)}render(){if(!this.hass||!this._config)return X``;const t=this._config.entity?this.getEntity(this._config.entity):void 0,e=this._config.name??t?.attributes.friendly_name??"",i=this._config.icon??t?.attributes.icon??"mdi:information";let s=t?.state??"";const n=t?.attributes.unit_of_measurement;n&&(s=`${s} ${n}`);const a=this._infoConfig.badge_entity?this.getEntity(this._infoConfig.badge_entity):void 0;return X`
      <div class="glass info-card">
        <div class="info-icon">
          <ha-icon .icon=${i}></ha-icon>
        </div>
        <div class="info-content">
          <div class="info-name">${e}</div>
          <div class="info-value">${s}</div>
        </div>
        ${a?X`
              <div class="badge">
                ${this._infoConfig.badge_icon?X`<ha-icon
                      .icon=${this._infoConfig.badge_icon}
                    ></ha-icon>`:""}
                ${a.state}
              </div>
            `:""}
      </div>
    `}};At.styles=[bt.glassStyles,o`
      :host {
        display: block;
      }
      .info-card {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
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
    `],At=t([dt("glass-info-row")],At);let St=class extends lt{set hass(t){}setConfig(t){if(!t.label)throw new Error('glass-section requires a "label" property');this._config=t}render(){return this._config?X`
      <div class="section">
        ${this._config.icon?X`<ha-icon .icon=${this._config.icon}></ha-icon>`:""}
        <span class="label">${this._config.label}</span>
      </div>
    `:X``}getCardSize(){return 0}};St.styles=o`
    :host { display: block; }
    .section {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 4px 0;
    }
    .label {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.35);
    }
    ha-icon {
      --mdc-icon-size: 14px;
      color: rgba(255, 255, 255, 0.25);
    }
  `,t([ut({attribute:!1})],St.prototype,"_config",void 0),St=t([dt("glass-section")],St);let Tt=class extends bt{get _departureConfig(){return this._config}setConfig(t){super.setConfig(t),t.entity&&this.setTrackedEntities([t.entity])}_getDepartures(){if(!this._config?.entity)return[];return this.getEntityAttribute(this._config.entity,"departures")??[]}_isDelayed(t){if(!t.scheduled||!t.expected)return!1;const e=new Date(t.scheduled).getTime();return new Date(t.expected).getTime()-e>6e4}_isSoon(t){const e=t.display?.toLowerCase()??"",i=e.match(/^(\d+)\s*min/);return i?parseInt(i[1],10)<=5:"nu"===e}_getTimeClass(t){return this._isDelayed(t)?"time delayed":this._isSoon(t)?"time soon":"time"}getCardSize(){return 3}render(){if(!this.hass||!this._config?.entity)return X``;const t=this._getDepartures(),e=this._departureConfig.max_departures??6,i=t.slice(0,e),s=this._departureConfig.station_name??this._departureConfig.name??(t.length>0?t[0].stop_area?.name:void 0)??"Avgångar",n=this._departureConfig.icon??"mdi:train";return X`
      <div class="glass departure-card">
        <div class="departure-header">
          <div class="departure-icon">
            <ha-icon .icon=${n}></ha-icon>
          </div>
          <div class="station-name">${s}</div>
        </div>
        ${0===i.length?X`<div class="empty-state">Inga avgångar</div>`:X`
              <div class="departure-list">
                ${i.map(t=>X`
                    <div class="departure-row">
                      <span class="line-badge">${t.line.designation}</span>
                      <span class="destination">${t.destination}</span>
                      <span class="track">Spår ${t.stop_point.designation}</span>
                      <span class=${this._getTimeClass(t)}>${t.display}</span>
                    </div>
                    ${t.deviations?.length?t.deviations.filter(t=>t.message).map(t=>X`<div class="deviation">${t.message}</div>`):q}
                  `)}
              </div>
            `}
      </div>
    `}};Tt.styles=[bt.glassStyles,o`
      :host {
        display: block;
      }
      .departure-card {
        padding: 14px;
      }
      .departure-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }
      .departure-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.06);
      }
      .departure-icon ha-icon {
        --mdc-icon-size: 22px;
        color: var(--glass-text-secondary);
      }
      .station-name {
        font-size: 15px;
        font-weight: 600;
        color: var(--glass-text-primary);
      }
      .departure-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .departure-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 4px;
        border-radius: 8px;
        transition: background var(--glass-transition);
      }
      .departure-row:hover {
        background: rgba(255, 255, 255, 0.04);
      }
      .line-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 38px;
        padding: 3px 8px;
        border-radius: 6px;
        background: rgba(79, 195, 247, 0.15);
        color: var(--glass-accent);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.02em;
        flex-shrink: 0;
      }
      .destination {
        flex: 1;
        font-size: 13px;
        font-weight: 500;
        color: var(--glass-text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        min-width: 0;
      }
      .track {
        font-size: 11px;
        color: var(--glass-text-dim);
        flex-shrink: 0;
        white-space: nowrap;
      }
      .time {
        font-size: 13px;
        font-weight: 600;
        color: var(--glass-text-secondary);
        font-variant-numeric: tabular-nums;
        flex-shrink: 0;
        text-align: right;
        min-width: 50px;
      }
      .time.soon {
        color: var(--glass-accent);
      }
      .time.delayed {
        color: var(--glass-coral);
      }
      .deviation {
        font-size: 11px;
        color: var(--glass-coral);
        padding: 2px 4px 2px 52px;
        opacity: 0.9;
      }
      .empty-state {
        text-align: center;
        padding: 16px 8px;
        font-size: 13px;
        color: var(--glass-text-dim);
      }
    `],Tt=t([dt("glass-departure-card")],Tt);const zt=o`
  :host([data-theme='natt']) {
    --hub-surface: #0A0A0C;
    --hub-card: #131316;
    --hub-card-border: #202026;
    --hub-text: #F2F1EE;
    --hub-text-muted: #8B8A92;
    --hub-text-dim: #55555E;
    --hub-amber: #F5B63C;       --hub-amber-text: #F6D9A0;  --hub-amber-muted: #A08A5E;
    --hub-amber-bg: linear-gradient(160deg, rgba(245,182,60,.13), rgba(245,182,60,.04));
    --hub-amber-border: rgba(245,182,60,.25);
    --hub-amber-glow: 0 0 28px rgba(245,182,60,.07);
    --hub-teal: #63D6C2;        --hub-teal-text: #9FE8DB;   --hub-teal-muted: #5F7F78;
    --hub-teal-bg: #101418;     --hub-teal-border: #1E2B31;
    --hub-green: #8EDCA8;       --hub-green-bg: rgba(110,220,160,.08); --hub-green-border: rgba(110,220,160,.18);
    --hub-lavender: #B99CF2;    --hub-lavender-text: #CDBBF0; --hub-lavender-muted: #7A6E92;
    --hub-lavender-bg: #141217; --hub-lavender-border: #262130;
    --hub-coral: #F2968C;       --hub-coral-bg: rgba(240,110,100,.12);
    --hub-chip-bg: #151519;     --hub-chip-border: #232329;
    --hub-track: #1E2B31;
    --hub-shadow: none;
  }
  :host([data-theme='dag']) {
    --hub-surface: #F3F0E9;
    --hub-card: #FFFFFF;
    --hub-card-border: #E8E3D8;
    --hub-text: #2A2823;
    --hub-text-muted: #8D877A;
    --hub-text-dim: #A9A395;
    --hub-amber: #F7BE4F;       --hub-amber-text: #2A2823;  --hub-amber-muted: #8D877A;
    --hub-amber-bg: #FFFFFF;
    --hub-amber-border: #F0E4C8;
    --hub-amber-glow: 0 2px 12px rgba(165,115,27,.08);
    --hub-teal: #2E9B87;        --hub-teal-text: #1F6E60;   --hub-teal-muted: #8D877A;
    --hub-teal-bg: #FFFFFF;     --hub-teal-border: #E8E3D8;
    --hub-green: #3E7A4C;       --hub-green-bg: #E9F2E7;    --hub-green-border: #D2E4CE;
    --hub-lavender: #8B6DC7;    --hub-lavender-text: #6B4FA8; --hub-lavender-muted: #8D877A;
    --hub-lavender-bg: #FFFFFF; --hub-lavender-border: #E4DDF0;
    --hub-coral: #C65445;       --hub-coral-bg: #FBE7E3;
    --hub-chip-bg: #FFFFFF;     --hub-chip-border: #E8E3D8;
    --hub-track: #EDE9DE;
    --hub-shadow: 0 1px 6px rgba(60,50,30,.05);
  }
  :host {
    --hub-font-display: 'Outfit', sans-serif;
    --hub-font-body: 'Inter', -apple-system, sans-serif;
    --hub-radius: 18px;
    --hub-radius-lg: 20px;
    --hub-radius-pill: 99px;
    --hub-gap: 12px;
    --hub-page-pad: clamp(20px, 3vw, 40px);
    --hub-fade: 600ms;
  }
`,Pt="glass-hub-theme";const Ft=["hem","ljus","media","energi","kcal"],Ht={hem:"Hem",ljus:"Ljus",media:"Media",energi:"Energi",kcal:"Kcal"};function Ot(t){return Ht[t]??t.charAt(0).toUpperCase()+t.slice(1)}const Ut=["auto","dag","natt"];class Dt extends bt{constructor(){super(...arguments),this.theme="natt",this._page=0,this._dragX=0,this._override=function(){const t=localStorage.getItem(Pt);return"natt"===t||"dag"===t?t:"auto"}(),this._dragging=!1,this._startX=0,this._lastX=0,this._lastT=0,this._velocity=0,this._onAnyInteraction=()=>{this._resetIdle()},this._onPointerDown=t=>{this._dragging=!0,this._startX=t.clientX,this._lastX=t.clientX,this._lastT=t.timeStamp,this._velocity=0,this._dragX=0,t.currentTarget.setPointerCapture?.(t.pointerId)},this._onPointerMove=t=>{if(!this._dragging)return;const e=t.timeStamp-this._lastT;e>0&&(this._velocity=(t.clientX-this._lastX)/e),this._lastX=t.clientX,this._lastT=t.timeStamp,this._dragX=t.clientX-this._startX},this._onPointerUp=t=>{if(!this._dragging)return;this._dragging=!1;const e=this.clientWidth||window.innerWidth;this._page=function(t,e,i,s,n){const a=.2*e,o=Math.abs(i)>.5;let r=s;return t<-a||o&&i<-.5?r=s+1:(t>a||o&&i>.5)&&(r=s-1),Math.max(0,Math.min(n-1,r))}(this._dragX,e,this._velocity,this._page,this._pages.length),this._dragX=0,this._velocity=0}}setConfig(t){super.setConfig(t)}get _cfg(){return this._config}get _pages(){return this._cfg?.pages??Ft}connectedCallback(){super.connectedCallback(),function(){if(document.getElementById("glass-hub-fonts"))return;const t=document.createElement("style");t.id="glass-hub-fonts",t.textContent="\n@font-face{font-family:'Outfit';src:url('/local/glass-cards/fonts/outfit-variable.woff2') format('woff2-variations');font-weight:100 900;font-display:swap;}\n@font-face{font-family:'Inter';src:url('/local/glass-cards/fonts/inter-variable.woff2') format('woff2-variations');font-weight:100 900;font-display:swap;}\n",document.head.appendChild(t)}(),this._applyTheme(),this._resetIdle(),this.addEventListener("pointerdown",this._onAnyInteraction)}disconnectedCallback(){super.disconnectedCallback(),this._clearIdle(),this.removeEventListener("pointerdown",this._onAnyInteraction)}willUpdate(t){t.has("hass")&&this._applyTheme()}goToPage(t){const e=this._pages.indexOf(t);e>=0&&(this._page=e,this._dragX=0)}_applyTheme(){const t=this.hass?.states["sun.sun"]?.attributes?.elevation,e="number"==typeof t?t:null;this.theme=function(t,e,i=4){return"auto"!==e?e:null===t?"natt":t>i?"dag":"natt"}(e,this._override,this._cfg?.day_elevation??4)}_cycleTheme(){const t=Ut.indexOf(this._override);this._override=Ut[(t+1)%Ut.length],function(t){localStorage.setItem(Pt,t)}(this._override),this._applyTheme()}_resetIdle(){this._clearIdle();const t=this._cfg?.idle_return_s??120;this._idleTimer=window.setTimeout(()=>{0!==this._page&&this.goToPage(this._pages[0])},1e3*t)}_clearIdle(){void 0!==this._idleTimer&&(clearTimeout(this._idleTimer),this._idleTimer=void 0)}_themeGlyph(){return"auto"===this._override?X`<span class="glyph-auto">A</span>`:"dag"===this._override?V`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
        stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"></circle>
        <line x1="12" y1="2" x2="12" y2="5"></line>
        <line x1="12" y1="19" x2="12" y2="22"></line>
        <line x1="2" y1="12" x2="5" y2="12"></line>
        <line x1="19" y1="12" x2="22" y2="12"></line>
        <line x1="4.9" y1="4.9" x2="7" y2="7"></line>
        <line x1="17" y1="17" x2="19.1" y2="19.1"></line>
        <line x1="4.9" y1="19.1" x2="7" y2="17"></line>
        <line x1="17" y1="7" x2="19.1" y2="4.9"></line>
      </svg>`:V`<svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M20 14.5A8 8 0 0 1 9.5 4a6.5 6.5 0 1 0 10.5 10.5z"></path>
    </svg>`}render(){const t=this._pages,e=t.length,i=`--page-count:${e};width:calc(100% * ${e});transform:translateX(calc(${-this._page} * 100% / ${e} + ${this._dragX}px));transition:${this._dragging?"none":"transform 320ms cubic-bezier(.3,.7,.3,1)"};`;return X`
      <div
        class="strip"
        style=${i}
        @pointerdown=${this._onPointerDown}
        @pointermove=${this._onPointerMove}
        @pointerup=${this._onPointerUp}
        @pointercancel=${this._onPointerUp}
      >
        ${t.map(t=>X`
            <section class="page" data-page-id=${t}>
              <h1 class="page-placeholder">${Ot(t)}</h1>
            </section>
          `)}
      </div>

      <button
        class="theme-toggle"
        aria-label="Byt tema"
        @click=${this._cycleTheme}
      >
        ${this._themeGlyph()}
      </button>

      <div class="dots">
        ${t.map((t,e)=>X`
            <button
              class="dot ${e===this._page?"active":""}"
              aria-label=${Ot(t)}
              @click=${()=>this.goToPage(t)}
            ></button>
          `)}
      </div>
    `}}Dt.styles=[zt,o`
      :host {
        position: absolute;
        inset: 0;
        overflow: hidden;
        background: var(--hub-surface);
        color: var(--hub-text);
        font-family: var(--hub-font-body);
        transition: background var(--hub-fade) ease;
        -webkit-tap-highlight-color: transparent;
      }

      .strip {
        display: flex;
        height: 100%;
        will-change: transform;
        touch-action: pan-y;
      }

      .page {
        flex: 0 0 calc(100% / var(--page-count));
        height: 100%;
        overflow: hidden;
        position: relative;
      }

      .page-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        margin: 0;
        font-family: var(--hub-font-display);
        font-weight: 300;
        font-size: clamp(32px, 6vw, 64px);
        color: var(--hub-text-muted);
        letter-spacing: 0.02em;
      }

      .theme-toggle {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: none;
        border-radius: 50%;
        background: transparent;
        color: var(--hub-text-muted);
        cursor: pointer;
        z-index: 20;
        -webkit-tap-highlight-color: transparent;
      }
      .theme-toggle svg {
        width: 24px;
        height: 24px;
      }
      .theme-toggle .glyph-auto {
        font-family: var(--hub-font-display);
        font-weight: 500;
        font-size: 20px;
      }

      .dots {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        z-index: 20;
      }
      .dot {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: none;
        background: transparent;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .dot::before {
        content: '';
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--hub-text-dim);
        transition: background 0.25s ease, transform 0.25s ease;
      }
      .dot.active::before {
        background: var(--hub-text);
        transform: scale(1.15);
      }
    `],t([ut({reflect:!0,attribute:"data-theme"})],Dt.prototype,"theme",void 0),t([ft()],Dt.prototype,"_page",void 0),t([ft()],Dt.prototype,"_dragX",void 0),customElements.define("glass-hub",Dt);const Mt=window;Mt.customCards=Mt.customCards||[],Mt.customCards.push({type:"glass-background",name:"Glass Background",description:"Animated gradient background"},{type:"glass-button",name:"Glass Button",description:"Toggle/info button"},{type:"glass-chip",name:"Glass Chip",description:"Small status pill"},{type:"glass-header",name:"Glass Header",description:"Greeting, weather, status chips"},{type:"glass-room-card",name:"Glass Room Card",description:"Room with sub-buttons and popup"},{type:"glass-light-slider",name:"Glass Light Slider",description:"Brightness slider with glow"},{type:"glass-popup",name:"Glass Popup",description:"Modal overlay"},{type:"glass-nav-bar",name:"Glass Nav Bar",description:"Bottom navigation"},{type:"glass-vacuum-card",name:"Glass Vacuum Card",description:"Vacuum controls"},{type:"glass-info-row",name:"Glass Info Row",description:"Information display"},{type:"glass-section",name:"Glass Section",description:"Section header label"},{type:"glass-departure-card",name:"Glass Departure Card",description:"Train departure list"},{type:"glass-hub",name:"Glass Hub",description:"Full-screen wall hub"}),console.info("%c GLASS CARDS %c v0.1.0 ","color: white; background: #4FC3F7; font-weight: bold; padding: 2px 6px; border-radius: 4px 0 0 4px;","color: #4FC3F7; background: rgba(79,195,247,0.1); padding: 2px 6px; border-radius: 0 4px 4px 0;");
