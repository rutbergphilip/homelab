function t(t,e,i,s){var a,r=arguments.length,o=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(t,e,i,s);else for(var n=t.length-1;n>=0;n--)(a=t[n])&&(o=(r<3?a(o):r>3?a(e,i,o):a(e,i))||o);return r>3&&o&&Object.defineProperty(e,i,o),o}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),a=new WeakMap;let r=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=a.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&a.set(e,t))}return t}toString(){return this.cssText}};const o=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new r(i,t,s)},n=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new r("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:l,defineProperty:c,getOwnPropertyDescriptor:h,getOwnPropertyNames:d,getOwnPropertySymbols:p,getPrototypeOf:u}=Object,g=globalThis,b=g.trustedTypes,m=b?b.emptyScript:"",v=g.reactiveElementPolyfillSupport,f=(t,e)=>t,x={toAttribute(t,e){switch(e){case Boolean:t=t?m:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},_=(t,e)=>!l(t,e),y={attribute:!0,type:String,converter:x,reflect:!1,useDefault:!1,hasChanged:_};Symbol.metadata??=Symbol("metadata"),g.litPropertyMetadata??=new WeakMap;let w=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=y){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&c(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:a}=h(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const r=s?.call(this);a?.call(this,e),this.requestUpdate(t,r,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??y}static _$Ei(){if(this.hasOwnProperty(f("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(f("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(f("properties"))){const t=this.properties,e=[...d(t),...p(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(n(t))}else void 0!==t&&e.push(n(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(i)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of s){const s=document.createElement("style"),a=e.litNonce;void 0!==a&&s.setAttribute("nonce",a),s.textContent=i.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const a=(void 0!==i.converter?.toAttribute?i.converter:x).toAttribute(e,i.type);this._$Em=t,null==a?this.removeAttribute(s):this.setAttribute(s,a),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),a="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:x;this._$Em=s;const r=a.fromAttribute(e,t.type);this[s]=r??this._$Ej?.get(s)??r,this._$Em=null}}requestUpdate(t,e,i,s=!1,a){if(void 0!==t){const r=this.constructor;if(!1===s&&(a=this[t]),i??=r.getPropertyOptions(t),!((i.hasChanged??_)(a,e)||i.useDefault&&i.reflect&&a===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:a},r){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??e??this[t]),!0!==a||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};w.elementStyles=[],w.shadowRootOptions={mode:"open"},w[f("elementProperties")]=new Map,w[f("finalized")]=new Map,v?.({ReactiveElement:w}),(g.reactiveElementVersions??=[]).push("2.1.2");const $=globalThis,k=t=>t,C=$.trustedTypes,E=C?C.createPolicy("lit-html",{createHTML:t=>t}):void 0,A="$lit$",S=`lit$${Math.random().toFixed(9).slice(2)}$`,T="?"+S,M=`<${T}>`,P=document,z=()=>P.createComment(""),F=t=>null===t||"object"!=typeof t&&"function"!=typeof t,H=Array.isArray,O="[ \t\n\f\r]",D=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,j=/-->/g,N=/>/g,U=RegExp(`>|${O}(?:([^\\s"'>=/]+)(${O}*=${O}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),R=/'/g,B=/"/g,I=/^(?:script|style|textarea|title)$/i,L=t=>(e,...i)=>({_$litType$:t,strings:e,values:i}),X=L(1),V=L(2),G=Symbol.for("lit-noChange"),q=Symbol.for("lit-nothing"),Y=new WeakMap,W=P.createTreeWalker(P,129);function K(t,e){if(!H(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==E?E.createHTML(e):e}const J=(t,e)=>{const i=t.length-1,s=[];let a,r=2===e?"<svg>":3===e?"<math>":"",o=D;for(let e=0;e<i;e++){const i=t[e];let n,l,c=-1,h=0;for(;h<i.length&&(o.lastIndex=h,l=o.exec(i),null!==l);)h=o.lastIndex,o===D?"!--"===l[1]?o=j:void 0!==l[1]?o=N:void 0!==l[2]?(I.test(l[2])&&(a=RegExp("</"+l[2],"g")),o=U):void 0!==l[3]&&(o=U):o===U?">"===l[0]?(o=a??D,c=-1):void 0===l[1]?c=-2:(c=o.lastIndex-l[2].length,n=l[1],o=void 0===l[3]?U:'"'===l[3]?B:R):o===B||o===R?o=U:o===j||o===N?o=D:(o=U,a=void 0);const d=o===U&&t[e+1].startsWith("/>")?" ":"";r+=o===D?i+M:c>=0?(s.push(n),i.slice(0,c)+A+i.slice(c)+S+d):i+S+(-2===c?e:d)}return[K(t,r+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class Z{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let a=0,r=0;const o=t.length-1,n=this.parts,[l,c]=J(t,e);if(this.el=Z.createElement(l,i),W.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=W.nextNode())&&n.length<o;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(A)){const e=c[r++],i=s.getAttribute(t).split(S),o=/([.?@])?(.*)/.exec(e);n.push({type:1,index:a,name:o[2],strings:i,ctor:"."===o[1]?st:"?"===o[1]?at:"@"===o[1]?rt:it}),s.removeAttribute(t)}else t.startsWith(S)&&(n.push({type:6,index:a}),s.removeAttribute(t));if(I.test(s.tagName)){const t=s.textContent.split(S),e=t.length-1;if(e>0){s.textContent=C?C.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],z()),W.nextNode(),n.push({type:2,index:++a});s.append(t[e],z())}}}else if(8===s.nodeType)if(s.data===T)n.push({type:2,index:a});else{let t=-1;for(;-1!==(t=s.data.indexOf(S,t+1));)n.push({type:7,index:a}),t+=S.length-1}a++}}static createElement(t,e){const i=P.createElement("template");return i.innerHTML=t,i}}function Q(t,e,i=t,s){if(e===G)return e;let a=void 0!==s?i._$Co?.[s]:i._$Cl;const r=F(e)?void 0:e._$litDirective$;return a?.constructor!==r&&(a?._$AO?.(!1),void 0===r?a=void 0:(a=new r(t),a._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=a:i._$Cl=a),void 0!==a&&(e=Q(t,a._$AS(t,e.values),a,s)),e}class tt{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??P).importNode(e,!0);W.currentNode=s;let a=W.nextNode(),r=0,o=0,n=i[0];for(;void 0!==n;){if(r===n.index){let e;2===n.type?e=new et(a,a.nextSibling,this,t):1===n.type?e=new n.ctor(a,n.name,n.strings,this,t):6===n.type&&(e=new ot(a,this,t)),this._$AV.push(e),n=i[++o]}r!==n?.index&&(a=W.nextNode(),r++)}return W.currentNode=P,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class et{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=q,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Q(this,t,e),F(t)?t===q||null==t||""===t?(this._$AH!==q&&this._$AR(),this._$AH=q):t!==this._$AH&&t!==G&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>H(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==q&&F(this._$AH)?this._$AA.nextSibling.data=t:this.T(P.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=Z.createElement(K(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new tt(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=Y.get(t.strings);return void 0===e&&Y.set(t.strings,e=new Z(t)),e}k(t){H(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const a of t)s===e.length?e.push(i=new et(this.O(z()),this.O(z()),this,this.options)):i=e[s],i._$AI(a),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=k(t).nextSibling;k(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class it{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,a){this.type=1,this._$AH=q,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=a,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=q}_$AI(t,e=this,i,s){const a=this.strings;let r=!1;if(void 0===a)t=Q(this,t,e,0),r=!F(t)||t!==this._$AH&&t!==G,r&&(this._$AH=t);else{const s=t;let o,n;for(t=a[0],o=0;o<a.length-1;o++)n=Q(this,s[i+o],e,o),n===G&&(n=this._$AH[o]),r||=!F(n)||n!==this._$AH[o],n===q?t=q:t!==q&&(t+=(n??"")+a[o+1]),this._$AH[o]=n}r&&!s&&this.j(t)}j(t){t===q?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class st extends it{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===q?void 0:t}}class at extends it{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==q)}}class rt extends it{constructor(t,e,i,s,a){super(t,e,i,s,a),this.type=5}_$AI(t,e=this){if((t=Q(this,t,e,0)??q)===G)return;const i=this._$AH,s=t===q&&i!==q||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,a=t!==q&&(i===q||s);s&&this.element.removeEventListener(this.name,this,i),a&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class ot{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Q(this,t)}}const nt=$.litHtmlPolyfillSupport;nt?.(Z,et),($.litHtmlVersions??=[]).push("3.3.2");const lt=globalThis;class ct extends w{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let a=s._$litPart$;if(void 0===a){const t=i?.renderBefore??null;s._$litPart$=a=new et(e.insertBefore(z(),t),t,void 0,i??{})}return a._$AI(t),a})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return G}}ct._$litElement$=!0,ct.finalized=!0,lt.litElementHydrateSupport?.({LitElement:ct});const ht=lt.litElementPolyfillSupport;ht?.({LitElement:ct}),(lt.litElementVersions??=[]).push("4.2.2");const dt=t=>(e,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},pt={attribute:!0,type:String,converter:x,reflect:!1,hasChanged:_},ut=(t=pt,e,i)=>{const{kind:s,metadata:a}=i;let r=globalThis.litPropertyMetadata.get(a);if(void 0===r&&globalThis.litPropertyMetadata.set(a,r=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),r.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const a=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,a,t,!0,i)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const a=this[s];e.call(this,i),this.requestUpdate(s,a,t,!0,i)}}throw Error("Unsupported decorator location: "+s)};function gt(t){return(e,i)=>"object"==typeof i?ut(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}function bt(t){return gt({...t,state:!0,attribute:!1})}let mt=class extends ct{constructor(){super(...arguments),this._cards=[],this._activeView=null,this._cardConfigs=[],this._boundHashChange=this._onHashChange.bind(this)}connectedCallback(){super.connectedCallback(),window.addEventListener("hashchange",this._boundHashChange),this._activeView=this._getViewFromHash()??this._config?.default_view??null}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("hashchange",this._boundHashChange)}_onHashChange(){const t=this._getViewFromHash();null!==t&&(this._activeView=t),location.hash&&"#"!==location.hash||(this._activeView=this._config?.default_view??null)}_getViewFromHash(){const t=location.hash.replace("#","");if(!t)return null;return(this._config?.views??[]).includes(t)?t:null}setConfig(t){this._config=t,this._activeView=this._getViewFromHash()??t.default_view??null,this._createCards()}set hass(t){this._hass=t,this._cards.forEach(e=>{e.hass=t})}get hass(){return this._hass}_createCards(){this._config.cards&&(this._cardConfigs=this._config.cards,this._cards=this._config.cards.map(t=>{const e=t.type?.startsWith("custom:")?t.type.replace("custom:",""):`hui-${t.type}-card`,i=document.createElement(e);return"function"==typeof i.setConfig&&i.setConfig(t),i}),this.requestUpdate())}render(){const t=this._cards.filter((t,e)=>{const i=this._cardConfigs[e];return!i||!i.view||i.view===this._activeView});return X`
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
    `],t([gt({attribute:!1})],mt.prototype,"_config",void 0),t([gt({attribute:!1})],mt.prototype,"_cards",void 0),t([bt()],mt.prototype,"_activeView",void 0),mt=t([dt("glass-background")],mt);class vt extends ct{constructor(){super(...arguments),this._trackedEntities=[],this._previousStates={}}setConfig(t){this._config=t}setTrackedEntities(t){this._trackedEntities=t.filter(Boolean)}shouldUpdate(){if(!this.hass)return!1;if(0===this._trackedEntities.length)return!0;let t=!1;for(const e of this._trackedEntities){const i=this.hass.states[e]?.state;this._previousStates[e]!==i&&(this._previousStates[e]=i,t=!0)}return t}getEntity(t){return this.hass?.states[t]}getState(t){return this.hass?.states[t]?.state??"unavailable"}getEntityAttribute(t,e){return this.hass?.states[t]?.attributes[e]}isOn(t){return"on"===this.getState(t)}callService(t,e,i,s){this.hass?.callService(t,e,i,s?{entity_id:s}:void 0)}toggle(t){const[e]=t.split(".");this.callService(e,"toggle",void 0,t)}getCardSize(){return 1}static get glassStyles(){return o`
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
    `}}t([gt({attribute:!1})],vt.prototype,"hass",void 0),t([gt({attribute:!1})],vt.prototype,"_config",void 0);let ft=class extends vt{get _buttonConfig(){return this._config}setConfig(t){super.setConfig(t),t.entity&&this.setTrackedEntities([t.entity])}_handleTap(){const t=this._buttonConfig.tap_action?.action??"toggle";"toggle"===t&&this._config.entity?this.toggle(this._config.entity):"navigate"===t&&this._buttonConfig.tap_action?.navigation_path&&(window.location.hash=this._buttonConfig.tap_action.navigation_path)}render(){if(!this.hass||!this._config)return X``;const t=this._config.entity?this.getEntity(this._config.entity):void 0,e=!!t&&this.isOn(this._config.entity),i=this._config.name??t?.attributes.friendly_name??"",s=this._config.icon??t?.attributes.icon??"mdi:help-circle";let a="";if(!1!==this._buttonConfig.show_state&&t){const e=t.attributes.unit_of_measurement;a=e?`${t.state} ${e}`:"on"===t.state?"Pa":"off"===t.state?"Av":t.state}return X`
      <div class="glass button ${e?"active":""}" @click=${this._handleTap}>
        <div class="icon-wrap">
          <ha-icon .icon=${s}></ha-icon>
        </div>
        <div class="info">
          <div class="name">${i}</div>
          ${a?X`<div class="state">${a}</div>`:""}
        </div>
      </div>
    `}};ft.styles=[vt.glassStyles,o`
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
    `],ft=t([dt("glass-button")],ft);let xt=class extends vt{setConfig(t){super.setConfig(t),t.entity&&this.setTrackedEntities([t.entity])}get _chipConfig(){return this._config}render(){if(!this.hass||!this._config)return X``;const t=this._config.entity?this.getEntity(this._config.entity):void 0,e=this._chipConfig.chip_type??"custom";let i=this._config.icon??"",s="",a=!1;switch(e){case"person":{const e=t?.attributes.friendly_name??"",r=t?.state??"";i=i||"mdi:account",s=`${e} · ${"home"===r?"Hemma":"Borta"}`,a="home"===r;break}case"battery":{const e=t?.state??"?";i=i||"mdi:cellphone",s=`${e} %`,a=Number(e)>20;break}case"lights":{const e=t?.state??"0";i=i||"mdi:lightbulb-group",s=`${e} st`,a=Number(e)>0;break}default:i=i||"mdi:information",s=this._chipConfig.content??t?.state??""}return X`
      <div class="chip ${a?"active":""}">
        <ha-icon .icon=${i}></ha-icon>
        <span class="value">${s}</span>
      </div>
    `}};xt.styles=[vt.glassStyles,o`
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
    `],xt=t([dt("glass-chip")],xt);let _t=class extends vt{get _headerConfig(){return this._config}setConfig(t){super.setConfig(t);const e=[];t.weather_entity&&e.push(t.weather_entity),t.chips&&t.chips.forEach(t=>{t.entity&&e.push(t.entity)}),this.setTrackedEntities(e)}_renderChip(t){const e=this.getEntity(t.entity);if(!e)return X``;let i=t.icon??"",s="",a=!1;switch(t.chip_type){case"person":i=i||"mdi:account";s=`${e.attributes.friendly_name??""} · ${"home"===e.state?"Hemma":"Borta"}`,a="home"===e.state;break;case"battery":i=i||"mdi:cellphone",s=`${e.state} %`,a=Number(e.state)>20;break;case"lights":i=i||"mdi:lightbulb-group",s=`${e.state} st`,a=Number(e.state)>0;break;default:i=i||"mdi:information",s=e.state}return X`
      <div class="chip ${a?"active":""}">
        <ha-icon .icon=${i}></ha-icon>
        <span>${s}</span>
      </div>
    `}render(){if(!this.hass||!this._config)return X``;const t=this.hass.user?.name??"",e=!1!==this._headerConfig.greeting?function(t){const e=(new Date).getHours();return e>=5&&e<10?`God morgon, ${t}`:e>=10&&e<17?`Hej, ${t}`:e>=17&&e<22?`God kvall, ${t}`:`God natt, ${t}`}(t):t,i=this._headerConfig.weather_entity?this.getEntity(this._headerConfig.weather_entity):void 0,s=i?.state??"",a=i?.attributes.temperature??"",r=i?.attributes.temperature_unit??"°C",o={"clear-night":"mdi:weather-night",cloudy:"mdi:weather-cloudy",fog:"mdi:weather-fog",hail:"mdi:weather-hail",lightning:"mdi:weather-lightning","lightning-rainy":"mdi:weather-lightning-rainy",partlycloudy:"mdi:weather-partly-cloudy",pouring:"mdi:weather-pouring",rainy:"mdi:weather-rainy",snowy:"mdi:weather-snowy","snowy-rainy":"mdi:weather-snowy-rainy",sunny:"mdi:weather-sunny",windy:"mdi:weather-windy","windy-variant":"mdi:weather-windy-variant",exceptional:"mdi:alert-circle-outline"}[s]??"mdi:weather-cloudy";return X`
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
                ${{"clear-night":"Klart",cloudy:"Molnigt",fog:"Dimma",partlycloudy:"Delvis molnigt",rainy:"Regn",snowy:"Sno",sunny:"Soligt",windy:"Blasigt"}[s]??s} \u2022 ${a}${r}
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
    `}};_t.styles=[vt.glassStyles,o`
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
    `],_t=t([dt("glass-header")],_t);let yt=class extends vt{get _roomConfig(){return this._config}setConfig(t){super.setConfig(t);const e=[];t.entity&&e.push(t.entity),t.sub_buttons&&t.sub_buttons.forEach(t=>e.push(t.entity)),this.setTrackedEntities(e)}_handleCardTap(){this._roomConfig.popup_id&&(window.location.hash=this._roomConfig.popup_id)}_handleSubButtonTap(t,e){t.stopPropagation(),this.toggle(e)}render(){if(!this.hass||!this._config)return X``;const t=this._roomConfig.sub_buttons??[],e=t.map(t=>t.entity);this._config.entity&&!e.includes(this._config.entity)&&e.unshift(this._config.entity);const i=e.some(t=>this.isOn(t)),s=function(t,e){const i=function(t,e){return e.filter(e=>"on"===t[e]?.state).length}(t,e);return 0===i?"Av":1===i?"Pa":`${i} lampor pa`}(this.hass.states,e),a=this._config.icon??"mdi:home",r=this._config.name??"";return X`
      <div class="glass room-card ${i?"active":""}" @click=${this._handleCardTap}>
        <div class="top">
          <div class="room-icon">
            <ha-icon .icon=${a}></ha-icon>
          </div>
          <div class="room-info">
            <div class="room-name">${r}</div>
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
    `}};yt.styles=[vt.glassStyles,o`
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
    `],yt=t([dt("glass-room-card")],yt);let wt=class extends vt{constructor(){super(...arguments),this._dragging=!1,this._dragValue=0}setConfig(t){super.setConfig(t),t.entity&&this.setTrackedEntities([t.entity])}_handleSliderInteraction(t){if(!this._config.entity)return;const e=this.getEntity(this._config.entity);if(!e||"off"===e.state)return void this.callService("light","turn_on",{brightness_pct:100},this._config.entity);const i=t.currentTarget.getBoundingClientRect(),s=t=>{const e=Math.max(0,Math.min(t-i.left,i.width)),s=Math.round(e/i.width*100);this._dragValue=Math.max(1,Math.min(100,s))},a="touches"in t?t.touches[0].clientX:t.clientX;s(a),this._dragging=!0;const r=t=>{const e="touches"in t?t.touches[0].clientX:t.clientX;s(e)},o=()=>{this._dragging=!1,this.callService("light","turn_on",{brightness_pct:this._dragValue},this._config.entity),document.removeEventListener("mousemove",r),document.removeEventListener("mouseup",o),document.removeEventListener("touchmove",r),document.removeEventListener("touchend",o)};document.addEventListener("mousemove",r),document.addEventListener("mouseup",o),document.addEventListener("touchmove",r,{passive:!0}),document.addEventListener("touchend",o)}render(){if(!this.hass||!this._config?.entity)return X``;const t=this.getEntity(this._config.entity);if(!t)return X``;const e="on"===t.state,i=this._dragging?this._dragValue:function(t){if(!t||"on"!==t.state)return 0;const e=t.attributes.brightness;return e?Math.round(e/255*100):100}(t),s=this._config.name??t.attributes.friendly_name??"",a=this._config.icon??t.attributes.icon??"mdi:lightbulb";return X`
      <div class="glass slider-card ${e?"on":"off"}">
        <div class="slider-header">
          <div class="slider-left">
            <div class="light-icon">
              <ha-icon .icon=${a}></ha-icon>
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
              Tryck för att tända
            </div>
          `}
        </div>
      </div>
    `}};wt.styles=[vt.glassStyles,o`
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
        background: var(--hub-icon-chip-bg, rgba(255, 255, 255, 0.06));
        transition: all var(--glass-transition);
      }
      .on .light-icon {
        background: var(--hub-amber-border, rgba(79, 195, 247, 0.12));
        box-shadow: var(--hub-amber-glow, 0 0 12px rgba(79, 195, 247, 0.15));
      }
      .light-icon ha-icon {
        --mdc-icon-size: 20px;
        color: var(--hub-text-dim, var(--glass-text-dim));
        transition: color var(--glass-transition);
      }
      .on .light-icon ha-icon { color: var(--hub-amber, var(--glass-accent)); }
      .light-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--hub-text, var(--glass-text-primary));
      }
      .brightness-value {
        font-size: 14px;
        font-weight: 600;
        color: var(--hub-text-muted, var(--glass-text-dim));
        font-variant-numeric: tabular-nums;
        min-width: 36px;
        text-align: right;
      }
      .on .brightness-value { color: var(--hub-amber, var(--glass-accent)); }
      .slider-track {
        position: relative;
        height: 36px;
        border-radius: 18px;
        background: var(--hub-track, rgba(255, 255, 255, 0.06));
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
        background: linear-gradient(
          90deg,
          var(--hub-amber, var(--glass-accent)),
          var(--hub-amber-muted, var(--glass-accent-light, #B3E5FC))
        );
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
        background: radial-gradient(circle, var(--hub-amber, rgba(79, 195, 247, 0.4)), transparent);
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
        color: var(--hub-text-dim, var(--glass-text-dim));
        cursor: pointer;
      }
    `],t([bt()],wt.prototype,"_dragging",void 0),t([bt()],wt.prototype,"_dragValue",void 0),wt=t([dt("glass-light-slider")],wt);const $t=o`
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
`;let kt=class extends ct{constructor(){super(...arguments),this._isOpen=!1,this._isClosing=!1,this._cards=[],this._onHashChange=()=>{this._checkHash()}}connectedCallback(){super.connectedCallback(),window.addEventListener("hashchange",this._onHashChange),this._checkHash()}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("hashchange",this._onHashChange)}_checkHash(){if(!this._config?.hash)return;const t=window.location.hash.replace("#","");t!==this._config.hash||this._isOpen?t!==this._config.hash&&this._isOpen&&this._close():this._open()}_open(){this._isOpen=!0,this._isClosing=!1,this._createPopupCards()}_close(){this._isClosing=!0,setTimeout(()=>{this._isOpen=!1,this._isClosing=!1},350),window.location.hash.replace("#","")===this._config.hash&&history.replaceState(null,"",window.location.pathname+window.location.search)}_handleBackdropClick(){this._close()}setConfig(t){if(!t.hash)throw new Error('glass-popup requires a "hash" property');this._config=t}set hass(t){this._hass=t,this._cards.forEach(e=>{e.hass=t})}get hass(){return this._hass}_createPopupCards(){this._config?.cards&&(this._cards=this._config.cards.map(t=>{const e=t.type?.startsWith("custom:")?t.type.replace("custom:",""):`hui-${t.type}-card`,i=document.createElement(e);return"function"==typeof i.setConfig&&i.setConfig(t),this.hass&&(i.hass=this.hass),i}),this.requestUpdate())}render(){return this._isOpen||this._isClosing?X`
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
    `],t([gt({attribute:!1})],kt.prototype,"_config",void 0),t([bt()],kt.prototype,"_isOpen",void 0),t([bt()],kt.prototype,"_isClosing",void 0),kt=t([dt("glass-popup")],kt);let Ct=class extends ct{constructor(){super(...arguments),this._activeHash="",this._onHashChange=()=>{const t=window.location.hash.replace("#","");this._config.items.some(e=>e.hash===t)&&(this._activeHash=t)}}connectedCallback(){super.connectedCallback(),this._activeHash=window.location.hash.replace("#","")||this._config?.items?.[0]?.hash||"",window.addEventListener("hashchange",this._onHashChange)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("hashchange",this._onHashChange)}setConfig(t){if(!t.items?.length)throw new Error('glass-nav-bar requires "items"');this._config=t}_handleTap(t){this._activeHash=t,window.location.hash=t}render(){return this._config?.items?X`
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
  `,t([gt({attribute:!1})],Ct.prototype,"hass",void 0),t([gt({attribute:!1})],Ct.prototype,"_config",void 0),t([bt()],Ct.prototype,"_activeHash",void 0),Ct=t([dt("glass-nav-bar")],Ct);let Et=class extends vt{get _vacuumConfig(){return this._config}setConfig(t){super.setConfig(t),t.entity&&this.setTrackedEntities([t.entity])}_getStatusText(t){return{cleaning:"Stader",docked:"Dockad",paused:"Pausad",returning:"Atergar",idle:"Inaktiv",error:"Fel",unavailable:"Otillganglig"}[t]??t}_start(){this._config.entity&&this.callService("vacuum","start",void 0,this._config.entity)}_stop(){this._config.entity&&this.callService("vacuum","return_to_base",void 0,this._config.entity)}_cleanRoom(t){this._config.entity&&null!=t.room_id&&this.callService("vacuum","send_command",{command:"app_segment_clean",params:[t.room_id]},this._config.entity)}render(){if(!this.hass||!this._config?.entity)return X``;const t=this.getEntity(this._config.entity);if(!t)return X``;const e=t.state,i="cleaning"===e,s="error"===e,a=t.attributes.battery_level,r=this._config.name??t.attributes.friendly_name??"Vacuum",o=this._config.icon??"mdi:robot-vacuum";return X`
      <div
        class="glass vacuum-card ${i?"cleaning":""} ${s?"error":""}"
      >
        <div class="vacuum-header">
          <div class="vacuum-icon">
            <ha-icon .icon=${o}></ha-icon>
          </div>
          <div class="vacuum-info">
            <div class="vacuum-name">${r}</div>
            <div class="vacuum-status">${this._getStatusText(e)}</div>
          </div>
          ${null!=a?X`
                <div class="vacuum-battery">
                  <ha-icon
                    icon="mdi:battery${a>80?"":a>60?"-80":a>40?"-60":a>20?"-40":"-20"}"
                  ></ha-icon>
                  ${a}%
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
    `}};Et.styles=[vt.glassStyles,o`
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
    `],Et=t([dt("glass-vacuum-card")],Et);let At=class extends vt{get _infoConfig(){return this._config}setConfig(t){super.setConfig(t);const e=[];t.entity&&e.push(t.entity),t.secondary_entity&&e.push(t.secondary_entity),t.badge_entity&&e.push(t.badge_entity),this.setTrackedEntities(e)}render(){if(!this.hass||!this._config)return X``;const t=this._config.entity?this.getEntity(this._config.entity):void 0,e=this._config.name??t?.attributes.friendly_name??"",i=this._config.icon??t?.attributes.icon??"mdi:information";let s=t?.state??"";const a=t?.attributes.unit_of_measurement;a&&(s=`${s} ${a}`);const r=this._infoConfig.badge_entity?this.getEntity(this._infoConfig.badge_entity):void 0;return X`
      <div class="glass info-card">
        <div class="info-icon">
          <ha-icon .icon=${i}></ha-icon>
        </div>
        <div class="info-content">
          <div class="info-name">${e}</div>
          <div class="info-value">${s}</div>
        </div>
        ${r?X`
              <div class="badge">
                ${this._infoConfig.badge_icon?X`<ha-icon
                      .icon=${this._infoConfig.badge_icon}
                    ></ha-icon>`:""}
                ${r.state}
              </div>
            `:""}
      </div>
    `}};At.styles=[vt.glassStyles,o`
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
    `],At=t([dt("glass-info-row")],At);let St=class extends ct{set hass(t){}setConfig(t){if(!t.label)throw new Error('glass-section requires a "label" property');this._config=t}render(){return this._config?X`
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
  `,t([gt({attribute:!1})],St.prototype,"_config",void 0),St=t([dt("glass-section")],St);let Tt=class extends vt{get _departureConfig(){return this._config}setConfig(t){super.setConfig(t),t.entity&&this.setTrackedEntities([t.entity])}_getDepartures(){if(!this._config?.entity)return[];return this.getEntityAttribute(this._config.entity,"departures")??[]}_isDelayed(t){if(!t.scheduled||!t.expected)return!1;const e=new Date(t.scheduled).getTime();return new Date(t.expected).getTime()-e>6e4}_isSoon(t){const e=t.display?.toLowerCase()??"",i=e.match(/^(\d+)\s*min/);return i?parseInt(i[1],10)<=5:"nu"===e}_getTimeClass(t){return this._isDelayed(t)?"time delayed":this._isSoon(t)?"time soon":"time"}getCardSize(){return 3}render(){if(!this.hass||!this._config?.entity)return X``;const t=this._getDepartures(),e=this._departureConfig.max_departures??6,i=t.slice(0,e),s=this._departureConfig.station_name??this._departureConfig.name??(t.length>0?t[0].stop_area?.name:void 0)??"Avgångar",a=this._departureConfig.icon??"mdi:train";return X`
      <div class="glass departure-card">
        <div class="departure-header">
          <div class="departure-icon">
            <ha-icon .icon=${a}></ha-icon>
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
    `}};Tt.styles=[vt.glassStyles,o`
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
    `],Tt=t([dt("glass-departure-card")],Tt);const Mt=o`
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
    --hub-coral: #F2968C;       --hub-coral-bg: rgba(240,110,100,.12); --hub-coral-border: rgba(240,110,100,.25);
    --hub-chip-bg: #151519;     --hub-chip-border: #232329;
    --hub-icon-chip-bg: #1d1d23; --hub-icon-chip-color: #5E5E68;
    --hub-track: #1E2B31;
    --hub-shadow: none;
    --hub-scrim: rgba(0, 0, 0, 0.4);
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
    --hub-coral: #C65445;       --hub-coral-bg: #FBE7E3; --hub-coral-border: #F0CFC8;
    --hub-chip-bg: #FFFFFF;     --hub-chip-border: #E8E3D8;
    --hub-icon-chip-bg: #F1EDE3; --hub-icon-chip-color: #B4AC99;
    --hub-track: #EDE9DE;
    --hub-shadow: 0 1px 6px rgba(60,50,30,.05);
    --hub-scrim: rgba(40, 35, 25, 0.25);
  }
  :host {
    --hub-font-display: 'Outfit', sans-serif;
    --hub-font-body: 'Inter', -apple-system, sans-serif;
    --hub-radius: 18px;
    --hub-radius-lg: 20px;
    --hub-radius-sm: 12px;
    --hub-radius-pill: 99px;
    --hub-gap: 12px;
    --hub-page-pad: clamp(20px, 3vw, 40px);
    --hub-fade: 600ms;
  }
`,Pt="glass-hub-theme";function zt(t,e=8){return Math.abs(t)>e}const Ft=new Intl.DateTimeFormat("sv-SE",{weekday:"long",day:"numeric",month:"long"});class Ht extends vt{constructor(){super(...arguments),this._now=new Date}connectedCallback(){super.connectedCallback(),this._interval=window.setInterval(()=>{this._now=new Date},3e4)}disconnectedCallback(){super.disconnectedCallback(),void 0!==this._interval&&(clearInterval(this._interval),this._interval=void 0)}get _timeStr(){return`${String(this._now.getHours()).padStart(2,"0")}:${String(this._now.getMinutes()).padStart(2,"0")}`}get _dateStr(){return function(t){return t.length?t.charAt(0).toUpperCase()+t.slice(1):t}(Ft.format(this._now))}get _weatherStr(){const t=this.weatherEntity?this.getEntity(this.weatherEntity):void 0;if(!t||!this.hass)return"";const e=this.hass.formatEntityState(t),i=t.attributes.temperature;return[e,"number"==typeof i?`${Math.round(i)}°`:""].filter(Boolean).join(" ")}render(){const t=this._weatherStr;return X`
      <div class="time">${this._timeStr}</div>
      <div class="date">${this._dateStr}${t?X` · ${t}`:""}</div>
    `}}Ht.styles=[Mt,o`
      :host {
        display: block;
      }
      .time {
        font-family: var(--hub-font-display);
        font-weight: 200;
        font-size: clamp(56px, 7vw, 96px);
        letter-spacing: -2px;
        line-height: 1;
        color: var(--hub-text);
      }
      .date {
        font-size: 13px;
        margin-top: 6px;
        color: var(--hub-text-muted);
        font-family: var(--hub-font-body);
      }
    `],t([gt({attribute:!1})],Ht.prototype,"weatherEntity",void 0),t([bt()],Ht.prototype,"_now",void 0),customElements.define("hub-clock",Ht);const Ot=t=>V`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    ${t}
  </svg>
`,Dt={lamp:Ot(V`
    <path d="M12 3a6 6 0 0 0-4 10.4c.6.6 1 1.4 1 2.3v.3h6v-.3c0-.9.4-1.7 1-2.3A6 6 0 0 0 12 3z"></path>
    <path d="M10 19h4M10.5 21.5h3"></path>
  `),bolt:Ot(V`
    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"></path>
  `),home:Ot(V`
    <path d="M3 11.5 12 4l9 7.5"></path>
    <path d="M5.5 10v9.5a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1V15a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4.5a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1V10"></path>
  `),vacuum:Ot(V`
    <circle cx="12" cy="12" r="8"></circle>
    <circle cx="12" cy="12" r="2.2"></circle>
    <path d="M12 4v2M4 12h2M18 12h2M12 20v-2"></path>
  `),train:Ot(V`
    <rect x="5" y="4" width="14" height="13" rx="4"></rect>
    <path d="M5 12h14"></path>
    <path d="M8 20l-1.5 2M16 20l1.5 2"></path>
    <circle cx="9" cy="17.5" r="0.9" fill="currentColor" stroke="none"></circle>
    <circle cx="15" cy="17.5" r="0.9" fill="currentColor" stroke="none"></circle>
  `),note:Ot(V`
    <circle cx="7" cy="18" r="2.3"></circle>
    <circle cx="16" cy="16" r="2.3"></circle>
    <path d="M9.3 18V5.5L18.3 4v11.5"></path>
  `),sun:Ot(V`
    <circle cx="12" cy="12" r="4"></circle>
    <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"></path>
  `),moon:Ot(V`
    <path d="M20 14.5A8 8 0 0 1 9.5 4 6.5 6.5 0 1 0 20 14.5z"></path>
  `),power:Ot(V`
    <path d="M12 3v8.5"></path>
    <path d="M6.7 6.9a8 8 0 1 0 10.6 0"></path>
  `),play:Ot(V`
    <path d="M7 4.5v15l13-7.5-13-7.5z"></path>
  `),pause:Ot(V`
    <rect x="7" y="5" width="3.5" height="14" rx="1"></rect>
    <rect x="13.5" y="5" width="3.5" height="14" rx="1"></rect>
  `),sofa:Ot(V`
    <path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"></path>
    <rect x="3" y="11" width="18" height="6" rx="2"></rect>
    <path d="M5 17v2M19 17v2"></path>
  `),pot:Ot(V`
    <path d="M4 10h16"></path>
    <path d="M5 10v6a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-6"></path>
    <path d="M2 10h2M20 10h2"></path>
    <path d="M9 10V7a3 3 0 0 1 6 0v3"></path>
  `),bed:Ot(V`
    <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6"></path>
    <path d="M3 15h18"></path>
    <path d="M3 18v2M21 18v2"></path>
    <rect x="5" y="10" width="6" height="4" rx="1"></rect>
  `),door:Ot(V`
    <rect x="6" y="3" width="12" height="18" rx="1"></rect>
    <circle cx="14.5" cy="12" r="0.8" fill="currentColor" stroke="none"></circle>
  `),desk:Ot(V`
    <path d="M3 7h18v3H3z"></path>
    <path d="M5 10v9M19 10v9"></path>
  `),shower:Ot(V`
    <path d="M8 4a5 5 0 0 1 9 3"></path>
    <path d="M5 9h14"></path>
    <path d="M7 12v2M11 12v2M15 12v2M19 12v2"></path>
    <path d="M7 17v2M11 17v2M15 17v2"></path>
  `)};class jt extends ct{constructor(){super(...arguments),this.icon="",this.label="",this.tone="neutral",this.active=!1}render(){const t=Dt[this.icon];return X`
      <span class="chip tone-${this.tone} ${this.active?"active":""}">
        ${t?X`<span class="icon">${t}</span>`:""}
        <span class="label">${this.label}</span>
      </span>
    `}}jt.styles=[Mt,o`
      :host {
        display: inline-flex;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 10px 16px;
        border-radius: var(--hub-radius-pill);
        font: 500 13px var(--hub-font-body);
        background: var(--hub-chip-bg);
        border: 1px solid var(--hub-chip-border);
        color: var(--hub-text-muted);
        white-space: nowrap;
      }
      .icon {
        display: flex;
        width: 14px;
        height: 14px;
        flex-shrink: 0;
      }
      .icon svg {
        width: 100%;
        height: 100%;
      }
      .chip.active.tone-amber {
        background: var(--hub-amber-bg);
        border-color: var(--hub-amber-border);
        color: var(--hub-amber-text);
      }
      .chip.active.tone-green {
        background: var(--hub-green-bg);
        border-color: var(--hub-green-border);
        color: var(--hub-green);
      }
      .chip.active.tone-teal {
        background: var(--hub-teal-bg);
        border-color: var(--hub-teal-border);
        color: var(--hub-teal-text);
      }
      .chip.active.tone-lavender {
        background: var(--hub-lavender-bg);
        border-color: var(--hub-lavender-border);
        color: var(--hub-lavender-text);
      }
      .chip.active.tone-coral {
        background: var(--hub-coral-bg);
        border-color: var(--hub-coral-border);
        color: var(--hub-coral);
      }
      .chip.active.tone-neutral {
        background: var(--hub-chip-bg);
        border-color: var(--hub-chip-border);
        color: var(--hub-text-muted);
      }
    `],t([gt({attribute:!1})],jt.prototype,"icon",void 0),t([gt({attribute:!1})],jt.prototype,"label",void 0),t([gt({attribute:!1})],jt.prototype,"tone",void 0),t([gt({type:Boolean})],jt.prototype,"active",void 0),customElements.define("hub-status-chip",jt);class Nt extends vt{constructor(){super(...arguments),this._longPressed=!1,this._downX=0,this._downY=0,this._onPointerDown=t=>{this._longPressed=!1,this._downX=t.clientX,this._downY=t.clientY,this._pressTimer=window.setTimeout(()=>{this._longPressed=!0,this.toggle(this.room.main_entity)},500)},this._onPointerMove=t=>{void 0!==this._pressTimer&&(zt(t.clientX-this._downX)||zt(t.clientY-this._downY))&&this._cancelPress()},this._cancelPress=()=>{void 0!==this._pressTimer&&(clearTimeout(this._pressTimer),this._pressTimer=void 0)},this._onClick=()=>{this._longPressed?this._longPressed=!1:this.dispatchEvent(new CustomEvent("hub-room-open",{detail:{roomId:this.room.id},bubbles:!0,composed:!0}))}}disconnectedCallback(){super.disconnectedCallback(),this._cancelPress()}get _lightsOn(){return this.room.lights.filter(t=>this.isOn(t.entity)).length}get _brightnessPct(){const t=this.getEntityAttribute(this.room.main_entity,"brightness");return"number"==typeof t?Math.round(t/255*100):null}get _subtitle(){const t=this._lightsOn;if(0===t)return"Släckt";const e=1===t?"1 lampa":`${t} lampor`,i=this._brightnessPct;return null!==i?`${e} · ${i} %`:e}render(){if(!this.hass||!this.room)return X``;const t=this._lightsOn>0,e=Dt[this.room.icon];return X`
      <div
        class="tile ${t?"active":""}"
        @pointerdown=${this._onPointerDown}
        @pointermove=${this._onPointerMove}
        @pointerup=${this._cancelPress}
        @pointercancel=${this._cancelPress}
        @pointerleave=${this._cancelPress}
        @click=${this._onClick}
      >
        <span class="icon-chip">${e??""}</span>
        <div>
          <b class="name">${this.room.name}</b>
          <small class="subtitle">${this._subtitle}</small>
        </div>
      </div>
    `}}Nt.styles=[Mt,o`
      :host {
        display: block;
      }
      .tile {
        box-sizing: border-box;
        height: 100%;
        border-radius: var(--hub-radius);
        padding: 14px 16px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 10px;
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        transition: background var(--hub-fade) ease, border-color var(--hub-fade) ease,
          box-shadow var(--hub-fade) ease;
      }
      .tile.active {
        background: var(--hub-amber-bg);
        border-color: var(--hub-amber-border);
        box-shadow: var(--hub-amber-glow);
      }
      .icon-chip {
        width: 32px;
        height: 32px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--hub-icon-chip-bg);
        color: var(--hub-icon-chip-color);
      }
      .icon-chip svg {
        width: 16px;
        height: 16px;
      }
      .tile.active .icon-chip {
        background: var(--hub-amber);
        color: var(--hub-surface);
      }
      .name {
        font: 600 13px var(--hub-font-body);
        color: var(--hub-text-muted);
        display: block;
      }
      .tile.active .name {
        color: var(--hub-amber-text);
      }
      .subtitle {
        font-size: 10.5px;
        color: var(--hub-text-dim);
        display: block;
        margin-top: 2px;
      }
      .tile.active .subtitle {
        color: var(--hub-amber-muted);
      }
    `],t([gt({attribute:!1})],Nt.prototype,"room",void 0),customElements.define("hub-room-tile",Nt);const Ut=new Set(["off","unavailable","unknown","standby","idle"]);class Rt extends vt{constructor(){super(...arguments),this.players=[],this._now=Date.now()}connectedCallback(){super.connectedCallback(),this._interval=window.setInterval(()=>{this._now=Date.now()},1e3)}disconnectedCallback(){super.disconnectedCallback(),void 0!==this._interval&&(clearInterval(this._interval),this._interval=void 0)}_goto(){this.dispatchEvent(new CustomEvent("hub-goto-page",{detail:{page:"media"},bubbles:!0,composed:!0}))}_togglePlay(t,e){t.stopPropagation(),this.callService("media_player","media_play_pause",void 0,e)}render(){if(!this.hass)return X``;const t=function(t,e){for(const i of e){const e=t[i.entity];if(e&&"playing"===e.state)return{entity:e,name:i.name}}for(const i of e){const e=t[i.entity];if(e&&!Ut.has(e.state))return{entity:e,name:i.name}}return null}(this.hass.states,this.players??[]);if(!t)return X`
        <div class="np idle" @click=${this._goto}>
          <span class="idle-ic">${Dt.note}</span>
          <b class="title dim">Ingenting spelas</b>
        </div>
      `;const e=t.entity,i="playing"===e.state,s=e.attributes.media_title||t.name,a=e.attributes.media_artist||t.name,r=e.attributes.entity_picture,o=function(t,e){if(!t)return 0;const i=t.attributes,s="number"==typeof i.media_duration?i.media_duration:0;if(s<=0)return 0;let a="number"==typeof i.media_position?i.media_position:0;const r="string"==typeof i.media_position_updated_at?Date.parse(i.media_position_updated_at):NaN;return"playing"!==t.state||Number.isNaN(r)||(a+=(e-r)/1e3),Math.max(0,Math.min(100,a/s*100))}(e,this._now);return X`
      <div class="np ${i?"playing":""}" @click=${this._goto}>
        <div
          class="art"
          style=${r?`background-image:url('${r}')`:""}
        ></div>
        <div class="meta">
          <b class="title">${s}</b>
          <small class="sub">${a}</small>
          <div class="bar"><div class="fill" style="width:${o}%"></div></div>
        </div>
        <button
          class="pp"
          aria-label=${i?"Pausa":"Spela"}
          @click=${t=>this._togglePlay(t,e.entity_id)}
        >
          <span class="ppic">${i?Dt.pause:Dt.play}</span>
        </button>
      </div>
    `}}Rt.styles=[Mt,o`
      :host {
        display: block;
        height: 100%;
      }
      .np {
        box-sizing: border-box;
        height: 100%;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 18px;
        border-radius: var(--hub-radius);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: background var(--hub-fade) ease, border-color var(--hub-fade) ease;
      }
      .np.playing {
        background: var(--hub-teal-bg);
        border-color: var(--hub-teal-border);
      }
      .art {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        flex-shrink: 0;
        background: linear-gradient(135deg, #3b6ea5, #8e5ea2);
        background-size: cover;
        background-position: center;
      }
      .meta {
        flex: 1;
        min-width: 0;
      }
      .title {
        font: 600 15px var(--hub-font-body);
        color: var(--hub-text-muted);
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .np.playing .title {
        color: var(--hub-teal-text);
      }
      .sub {
        font-size: 12px;
        color: var(--hub-text-dim);
        display: block;
        margin-top: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .np.playing .sub {
        color: var(--hub-teal-muted);
      }
      .bar {
        height: 4px;
        border-radius: 2px;
        background: var(--hub-track);
        margin-top: 9px;
        overflow: hidden;
      }
      .np.playing .bar {
        background: var(--hub-teal-border);
      }
      .fill {
        height: 100%;
        border-radius: 2px;
        background: var(--hub-text-dim);
        transition: width 0.9s linear;
      }
      .np.playing .fill {
        background: var(--hub-teal);
      }
      .pp {
        width: 48px;
        height: 48px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        padding: 0;
        margin: -4px -8px -4px 0;
        cursor: pointer;
        color: var(--hub-text-muted);
        -webkit-tap-highlight-color: transparent;
      }
      .np.playing .pp {
        color: var(--hub-teal);
      }
      .pp .ppic {
        display: flex;
        width: 22px;
        height: 22px;
      }
      .pp svg {
        width: 100%;
        height: 100%;
      }
      .idle-ic {
        display: flex;
        width: 22px;
        height: 22px;
        color: var(--hub-text-dim);
        flex-shrink: 0;
      }
      .idle-ic svg {
        width: 100%;
        height: 100%;
      }
      .title.dim {
        color: var(--hub-text-dim);
        font-weight: 500;
      }
    `],t([gt({attribute:!1})],Rt.prototype,"players",void 0),t([bt()],Rt.prototype,"_now",void 0),customElements.define("hub-now-playing",Rt);const Bt=new Intl.NumberFormat("sv-SE");class It extends vt{_goto(){this.dispatchEvent(new CustomEvent("hub-goto-page",{detail:{page:"kcal"},bubbles:!0,composed:!0}))}render(){if(!this.hass)return X``;const t=this.todayEntity?this.getEntity(this.todayEntity):void 0,e=t?Number(t.state):NaN;if(!t||"unavailable"===t.state||"unknown"===t.state||Number.isNaN(e))return X`
        <div class="kc offline" @click=${this._goto}>
          <div class="ring" style="--pct:0"></div>
          <div class="meta"><b class="val">Kcal · offline</b></div>
        </div>
      `;const i="number"==typeof t.attributes.kcal_target?t.attributes.kcal_target:0,s=function(t,e){return e>0?Math.max(0,Math.min(100,t/e*100)):0}(e,i),a=[],r=t.attributes.protein;"number"==typeof r&&a.push(`${Math.round(r)} g protein`);const o=t.attributes.status;"string"==typeof o&&o&&a.push(o.includes("✓")?o:`${o} ✓`);const n=a.join(" · ");return X`
      <div class="kc" @click=${this._goto}>
        <div class="ring" style="--pct:${s}"></div>
        <div class="meta">
          <b class="val">
            ${Bt.format(Math.round(e))}
            <span class="target">
              ${i>0?`/ ${Bt.format(i)} kcal`:"kcal"}
            </span>
          </b>
          ${n?X`<small class="sub">${n}</small>`:q}
        </div>
      </div>
    `}}It.styles=[Mt,o`
      :host {
        display: block;
        height: 100%;
      }
      .kc {
        box-sizing: border-box;
        height: 100%;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 18px;
        border-radius: var(--hub-radius);
        background: var(--hub-lavender-bg);
        border: 1px solid var(--hub-lavender-border);
        box-shadow: var(--hub-shadow);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: background var(--hub-fade) ease, border-color var(--hub-fade) ease;
      }
      .kc.offline {
        background: var(--hub-card);
        border-color: var(--hub-card-border);
      }
      .ring {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        flex-shrink: 0;
        background: conic-gradient(
          var(--hub-lavender) calc(var(--pct, 0) * 1%),
          var(--hub-track) 0
        );
        -webkit-mask: radial-gradient(circle, transparent 14px, #000 14.5px);
        mask: radial-gradient(circle, transparent 14px, #000 14.5px);
      }
      .kc.offline .ring {
        background: var(--hub-track);
      }
      .meta {
        min-width: 0;
      }
      .val {
        font: 600 15px var(--hub-font-body);
        color: var(--hub-lavender-text);
        display: block;
        white-space: nowrap;
      }
      .kc.offline .val {
        color: var(--hub-text-dim);
        font-weight: 500;
        font-size: 13px;
      }
      .target {
        opacity: 0.5;
        font-weight: 400;
      }
      .sub {
        font-size: 12px;
        color: var(--hub-lavender-muted);
        display: block;
        margin-top: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `],t([gt({attribute:!1})],It.prototype,"todayEntity",void 0),customElements.define("hub-kcal-ring",It);const Lt={cleaning:"Städar",returning:"Åker hem",paused:"Pausad",error:"Fel",idle:"Väntar"};class Xt extends vt{constructor(){super(...arguments),this._now=new Date}connectedCallback(){super.connectedCallback(),this._interval=window.setInterval(()=>{this._now=new Date},6e4)}disconnectedCallback(){super.disconnectedCallback(),void 0!==this._interval&&(clearInterval(this._interval),this._interval=void 0)}get _chips(){const t=this.config,e=[],i=t.lights_count_entity?this.getEntity(t.lights_count_entity):void 0,s=i&&!Number.isNaN(Number(i.state))?Number(i.state):null;e.push({icon:"lamp",label:null===s?"—":`${s} ${1===s?"lampa":"lampor"}`,tone:"amber",active:(s??0)>0});const a=t.price_entity?this.getEntity(t.price_entity):void 0,r=a&&!Number.isNaN(Number(a.state))?Math.round(Number(a.state)):null;if(e.push({icon:"bolt",label:null===r?"— öre":`${r} öre`,tone:"green",active:null!==r}),t.vacuum_entity){const i=this.getEntity(t.vacuum_entity);i&&"docked"!==i.state&&"unavailable"!==i.state&&"unknown"!==i.state&&e.push({icon:"vacuum",label:Lt[i.state]??"Städar",tone:"error"===i.state?"coral":"neutral",active:!0})}if(t.departures&&function(t,e="06:30",i="09:30"){const s=t.getDay();if(0===s||6===s)return!1;const a=60*t.getHours()+t.getMinutes(),r=t=>{const[e,i]=t.split(":").map(Number);return 60*e+i};return a>=r(e)&&a<=r(i)}(this._now,t.departures.window?.start,t.departures.window?.end)){const i=this.getEntity(t.departures.next_entity),s=i&&i.state&&"unavailable"!==i.state?i.state:"—";e.push({icon:"train",label:s,tone:"neutral",active:!0})}if(t.person_entity){const i=this.getEntity(t.person_entity),s=(i?.attributes.friendly_name||"Philip").split(" ")[0],a="home"===i?.state;e.push({icon:"home",label:`${s} ${a?"hemma":"borta"}`,tone:"neutral",active:!1})}return e}render(){if(!this.hass||!this.config)return X``;const t=this.config;return X`
      <div class="page">
        <div class="top">
          <hub-clock .hass=${this.hass} .weatherEntity=${t.weather_entity}></hub-clock>
          <div class="chips">
            ${this._chips.map(t=>X`
                <hub-status-chip
                  .icon=${t.icon}
                  .label=${t.label}
                  .tone=${t.tone}
                  ?active=${t.active}
                ></hub-status-chip>
              `)}
          </div>
        </div>

        <div class="rooms">
          ${(t.rooms??[]).map(t=>X`<hub-room-tile .hass=${this.hass} .room=${t}></hub-room-tile>`)}
        </div>

        <div class="bottom">
          <hub-now-playing
            class="np"
            .hass=${this.hass}
            .players=${t.media_players??[]}
          ></hub-now-playing>
          <hub-kcal-ring
            class="kc"
            .hass=${this.hass}
            .todayEntity=${t.kcal?.today_entity}
          ></hub-kcal-ring>
        </div>
      </div>
    `}}Xt.styles=[Mt,o`
      :host {
        display: block;
        height: 100%;
      }
      .page {
        box-sizing: border-box;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: var(--hub-page-pad);
      }
      .top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
        max-width: 62%;
      }
      .rooms {
        flex: 1;
        min-height: 0;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-auto-rows: 1fr;
        gap: var(--hub-gap);
      }
      @media (max-width: 1400px) {
        .rooms {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      .bottom {
        display: flex;
        gap: var(--hub-gap);
        align-items: stretch;
      }
      .bottom .np {
        flex: 2;
        min-width: 0;
      }
      .bottom .kc {
        flex: 1;
        min-width: 0;
      }
    `],t([gt({attribute:!1})],Xt.prototype,"config",void 0),t([bt()],Xt.prototype,"_now",void 0),customElements.define("hub-home-page",Xt);const Vt=new Set(["unavailable","unknown"]);function Gt(t){return!!t&&!Vt.has(t.state)}class qt extends vt{constructor(){super(...arguments),this._armed=!1,this._flash=!1,this._onAllOff=()=>{if(!this._armed)return this._armed=!0,void 0!==this._armTimer&&clearTimeout(this._armTimer),void(this._armTimer=window.setTimeout(()=>{this._armed=!1,this._armTimer=void 0},3e3));void 0!==this._armTimer&&clearTimeout(this._armTimer),this._armTimer=void 0,this._armed=!1,this._flash=!0,this.callService("light","turn_off",void 0,"all"),void 0!==this._flashTimer&&clearTimeout(this._flashTimer),this._flashTimer=window.setTimeout(()=>{this._flash=!1,this._flashTimer=void 0},200)}}disconnectedCallback(){super.disconnectedCallback(),this._clearTimers()}_clearTimers(){void 0!==this._armTimer&&clearTimeout(this._armTimer),void 0!==this._flashTimer&&clearTimeout(this._flashTimer),this._armTimer=void 0,this._flashTimer=void 0,this._armed=!1,this._flash=!1}_activateScene(t){this.callService("scene","turn_on",void 0,t)}_lightRow(t){return Gt(this.hass.states[t.entity])?X`
      <glass-light-slider
        .hass=${this.hass}
        ._config=${{type:"glass-light-slider",entity:t.entity,name:t.name}}
      ></glass-light-slider>
    `:X`
        <div class="dead-row">
          <span class="dead-name">${t.name}</span>
          <span class="dead-state">Ej tillgänglig</span>
        </div>
      `}_sceneChip(t){return X`
      <button class="scene-chip" @click=${()=>this._activateScene(t.entity)}>
        ${t.name}
      </button>
    `}_roomCard(t){const e=function(t,e){const i=t.lights.filter(t=>"on"===e[t.entity]?.state),s=i.length;if(0===s)return{onCount:0,pct:null,label:"Släckt"};const a=i.map(t=>e[t.entity]?.attributes.brightness).filter(t=>"number"==typeof t),r=a.length?Math.round(a.reduce((t,e)=>t+e,0)/a.length/255*100):null,o=1===s?"1 lampa":`${s} lampor`;return{onCount:s,pct:r,label:null!==r?`${o} · ${r} %`:o}}(t,this.hass.states),i=e.onCount>0,s=Dt[t.icon];return X`
      <div class="room ${i?"active":""}">
        <div class="room-head">
          <span class="room-ic">${s??""}</span>
          <div>
            <b class="room-name">${t.name}</b>
            <small class="room-meta">${e.label}</small>
          </div>
        </div>
        <div class="lights">${t.lights.map(t=>this._lightRow(t))}</div>
        ${t.scenes?.length?X`<div class="scenes">${t.scenes.map(t=>this._sceneChip(t))}</div>`:q}
      </div>
    `}render(){if(!this.hass||!this.config)return X``;const t=this.config,e=function(t,e){let i=0,s=0;for(const a of t.rooms??[])for(const t of a.lights){const a=e[t.entity];Gt(a)&&(s+=1,"on"===a.state&&(i+=1))}return{on:i,total:s}}(t,this.hass.states);return X`
      <div class="page">
        <div class="header">
          <div class="heading">
            <span class="title">Ljus</span>
            <span class="subtitle">
              ${e.on>0?X`<span class="lit">${e.on} tända</span>`:X`Allt släckt`}
            </span>
          </div>
          <div class="actions">
            ${(t.scenes??[]).map(t=>X`
                <button
                  class="action"
                  @click=${()=>this._activateScene(t.entity)}
                >
                  ${Dt[t.icon]?X`<span class="ic">${Dt[t.icon]}</span>`:q}
                  <span>${t.name}</span>
                </button>
              `)}
            <button
              class="action ${this._armed?"armed":""} ${this._flash?"flash":""}"
              aria-label="Släck alla lampor"
              @click=${this._onAllOff}
            >
              <span class="ic">${Dt.power}</span>
              <span>${this._armed?"Säker? Tryck igen":"Allt släckt"}</span>
            </button>
          </div>
        </div>

        <div class="body">
          <div class="rooms">
            ${(t.rooms??[]).map(t=>this._roomCard(t))}
          </div>
        </div>
      </div>
    `}}qt.styles=[Mt,o`
      :host {
        display: block;
        height: 100%;
      }
      .page {
        box-sizing: border-box;
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: var(--hub-page-pad);
      }

      /* ── Header ─────────────────────────────────────────── */
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        /* keep the whole-home actions clear of the theme toggle in the corner */
        padding-right: 56px;
        margin-bottom: 20px;
      }
      .heading {
        display: flex;
        flex-direction: column;
      }
      .title {
        font: 300 28px var(--hub-font-display);
        letter-spacing: -0.01em;
        color: var(--hub-text);
        line-height: 1.05;
      }
      .subtitle {
        margin-top: 4px;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .subtitle .lit {
        color: var(--hub-amber);
        font-weight: 600;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
      }

      .action {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 48px;
        padding: 0 18px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-amber-border);
        background: var(--hub-amber-bg);
        color: var(--hub-amber-text);
        font: 600 14px var(--hub-font-body);
        white-space: nowrap;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: transform ${200}ms cubic-bezier(0.2, 0.8, 0.2, 1),
          background var(--hub-fade) ease, border-color var(--hub-fade) ease,
          color var(--hub-fade) ease;
      }
      .action .ic {
        display: flex;
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }
      .action .ic svg {
        width: 100%;
        height: 100%;
      }
      .action.armed {
        background: var(--hub-coral-bg);
        border-color: var(--hub-coral-border);
        color: var(--hub-coral);
      }
      .action.flash {
        transform: scale(0.94);
        background: var(--hub-green-bg);
        border-color: var(--hub-green-border);
        color: var(--hub-green);
      }

      /* ── Rooms grid ─────────────────────────────────────── */
      .body {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        padding-bottom: 56px;
        -webkit-overflow-scrolling: touch;
      }
      .rooms {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        align-content: start;
        gap: var(--hub-gap);
      }
      @media (max-width: 900px) {
        .rooms {
          grid-template-columns: 1fr;
        }
      }

      .room {
        box-sizing: border-box;
        border-radius: var(--hub-radius);
        padding: 16px;
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        display: flex;
        flex-direction: column;
        gap: 12px;
        transition: border-color var(--hub-fade) ease, box-shadow var(--hub-fade) ease;
      }
      .room.active {
        border-color: var(--hub-amber-border);
        box-shadow: var(--hub-amber-glow);
      }
      .room-head {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .room-ic {
        width: 32px;
        height: 32px;
        flex-shrink: 0;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--hub-icon-chip-bg);
        color: var(--hub-icon-chip-color);
        transition: background var(--hub-fade) ease, color var(--hub-fade) ease;
      }
      .room-ic svg {
        width: 16px;
        height: 16px;
      }
      .room.active .room-ic {
        background: var(--hub-amber);
        color: var(--hub-surface);
      }
      .room-name {
        font: 600 15px var(--hub-font-body);
        color: var(--hub-text-muted);
        display: block;
      }
      .room.active .room-name {
        color: var(--hub-amber-text);
      }
      .room-meta {
        display: block;
        margin-top: 1px;
        font: 500 11.5px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
      .room.active .room-meta {
        color: var(--hub-amber-muted);
      }

      .lights {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      glass-light-slider {
        display: block;
      }

      /* Unavailable / missing lights are quiet, non-interactive rows. */
      .dead-row {
        box-sizing: border-box;
        min-height: 48px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 0 16px;
        border-radius: var(--hub-radius-sm, 12px);
        background: var(--hub-icon-chip-bg);
        border: 1px solid var(--hub-card-border);
      }
      .dead-name {
        font: 500 14px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
      .dead-state {
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-dim);
      }

      /* ── Per-room scene chips ───────────────────────────── */
      .scenes {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding-top: 2px;
      }
      .scene-chip {
        min-height: 48px;
        padding: 0 14px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        font: 500 12.5px var(--hub-font-body);
        white-space: nowrap;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: transform 120ms ease, background 160ms ease, border-color 160ms ease,
          color 160ms ease;
      }
      .scene-chip:active {
        transform: scale(0.95);
        background: var(--hub-amber-bg);
        border-color: var(--hub-amber-border);
        color: var(--hub-amber-text);
      }
    `],t([gt({attribute:!1})],qt.prototype,"config",void 0),t([bt()],qt.prototype,"_armed",void 0),t([bt()],qt.prototype,"_flash",void 0),customElements.define("hub-lights-page",qt);const Yt=V`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <path d="M6 6l12 12M18 6L6 18"></path>
  </svg>
`;class Wt extends vt{constructor(){super(...arguments),this.room=null,this._onScrim=t=>{t.target===t.currentTarget&&this._close()}}_close(){this.dispatchEvent(new CustomEvent("hub-popup-close",{bubbles:!0,composed:!0}))}render(){if(!this.room||!this.hass)return X``;const t=this.room;return X`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label=${t.name}>
          <div class="head">
            <span class="title">${t.name}</span>
            <button class="close" aria-label="Stäng" @click=${this._close}>
              ${Yt}
            </button>
          </div>
          <div class="lights">
            ${t.lights.map(t=>X`
                <glass-light-slider
                  .hass=${this.hass}
                  ._config=${{type:"glass-light-slider",entity:t.entity,name:t.name}}
                ></glass-light-slider>
              `)}
          </div>
        </div>
      </div>
    `}}Wt.styles=[Mt,o`
      :host {
        position: absolute;
        inset: 0;
        z-index: 40;
      }
      .scrim {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        box-sizing: border-box;
        background: var(--hub-scrim);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        animation: fade 0.2s ease;
      }
      @keyframes fade {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      .card {
        width: 100%;
        max-width: 520px;
        max-height: 100%;
        overflow: auto;
        box-sizing: border-box;
        padding: 20px;
        border-radius: var(--hub-radius-lg);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        animation: pop 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      @keyframes pop {
        from {
          opacity: 0;
          transform: translateY(12px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }
      .title {
        font: 500 22px var(--hub-font-display);
        letter-spacing: -0.01em;
        color: var(--hub-text);
      }
      .close {
        width: 48px;
        height: 48px;
        margin: -8px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        color: var(--hub-text-muted);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .close svg {
        width: 22px;
        height: 22px;
      }
      .lights {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      glass-light-slider {
        display: block;
      }
    `],t([gt({attribute:!1})],Wt.prototype,"room",void 0),customElements.define("hub-room-popup",Wt);const Kt=["hem","ljus","media","energi","kcal"],Jt={hem:"Hem",ljus:"Ljus",media:"Media",energi:"Energi",kcal:"Kcal"};function Zt(t){return Jt[t]??t.charAt(0).toUpperCase()+t.slice(1)}const Qt=["auto","dag","natt"];class te extends vt{constructor(){super(...arguments),this.theme="natt",this._page=0,this._dragX=0,this._openRoom=null,this._override=function(){const t=localStorage.getItem(Pt);return"natt"===t||"dag"===t?t:"auto"}(),this._pointerActive=!1,this._dragging=!1,this._startX=0,this._lastX=0,this._lastT=0,this._velocity=0,this._onRoomOpen=t=>{const e=t.detail?.roomId;this._openRoom=this._cfg?.rooms?.find(t=>t.id===e)??null},this._onGotoPage=t=>{const e=t.detail?.page;e&&this.goToPage(e)},this._onPopupClose=()=>{this._openRoom=null},this._onAnyInteraction=()=>{this._resetIdle()},this._onPointerDown=t=>{this._pointerActive=!0,this._dragging=!1,this._startX=t.clientX,this._lastX=t.clientX,this._lastT=t.timeStamp,this._velocity=0,this._dragX=0},this._onPointerMove=t=>{if(!this._pointerActive)return;const e=t.clientX-this._startX;if(!this._dragging){if(!zt(e))return;this._dragging=!0,t.currentTarget.setPointerCapture?.(t.pointerId),this._lastX=t.clientX,this._lastT=t.timeStamp}const i=t.timeStamp-this._lastT;i>0&&(this._velocity=(t.clientX-this._lastX)/i),this._lastX=t.clientX,this._lastT=t.timeStamp,this._dragX=e},this._onPointerUp=t=>{if(!this._pointerActive)return;const e=this._dragging;if(this._pointerActive=!1,this._dragging=!1,e){t.currentTarget.releasePointerCapture?.(t.pointerId);const e=this.clientWidth||window.innerWidth;this._page=function(t,e,i,s,a){const r=.2*e,o=Math.abs(i)>.5;let n=s;return t<-r||o&&i<-.5?n=s+1:(t>r||o&&i>.5)&&(n=s-1),Math.max(0,Math.min(a-1,n))}(this._dragX,e,this._velocity,this._page,this._pages.length)}this._dragX=0,this._velocity=0}}setConfig(t){super.setConfig(t)}get _cfg(){return this._config}get _pages(){return this._cfg?.pages??Kt}connectedCallback(){super.connectedCallback(),function(){if(document.getElementById("glass-hub-fonts"))return;const t=document.createElement("style");t.id="glass-hub-fonts",t.textContent="\n@font-face{font-family:'Outfit';src:url('/local/glass-cards/fonts/outfit-variable.woff2') format('woff2-variations');font-weight:100 900;font-display:swap;}\n@font-face{font-family:'Inter';src:url('/local/glass-cards/fonts/inter-variable.woff2') format('woff2-variations');font-weight:100 900;font-display:swap;}\n",document.head.appendChild(t)}(),this._applyTheme(),this._resetIdle(),this.addEventListener("pointerdown",this._onAnyInteraction),this.addEventListener("hub-room-open",this._onRoomOpen),this.addEventListener("hub-goto-page",this._onGotoPage),this.addEventListener("hub-popup-close",this._onPopupClose)}disconnectedCallback(){super.disconnectedCallback(),this._clearIdle(),this.removeEventListener("pointerdown",this._onAnyInteraction),this.removeEventListener("hub-room-open",this._onRoomOpen),this.removeEventListener("hub-goto-page",this._onGotoPage),this.removeEventListener("hub-popup-close",this._onPopupClose)}willUpdate(t){t.has("hass")&&this._applyTheme()}goToPage(t){const e=this._pages.indexOf(t);e>=0&&(this._page=e,this._dragX=0)}_applyTheme(){const t=this.hass?.states["sun.sun"]?.attributes?.elevation,e="number"==typeof t?t:null;this.theme=function(t,e,i=4){return"auto"!==e?e:null===t?"natt":t>i?"dag":"natt"}(e,this._override,this._cfg?.day_elevation??4)}_cycleTheme(){const t=Qt.indexOf(this._override);this._override=Qt[(t+1)%Qt.length],function(t){localStorage.setItem(Pt,t)}(this._override),this._applyTheme()}_resetIdle(){this._clearIdle();const t=this._cfg?.idle_return_s??120;this._idleTimer=window.setTimeout(()=>{0!==this._page&&this.goToPage(this._pages[0])},1e3*t)}_clearIdle(){void 0!==this._idleTimer&&(clearTimeout(this._idleTimer),this._idleTimer=void 0)}_themeGlyph(){return"auto"===this._override?X`<span class="glyph-auto">A</span>`:"dag"===this._override?V`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
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
              ${"hem"===t?X`<hub-home-page
                    .hass=${this.hass}
                    .config=${this._cfg}
                  ></hub-home-page>`:"ljus"===t?X`<hub-lights-page
                      .hass=${this.hass}
                      .config=${this._cfg}
                    ></hub-lights-page>`:X`<h1 class="page-placeholder">${Zt(t)}</h1>`}
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
              aria-label=${Zt(t)}
              @click=${()=>this.goToPage(t)}
            ></button>
          `)}
      </div>

      ${this._openRoom?X`<hub-room-popup
            .hass=${this.hass}
            .room=${this._openRoom}
          ></hub-room-popup>`:q}
    `}}te.styles=[Mt,o`
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
    `],t([gt({reflect:!0,attribute:"data-theme"})],te.prototype,"theme",void 0),t([bt()],te.prototype,"_page",void 0),t([bt()],te.prototype,"_dragX",void 0),t([bt()],te.prototype,"_openRoom",void 0),customElements.define("glass-hub",te);const ee=window;ee.customCards=ee.customCards||[],ee.customCards.push({type:"glass-background",name:"Glass Background",description:"Animated gradient background"},{type:"glass-button",name:"Glass Button",description:"Toggle/info button"},{type:"glass-chip",name:"Glass Chip",description:"Small status pill"},{type:"glass-header",name:"Glass Header",description:"Greeting, weather, status chips"},{type:"glass-room-card",name:"Glass Room Card",description:"Room with sub-buttons and popup"},{type:"glass-light-slider",name:"Glass Light Slider",description:"Brightness slider with glow"},{type:"glass-popup",name:"Glass Popup",description:"Modal overlay"},{type:"glass-nav-bar",name:"Glass Nav Bar",description:"Bottom navigation"},{type:"glass-vacuum-card",name:"Glass Vacuum Card",description:"Vacuum controls"},{type:"glass-info-row",name:"Glass Info Row",description:"Information display"},{type:"glass-section",name:"Glass Section",description:"Section header label"},{type:"glass-departure-card",name:"Glass Departure Card",description:"Train departure list"},{type:"glass-hub",name:"Glass Hub",description:"Full-screen wall hub"}),console.info("%c GLASS CARDS %c v0.1.0 ","color: white; background: #4FC3F7; font-weight: bold; padding: 2px 6px; border-radius: 4px 0 0 4px;","color: #4FC3F7; background: rgba(79,195,247,0.1); padding: 2px 6px; border-radius: 0 4px 4px 0;");
