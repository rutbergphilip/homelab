function t(t,e,i,a){var s,r=arguments.length,o=r<3?e:null===a?a=Object.getOwnPropertyDescriptor(e,i):a;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(t,e,i,a);else for(var n=t.length-1;n>=0;n--)(s=t[n])&&(o=(r<3?s(o):r>3?s(e,i,o):s(e,i))||o);return r>3&&o&&Object.defineProperty(e,i,o),o}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,a=Symbol(),s=new WeakMap;let r=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==a)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=s.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&s.set(e,t))}return t}toString(){return this.cssText}};const o=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,a)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[a+1],t[0]);return new r(i,t,a)},n=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new r("string"==typeof t?t:t+"",void 0,a))(e)})(t):t,{is:l,defineProperty:h,getOwnPropertyDescriptor:c,getOwnPropertyNames:d,getOwnPropertySymbols:p,getPrototypeOf:u}=Object,g=globalThis,b=g.trustedTypes,v=b?b.emptyScript:"",m=g.reactiveElementPolyfillSupport,f=(t,e)=>t,x={toAttribute(t,e){switch(e){case Boolean:t=t?v:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},y=(t,e)=>!l(t,e),_={attribute:!0,type:String,converter:x,reflect:!1,useDefault:!1,hasChanged:y};Symbol.metadata??=Symbol("metadata"),g.litPropertyMetadata??=new WeakMap;let w=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=_){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),a=this.getPropertyDescriptor(t,i,e);void 0!==a&&h(this.prototype,t,a)}}static getPropertyDescriptor(t,e,i){const{get:a,set:s}=c(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:a,set(e){const r=a?.call(this);s?.call(this,e),this.requestUpdate(t,r,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??_}static _$Ei(){if(this.hasOwnProperty(f("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(f("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(f("properties"))){const t=this.properties,e=[...d(t),...p(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(n(t))}else void 0!==t&&e.push(n(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,a)=>{if(i)t.adoptedStyleSheets=a.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of a){const a=document.createElement("style"),s=e.litNonce;void 0!==s&&a.setAttribute("nonce",s),a.textContent=i.cssText,t.appendChild(a)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),a=this.constructor._$Eu(t,i);if(void 0!==a&&!0===i.reflect){const s=(void 0!==i.converter?.toAttribute?i.converter:x).toAttribute(e,i.type);this._$Em=t,null==s?this.removeAttribute(a):this.setAttribute(a,s),this._$Em=null}}_$AK(t,e){const i=this.constructor,a=i._$Eh.get(t);if(void 0!==a&&this._$Em!==a){const t=i.getPropertyOptions(a),s="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:x;this._$Em=a;const r=s.fromAttribute(e,t.type);this[a]=r??this._$Ej?.get(a)??r,this._$Em=null}}requestUpdate(t,e,i,a=!1,s){if(void 0!==t){const r=this.constructor;if(!1===a&&(s=this[t]),i??=r.getPropertyOptions(t),!((i.hasChanged??y)(s,e)||i.useDefault&&i.reflect&&s===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:a,wrapped:s},r){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??e??this[t]),!0!==s||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===a&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,a=this[e];!0!==t||this._$AL.has(e)||void 0===a||this.C(e,void 0,i,a)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};w.elementStyles=[],w.shadowRootOptions={mode:"open"},w[f("elementProperties")]=new Map,w[f("finalized")]=new Map,m?.({ReactiveElement:w}),(g.reactiveElementVersions??=[]).push("2.1.2");const k=globalThis,$=t=>t,E=k.trustedTypes,C=E?E.createPolicy("lit-html",{createHTML:t=>t}):void 0,S="$lit$",M=`lit$${Math.random().toFixed(9).slice(2)}$`,A="?"+M,T=`<${A}>`,P=document,N=()=>P.createComment(""),z=t=>null===t||"object"!=typeof t&&"function"!=typeof t,F=Array.isArray,D="[ \t\n\f\r]",B=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,j=/-->/g,L=/>/g,O=RegExp(`>|${D}(?:([^\\s"'>=/]+)(${D}*=${D}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),I=/'/g,R=/"/g,H=/^(?:script|style|textarea|title)$/i,U=t=>(e,...i)=>({_$litType$:t,strings:e,values:i}),V=U(1),X=U(2),W=Symbol.for("lit-noChange"),G=Symbol.for("lit-nothing"),q=new WeakMap,Y=P.createTreeWalker(P,129);function K(t,e){if(!F(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==C?C.createHTML(e):e}const Z=(t,e)=>{const i=t.length-1,a=[];let s,r=2===e?"<svg>":3===e?"<math>":"",o=B;for(let e=0;e<i;e++){const i=t[e];let n,l,h=-1,c=0;for(;c<i.length&&(o.lastIndex=c,l=o.exec(i),null!==l);)c=o.lastIndex,o===B?"!--"===l[1]?o=j:void 0!==l[1]?o=L:void 0!==l[2]?(H.test(l[2])&&(s=RegExp("</"+l[2],"g")),o=O):void 0!==l[3]&&(o=O):o===O?">"===l[0]?(o=s??B,h=-1):void 0===l[1]?h=-2:(h=o.lastIndex-l[2].length,n=l[1],o=void 0===l[3]?O:'"'===l[3]?R:I):o===R||o===I?o=O:o===j||o===L?o=B:(o=O,s=void 0);const d=o===O&&t[e+1].startsWith("/>")?" ":"";r+=o===B?i+T:h>=0?(a.push(n),i.slice(0,h)+S+i.slice(h)+M+d):i+M+(-2===h?e:d)}return[K(t,r+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),a]};class J{constructor({strings:t,_$litType$:e},i){let a;this.parts=[];let s=0,r=0;const o=t.length-1,n=this.parts,[l,h]=Z(t,e);if(this.el=J.createElement(l,i),Y.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(a=Y.nextNode())&&n.length<o;){if(1===a.nodeType){if(a.hasAttributes())for(const t of a.getAttributeNames())if(t.endsWith(S)){const e=h[r++],i=a.getAttribute(t).split(M),o=/([.?@])?(.*)/.exec(e);n.push({type:1,index:s,name:o[2],strings:i,ctor:"."===o[1]?at:"?"===o[1]?st:"@"===o[1]?rt:it}),a.removeAttribute(t)}else t.startsWith(M)&&(n.push({type:6,index:s}),a.removeAttribute(t));if(H.test(a.tagName)){const t=a.textContent.split(M),e=t.length-1;if(e>0){a.textContent=E?E.emptyScript:"";for(let i=0;i<e;i++)a.append(t[i],N()),Y.nextNode(),n.push({type:2,index:++s});a.append(t[e],N())}}}else if(8===a.nodeType)if(a.data===A)n.push({type:2,index:s});else{let t=-1;for(;-1!==(t=a.data.indexOf(M,t+1));)n.push({type:7,index:s}),t+=M.length-1}s++}}static createElement(t,e){const i=P.createElement("template");return i.innerHTML=t,i}}function Q(t,e,i=t,a){if(e===W)return e;let s=void 0!==a?i._$Co?.[a]:i._$Cl;const r=z(e)?void 0:e._$litDirective$;return s?.constructor!==r&&(s?._$AO?.(!1),void 0===r?s=void 0:(s=new r(t),s._$AT(t,i,a)),void 0!==a?(i._$Co??=[])[a]=s:i._$Cl=s),void 0!==s&&(e=Q(t,s._$AS(t,e.values),s,a)),e}class tt{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,a=(t?.creationScope??P).importNode(e,!0);Y.currentNode=a;let s=Y.nextNode(),r=0,o=0,n=i[0];for(;void 0!==n;){if(r===n.index){let e;2===n.type?e=new et(s,s.nextSibling,this,t):1===n.type?e=new n.ctor(s,n.name,n.strings,this,t):6===n.type&&(e=new ot(s,this,t)),this._$AV.push(e),n=i[++o]}r!==n?.index&&(s=Y.nextNode(),r++)}return Y.currentNode=P,a}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class et{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,a){this.type=2,this._$AH=G,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=a,this._$Cv=a?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Q(this,t,e),z(t)?t===G||null==t||""===t?(this._$AH!==G&&this._$AR(),this._$AH=G):t!==this._$AH&&t!==W&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>F(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==G&&z(this._$AH)?this._$AA.nextSibling.data=t:this.T(P.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,a="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=J.createElement(K(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===a)this._$AH.p(e);else{const t=new tt(a,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=q.get(t.strings);return void 0===e&&q.set(t.strings,e=new J(t)),e}k(t){F(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,a=0;for(const s of t)a===e.length?e.push(i=new et(this.O(N()),this.O(N()),this,this.options)):i=e[a],i._$AI(s),a++;a<e.length&&(this._$AR(i&&i._$AB.nextSibling,a),e.length=a)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=$(t).nextSibling;$(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class it{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,a,s){this.type=1,this._$AH=G,this._$AN=void 0,this.element=t,this.name=e,this._$AM=a,this.options=s,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=G}_$AI(t,e=this,i,a){const s=this.strings;let r=!1;if(void 0===s)t=Q(this,t,e,0),r=!z(t)||t!==this._$AH&&t!==W,r&&(this._$AH=t);else{const a=t;let o,n;for(t=s[0],o=0;o<s.length-1;o++)n=Q(this,a[i+o],e,o),n===W&&(n=this._$AH[o]),r||=!z(n)||n!==this._$AH[o],n===G?t=G:t!==G&&(t+=(n??"")+s[o+1]),this._$AH[o]=n}r&&!a&&this.j(t)}j(t){t===G?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class at extends it{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===G?void 0:t}}class st extends it{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==G)}}class rt extends it{constructor(t,e,i,a,s){super(t,e,i,a,s),this.type=5}_$AI(t,e=this){if((t=Q(this,t,e,0)??G)===W)return;const i=this._$AH,a=t===G&&i!==G||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,s=t!==G&&(i===G||a);a&&this.element.removeEventListener(this.name,this,i),s&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class ot{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Q(this,t)}}const nt=k.litHtmlPolyfillSupport;nt?.(J,et),(k.litHtmlVersions??=[]).push("3.3.2");const lt=globalThis;class ht extends w{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const a=i?.renderBefore??e;let s=a._$litPart$;if(void 0===s){const t=i?.renderBefore??null;a._$litPart$=s=new et(e.insertBefore(N(),t),t,void 0,i??{})}return s._$AI(t),s})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return W}}ht._$litElement$=!0,ht.finalized=!0,lt.litElementHydrateSupport?.({LitElement:ht});const ct=lt.litElementPolyfillSupport;ct?.({LitElement:ht}),(lt.litElementVersions??=[]).push("4.2.2");const dt=t=>(e,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},pt={attribute:!0,type:String,converter:x,reflect:!1,hasChanged:y},ut=(t=pt,e,i)=>{const{kind:a,metadata:s}=i;let r=globalThis.litPropertyMetadata.get(s);if(void 0===r&&globalThis.litPropertyMetadata.set(s,r=new Map),"setter"===a&&((t=Object.create(t)).wrapped=!0),r.set(i.name,t),"accessor"===a){const{name:a}=i;return{set(i){const s=e.get.call(this);e.set.call(this,i),this.requestUpdate(a,s,t,!0,i)},init(e){return void 0!==e&&this.C(a,void 0,t,e),e}}}if("setter"===a){const{name:a}=i;return function(i){const s=this[a];e.call(this,i),this.requestUpdate(a,s,t,!0,i)}}throw Error("Unsupported decorator location: "+a)};function gt(t){return(e,i)=>"object"==typeof i?ut(t,e,i):((t,e,i)=>{const a=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),a?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}function bt(t){return gt({...t,state:!0,attribute:!1})}let vt=class extends ht{constructor(){super(...arguments),this._cards=[],this._activeView=null,this._cardConfigs=[],this._boundHashChange=this._onHashChange.bind(this)}connectedCallback(){super.connectedCallback(),window.addEventListener("hashchange",this._boundHashChange),this._activeView=this._getViewFromHash()??this._config?.default_view??null}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("hashchange",this._boundHashChange)}_onHashChange(){const t=this._getViewFromHash();null!==t&&(this._activeView=t),location.hash&&"#"!==location.hash||(this._activeView=this._config?.default_view??null)}_getViewFromHash(){const t=location.hash.replace("#","");if(!t)return null;return(this._config?.views??[]).includes(t)?t:null}setConfig(t){this._config=t,this._activeView=this._getViewFromHash()??t.default_view??null,this._createCards()}set hass(t){this._hass=t,this._cards.forEach(e=>{e.hass=t})}get hass(){return this._hass}_createCards(){this._config.cards&&(this._cardConfigs=this._config.cards,this._cards=this._config.cards.map(t=>{const e=t.type?.startsWith("custom:")?t.type.replace("custom:",""):`hui-${t.type}-card`,i=document.createElement(e);return"function"==typeof i.setConfig&&i.setConfig(t),i}),this.requestUpdate())}render(){const t=this._cards.filter((t,e)=>{const i=this._cardConfigs[e];return!i||!i.view||i.view===this._activeView});return V`
      <div class="background"></div>
      <div class="content">
        ${t.map(t=>t)}
      </div>
    `}getCardSize(){return 6}};vt.styles=[o`
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
    `],t([gt({attribute:!1})],vt.prototype,"_config",void 0),t([gt({attribute:!1})],vt.prototype,"_cards",void 0),t([bt()],vt.prototype,"_activeView",void 0),vt=t([dt("glass-background")],vt);class mt extends ht{constructor(){super(...arguments),this._trackedEntities=[],this._previousStates={}}setConfig(t){this._config=t}setTrackedEntities(t){this._trackedEntities=t.filter(Boolean)}shouldUpdate(){if(!this.hass)return!1;if(0===this._trackedEntities.length)return!0;let t=!1;for(const e of this._trackedEntities){const i=this.hass.states[e]?.state;this._previousStates[e]!==i&&(this._previousStates[e]=i,t=!0)}return t}getEntity(t){return this.hass?.states[t]}getState(t){return this.hass?.states[t]?.state??"unavailable"}getEntityAttribute(t,e){return this.hass?.states[t]?.attributes[e]}isOn(t){return"on"===this.getState(t)}callService(t,e,i,a){this.hass?.callService(t,e,i,a?{entity_id:a}:void 0)}toggle(t){const[e]=t.split(".");this.callService(e,"toggle",void 0,t)}getCardSize(){return 1}static get glassStyles(){return o`
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
    `}}t([gt({attribute:!1})],mt.prototype,"hass",void 0),t([gt({attribute:!1})],mt.prototype,"_config",void 0);let ft=class extends mt{get _buttonConfig(){return this._config}setConfig(t){super.setConfig(t),t.entity&&this.setTrackedEntities([t.entity])}_handleTap(){const t=this._buttonConfig.tap_action?.action??"toggle";"toggle"===t&&this._config.entity?this.toggle(this._config.entity):"navigate"===t&&this._buttonConfig.tap_action?.navigation_path&&(window.location.hash=this._buttonConfig.tap_action.navigation_path)}render(){if(!this.hass||!this._config)return V``;const t=this._config.entity?this.getEntity(this._config.entity):void 0,e=!!t&&this.isOn(this._config.entity),i=this._config.name??t?.attributes.friendly_name??"",a=this._config.icon??t?.attributes.icon??"mdi:help-circle";let s="";if(!1!==this._buttonConfig.show_state&&t){const e=t.attributes.unit_of_measurement;s=e?`${t.state} ${e}`:"on"===t.state?"Pa":"off"===t.state?"Av":t.state}return V`
      <div class="glass button ${e?"active":""}" @click=${this._handleTap}>
        <div class="icon-wrap">
          <ha-icon .icon=${a}></ha-icon>
        </div>
        <div class="info">
          <div class="name">${i}</div>
          ${s?V`<div class="state">${s}</div>`:""}
        </div>
      </div>
    `}};ft.styles=[mt.glassStyles,o`
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
    `],ft=t([dt("glass-button")],ft);let xt=class extends mt{setConfig(t){super.setConfig(t),t.entity&&this.setTrackedEntities([t.entity])}get _chipConfig(){return this._config}render(){if(!this.hass||!this._config)return V``;const t=this._config.entity?this.getEntity(this._config.entity):void 0,e=this._chipConfig.chip_type??"custom";let i=this._config.icon??"",a="",s=!1;switch(e){case"person":{const e=t?.attributes.friendly_name??"",r=t?.state??"";i=i||"mdi:account",a=`${e} · ${"home"===r?"Hemma":"Borta"}`,s="home"===r;break}case"battery":{const e=t?.state??"?";i=i||"mdi:cellphone",a=`${e} %`,s=Number(e)>20;break}case"lights":{const e=t?.state??"0";i=i||"mdi:lightbulb-group",a=`${e} st`,s=Number(e)>0;break}default:i=i||"mdi:information",a=this._chipConfig.content??t?.state??""}return V`
      <div class="chip ${s?"active":""}">
        <ha-icon .icon=${i}></ha-icon>
        <span class="value">${a}</span>
      </div>
    `}};xt.styles=[mt.glassStyles,o`
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
    `],xt=t([dt("glass-chip")],xt);let yt=class extends mt{get _headerConfig(){return this._config}setConfig(t){super.setConfig(t);const e=[];t.weather_entity&&e.push(t.weather_entity),t.chips&&t.chips.forEach(t=>{t.entity&&e.push(t.entity)}),this.setTrackedEntities(e)}_renderChip(t){const e=this.getEntity(t.entity);if(!e)return V``;let i=t.icon??"",a="",s=!1;switch(t.chip_type){case"person":i=i||"mdi:account";a=`${e.attributes.friendly_name??""} · ${"home"===e.state?"Hemma":"Borta"}`,s="home"===e.state;break;case"battery":i=i||"mdi:cellphone",a=`${e.state} %`,s=Number(e.state)>20;break;case"lights":i=i||"mdi:lightbulb-group",a=`${e.state} st`,s=Number(e.state)>0;break;default:i=i||"mdi:information",a=e.state}return V`
      <div class="chip ${s?"active":""}">
        <ha-icon .icon=${i}></ha-icon>
        <span>${a}</span>
      </div>
    `}render(){if(!this.hass||!this._config)return V``;const t=this.hass.user?.name??"",e=!1!==this._headerConfig.greeting?function(t){const e=(new Date).getHours();return e>=5&&e<10?`God morgon, ${t}`:e>=10&&e<17?`Hej, ${t}`:e>=17&&e<22?`God kvall, ${t}`:`God natt, ${t}`}(t):t,i=this._headerConfig.weather_entity?this.getEntity(this._headerConfig.weather_entity):void 0,a=i?.state??"",s=i?.attributes.temperature??"",r=i?.attributes.temperature_unit??"°C",o={"clear-night":"mdi:weather-night",cloudy:"mdi:weather-cloudy",fog:"mdi:weather-fog",hail:"mdi:weather-hail",lightning:"mdi:weather-lightning","lightning-rainy":"mdi:weather-lightning-rainy",partlycloudy:"mdi:weather-partly-cloudy",pouring:"mdi:weather-pouring",rainy:"mdi:weather-rainy",snowy:"mdi:weather-snowy","snowy-rainy":"mdi:weather-snowy-rainy",sunny:"mdi:weather-sunny",windy:"mdi:weather-windy","windy-variant":"mdi:weather-windy-variant",exceptional:"mdi:alert-circle-outline"}[a]??"mdi:weather-cloudy";return V`
      <div class="glass header">
        <div class="top-row">
          <div class="home-icon">
            <ha-icon icon="mdi:home"></ha-icon>
          </div>
          <div class="greeting-section">
            <div class="greeting">${e}</div>
            ${i?V`
              <div class="weather">
                <ha-icon .icon=${o}></ha-icon>
                ${{"clear-night":"Klart",cloudy:"Molnigt",fog:"Dimma",partlycloudy:"Delvis molnigt",rainy:"Regn",snowy:"Sno",sunny:"Soligt",windy:"Blasigt"}[a]??a} \u2022 ${s}${r}
              </div>
            `:""}
          </div>
        </div>
        ${this._headerConfig.chips?.length?V`
          <div class="chips">
            ${this._headerConfig.chips.map(t=>this._renderChip(t))}
          </div>
        `:""}
      </div>
    `}};yt.styles=[mt.glassStyles,o`
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
    `],yt=t([dt("glass-header")],yt);let _t=class extends mt{get _roomConfig(){return this._config}setConfig(t){super.setConfig(t);const e=[];t.entity&&e.push(t.entity),t.sub_buttons&&t.sub_buttons.forEach(t=>e.push(t.entity)),this.setTrackedEntities(e)}_handleCardTap(){this._roomConfig.popup_id&&(window.location.hash=this._roomConfig.popup_id)}_handleSubButtonTap(t,e){t.stopPropagation(),this.toggle(e)}render(){if(!this.hass||!this._config)return V``;const t=this._roomConfig.sub_buttons??[],e=t.map(t=>t.entity);this._config.entity&&!e.includes(this._config.entity)&&e.unshift(this._config.entity);const i=e.some(t=>this.isOn(t)),a=function(t,e){const i=function(t,e){return e.filter(e=>"on"===t[e]?.state).length}(t,e);return 0===i?"Av":1===i?"Pa":`${i} lampor pa`}(this.hass.states,e),s=this._config.icon??"mdi:home",r=this._config.name??"";return V`
      <div class="glass room-card ${i?"active":""}" @click=${this._handleCardTap}>
        <div class="top">
          <div class="room-icon">
            <ha-icon .icon=${s}></ha-icon>
          </div>
          <div class="room-info">
            <div class="room-name">${r}</div>
            <div class="room-status">${a}</div>
          </div>
        </div>
        ${t.length?V`
          <div class="sub-buttons">
            ${t.map(t=>{const e=this.isOn(t.entity),i=t.icon??this.getEntity(t.entity)?.attributes.icon??"mdi:lightbulb";return V`
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
    `}};_t.styles=[mt.glassStyles,o`
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
    `],_t=t([dt("glass-room-card")],_t);let wt=class extends mt{constructor(){super(...arguments),this._dragging=!1,this._dragValue=0,this._stopEvent=t=>{t.stopPropagation()},this._toggleLight=t=>{t.stopPropagation(),this._config?.entity&&this.toggle(this._config.entity)}}setConfig(t){super.setConfig(t),t.entity&&this.setTrackedEntities([t.entity])}_handleSliderInteraction(t){if(!this._config.entity)return;const e=this.getEntity(this._config.entity);if(!e||"off"===e.state)return void this.callService("light","turn_on",{brightness_pct:100},this._config.entity);const i=t.currentTarget.getBoundingClientRect(),a=t=>{const e=Math.max(0,Math.min(t-i.left,i.width)),a=Math.round(e/i.width*100);this._dragValue=Math.max(1,Math.min(100,a))},s="touches"in t?t.touches[0].clientX:t.clientX;a(s),this._dragging=!0;const r=t=>{const e="touches"in t?t.touches[0].clientX:t.clientX;a(e)},o=()=>{this._dragging=!1,this.callService("light","turn_on",{brightness_pct:this._dragValue},this._config.entity),document.removeEventListener("mousemove",r),document.removeEventListener("mouseup",o),document.removeEventListener("touchmove",r),document.removeEventListener("touchend",o)};document.addEventListener("mousemove",r),document.addEventListener("mouseup",o),document.addEventListener("touchmove",r,{passive:!0}),document.addEventListener("touchend",o)}render(){if(!this.hass||!this._config?.entity)return V``;const t=this.getEntity(this._config.entity);if(!t)return V``;const e="on"===t.state,i=this._dragging?this._dragValue:function(t){if(!t||"on"!==t.state)return 0;const e=t.attributes.brightness;return e?Math.round(e/255*100):100}(t),a=this._config.name??t.attributes.friendly_name??"",s=this._config.icon??t.attributes.icon??"mdi:lightbulb";return V`
      <div class="glass slider-card ${e?"on":"off"}">
        <div class="slider-header">
          <div class="slider-left">
            <button
              class="light-icon-btn"
              role="button"
              aria-pressed=${e?"true":"false"}
              aria-label=${e?`Släck ${a}`:`Tänd ${a}`}
              @pointerdown=${this._stopEvent}
              @mousedown=${this._stopEvent}
              @touchstart=${this._stopEvent}
              @click=${this._toggleLight}
            >
              <span class="light-icon">
                <ha-icon .icon=${s}></ha-icon>
              </span>
            </button>
            <span class="light-name">${a}</span>
          </div>
          <span class="brightness-value">${e?`${i}%`:"Av"}</span>
        </div>
        <div class="slider-track" @mousedown=${this._handleSliderInteraction} @touchstart=${this._handleSliderInteraction}>
          ${e?V`
            <div class="slider-fill ${this._dragging?"dragging":""}" style="width: ${i}%"></div>
            <div class="slider-glow" style="left: calc(${i}% - 12px)"></div>
          `:V`
            <div class="off-overlay" @click=${()=>this.callService("light","turn_on",{brightness_pct:100},this._config.entity)}>
              Tryck för att tända
            </div>
          `}
        </div>
      </div>
    `}};wt.styles=[mt.glassStyles,o`
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
      .light-icon-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 48px;
        min-height: 48px;
        margin: -6px;
        padding: 0;
        border: none;
        background: transparent;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .light-icon-btn:focus-visible {
        outline: 2px solid var(--hub-amber, var(--glass-accent));
        outline-offset: 2px;
        border-radius: 14px;
      }
      .light-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: var(--hub-icon-chip-bg, rgba(255, 255, 255, 0.06));
        transition: background var(--glass-transition), box-shadow var(--glass-transition),
          transform 0.15s ease;
      }
      .light-icon-btn:active .light-icon { transform: scale(0.9); }
      .on .light-icon {
        background: var(--hub-amber, var(--glass-accent));
        box-shadow: var(--hub-amber-glow, 0 0 12px rgba(79, 195, 247, 0.15));
      }
      .light-icon ha-icon {
        --mdc-icon-size: 20px;
        color: var(--hub-icon-chip-color, var(--glass-text-dim));
        transition: color var(--glass-transition);
      }
      .on .light-icon ha-icon { color: var(--hub-surface, #ffffff); }
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
    `],t([bt()],wt.prototype,"_dragging",void 0),t([bt()],wt.prototype,"_dragValue",void 0),wt=t([dt("glass-light-slider")],wt);const kt=o`
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
`;let $t=class extends ht{constructor(){super(...arguments),this._isOpen=!1,this._isClosing=!1,this._cards=[],this._onHashChange=()=>{this._checkHash()}}connectedCallback(){super.connectedCallback(),window.addEventListener("hashchange",this._onHashChange),this._checkHash()}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("hashchange",this._onHashChange)}_checkHash(){if(!this._config?.hash)return;const t=window.location.hash.replace("#","");t!==this._config.hash||this._isOpen?t!==this._config.hash&&this._isOpen&&this._close():this._open()}_open(){this._isOpen=!0,this._isClosing=!1,this._createPopupCards()}_close(){this._isClosing=!0,setTimeout(()=>{this._isOpen=!1,this._isClosing=!1},350),window.location.hash.replace("#","")===this._config.hash&&history.replaceState(null,"",window.location.pathname+window.location.search)}_handleBackdropClick(){this._close()}setConfig(t){if(!t.hash)throw new Error('glass-popup requires a "hash" property');this._config=t}set hass(t){this._hass=t,this._cards.forEach(e=>{e.hass=t})}get hass(){return this._hass}_createPopupCards(){this._config?.cards&&(this._cards=this._config.cards.map(t=>{const e=t.type?.startsWith("custom:")?t.type.replace("custom:",""):`hui-${t.type}-card`,i=document.createElement(e);return"function"==typeof i.setConfig&&i.setConfig(t),this.hass&&(i.hass=this.hass),i}),this.requestUpdate())}render(){return this._isOpen||this._isClosing?V`
      <div class="overlay ${this._isOpen&&!this._isClosing?"open":""} ${this._isClosing?"closing":""}">
        <div class="backdrop" @click=${this._handleBackdropClick}></div>
        <div class="panel">
          <div class="handle"></div>
          ${this._config.title?V`
            <div class="popup-header">
              ${this._config.icon?V`<ha-icon .icon=${this._config.icon}></ha-icon>`:""}
              <span class="popup-title">${this._config.title}</span>
            </div>
          `:""}
          <div class="popup-cards">
            ${this._cards.map(t=>t)}
          </div>
        </div>
      </div>
    `:V``}getCardSize(){return 0}};$t.styles=[kt,o`
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
    `],t([gt({attribute:!1})],$t.prototype,"_config",void 0),t([bt()],$t.prototype,"_isOpen",void 0),t([bt()],$t.prototype,"_isClosing",void 0),$t=t([dt("glass-popup")],$t);let Et=class extends ht{constructor(){super(...arguments),this._activeHash="",this._onHashChange=()=>{const t=window.location.hash.replace("#","");this._config.items.some(e=>e.hash===t)&&(this._activeHash=t)}}connectedCallback(){super.connectedCallback(),this._activeHash=window.location.hash.replace("#","")||this._config?.items?.[0]?.hash||"",window.addEventListener("hashchange",this._onHashChange)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("hashchange",this._onHashChange)}setConfig(t){if(!t.items?.length)throw new Error('glass-nav-bar requires "items"');this._config=t}_handleTap(t){this._activeHash=t,window.location.hash=t}render(){return this._config?.items?V`
      <div class="nav-bar">
        ${this._config.items.map(t=>V`
          <div class="nav-item ${this._activeHash===t.hash?"active":""}" @click=${()=>this._handleTap(t.hash)}>
            <ha-icon .icon=${t.icon}></ha-icon>
            <span class="nav-label">${t.label}</span>
          </div>
        `)}
      </div>
    `:V``}getCardSize(){return 0}};Et.styles=o`
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
  `,t([gt({attribute:!1})],Et.prototype,"hass",void 0),t([gt({attribute:!1})],Et.prototype,"_config",void 0),t([bt()],Et.prototype,"_activeHash",void 0),Et=t([dt("glass-nav-bar")],Et);let Ct=class extends mt{get _vacuumConfig(){return this._config}setConfig(t){super.setConfig(t),t.entity&&this.setTrackedEntities([t.entity])}_getStatusText(t){return{cleaning:"Stader",docked:"Dockad",paused:"Pausad",returning:"Atergar",idle:"Inaktiv",error:"Fel",unavailable:"Otillganglig"}[t]??t}_start(){this._config.entity&&this.callService("vacuum","start",void 0,this._config.entity)}_stop(){this._config.entity&&this.callService("vacuum","return_to_base",void 0,this._config.entity)}_cleanRoom(t){this._config.entity&&null!=t.room_id&&this.callService("vacuum","send_command",{command:"app_segment_clean",params:[t.room_id]},this._config.entity)}render(){if(!this.hass||!this._config?.entity)return V``;const t=this.getEntity(this._config.entity);if(!t)return V``;const e=t.state,i="cleaning"===e,a="error"===e,s=t.attributes.battery_level,r=this._config.name??t.attributes.friendly_name??"Vacuum",o=this._config.icon??"mdi:robot-vacuum";return V`
      <div
        class="glass vacuum-card ${i?"cleaning":""} ${a?"error":""}"
      >
        <div class="vacuum-header">
          <div class="vacuum-icon">
            <ha-icon .icon=${o}></ha-icon>
          </div>
          <div class="vacuum-info">
            <div class="vacuum-name">${r}</div>
            <div class="vacuum-status">${this._getStatusText(e)}</div>
          </div>
          ${null!=s?V`
                <div class="vacuum-battery">
                  <ha-icon
                    icon="mdi:battery${s>80?"":s>60?"-80":s>40?"-60":s>20?"-40":"-20"}"
                  ></ha-icon>
                  ${s}%
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
        ${this._vacuumConfig.rooms?.length?V`
              <div class="rooms">
                ${this._vacuumConfig.rooms.map(t=>V`
                    <div class="room-btn" @click=${()=>this._cleanRoom(t)}>
                      ${t.name}
                    </div>
                  `)}
              </div>
            `:""}
      </div>
    `}};Ct.styles=[mt.glassStyles,o`
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
    `],Ct=t([dt("glass-vacuum-card")],Ct);let St=class extends mt{get _infoConfig(){return this._config}setConfig(t){super.setConfig(t);const e=[];t.entity&&e.push(t.entity),t.secondary_entity&&e.push(t.secondary_entity),t.badge_entity&&e.push(t.badge_entity),this.setTrackedEntities(e)}render(){if(!this.hass||!this._config)return V``;const t=this._config.entity?this.getEntity(this._config.entity):void 0,e=this._config.name??t?.attributes.friendly_name??"",i=this._config.icon??t?.attributes.icon??"mdi:information";let a=t?.state??"";const s=t?.attributes.unit_of_measurement;s&&(a=`${a} ${s}`);const r=this._infoConfig.badge_entity?this.getEntity(this._infoConfig.badge_entity):void 0;return V`
      <div class="glass info-card">
        <div class="info-icon">
          <ha-icon .icon=${i}></ha-icon>
        </div>
        <div class="info-content">
          <div class="info-name">${e}</div>
          <div class="info-value">${a}</div>
        </div>
        ${r?V`
              <div class="badge">
                ${this._infoConfig.badge_icon?V`<ha-icon
                      .icon=${this._infoConfig.badge_icon}
                    ></ha-icon>`:""}
                ${r.state}
              </div>
            `:""}
      </div>
    `}};St.styles=[mt.glassStyles,o`
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
    `],St=t([dt("glass-info-row")],St);let Mt=class extends ht{set hass(t){}setConfig(t){if(!t.label)throw new Error('glass-section requires a "label" property');this._config=t}render(){return this._config?V`
      <div class="section">
        ${this._config.icon?V`<ha-icon .icon=${this._config.icon}></ha-icon>`:""}
        <span class="label">${this._config.label}</span>
      </div>
    `:V``}getCardSize(){return 0}};Mt.styles=o`
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
  `,t([gt({attribute:!1})],Mt.prototype,"_config",void 0),Mt=t([dt("glass-section")],Mt);let At=class extends mt{get _departureConfig(){return this._config}setConfig(t){super.setConfig(t),t.entity&&this.setTrackedEntities([t.entity])}_getDepartures(){if(!this._config?.entity)return[];return this.getEntityAttribute(this._config.entity,"departures")??[]}_isDelayed(t){if(!t.scheduled||!t.expected)return!1;const e=new Date(t.scheduled).getTime();return new Date(t.expected).getTime()-e>6e4}_isSoon(t){const e=t.display?.toLowerCase()??"",i=e.match(/^(\d+)\s*min/);return i?parseInt(i[1],10)<=5:"nu"===e}_getTimeClass(t){return this._isDelayed(t)?"time delayed":this._isSoon(t)?"time soon":"time"}getCardSize(){return 3}render(){if(!this.hass||!this._config?.entity)return V``;const t=this._getDepartures(),e=this._departureConfig.max_departures??6,i=t.slice(0,e),a=this._departureConfig.station_name??this._departureConfig.name??(t.length>0?t[0].stop_area?.name:void 0)??"Avgångar",s=this._departureConfig.icon??"mdi:train";return V`
      <div class="glass departure-card">
        <div class="departure-header">
          <div class="departure-icon">
            <ha-icon .icon=${s}></ha-icon>
          </div>
          <div class="station-name">${a}</div>
        </div>
        ${0===i.length?V`<div class="empty-state">Inga avgångar</div>`:V`
              <div class="departure-list">
                ${i.map(t=>V`
                    <div class="departure-row">
                      <span class="line-badge">${t.line.designation}</span>
                      <span class="destination">${t.destination}</span>
                      <span class="track">Spår ${t.stop_point.designation}</span>
                      <span class=${this._getTimeClass(t)}>${t.display}</span>
                    </div>
                    ${t.deviations?.length?t.deviations.filter(t=>t.message).map(t=>V`<div class="deviation">${t.message}</div>`):G}
                  `)}
              </div>
            `}
      </div>
    `}};At.styles=[mt.glassStyles,o`
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
    `],At=t([dt("glass-departure-card")],At);const Tt=o`
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
    --hub-navbar-bg: rgba(19, 19, 22, 0.72);
    --hub-navbar-border: rgba(255, 255, 255, 0.06);
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
    --hub-navbar-bg: rgba(250, 248, 243, 0.72);
    --hub-navbar-border: rgba(60, 50, 30, 0.08);
  }
  :host {
    /* Ink for text sitting directly on weather footage — always light with a
       shadow, independent of theme (the footage, not the theme, is the
       backdrop there). */
    --hub-ink-on-media: #f4f3ef;
    --hub-ink-on-media-muted: rgba(244, 243, 239, 0.95);
    --hub-font-display: 'Outfit', sans-serif;
    --hub-font-body: 'Inter', -apple-system, sans-serif;
    --hub-radius: 18px;
    --hub-radius-lg: 20px;
    --hub-radius-sm: 12px;
    --hub-radius-pill: 99px;
    --hub-gap: 12px;
    --hub-page-pad: clamp(20px, 3vw, 40px);
    --hub-nav-h: calc(64px + env(safe-area-inset-bottom, 0px));
    --hub-fade: 600ms;
  }
`,Pt="glass-hub-theme";const Nt="glass-hub-weather-bg";function zt(){return"off"!==localStorage.getItem(Nt)}function Ft(t){localStorage.setItem(Nt,t?"on":"off")}let Dt=null;function Bt(){return Dt}function jt(t,e=8){return Math.abs(t)>e}const Lt=t=>X`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    ${t}
  </svg>
`,Ot={lamp:Lt(X`
    <path d="M12 3a6 6 0 0 0-4 10.4c.6.6 1 1.4 1 2.3v.3h6v-.3c0-.9.4-1.7 1-2.3A6 6 0 0 0 12 3z"></path>
    <path d="M10 19h4M10.5 21.5h3"></path>
  `),bolt:Lt(X`
    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"></path>
  `),home:Lt(X`
    <path d="M3 11.5 12 4l9 7.5"></path>
    <path d="M5.5 10v9.5a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1V15a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4.5a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1V10"></path>
  `),vacuum:Lt(X`
    <circle cx="12" cy="12" r="8"></circle>
    <circle cx="12" cy="12" r="2.2"></circle>
    <path d="M12 4v2M4 12h2M18 12h2M12 20v-2"></path>
  `),train:Lt(X`
    <rect x="5" y="4" width="14" height="13" rx="4"></rect>
    <path d="M5 12h14"></path>
    <path d="M8 20l-1.5 2M16 20l1.5 2"></path>
    <circle cx="9" cy="17.5" r="0.9" fill="currentColor" stroke="none"></circle>
    <circle cx="15" cy="17.5" r="0.9" fill="currentColor" stroke="none"></circle>
  `),bus:Lt(X`
    <rect x="4" y="4" width="16" height="13" rx="2.5"></rect>
    <path d="M4 12h16"></path>
    <path d="M4 8.5h16"></path>
    <path d="M7 20l-1 2M17 20l1 2"></path>
    <circle cx="8" cy="14.5" r="0.9" fill="currentColor" stroke="none"></circle>
    <circle cx="16" cy="14.5" r="0.9" fill="currentColor" stroke="none"></circle>
  `),note:Lt(X`
    <circle cx="7" cy="18" r="2.3"></circle>
    <circle cx="16" cy="16" r="2.3"></circle>
    <path d="M9.3 18V5.5L18.3 4v11.5"></path>
  `),ring:Lt(X`
    <path d="M14.7 4.5A8 8 0 0 1 12 20 8 8 0 0 1 9.3 4.5"></path>
  `),sun:Lt(X`
    <circle cx="12" cy="12" r="4"></circle>
    <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"></path>
  `),moon:Lt(X`
    <path d="M20 14.5A8 8 0 0 1 9.5 4 6.5 6.5 0 1 0 20 14.5z"></path>
  `),power:Lt(X`
    <path d="M12 3v8.5"></path>
    <path d="M6.7 6.9a8 8 0 1 0 10.6 0"></path>
  `),play:Lt(X`
    <path d="M7 4.5v15l13-7.5-13-7.5z"></path>
  `),pause:Lt(X`
    <rect x="7" y="5" width="3.5" height="14" rx="1"></rect>
    <rect x="13.5" y="5" width="3.5" height="14" rx="1"></rect>
  `),prev:Lt(X`
    <path d="M18.5 5.5v13L9 12l9.5-6.5z"></path>
    <path d="M6 5v14"></path>
  `),next:Lt(X`
    <path d="M5.5 5.5v13L15 12 5.5 5.5z"></path>
    <path d="M18 5v14"></path>
  `),speaker:Lt(X`
    <rect x="6" y="3" width="12" height="18" rx="3"></rect>
    <circle cx="12" cy="14" r="3.2"></circle>
    <circle cx="12" cy="6.5" r="0.9" fill="currentColor" stroke="none"></circle>
  `),sofa:Lt(X`
    <path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"></path>
    <rect x="3" y="11" width="18" height="6" rx="2"></rect>
    <path d="M5 17v2M19 17v2"></path>
  `),pot:Lt(X`
    <path d="M4 10h16"></path>
    <path d="M5 10v6a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-6"></path>
    <path d="M2 10h2M20 10h2"></path>
    <path d="M9 10V7a3 3 0 0 1 6 0v3"></path>
  `),bed:Lt(X`
    <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6"></path>
    <path d="M3 15h18"></path>
    <path d="M3 18v2M21 18v2"></path>
    <rect x="5" y="10" width="6" height="4" rx="1"></rect>
  `),door:Lt(X`
    <rect x="6" y="3" width="12" height="18" rx="1"></rect>
    <circle cx="14.5" cy="12" r="0.8" fill="currentColor" stroke="none"></circle>
  `),desk:Lt(X`
    <path d="M3 7h18v3H3z"></path>
    <path d="M5 10v9M19 10v9"></path>
  `),shower:Lt(X`
    <path d="M8 4a5 5 0 0 1 9 3"></path>
    <path d="M5 9h14"></path>
    <path d="M7 12v2M11 12v2M15 12v2M19 12v2"></path>
    <path d="M7 17v2M11 17v2M15 17v2"></path>
  `),leaf:Lt(X`
    <path d="M4 20c0-8 6-14 16-15C19 13 13 20 5 20a4 4 0 0 1-1 0z"></path>
    <path d="M4 20c3-5 7-8 12-9.5"></path>
  `),clock:Lt(X`
    <circle cx="12" cy="12" r="8.5"></circle>
    <path d="M12 7.5V12l3 2"></path>
  `),calendar:Lt(X`
    <rect x="4" y="5.5" width="16" height="14.5" rx="2"></rect>
    <path d="M4 10h16"></path>
    <path d="M8 3.5v3"></path>
    <path d="M16 3.5v3"></path>
    <path d="M8.5 14h2"></path>
    <path d="M13.5 14h2"></path>
    <path d="M8.5 17h2"></path>
  `),expand:Lt(X`
    <path d="M8 4H5a1 1 0 0 0-1 1v3"></path>
    <path d="M16 4h3a1 1 0 0 1 1 1v3"></path>
    <path d="M8 20H5a1 1 0 0 1-1-1v-3"></path>
    <path d="M16 20h3a1 1 0 0 0 1-1v-3"></path>
  `),compress:Lt(X`
    <path d="M4 8h3a1 1 0 0 0 1-1V4"></path>
    <path d="M20 8h-3a1 1 0 0 1-1-1V4"></path>
    <path d="M4 16h3a1 1 0 0 1 1 1v3"></path>
    <path d="M20 16h-3a1 1 0 0 1-1 1v3"></path>
  `),close:X`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"></path></svg>`},It={sunny:{sky:"clear",clouds:0,sun:!0,stars:!0,rain:0,snow:0,hail:0,lightning:!1,fog:!1,wind:1},"clear-night":{sky:"clear",clouds:0,sun:!1,stars:!0,rain:0,snow:0,hail:0,lightning:!1,fog:!1,wind:1},partlycloudy:{sky:"partly",clouds:.35,sun:!0,stars:!0,rain:0,snow:0,hail:0,lightning:!1,fog:!1,wind:1},cloudy:{sky:"overcast",clouds:.85,sun:!1,stars:!1,rain:0,snow:0,hail:0,lightning:!1,fog:!1,wind:1},rainy:{sky:"storm",clouds:.7,sun:!1,stars:!1,rain:110,snow:0,hail:0,lightning:!1,fog:!1,wind:1.2},pouring:{sky:"storm",clouds:.9,sun:!1,stars:!1,rain:260,snow:0,hail:0,lightning:!1,fog:!1,wind:1.5},snowy:{sky:"overcast",clouds:.7,sun:!1,stars:!1,rain:0,snow:70,hail:0,lightning:!1,fog:!1,wind:1},"snowy-rainy":{sky:"storm",clouds:.8,sun:!1,stars:!1,rain:70,snow:45,hail:0,lightning:!1,fog:!1,wind:1.2},lightning:{sky:"storm",clouds:.9,sun:!1,stars:!1,rain:0,snow:0,hail:0,lightning:!0,fog:!1,wind:1.4},"lightning-rainy":{sky:"storm",clouds:.9,sun:!1,stars:!1,rain:170,snow:0,hail:0,lightning:!0,fog:!1,wind:1.6},fog:{sky:"fog",clouds:.45,sun:!1,stars:!1,rain:0,snow:0,hail:0,lightning:!1,fog:!0,wind:.5},hail:{sky:"storm",clouds:.8,sun:!1,stars:!1,rain:40,snow:0,hail:120,lightning:!1,fog:!1,wind:1.3},windy:{sky:"partly",clouds:.5,sun:!1,stars:!1,rain:0,snow:0,hail:0,lightning:!1,fog:!1,wind:2.6},"windy-variant":{sky:"partly",clouds:.5,sun:!1,stars:!1,rain:0,snow:0,hail:0,lightning:!1,fog:!1,wind:2.6}};function Rt(t){return It[t]??It.cloudy}function Ht(t){return null===t?"night":t>10?"day":t>-4?"golden":"night"}const Ut={clear:["#04060C","#070B14","#0B1220"],partly:["#05060B","#090C12","#10141C"],overcast:["#060708","#0A0B0D","#101214"],storm:["#050607","#0A0B0E","#12141A"],fog:["#08090B","#0E1013","#16181C"]},Vt={day:{clear:["#4A85C7","#8CB8E3","#D6E7F4"],partly:["#5E8FC0","#93B7DB","#D3E2EE"],overcast:["#8A97A5","#AEB8C2","#D5DADF"],storm:["#4E5A68","#6E7B89","#9AA5B0"],fog:["#A8AFB5","#C2C7CB","#DCDFE1"]},golden:{clear:["#3E6CA8","#C98A5E","#F2C98E"],partly:["#4A6E9E","#B98963","#E8C393"],overcast:["#77808D","#9C9997","#C4B4A4"],storm:["#45505E","#6B6E75","#8F8578"],fog:["#9AA0A8","#B8B4AE","#D6CDC0"]},night:{clear:["#101B30","#1A2A47","#2A3C5C"],partly:["#12192A","#1C2740","#2B3852"],overcast:["#1A1E26","#242A34","#323844"],storm:["#151820","#20242E","#2E323E"],fog:["#1D2026","#282C33","#383C44"]}};function Xt(t){const e="string"==typeof t.datetime?Date.parse(t.datetime):NaN;return Number.isNaN(e)?NaN:e}function Wt(t){if(!Array.isArray(t))return[];const e=[];for(const i of t){if(!i||"object"!=typeof i)continue;const t=Xt(i);Number.isNaN(t)||"number"!=typeof i.temperature||e.push({ts:t,temp:i.temperature,condition:"string"==typeof i.condition?i.condition:"cloudy",precip:"number"==typeof i.precipitation?i.precipitation:0,precipProb:"number"==typeof i.precipitation_probability?i.precipitation_probability:null})}return e.sort((t,e)=>t.ts-e.ts)}function Gt(t){if(!Array.isArray(t))return[];const e=[];for(const i of t){if(!i||"object"!=typeof i)continue;const t=Xt(i);Number.isNaN(t)||"number"!=typeof i.temperature||e.push({ts:t,condition:"string"==typeof i.condition?i.condition:"cloudy",high:i.temperature,low:"number"==typeof i.templow?i.templow:null,precipProb:"number"==typeof i.precipitation_probability?i.precipitation_probability:null})}return e.sort((t,e)=>t.ts-e.ts)}const qt=new Set(["rainy","pouring","snowy","snowy-rainy","lightning-rainy","hail"]),Yt=new Set(["snowy","snowy-rainy"]);function Kt(t){return qt.has(t)}function Zt(t){return`${String(new Date(t).getHours()).padStart(2,"0")}:00`}const Jt={clear:{lit:[.16,.18,.23],shade:[.05,.06,.09],alpha:.75},partly:{lit:[.16,.18,.23],shade:[.05,.06,.09],alpha:.8},overcast:{lit:[.13,.14,.17],shade:[.04,.045,.06],alpha:.85},storm:{lit:[.12,.13,.16],shade:[.03,.035,.05],alpha:.9},fog:{lit:[.16,.17,.2],shade:[.07,.08,.1],alpha:.6}},Qt={clear:{lit:[1,1,1],shade:[.62,.66,.72],alpha:.92},partly:{lit:[1,1,1],shade:[.62,.66,.72],alpha:.92},overcast:{lit:[.82,.85,.88],shade:[.45,.49,.55],alpha:.95},storm:{lit:[.62,.66,.72],shade:[.28,.31,.37],alpha:.95},fog:{lit:[.88,.89,.9],shade:[.65,.67,.69],alpha:.7}};class te{constructor(t){this.canvas=t,this.ok=!1,this.gl=null,this.prog=null,this.u={},this._onLost=t=>{t.preventDefault(),this.ok=!1},this._onRestored=()=>{this._init()},t.addEventListener("webglcontextlost",this._onLost),t.addEventListener("webglcontextrestored",this._onRestored),this._init()}_init(){this.ok=!1;const t=this.canvas.getContext("webgl",{alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,stencil:!1});if(!t)return;const e=(e,i)=>{const a=t.createShader(e);return a?(t.shaderSource(a,i),t.compileShader(a),t.getShaderParameter(a,t.COMPILE_STATUS)?a:(console.debug("[cloud-shader] compile failed:",t.getShaderInfoLog(a)),null)):null},i=e(t.VERTEX_SHADER,"\nattribute vec2 a_pos;\nvoid main() { gl_Position = vec4(a_pos, 0.0, 1.0); }\n"),a=e(t.FRAGMENT_SHADER,"\nprecision mediump float;\nuniform vec2 u_res;\nuniform float u_time;\nuniform float u_density;\nuniform float u_wind;\nuniform vec3 u_lit;\nuniform vec3 u_shade;\nuniform float u_alpha;\nuniform float u_flash;\n\nfloat hash(vec2 p) {\n  p = fract(p * vec2(127.1, 311.7));\n  p += dot(p, p + 34.23);\n  return fract(p.x * p.y);\n}\nfloat noise(vec2 p) {\n  vec2 i = floor(p);\n  vec2 f = fract(p);\n  f = f * f * (3.0 - 2.0 * f);\n  return mix(\n    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),\n    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),\n    f.y);\n}\nfloat fbm(vec2 p) {\n  float v = 0.0;\n  float a = 0.5;\n  for (int i = 0; i < 5; i++) {\n    v += a * noise(p);\n    p = p * 2.03 + vec2(19.3, 7.1);\n    a *= 0.5;\n  }\n  return v;\n}\nvoid main() {\n  vec2 uv = gl_FragCoord.xy / u_res;\n  // Aspect-corrected, vertically squashed noise space -> wide cloud banks.\n  vec2 p = vec2(uv.x * (u_res.x / u_res.y), uv.y * 1.9);\n  float t = u_time * 0.014 * u_wind;\n  // Large slow masses + domain-warped turbulent detail.\n  float base = fbm(p * 1.5 + vec2(t, 0.0));\n  vec2 q = vec2(\n    fbm(p * 2.8 + vec2(t * 2.2, 1.7)),\n    fbm(p * 2.8 + vec2(8.3 - t * 1.4, 2.8)));\n  float detail = fbm(p * 4.2 + q * 1.7 + vec2(t * 3.5, 0.0));\n  float f = base * 0.62 + detail * 0.55 + (uv.y - 0.5) * 0.12;\n  float th = mix(0.86, 0.32, u_density);\n  float cov = smoothstep(th, th + 0.28, f);\n  // Denser core = darker (self-shadowing); lightning lifts the whole field.\n  vec3 col = mix(u_lit, u_shade, smoothstep(th + 0.05, th + 0.55, f));\n  col += vec3(u_flash * 0.45);\n  float a = min(cov * u_alpha * (1.0 + u_flash * 0.25), 1.0);\n  gl_FragColor = vec4(col * a, a); // premultiplied\n}\n");if(!i||!a)return;const s=t.createProgram();if(!s)return;if(t.attachShader(s,i),t.attachShader(s,a),t.linkProgram(s),!t.getProgramParameter(s,t.LINK_STATUS))return void console.debug("[cloud-shader] link failed:",t.getProgramInfoLog(s));t.useProgram(s);const r=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,r),t.bufferData(t.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),t.STATIC_DRAW);const o=t.getAttribLocation(s,"a_pos");t.enableVertexAttribArray(o),t.vertexAttribPointer(o,2,t.FLOAT,!1,0,0);for(const e of["u_res","u_time","u_density","u_wind","u_lit","u_shade","u_alpha","u_flash"])this.u[e]=t.getUniformLocation(s,e);t.enable(t.BLEND),t.blendFunc(t.ONE,t.ONE_MINUS_SRC_ALPHA),t.clearColor(0,0,0,0),this.gl=t,this.prog=s,this.ok=!0}render(t){const e=this.gl;e&&this.ok&&(e.viewport(0,0,this.canvas.width,this.canvas.height),e.clear(e.COLOR_BUFFER_BIT),e.uniform2f(this.u.u_res,this.canvas.width,this.canvas.height),e.uniform1f(this.u.u_time,t.time),e.uniform1f(this.u.u_density,t.density),e.uniform1f(this.u.u_wind,t.wind),e.uniform3f(this.u.u_lit,...t.palette.lit),e.uniform3f(this.u.u_shade,...t.palette.shade),e.uniform1f(this.u.u_alpha,t.palette.alpha),e.uniform1f(this.u.u_flash,t.flash),e.drawArrays(e.TRIANGLES,0,3))}clear(){const t=this.gl;t&&this.ok&&(t.viewport(0,0,this.canvas.width,this.canvas.height),t.clear(t.COLOR_BUFFER_BIT))}dispose(){this.canvas.removeEventListener("webglcontextlost",this._onLost),this.canvas.removeEventListener("webglcontextrestored",this._onRestored),this.gl&&this.prog&&this.gl.deleteProgram(this.prog),this.gl=null,this.prog=null,this.ok=!1}}const ee=[{scale:.55,alpha:.3,speed:.6},{scale:.8,alpha:.55,speed:.85},{scale:1.15,alpha:.9,speed:1.15}];class ie extends mt{constructor(){super(...arguments),this.theme="natt",this.active=!1,this._skyA="",this._skyB="",this._frontA=!0,this._w=0,this._h=0,this._dpr=1,this._running=!1,this._raf=0,this._last=0,this._t=0,this._scene=Rt("cloudy"),this._sceneKey="",this._drops=[],this._flakes=[],this._stones=[],this._splashes=[],this._clouds=[],this._stars=[],this._fogOffsets=[0,0,0],this._flash=0,this._nextFlash=0,this._bolt=null,this._onVisibility=()=>this._maybeRun(),this._onForce=()=>this.requestUpdate(),this._frame=t=>{if(!this._running)return;const e=Math.min((t-this._last)/1e3,.05);this._last=t,this._t+=e,this._draw(e),this._raf=requestAnimationFrame(this._frame)}}connectedCallback(){super.connectedCallback(),document.addEventListener("visibilitychange",this._onVisibility),window.addEventListener("hub-weather-force",this._onForce)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("visibilitychange",this._onVisibility),window.removeEventListener("hub-weather-force",this._onForce),this._ro?.disconnect(),this._ro=void 0,this._shader?.dispose(),this._shader=void 0,this._stopLoop()}firstUpdated(){this._canvas=this.renderRoot.querySelector("canvas.px")??void 0,this._ctx=this._canvas?.getContext("2d")??void 0,this._glCanvas=this.renderRoot.querySelector("canvas.gl")??void 0,this._glCanvas&&(this._shader=new te(this._glCanvas)),this._ro=new ResizeObserver(()=>this._resize()),this._ro.observe(this),this._resize()}updated(t){this._syncScene(),t.has("active")&&this._maybeRun()}get _condition(){return Bt()??this.getEntity(this.entity)?.state??"cloudy"}get _elevation(){const t=this.hass?.states["sun.sun"]?.attributes?.elevation;return"number"==typeof t?t:null}_syncScene(){const t=Ht(this._elevation),e=this._condition,i=`${e}|${this.theme}|${t}`;if(i===this._sceneKey)return;this._sceneKey=i,this._scene=Rt(e);const[a,s,r]=function(t,e,i){return"natt"===e?Ut[t]:Vt[i][t]}(this._scene.sky,this.theme,t),o=`background:linear-gradient(180deg, ${a} 0%, ${s} 55%, ${r} 100%)`;this._frontA?(this._skyB=o,this._frontA=!1):(this._skyA=o,this._frontA=!0),this._buildSprites(),this._buildParticles(),this._nextFlash=this._t+2+5*Math.random(),this._maybeRun()}_resize(){this._canvas&&(this._w=this.offsetWidth,this._h=this.offsetHeight,this._dpr=Math.min(window.devicePixelRatio||1,1.5),this._canvas.width=Math.max(1,Math.round(this._w*this._dpr)),this._canvas.height=Math.max(1,Math.round(this._h*this._dpr)),this._glCanvas&&(this._glCanvas.width=Math.max(1,Math.round(this._w*this._dpr/2)),this._glCanvas.height=Math.max(1,Math.round(this._h*this._dpr/2))),this._buildParticles())}get _isNightBand(){return"night"===Ht(this._elevation)}_perMp(t){return Math.round(t*this._w*this._h/1e6)}_buildParticles(){const t=this._scene,e=this._w,i=this._h;if(0===e||0===i)return;const a=Math.random;this._drops=Array.from({length:this._perMp(t.rain)},()=>({x:a()*e,y:a()*i,layer:Math.floor(a()*ee.length),jl:.7+.6*a(),js:.85+.35*a(),ja:40*(a()-.5)})),this._flakes=Array.from({length:this._perMp(t.snow)},()=>({x:a()*e,y:a()*i,r:1.5+2.5*a(),phase:a()*Math.PI*2,rot:a()*Math.PI*2,rotSpd:1.2*(a()-.5),layer:Math.floor(a()*ee.length)})),this._stones=Array.from({length:this._perMp(t.hail)},()=>({x:a()*e,y:a()*i,vy:700+300*a(),vx:60*(a()-.5),r:1.2+1.6*a(),bounced:!1}));const s=t.clouds>0?Math.round(2+5*t.clouds):0;this._clouds=Array.from({length:s},(t,r)=>({x:a()*e*1.4-.2*e,y:r/Math.max(s,1)*i*.38+30*a(),scale:.7+.9*a(),spd:6+10*a(),alpha:.5+.5*a()})),this._stars=t.stars?Array.from({length:90},()=>({x:a()*e,y:a()*i*.7,r:.5+1.1*a(),phase:a()*Math.PI*2})):[],this._splashes=[]}_buildSprites(){const t=document.createElement("canvas");t.width=512,t.height=256;const e=t.getContext("2d"),i="natt"===this.theme,a="storm"===this._scene.sky,[s,r,o]=i?[26,30,40]:a?[120,130,142]:[255,255,255];for(let t=0;t<9;t++){const t=80+352*Math.random(),a=90+80*Math.random(),n=55+70*Math.random(),l=e.createRadialGradient(t,a,0,t,a,n);l.addColorStop(0,`rgba(${s},${r},${o},${i?.5:.55})`),l.addColorStop(1,`rgba(${s},${r},${o},0)`),e.fillStyle=l,e.fillRect(0,0,512,256)}this._cloudSprite=t;const n=document.createElement("canvas");n.width=32,n.height=32;const l=n.getContext("2d"),h=l.createRadialGradient(16,16,0,16,16,14);h.addColorStop(0,"rgba(255,255,255,0.9)"),h.addColorStop(.5,"rgba(255,255,255,0.35)"),h.addColorStop(1,"rgba(255,255,255,0)"),l.fillStyle=h,l.fillRect(0,0,32,32),l.strokeStyle="rgba(255,255,255,0.5)",l.lineWidth=1.2;for(let t=0;t<3;t++)l.save(),l.translate(16,16),l.rotate(t*Math.PI/3),l.beginPath(),l.moveTo(-7,0),l.lineTo(7,0),l.stroke(),l.restore();this._flakeSprite=n}_maybeRun(){const t=this._scene.rain>0||this._scene.snow>0||this._scene.hail>0||this._scene.clouds>0||this._scene.stars||this._scene.sun||this._scene.fog||this._scene.lightning,e=this.active&&t&&this.isConnected&&"visible"===document.visibilityState;e&&!this._running?(this._running=!0,this._last=performance.now(),console.debug("[weather-bg] start"),this._raf=requestAnimationFrame(this._frame)):!e&&this._running&&this._stopLoop()}_stopLoop(){this._running&&(this._running=!1,cancelAnimationFrame(this._raf),console.debug("[weather-bg] stop"))}_draw(t){const e=this._ctx;if(!e)return;const i=this._w,a=this._h;e.setTransform(this._dpr,0,0,this._dpr,0,0),e.clearRect(0,0,i,a),this._updateFlash(t),this._stars.length&&this._isNightBand&&this._drawStars(e),!this._isNightBand||"clear"!==this._scene.sky&&"partly"!==this._scene.sky||this._drawMoon(e,i,a),this._scene.sun&&!this._isNightBand&&"dag"===this.theme&&this._drawSun(e,i,a);var s,r;if(!0===this._shader?.ok?this._scene.clouds>0?this._shader.render({time:this._t,density:this._scene.clouds,wind:this._scene.wind,palette:(s=this._scene.sky,r=this.theme,"natt"===r?Jt[s]:Qt[s]),flash:this._flash}):this._shader.clear():this._clouds.length&&this._drawClouds(e,t,i,a),this._scene.fog&&this._drawFog(e,t,i,a),this._drops.length&&this._drawRain(e,t,i,a),this._flakes.length&&this._drawSnow(e,t,i,a),this._stones.length&&this._drawHail(e,t,i,a),this._splashes.length&&this._drawSplashes(e,t),this._flash>.01){const t=("natt"===this.theme?.22:.3)*(this._bolt?.6:1);e.fillStyle=`rgba(215,225,255,${this._flash*t})`,e.fillRect(0,0,i,a)}this._bolt&&this._flash>.05&&this._drawBolt(e)}_drawStars(t){for(const e of this._stars){const i=.25+.5*Math.abs(Math.sin(.5*this._t+e.phase));t.fillStyle=`rgba(200,215,255,${i})`,t.beginPath(),t.arc(e.x,e.y,e.r,0,2*Math.PI),t.fill()}}_drawMoon(t,e,i){const a=.78*e,s=.2*i,r=.045*Math.min(e,i),o=t.createRadialGradient(a,s,.5*r,a,s,5*r);o.addColorStop(0,"rgba(215,225,250,0.22)"),o.addColorStop(.4,"rgba(215,225,250,0.07)"),o.addColorStop(1,"rgba(215,225,250,0)"),t.fillStyle=o,t.fillRect(a-5*r,s-5*r,10*r,10*r);const n=t.createRadialGradient(a+.35*r,s-.35*r,.1*r,a,s,r);n.addColorStop(0,"rgba(238,242,250,0.95)"),n.addColorStop(.75,"rgba(214,222,238,0.9)"),n.addColorStop(1,"rgba(178,190,214,0.85)"),t.fillStyle=n,t.beginPath(),t.arc(a,s,r,0,2*Math.PI),t.fill()}_sunPos(t,e){const i=this.hass?.states["sun.sun"]?.attributes,a="number"==typeof i?.azimuth?i.azimuth:null,s="number"==typeof i?.elevation?i.elevation:null;if(null===a||null===s)return{cx:.76*t,cy:.2*e};return{cx:t*Math.min(Math.max((a-90)/180,.06),.94),cy:e*(.78-.62*(Math.min(Math.max(s,0),55)/55))}}_drawSun(t,e,i){const{cx:a,cy:s}=this._sunPos(e,i),r="golden"===Ht(this._elevation),o=.55*Math.min(e,i),n=.92+.08*Math.sin(.3*this._t),l=r?"255,170,90":"255,218,130";let h=t.createRadialGradient(a,s,0,a,s,o);h.addColorStop(0,`rgba(255,246,220,${.85*n})`),h.addColorStop(.12,`rgba(${l},${.5*n})`),h.addColorStop(.35,`rgba(${l},0.16)`),h.addColorStop(1,`rgba(${l},0)`),t.fillStyle=h,t.fillRect(0,0,e,i);const c=.52*o;h=t.createRadialGradient(a,s,.88*c,a,s,1.12*c),h.addColorStop(0,`rgba(${l},0)`),h.addColorStop(.5,`rgba(${l},0.1)`),h.addColorStop(1,`rgba(${l},0)`),t.fillStyle=h;const d=1.15*c;t.fillRect(a-d,s-d,2*d,2*d),t.save(),t.translate(a,s),t.rotate(.02*this._t),t.fillStyle=`rgba(${l},0.07)`;for(let e=0;e<8;e++)t.rotate(Math.PI/4),t.beginPath(),t.moveTo(0,0),t.lineTo(1.1*o,.045*-o),t.lineTo(1.1*o,.045*o),t.closePath(),t.fill();t.restore();const p=e/2-a,u=i/2-s,g=[[.7,14,.06],[1.4,9,.08],[2.1,22,.045]];for(const[e,i,r]of g){const o=a+p*e,n=s+u*e,h=t.createRadialGradient(o,n,0,o,n,i);h.addColorStop(0,`rgba(${l},${r})`),h.addColorStop(1,`rgba(${l},0)`),t.fillStyle=h,t.fillRect(o-i,n-i,2*i,2*i)}}_drawClouds(t,e,i,a){const s=this._cloudSprite;if(!s)return;const r=this._scene.wind;for(const a of this._clouds){a.x+=a.spd*r*e;const o=512*a.scale*.9;a.x-o/2>i&&(a.x=-o/2),t.globalAlpha=a.alpha*(.35+.5*this._scene.clouds)+.3*this._flash,t.drawImage(s,a.x-o/2,a.y-128*a.scale/2,o,256*a.scale*.9)}t.globalAlpha=1}_drawFog(t,e,i,a){const s="natt"===this.theme,[r,o,n]=s?[40,44,52]:[225,228,230],l=s?[.1,.14,.18]:[.16,.22,.28];for(let s=0;s<3;s++){const h=s%2==0?1:-1;this._fogOffsets[s]=(this._fogOffsets[s]+h*(4+3*s)*e+i)%i;const c=a*(.35+.22*s),d=t.createLinearGradient(0,c-70,0,c+70);d.addColorStop(0,`rgba(${r},${o},${n},0)`),d.addColorStop(.5,`rgba(${r},${o},${n},${l[s]})`),d.addColorStop(1,`rgba(${r},${o},${n},0)`),t.fillStyle=d,t.fillRect(this._fogOffsets[s]-i,c-70,i,140),t.fillRect(this._fogOffsets[s],c-70,i,140)}}_drawRain(t,e,i,a){const s=this._scene.wind,r="natt"===this.theme,o=this._scene.rain>150?1500:1150,n=this._scene.rain>150?30:20;t.lineCap="round";for(const l of this._drops){const h=ee[l.layer],c=o*h.speed*l.js,d=(60*s+l.ja)*h.speed;l.y+=c*e,l.x+=d*e,l.y>a&&(l.y=-n,l.x=Math.random()*i,2===l.layer&&Math.random()<.25&&this._splashes.push({x:l.x,y:a-4-8*Math.random(),r:1,life:1})),l.x>i&&(l.x-=i);const p=n*h.scale*l.jl,u=d/c*p;t.strokeStyle=r?`rgba(150,170,200,${.45*h.alpha})`:`rgba(235,242,250,${.6*h.alpha})`,t.lineWidth=1*h.scale,t.beginPath(),t.moveTo(l.x,l.y),t.lineTo(l.x-u,l.y-p),t.stroke()}}_drawSnow(t,e,i,a){const s=this._flakeSprite;if(!s)return;const r=this._scene.wind;for(const o of this._flakes){const n=ee[o.layer];o.y+=55*n.speed*e,o.x+=20*Math.sin(o.phase+.8*this._t)*r*e,o.rot+=o.rotSpd*e,o.y>a+6&&(o.y=-6,o.x=Math.random()*i),o.x>i+6&&(o.x=-6),o.x<-6&&(o.x=i+6);const l=4*o.r*n.scale;t.save(),t.globalAlpha=n.alpha*("natt"===this.theme?.7:.95),t.translate(o.x,o.y),t.rotate(o.rot),t.drawImage(s,-l/2,-l/2,l,l),t.restore()}t.globalAlpha=1}_drawHail(t,e,i,a){const s="natt"===this.theme;t.fillStyle=s?"rgba(190,205,225,0.7)":"rgba(250,252,255,0.9)";for(const s of this._stones)s.y+=s.vy*e,s.x+=s.vx*e,s.y>a?!s.bounced&&Math.random()<.5?(s.bounced=!0,s.vy=.35*-s.vy,s.y=a):(s.y=-4,s.x=Math.random()*i,s.vy=700+300*Math.random(),s.bounced=!1):s.bounced&&(s.vy+=1600*e),t.beginPath(),t.arc(s.x,s.y,s.r,0,2*Math.PI),t.fill()}_drawSplashes(t,e){const i="natt"===this.theme;for(const a of this._splashes)a.r+=50*e,a.life-=5*e,a.life<=0||(t.strokeStyle=i?`rgba(150,170,200,${.2*a.life})`:`rgba(235,242,250,${.3*a.life})`,t.lineWidth=1,t.beginPath(),t.ellipse(a.x,a.y,a.r,.35*a.r,0,0,2*Math.PI),t.stroke());this._splashes=this._splashes.filter(t=>t.life>0)}_updateFlash(t){if(!this._scene.lightning)return this._flash=0,void(this._bolt=null);this._t>=this._nextFlash?(this._flash=1,this._bolt=Math.random()<.7?this._makeBolt():null,this._nextFlash=this._t+(Math.random()<.3?.15:4+8*Math.random())):this._flash=Math.max(0,this._flash-t/.4)**1.5}_makeBolt(){const t=this._w,e=this._h,i=Math.random,a=[],s=[];let r=t*(.2+.6*i()),o=-8;const n=10*(i()-.5),l=e*(.55+.3*i());for(s.push([r,o]);o<l;)if(o+=12+22*i(),r+=36*(i()-.5)+n,s.push([r,o]),i()<.14&&s.length>2){const t=[[r,o]];let e=r,s=o;const n=i()<.5?-1:1,l=3+Math.floor(4*i());for(let a=0;a<l;a++)s+=10+16*i(),e+=n*(8+20*i())+12*(i()-.5),t.push([e,s]);a.push(t)}return a.unshift(s),a}_drawBolt(t){const e=this._bolt;if(!e)return;const i=this._flash,a=[[10,`rgba(120,170,255,${.25*i})`],[4.5,`rgba(170,205,255,${.45*i})`],[2.5,`rgba(255,255,255,${.95*i})`]];t.lineCap="round",t.lineJoin="round";for(const[i,s]of a)t.strokeStyle=s,e.forEach((e,a)=>{t.lineWidth=0===a?i:.55*i,t.beginPath(),t.moveTo(e[0][0],e[0][1]);for(let i=1;i<e.length;i++)t.lineTo(e[i][0],e[i][1]);t.stroke()})}render(){return V`
      <div class="sky" style="${this._skyA};opacity:${this._frontA?1:0}"></div>
      <div class="sky" style="${this._skyB};opacity:${this._frontA?0:1}"></div>
      <div class="scrim"></div>
      <canvas class="gl"></canvas>
      <canvas class="px"></canvas>
    `}}ie.styles=o`
    :host {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
      z-index: 0;
    }
    .sky {
      position: absolute;
      inset: 0;
      transition: opacity 1.5s ease;
    }
    /* Text-contrast veil for the light on-media hero ink over bright day
       skies, anchored to the clock corner. Invisible on dark natt scenes. */
    .scrim {
      position: absolute;
      inset: 0;
      background: radial-gradient(120% 90% at 18% 12%, rgba(0, 0, 0, 0.26), transparent 55%);
    }
    canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
  `,t([gt({attribute:!1})],ie.prototype,"entity",void 0),t([gt({attribute:!1})],ie.prototype,"theme",void 0),t([gt({attribute:!1})],ie.prototype,"active",void 0),t([bt()],ie.prototype,"_skyA",void 0),t([bt()],ie.prototype,"_skyB",void 0),t([bt()],ie.prototype,"_frontA",void 0),customElements.define("hub-weather-bg",ie);const ae=X`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="4.2"></circle>
  <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5 5l1.6 1.6M17.4 17.4L19 19M5 19l1.6-1.6M17.4 6.6L19 5"></path>
</svg>`,se=X`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M19.5 14.2A7.8 7.8 0 0 1 9.8 4.5a7.8 7.8 0 1 0 9.7 9.7z"></path>
</svg>`,re=X`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6.5 17.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6 4 4 0 0 1-1.5.3z"></path>
</svg>`,oe=X`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="17" cy="7" r="2.8"></circle>
  <path d="M17 2.6v1M21.4 7h1M20.1 3.9l-.7.7M20.1 10.1l-.7-.7"></path>
  <path d="M5.8 19a3.6 3.6 0 0 1-.3-7.2 4.7 4.7 0 0 1 9.1-1.1 3.5 3.5 0 0 1 1.2 6.9 3.6 3.6 0 0 1-1.4.3z"></path>
</svg>`,ne=X`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20.6 8.6a4 4 0 0 1-5-5 4 4 0 1 0 5 5z"></path>
  <path d="M5.8 19a3.6 3.6 0 0 1-.3-7.2 4.7 4.7 0 0 1 9.1-1.1 3.5 3.5 0 0 1 1.2 6.9 3.6 3.6 0 0 1-1.4.3z"></path>
</svg>`,le=X`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6.5 14.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6 4 4 0 0 1-1.5.3z"></path>
  <path d="M8 17.5l-1 2.5M12.5 17.5l-1 2.5M17 17.5l-1 2.5"></path>
</svg>`,he=X`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6.5 13.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6 4 4 0 0 1-1.5.3z"></path>
  <path d="M7 16l-1.4 3.6M10.5 16l-1.4 3.6M14 16l-1.4 3.6M17.5 16l-1.4 3.6"></path>
</svg>`,ce=X`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6.5 14.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6 4 4 0 0 1-1.5.3z"></path>
  <path d="M8 18.2v.01M12 19.6v.01M16 18.2v.01M10 21v.01M14 21v.01" stroke-width="2.4"></path>
</svg>`,de=X`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6.5 14.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6 4 4 0 0 1-1.5.3z"></path>
  <path d="M8 17.5l-1 2.5M15.5 17.5l-1 2.5"></path>
  <path d="M11.8 20v.01M17.5 20v.01" stroke-width="2.4"></path>
</svg>`,pe=X`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6.5 13.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6"></path>
  <path d="M12.5 12l-2.5 4.5h3L10.5 21"></path>
</svg>`,ue=X`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6.5 13.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6"></path>
  <path d="M12.5 12l-2.5 4.5h3L10.5 21"></path>
  <path d="M6.6 16.5l-.9 2.3M17 16.5l-.9 2.3"></path>
</svg>`,ge=X`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6.5 12.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.4 7.4"></path>
  <path d="M4.5 15.5h15M6.5 18.5h11M8.5 21.5h7"></path>
</svg>`,be=X`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3.5 9h11a2.6 2.6 0 1 0-2.6-2.6"></path>
  <path d="M3.5 13.5h15.2a2.6 2.6 0 1 1-2.6 2.6"></path>
  <path d="M3.5 18h7.4a2.2 2.2 0 1 1-2.2 2.2"></path>
</svg>`,ve={sunny:{day:ae,night:se},"clear-night":{day:se},partlycloudy:{day:oe,night:ne},cloudy:{day:re},rainy:{day:le},pouring:{day:he},snowy:{day:ce},"snowy-rainy":{day:de},lightning:{day:pe},"lightning-rainy":{day:ue},fog:{day:ge},hail:{day:X`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6.5 14.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6 4 4 0 0 1-1.5.3z"></path>
  <path d="M8 18v.01M12 18v.01M16 18v.01M10 21v.01M14 21v.01" stroke-width="2.6"></path>
</svg>`},windy:{day:be},"windy-variant":{day:be}};function me(t,e){const i=ve[t]??ve.cloudy;return e&&i.night?i.night:i.day}const fe=new Map;async function xe(t,e,i){const a=`${e}:${i}`,s=fe.get(a);if(s&&Date.now()-s.at<9e5)return s.data;try{const s=await t.callWS({type:"call_service",domain:"weather",service:"get_forecasts",service_data:{type:i},target:{entity_id:e},return_response:!0}),r=s?.response?.[e]?.forecast??[];return fe.set(a,{at:Date.now(),data:r}),r}catch{return null}}const ye=new Intl.DateTimeFormat("sv-SE",{weekday:"long",day:"numeric",month:"long"});class _e extends mt{constructor(){super(...arguments),this.bgActive=!1,this._now=new Date,this._hours=[],this._days=[],this._fetchedFor="",this._onForce=()=>{this.requestUpdate()},this._open=()=>{this.dispatchEvent(new CustomEvent("hub-weather-open",{bubbles:!0,composed:!0}))}}connectedCallback(){super.connectedCallback(),this._interval=window.setInterval(()=>{this._now=new Date},3e4),this._forecastTimer=window.setInterval(()=>this._loadForecasts(),9e5),this.addEventListener("click",this._open),window.addEventListener("hub-weather-force",this._onForce)}disconnectedCallback(){super.disconnectedCallback(),void 0!==this._interval&&clearInterval(this._interval),void 0!==this._forecastTimer&&clearInterval(this._forecastTimer),this._interval=this._forecastTimer=void 0,this.removeEventListener("click",this._open),window.removeEventListener("hub-weather-force",this._onForce)}updated(t){(t.has("hass")||t.has("weatherEntity"))&&this.hass&&this.weatherEntity&&this._fetchedFor!==this.weatherEntity&&(this._fetchedFor=this.weatherEntity,this._loadForecasts())}async _loadForecasts(){if(!this.hass||!this.weatherEntity)return;const[t,e]=await Promise.all([xe(this.hass,this.weatherEntity,"hourly"),xe(this.hass,this.weatherEntity,"daily")]);t&&(this._hours=Wt(t)),e&&(this._days=Gt(e))}get _timeStr(){return`${String(this._now.getHours()).padStart(2,"0")}:${String(this._now.getMinutes()).padStart(2,"0")}`}get _isNight(){return"below_horizon"===this.hass?.states["sun.sun"]?.state}render(){const t=this.weatherEntity?this.getEntity(this.weatherEntity):void 0,e=Bt()??t?.state??"",i=t?.attributes.temperature,a=function(t){const e=t[0];return e&&null!==e.low?{low:e.low,high:e.high}:null}(this._days),s=function(t,e){const i=t.filter(t=>t.ts>=e&&t.ts<=e+432e5);if(0===i.length)return null;if(Kt(i[0].condition)){const t=i.find(t=>!Kt(t.condition));return t?`Uppehåll ~${Zt(t.ts)}`:null}const a=i.find(t=>Kt(t.condition));return a?`${Yt.has(a.condition)?"Snö":"Regn"} börjar ~${Zt(a.ts)}`:null}(this._hours,this._now.getTime());return V`
      <div class="time">${this._timeStr}</div>
      <div class="date">${function(t){return t.length?t.charAt(0).toUpperCase()+t.slice(1):t}(ye.format(this._now))}</div>
      ${t&&"number"==typeof i?V`
            <div class="wx">
              ${me(e,this._isNight)}
              <span class="wx-temp">${Math.round(i)}°</span>
              ${a?V`<span class="wx-range">
                    <span>↑ ${Math.round(a.high)}°</span>
                    <span>↓ ${Math.round(a.low)}°</span>
                  </span>`:G}
            </div>
            ${s?V`<div class="hint">${s}</div>`:G}
          `:G}
    `}}_e.styles=[Tt,o`
      :host {
        display: block;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
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
      .wx {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 10px;
      }
      .wx svg {
        width: 30px;
        height: 30px;
        color: var(--hub-text-muted);
      }
      .wx-temp {
        font: 300 30px var(--hub-font-display);
        letter-spacing: -0.02em;
        color: var(--hub-text);
      }
      .wx-range {
        display: flex;
        flex-direction: column;
        line-height: 1.25;
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-muted);
        font-variant-numeric: tabular-nums;
      }
      .hint {
        margin-top: 5px;
        font: 500 12.5px var(--hub-font-body);
        color: var(--hub-teal);
      }
      /* Over weather footage the hero always uses light ink + shadow — the
         backdrop is the video (dark night clips, bright day clips), not the
         theme surface, so theme-colored text can't guarantee contrast. */
      :host([bg-active]) .time,
      :host([bg-active]) .wx-temp {
        color: var(--hub-ink-on-media);
        text-shadow: 0 2px 18px rgba(0, 0, 0, 0.45), 0 1px 3px rgba(0, 0, 0, 0.3);
      }
      :host([bg-active]) .date,
      :host([bg-active]) .wx-range {
        color: var(--hub-ink-on-media-muted);
        text-shadow: 0 1px 8px rgba(0, 0, 0, 0.55);
      }
      :host([bg-active]) .wx svg {
        color: var(--hub-ink-on-media-muted);
      }
      :host([bg-active]) .hint {
        color: #8fe3d2;
        text-shadow: 0 1px 8px rgba(0, 0, 0, 0.5);
      }
    `],t([gt({attribute:!1})],_e.prototype,"weatherEntity",void 0),t([gt({type:Boolean,reflect:!0,attribute:"bg-active"})],_e.prototype,"bgActive",void 0),t([bt()],_e.prototype,"_now",void 0),t([bt()],_e.prototype,"_hours",void 0),t([bt()],_e.prototype,"_days",void 0),customElements.define("hub-clock",_e);class we extends ht{constructor(){super(...arguments),this.icon="",this.label="",this.tone="neutral",this.active=!1}render(){const t=Ot[this.icon];return V`
      <span class="chip tone-${this.tone} ${this.active?"active":""}">
        ${t?V`<span class="icon">${t}</span>`:""}
        <span class="label">${this.label}</span>
      </span>
    `}}we.styles=[Tt,o`
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
    `],t([gt({attribute:!1})],we.prototype,"icon",void 0),t([gt({attribute:!1})],we.prototype,"label",void 0),t([gt({attribute:!1})],we.prototype,"tone",void 0),t([gt({type:Boolean})],we.prototype,"active",void 0),customElements.define("hub-status-chip",we);class ke extends mt{constructor(){super(...arguments),this._open=()=>{this.dispatchEvent(new CustomEvent("hub-lights-open",{bubbles:!0,composed:!0}))}}get _count(){const t=this.config.lights_count_entity?this.getEntity(this.config.lights_count_entity):void 0,e=Number(t?.state);return t&&!Number.isNaN(e)?e:null}_litRooms(){return(this.config.rooms??[]).filter(t=>t.lights.some(t=>"on"===this.getEntity(t.entity)?.state)).map(t=>t.name)}render(){if(!this.hass||!this.config)return V``;const t=this._count;return V`
      <div
        class="card ${(t??0)>0?"on":""}"
        role="button"
        tabindex="0"
        aria-label="Visa alla lampor"
        @click=${this._open}
      >
        <span class="ic">${Ot.lamp}</span>
        <div>
          <b class="label">Belysning</b>
          <span class="sub">${function(t,e){if(null===t)return"–";if(0===t)return"Allt släckt";const i=`${t} ${1===t?"tänd":"tända"}`;return e.length?`${i} · ${e.join(", ")}`:i}(t,this._litRooms())}</span>
        </div>
      </div>
    `}}ke.styles=[Tt,o`
      :host {
        display: block;
        height: 100%;
      }
      .card {
        box-sizing: border-box;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 10px;
        padding: 16px 18px;
        border-radius: var(--hub-radius);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        transition:
          transform 150ms cubic-bezier(0.2, 0.8, 0.2, 1),
          background 200ms ease,
          border-color 200ms ease;
      }
      .card:active {
        transform: scale(0.985);
      }
      .card.on {
        background: var(--hub-amber-bg);
        border-color: var(--hub-amber-border);
      }
      .ic {
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 11px;
        background: var(--hub-icon-chip-bg);
        color: var(--hub-icon-chip-color);
      }
      .card.on .ic {
        color: var(--hub-amber-text);
      }
      .ic svg {
        width: 21px;
        height: 21px;
      }
      .label {
        display: block;
        font: 600 15px var(--hub-font-body);
        color: var(--hub-text);
      }
      .sub {
        display: block;
        margin-top: 3px;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .card.on .sub {
        color: var(--hub-amber-text);
      }
    `],t([gt({attribute:!1})],ke.prototype,"config",void 0),customElements.define("hub-lighting-tile",ke);const $e={docked:"Dockad",cleaning:"Städar",returning:"Åker hem",paused:"Pausad",error:"Fel",idle:"Väntar"};class Ee extends mt{constructor(){super(...arguments),this._open=()=>{this.dispatchEvent(new CustomEvent("hub-vacuum-open",{bubbles:!0,composed:!0}))}}render(){if(!this.hass||!this.config)return V``;const t=this.config.vacuum_entity?this.getEntity(this.config.vacuum_entity):void 0,e=this.config.vacuum_controls,i=e?.battery_entity?this.getEntity(e.battery_entity)?.state:void 0,a=t?.state??"unknown",s=$e[a]??"–",r="cleaning"===a||"returning"===a,o=i&&!Number.isNaN(Number(i))?`${s} · ${i}%`:s;return V`
      <div
        class="card ${r?"active":""} ${"error"===a?"err":""}"
        role="button"
        tabindex="0"
        aria-label="Visa dammsugaren"
        @click=${this._open}
      >
        <span class="ic">${Ot.vacuum}</span>
        <div>
          <b class="label">Roborock</b>
          <span class="sub">${o}</span>
        </div>
      </div>
    `}}function Ce(t){const e=t??[];return{open:e.filter(t=>"needs_action"===t.status),done:e.filter(t=>"completed"===t.status)}}async function Se(t,e){try{const i=await t.callWS({type:"call_service",domain:"todo",service:"get_items",service_data:{},target:{entity_id:e},return_response:!0});return i?.response?.[e]?.items??[]}catch{return null}}Ee.styles=[Tt,o`
      :host { display: block; height: 100%; }
      .card {
        box-sizing: border-box; height: 100%;
        display: flex; flex-direction: column; justify-content: space-between; gap: 10px;
        padding: 16px 18px;
        border-radius: var(--hub-radius);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        cursor: pointer; user-select: none;
        -webkit-tap-highlight-color: transparent;
        transition: transform 150ms cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      .card:active { transform: scale(0.985); }
      .card.err { border-color: var(--hub-coral-border); background: var(--hub-coral-bg); }
      .ic {
        width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;
        border-radius: 11px; background: var(--hub-icon-chip-bg); color: var(--hub-icon-chip-color);
      }
      .ic svg { width: 21px; height: 21px; }
      .card.active .ic { color: var(--hub-teal); }
      .card.err .ic { color: var(--hub-coral); }
      .label { display: block; font: 600 15px var(--hub-font-body); color: var(--hub-text); }
      .sub {
        display: block; margin-top: 3px;
        font: 500 13px var(--hub-font-body); color: var(--hub-text-muted);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
    `],t([gt({attribute:!1})],Ee.prototype,"config",void 0),customElements.define("hub-vacuum-card",Ee);class Me extends mt{constructor(){super(...arguments),this._items=null,this._lastCount="",this._open=()=>{this.dispatchEvent(new CustomEvent("hub-todo-open",{bubbles:!0,composed:!0}))}}updated(t){super.updated(t);const e=this.config?.todo_entity;if(!e||!this.hass)return;const i=this.getEntity(e)?.state??"";i!==this._lastCount&&(this._lastCount=i,this._refresh())}async _refresh(){this.hass&&this.config?.todo_entity&&(this._items=await Se(this.hass,this.config.todo_entity))}_complete(t,e){t.stopPropagation(),this.config.todo_entity&&this.callService("todo","update_item",{item:e.uid,status:"completed"},this.config.todo_entity)}render(){if(!this.hass||!this.config?.todo_entity)return V``;const{open:t}=Ce(this._items);return V`
      <div class="card" role="button" tabindex="0" aria-label="Visa att göra-listan" @click=${this._open}>
        <b class="label">Att göra</b>
        ${0===t.length?V`<span class="empty">Inget att göra</span>`:t.slice(0,4).map(t=>V`
                <div class="row">
                  <button class="box" aria-label="Klar: ${t.summary}" @click=${e=>this._complete(e,t)}></button>
                  <span class="txt">${t.summary}</span>
                </div>
              `)}
        ${t.length>4?V`<span class="more">+${t.length-4} till</span>`:G}
      </div>
    `}}Me.styles=[Tt,o`
      :host { display: block; height: 100%; }
      .card {
        box-sizing: border-box; height: 100%;
        display: flex; flex-direction: column; gap: 8px;
        padding: 14px 18px;
        border-radius: var(--hub-radius);
        background: var(--hub-lavender-bg, var(--hub-card));
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        cursor: pointer; user-select: none;
        -webkit-tap-highlight-color: transparent;
        overflow: hidden;
      }
      .card:active { transform: scale(0.985); }
      .label { font: 600 14px var(--hub-font-body); color: var(--hub-text); flex-shrink: 0; }
      .row {
        display: flex; align-items: center; gap: 10px; min-height: 28px;
      }
      .box {
        width: 18px; height: 18px; flex-shrink: 0;
        border-radius: 6px;
        border: 1.5px solid var(--hub-text-dim);
        background: transparent;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        padding: 0;
      }
      .txt {
        flex: 1; min-width: 0;
        font: 500 13px var(--hub-font-body); color: var(--hub-text-muted);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .empty { font: 500 13px var(--hub-font-body); color: var(--hub-text-dim); }
      .more { font: 500 12px var(--hub-font-body); color: var(--hub-text-dim); }
    `],t([gt({attribute:!1})],Me.prototype,"config",void 0),t([bt()],Me.prototype,"_items",void 0),customElements.define("hub-todo-card",Me);const Ae=new Set(["off","unavailable","unknown","standby","idle"]);function Te(t,e){for(const i of e){const e=t[i.entity];if(e&&"playing"===e.state)return{entity:e,name:i.name}}for(const i of e){const e=t[i.entity];if(e&&!Ae.has(e.state))return{entity:e,name:i.name}}return null}function Pe(t,e){if(!t)return 0;const i=t.attributes,a="number"==typeof i.media_duration?i.media_duration:0;if(a<=0)return 0;let s="number"==typeof i.media_position?i.media_position:0;const r="string"==typeof i.media_position_updated_at?Date.parse(i.media_position_updated_at):NaN;return"playing"!==t.state||Number.isNaN(r)||(s+=(e-r)/1e3),Math.max(0,Math.min(100,s/a*100))}class Ne extends mt{constructor(){super(...arguments),this.players=[],this._now=Date.now()}connectedCallback(){super.connectedCallback(),this._interval=window.setInterval(()=>{this._now=Date.now()},1e3)}disconnectedCallback(){super.disconnectedCallback(),void 0!==this._interval&&(clearInterval(this._interval),this._interval=void 0)}_goto(){this.dispatchEvent(new CustomEvent("hub-goto-page",{detail:{page:"media"},bubbles:!0,composed:!0}))}_togglePlay(t,e){t.stopPropagation(),this.callService("media_player","media_play_pause",void 0,e)}render(){if(!this.hass)return V``;const t=Te(this.hass.states,this.players??[]);if(!t)return V`
        <div class="np idle" @click=${this._goto}>
          <span class="idle-ic">${Ot.note}</span>
          <b class="title dim">Ingenting spelas</b>
        </div>
      `;const e=t.entity,i="playing"===e.state,a=e.attributes.media_title||t.name,s=e.attributes.media_artist||t.name,r=e.attributes.entity_picture,o=Pe(e,this._now);return V`
      <div class="np ${i?"playing":""}" @click=${this._goto}>
        <div
          class="art"
          style=${r?`background-image:url('${r}')`:""}
        ></div>
        <div class="meta">
          <b class="title">${a}</b>
          <small class="sub">${s}</small>
          <div class="bar"><div class="fill" style="width:${o}%"></div></div>
        </div>
        <button
          class="pp"
          aria-label=${i?"Pausa":"Spela"}
          @click=${t=>this._togglePlay(t,e.entity_id)}
        >
          <span class="ppic">${i?Ot.pause:Ot.play}</span>
        </button>
      </div>
    `}}Ne.styles=[Tt,o`
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
    `],t([gt({attribute:!1})],Ne.prototype,"players",void 0),t([bt()],Ne.prototype,"_now",void 0),customElements.define("hub-now-playing",Ne);const ze=new Intl.NumberFormat("sv-SE");function Fe(t,e){return e>0?Math.max(0,Math.min(100,t/e*100)):0}class De extends mt{_goto(){this.dispatchEvent(new CustomEvent("hub-goto-page",{detail:{page:"kcal"},bubbles:!0,composed:!0}))}render(){if(!this.hass)return V``;const t=this.todayEntity?this.getEntity(this.todayEntity):void 0,e=t?Number(t.state):NaN;if(!t||"unavailable"===t.state||"unknown"===t.state||Number.isNaN(e))return V`
        <div class="kc offline" @click=${this._goto}>
          <div class="ring" style="--pct:0"></div>
          <div class="meta"><b class="val">Kcal · offline</b></div>
        </div>
      `;const i="number"==typeof t.attributes.kcal_target?t.attributes.kcal_target:0,a=Fe(e,i),s=function(t){const e=t.protein_g;return"number"==typeof e?`${Math.round(e)} g protein`:""}(t.attributes);return V`
      <div class="kc" @click=${this._goto}>
        <div class="ring" style="--pct:${a}"></div>
        <div class="meta">
          <b class="val">
            ${ze.format(Math.round(e))}
            <span class="target">
              ${i>0?`/ ${ze.format(i)} kcal`:"kcal"}
            </span>
          </b>
          ${s?V`<small class="sub">${s}</small>`:G}
        </div>
      </div>
    `}}De.styles=[Tt,o`
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
    `],t([gt({attribute:!1})],De.prototype,"todayEntity",void 0),customElements.define("hub-kcal-ring",De);const Be={frukost:"Frukost",lunch:"Lunch",middag:"Middag",mellis:"Mellis"},je=["frukost","lunch","middag","mellis"],Le={gymdag:"G",vilodag:"V",flexdag:"F"};const Oe=/^\d{4}-\d{2}-\d{2}$/;function Ie(t){if(!t||"object"!=typeof t)return null;const e=t;if("frukost"!==(i=e.slot)&&"lunch"!==i&&"middag"!==i&&"mellis"!==i||"string"!=typeof e.name||""===e.name)return null;var i;const a=t=>"number"==typeof t&&Number.isFinite(t)?t:0;return{slot:e.slot,name:e.name,kcal:a(e.kcal),protein:a(e.protein),fat:a(e.fat),carbs:a(e.carbs),logged:!0===e.logged}}function Re(t){if(!t||"object"!=typeof t)return null;const e=t;if("string"!=typeof e.date||!Oe.test(e.date))return null;const i=Array.isArray(e.meals)?e.meals.map(Ie).filter(t=>null!==t):[];return{date:e.date,weekday:"string"==typeof e.weekday?e.weekday:"",day_type:"string"==typeof e.day_type?e.day_type:"vilodag",confirmed:!0===e.confirmed,meals:i,total_kcal:"number"==typeof e.total_kcal?e.total_kcal:0,target_kcal:"number"==typeof e.target_kcal?e.target_kcal:0,protein_ok:!0===e.protein_ok,kcal_ok:!1!==e.kcal_ok}}function He(t){if(!t)return null;const{week_start:e,today:i,days:a}=t;if("string"!=typeof e||!Oe.test(e))return null;if(!Array.isArray(a))return null;const s=a.map(Re).filter(t=>null!==t);return 0===s.length?null:{weekStart:e,today:"string"==typeof i&&Oe.test(i)?i:e,confirmedDays:s.filter(t=>t.confirmed).length,days:s}}function Ue(t){const e=t=>je.flatMap(e=>t.meals.filter(t=>t.slot===e&&!t.logged)),i=t.days.find(e=>e.date===t.today);if(i){const t=e(i);if(t.length>0)return{dayLabel:"Idag",day:i,meals:t}}const a=t.days.find(e=>e.date===function(t,e){const[i,a,s]=t.split("-").map(Number);return new Date(Date.UTC(i,a-1,s+e)).toISOString().slice(0,10)}(t.today,1));if(a){const t=e(a);if(t.length>0)return{dayLabel:"Imorgon",day:a,meals:t}}return null}const Ve=new Intl.NumberFormat("sv-SE");class Xe extends mt{_model(){if(!this.plannerEntity)return null;const t=this.getEntity(this.plannerEntity);return t&&"unavailable"!==t.state&&"unknown"!==t.state?He(t.attributes):null}_open(){this.dispatchEvent(new CustomEvent("hub-goto-page",{detail:{page:"vecka"},bubbles:!0,composed:!0}))}render(){if(!this.hass||!this.plannerEntity)return G;const t=this._model(),e=t?Ue(t):null;return V`
      <div class="card${e?"":" empty"}" @click=${this._open}>
        <div class="head">
          <span class="eyebrow">Matsedel</span>
          ${t?V`<span class="count">${t.confirmedDays} / 7 ✓</span>`:G}
        </div>
        ${e?V`
              <span class="when">${e.dayLabel}</span>
              <div class="meals">
                ${e.meals.map(t=>V`
                    <div class="meal">
                      <span class="slot">${Be[t.slot]}</span>
                      <span class="name">${t.name}</span>
                      <span class="kcal">${Ve.format(t.kcal)}</span>
                    </div>
                  `)}
              </div>
            `:V`<div class="none">${t?"Inget planerat ännu":"Vecka · offline"}</div>`}
      </div>
    `}}function We(t){const e=Date.parse(t.expected??t.scheduled??"");return Number.isNaN(e)?Number.POSITIVE_INFINITY:e}function Ge(t,e,i){if(!Array.isArray(t))return[];const a=i?new RegExp(i,"i"):null;return t.filter(t=>t?.line?.designation===e).filter(t=>!(a&&t.destination&&a.test(t.destination))).sort((t,e)=>We(t)-We(e))}Xe.styles=[Tt,o`
      :host {
        display: block;
        height: 100%;
      }
      .card {
        box-sizing: border-box;
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 12px 18px;
        border-radius: var(--hub-radius);
        background: var(--hub-lavender-bg);
        border: 1px solid var(--hub-lavender-border);
        box-shadow: var(--hub-shadow);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition:
          background var(--hub-fade) ease,
          border-color var(--hub-fade) ease;
        overflow: hidden;
      }
      .card.empty {
        background: var(--hub-card);
        border-color: var(--hub-card-border);
      }
      .head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;
        flex-shrink: 0;
      }
      .eyebrow {
        font: 600 11px var(--hub-font-body);
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
      }
      .count {
        font: 500 11.5px var(--hub-font-body);
        color: var(--hub-lavender-muted);
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }
      .when {
        font: 600 12.5px var(--hub-font-body);
        color: var(--hub-lavender-text);
        margin-top: 4px;
        flex-shrink: 0;
      }
      .meals {
        flex: 1;
        min-height: 0;
        overflow: hidden;
        margin-top: 2px;
      }
      .meal {
        display: flex;
        align-items: baseline;
        gap: 8px;
        padding: 2.5px 0;
      }
      .slot {
        flex-shrink: 0;
        width: 58px;
        font: 600 10px var(--hub-font-body);
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
      }
      .name {
        min-width: 0;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .kcal {
        flex-shrink: 0;
        margin-left: auto;
        font: 500 11.5px var(--hub-font-body);
        color: var(--hub-text-muted);
        font-variant-numeric: tabular-nums;
      }
      .none {
        flex: 1;
        display: flex;
        align-items: center;
        font: 400 13px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
    `],t([gt({attribute:!1})],Xe.prototype,"plannerEntity",void 0),customElements.define("hub-meal-card",Xe);function qe(t){if(!Array.isArray(t))return[];const e=new Map;for(const i of t){if(!i||"object"!=typeof i)continue;const t=i;if("string"!=typeof t.header||0===t.header.length)continue;const a="number"==typeof t.priority?t.priority:0,s=Array.isArray(t.lines)?t.lines.map(t=>t&&"object"==typeof t?t.designation:null).filter(t=>"string"==typeof t&&t.length>0):[],r="string"==typeof t.details&&t.details.length>0?t.details:void 0,o="string"==typeof t.scope&&t.scope.length>0?t.scope:void 0,n=e.get(t.header);if(n){for(const t of s)n.badges.add(t);n.priority=Math.max(n.priority,a),!n.details&&r&&(n.details=r),!n.scope&&o&&(n.scope=o)}else e.set(t.header,{badges:new Set(s),priority:a,details:r,scope:o})}return[...e.entries()].sort((t,e)=>e[1].priority-t[1].priority).slice(0,5).map(([t,e])=>({badges:[...e.badges].sort(),header:t,...void 0!==e.details?{details:e.details}:{},...void 0!==e.scope?{scope:e.scope}:{}}))}const Ye=new Set(["unavailable","unknown",""]);function Ke(t){if(!t||Ye.has(t))return null;const e=new Date(t);if(Number.isNaN(e.getTime()))return null;return`${String(e.getHours()).padStart(2,"0")}:${String(e.getMinutes()).padStart(2,"0")}`}class Ze extends mt{constructor(){super(...arguments),this._open=()=>{this.dispatchEvent(new CustomEvent("hub-transit-open",{bubbles:!0,composed:!0}))}}_pendeltag(){const t=this.config.transit?.pendeltag;if(!t)return V`<span class="sub dim">–</span>`;const e=this.getEntity(t.next_entity),i=Ke(e?.state);if(!i)return V`<span class="sub dim">–</span>`;const a=this.getEntity(t.count_entity),s=a&&!Number.isNaN(Number(a.state))?Number(a.state):null;return V`<span class="sub">Nästa ${i}${null===s?"":` · ${s} ${1===s?"avgång":"avgångar"}`}</span>`}_bus(){const t=this.config.transit?.bus;if(!t)return V`<span class="sub dim">Inga avgångar idag</span>`;const e=this.getEntity(t.entity),i=Ge(e?.attributes.departures??[],t.line,t.exclude_destination).slice(0,3);return 0===i.length?V`<span class="sub dim">Inga avgångar idag</span>`:V`<span class="sub"
      >${i.map((t,e)=>V`${e>0?V`<span class="sep">·</span>`:""}<span
            class="dep ${t.state&&"EXPECTED"!==t.state?"delayed":""}"
            >${t.display??"–"}</span
          >`)}</span
    >`}_shaped(){const t=this.config.disturbances_entity?this.getEntity(this.config.disturbances_entity):void 0;return t&&"unavailable"!==t.state&&"unknown"!==t.state?qe(t.attributes.deviations):[]}_alerts(t){if(0===t.length)return G;if(1===t.length){const e=t[0];return V`<div class="alerts">
        <div class="alert">
          ${e.badges.map(t=>V`<span class="badge">${t}</span>`)}
          <span class="alert-text">${e.header}</span>
        </div>
      </div>`}const e=[...new Set(t.flatMap(t=>t.badges))].sort();return V`<div class="alerts">
      <div class="alert">
        ${e.map(t=>V`<span class="badge">${t}</span>`)}
        <span class="alert-text">${t.length} störningar</span>
      </div>
    </div>`}render(){if(!this.hass||!this.config)return V``;const t=this.config.transit?.bus?.label??"Buss",e=this._shaped();return V`
      <div
        class="card ${e.length?"has-alerts":""}"
        role="button"
        tabindex="0"
        aria-label="Visa avgångar och störningar"
        @click=${this._open}
      >
        <div class="row">
          <span class="ic">${Ot.train}</span>
          <div class="meta">
            <b class="label">Pendeltåg</b>
            ${this._pendeltag()}
          </div>
        </div>
        <div class="row">
          <span class="ic">${Ot.bus}</span>
          <div class="meta">
            <b class="label">${t}</b>
            ${this._bus()}
          </div>
        </div>
        ${this._alerts(e)}
      </div>
    `}}Ze.styles=[Tt,o`
      :host {
        display: block;
        height: 100%;
      }
      .card {
        box-sizing: border-box;
        height: 100%;
        display: flex;
        flex-direction: column;
        border-radius: var(--hub-radius);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        overflow: hidden;
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        transition: transform 150ms cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      .card:active {
        transform: scale(0.985);
      }
      .row {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 18px;
        min-width: 0;
        min-height: 0;
        flex: 1;
        overflow: hidden;
      }
      .row + .row {
        border-top: 1px solid var(--hub-card-border);
      }
      .card.has-alerts .row {
        padding: 6px 18px;
        gap: 12px;
      }
      .ic {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        flex-shrink: 0;
        border-radius: 11px;
        background: var(--hub-icon-chip-bg);
        color: var(--hub-icon-chip-color);
      }
      .ic svg {
        width: 21px;
        height: 21px;
      }
      .card.has-alerts .ic {
        width: 28px;
        height: 28px;
        border-radius: 9px;
      }
      .card.has-alerts .ic svg {
        width: 16px;
        height: 16px;
      }
      .meta {
        flex: 1;
        min-width: 0;
      }
      .label {
        display: block;
        font: 600 14px var(--hub-font-body);
        color: var(--hub-text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .card.has-alerts .label {
        font-size: 13.5px;
      }
      .sub {
        display: block;
        margin-top: 3px;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .card.has-alerts .sub {
        font-size: 12px;
        margin-top: 2px;
      }
      .sub.dim {
        color: var(--hub-text-dim);
        font-weight: 500;
      }
      .dep {
        color: var(--hub-text-muted);
      }
      .dep.delayed {
        color: var(--hub-coral);
      }
      .sep {
        color: var(--hub-text-dim);
        margin: 0 6px;
      }
      .alerts {
        flex-shrink: 0;
        border-top: 1px solid var(--hub-coral-border);
        background: var(--hub-coral-bg);
        padding: 3px 18px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .alert {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }
      .badge {
        flex-shrink: 0;
        min-width: 22px;
        padding: 1px 6px;
        border-radius: 6px;
        text-align: center;
        background: var(--hub-coral);
        color: var(--hub-surface);
        font: 700 10px var(--hub-font-body);
      }
      .alert-text {
        flex: 1;
        min-width: 0;
        font: 600 11px var(--hub-font-body);
        color: var(--hub-coral);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `],t([gt({attribute:!1})],Ze.prototype,"config",void 0),customElements.define("hub-transit-card",Ze);const Je=36e5,Qe=new Set(["unavailable","unknown","none",""]);function ti(t,e,i){if(!Array.isArray(t))return[];const a=[];for(const s of t){if(!s||"object"!=typeof s)continue;const t=s,r="number"==typeof t.total?t.total:Number(t.total);if(!Number.isFinite(r)||"string"!=typeof t.startsAt)continue;const o=new Date(t.startsAt);if(Number.isNaN(o.getTime()))continue;const n="number"==typeof t.energy?t.energy:Number(t.energy),l=Number.isFinite(n)?100*n:null,h=100*r,c="spot"===e&&null!==l?l:h+("allin"===e?i:0);a.push({start:o,ore:c,totalOre:h,spotOre:l})}return a.sort((t,e)=>t.start.getTime()-e.start.getTime())}function ei(t){if(t.length<3)return null;let e=1/0,i=-1;for(let a=0;a+3<=t.length;a++){let s=!0,r=t[a].ore;for(let e=a+1;e<a+3;e++){if(t[e].start.getTime()-t[e-1].start.getTime()!==Je){s=!1;break}r+=t[e].ore}s&&r<e&&(e=r,i=a)}return i<0?null:{start:t[i].start,end:new Date(t[i+3-1].start.getTime()+Je)}}function ii(t,e,i,a="allin",s=0){if(Qe.has(String(e??"").toLowerCase()))return{now:null,level:"normal",today:[],tomorrow:[],cheapestWindow:null};const r=ti(t?.today,a,s),o=ti(t?.tomorrow,a,s);if(0===r.length&&0===o.length)return{now:null,level:"normal",today:[],tomorrow:[],cheapestWindow:null};const n=[...r,...o].sort((t,e)=>t.start.getTime()-e.start.getTime()),l=i.getTime(),h=n.find(t=>t.start.getTime()<=l&&l<t.start.getTime()+Je)??null;let c="normal";if(h&&r.length){const t=r.reduce((t,e)=>t+e.ore,0)/r.length;if(t>0){const e=h.ore/t;e<.85?c="låg":e>1.15&&(c="hög")}}const d=n.filter(t=>t.start.getTime()+Je>l);return{now:h,level:c,today:r,tomorrow:o,cheapestWindow:ei(d)}}function ai(t){const e=[...t.today,...t.tomorrow];return e.length>0&&e.every(t=>null!==t.spotOre)}const si="glass-hub-price-view";function ri(){try{return"spot"===localStorage.getItem(si)?"spot":"allin"}catch{return"allin"}}function oi(t){return(t?.grid?.overforing_ore??0)+(t?.grid?.energiskatt_ore??0)}const ni={"låg":"lågt",normal:"normalt","hög":"högt"};class li extends mt{constructor(){super(...arguments),this._now=new Date,this._open=()=>{this.dispatchEvent(new CustomEvent("hub-goto-page",{detail:{page:"energi"},bubbles:!0,composed:!0}))}}connectedCallback(){super.connectedCallback(),this._interval=window.setInterval(()=>{this._now=new Date},6e4)}disconnectedCallback(){super.disconnectedCallback(),void 0!==this._interval&&(clearInterval(this._interval),this._interval=void 0)}_model(){const t=this.config.price_series_entity?this.getEntity(this.config.price_series_entity):void 0;if(!t)return null;const e=ri(),i=t.attributes,a=ii(i,t.state,this._now,e,"allin"===e?oi(this.config):0);return"spot"===e&&a.today.length&&a.today.some(t=>null===t.spotOre)?ii(i,t.state,this._now,"allin",oi(this.config)):a}_currentOre(t){if(t?.now)return Math.round(t.now.ore);const e=this.config.price_entity?this.getEntity(this.config.price_entity):void 0;return e&&!Number.isNaN(Number(e.state))?Math.round(100*Number(e.state)):null}_bars(t){const e=function(t,e){const i=[...t.today,...t.tomorrow].sort((t,e)=>t.start.getTime()-e.start.getTime()),a=e.getTime(),s=t.cheapestWindow,r=s?s.start.getTime():null,o=s?s.end.getTime():null;return i.filter(t=>t.start.getTime()+Je>a).slice(0,12).map(t=>{const e=t.start.getTime();return{start:t.start,ore:t.ore,current:e<=a&&a<e+Je,cheap:null!==r&&e>=r&&e<o}})}(t,this._now);if(0===e.length)return V`<div class="waiting">Väntar på prisdata</div>`;const i=e.map(t=>t.ore),a=Math.min(...i),s=Math.max(...i)-a;return V`<div class="bars">
      ${e.map(t=>{return V`<div
          class="bar ${t.current?"current":t.cheap?"cheap":""}"
          style="height:${(e=t.ore,s>0?100*(.2+(e-a)/s*.8):60).toFixed(1)}%"
        ></div>`;var e})}
    </div>`}render(){if(!this.hass||!this.config)return V``;const t=this._model(),e=this._currentOre(t),i=!!t&&t.today.length>0,a=t?.now?t.level:"normal",s="låg"===a?"low":"hög"===a?"high":"",r=i&&!!t?.now&&"normal"!==a,o=t?.cheapestWindow,n=o?V`<span class="hint"
          ><span class="ic">${Ot.clock}</span>Billigast ${o.start.getHours()}–${o.end.getHours()}</span
        >`:G;return V`
      <button class="card" aria-label=${null===e?"Elpris, öppna energisidan":`Elpris ${e} öre just nu${r?`, ${ni[a]}`:""}, öppna energisidan`} @click=${this._open}>
        <div class="head">
          <div class="lead">
            <span class="ic">${Ot.bolt}</span>
            <span class="num ${s}">${null===e?"—":e}</span>
            <span class="unit">öre</span>
            ${r?V`<span class="level ${s}">· ${ni[a]}</span>`:G}
          </div>
          ${n}
        </div>
        ${i?this._bars(t):V`<div class="waiting">Väntar på prisdata</div>`}
      </button>
    `}}li.styles=[Tt,o`
      :host {
        display: block;
        height: 100%;
      }
      .card {
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 14px 18px;
        text-align: left;
        border-radius: var(--hub-radius);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        color: inherit;
        font-family: var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: border-color 150ms ease;
      }
      .card:focus-visible {
        outline: 2px solid var(--hub-green-border);
        outline-offset: 2px;
      }

      .head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
      }
      .lead {
        display: flex;
        align-items: baseline;
        gap: 6px;
        min-width: 0;
      }
      .ic {
        align-self: center;
        display: flex;
        width: 15px;
        height: 15px;
        color: var(--hub-text-dim);
        flex-shrink: 0;
      }
      .ic svg {
        width: 100%;
        height: 100%;
      }
      .num {
        font: 300 clamp(30px, 4vw, 40px) / 1 var(--hub-font-display);
        letter-spacing: -0.02em;
        color: var(--hub-text);
        font-variant-numeric: tabular-nums;
        transition: color var(--hub-fade) ease;
      }
      .num.low {
        color: var(--hub-green);
      }
      .num.high {
        color: var(--hub-coral);
      }
      .unit {
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .level {
        font: 600 13px var(--hub-font-body);
      }
      .level.low {
        color: var(--hub-green);
      }
      .level.high {
        color: var(--hub-coral);
      }
      .hint {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        flex-shrink: 0;
        font: 600 12px var(--hub-font-body);
        color: var(--hub-green);
        white-space: nowrap;
      }
      .hint .ic {
        width: 13px;
        height: 13px;
        color: var(--hub-green);
      }

      /* ── Slim 12h forward sparkline ────────────────────────── */
      .bars {
        flex: 1;
        min-height: 0;
        display: flex;
        align-items: flex-end;
        gap: 3px;
      }
      .bar {
        flex: 1;
        min-width: 0;
        border-radius: 3px 3px 1px 1px;
        background: var(--hub-track);
        transition: height var(--hub-fade) ease, background var(--hub-fade) ease;
      }
      .bar.cheap {
        background: color-mix(in srgb, var(--hub-green) 45%, var(--hub-track));
      }
      .bar.current {
        background: var(--hub-green);
        box-shadow: 0 0 12px var(--hub-green-border);
      }

      .waiting {
        flex: 1;
        display: flex;
        align-items: center;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-dim);
        letter-spacing: 0.01em;
      }
    `],t([gt({attribute:!1})],li.prototype,"config",void 0),t([bt()],li.prototype,"_now",void 0),customElements.define("hub-energy-strip",li);const hi={cleaning:"Städar",returning:"Åker hem",paused:"Pausad",error:"Fel",idle:"Väntar"};class ci extends mt{constructor(){super(...arguments),this.theme="natt",this.weatherBg=!1,this.pageActive=!1,this._openVacuum=()=>{this.dispatchEvent(new CustomEvent("hub-vacuum-open",{bubbles:!0,composed:!0}))}}_gotoPage(t){this.dispatchEvent(new CustomEvent("hub-goto-page",{detail:{page:t},bubbles:!0,composed:!0}))}get _chips(){const t=this.config,e=[],i=t.lights_count_entity?this.getEntity(t.lights_count_entity):void 0,a=i&&!Number.isNaN(Number(i.state))?Number(i.state):null;if(e.push({icon:"lamp",label:null===a?"—":`${a} ${1===a?"lampa":"lampor"}`,tone:"amber",active:(a??0)>0}),t.vacuum_entity){const i=this.getEntity(t.vacuum_entity);i&&"docked"!==i.state&&"unavailable"!==i.state&&"unknown"!==i.state&&e.push({icon:"vacuum",label:hi[i.state]??"Städar",tone:"error"===i.state?"coral":"neutral",active:!0,open:this._openVacuum})}if(t.person_entity){const i=this.getEntity(t.person_entity),a=(i?.attributes.friendly_name||"Philip").split(" ")[0],s="home"===i?.state;e.push({icon:"home",label:`${a} ${s?"hemma":"borta"}`,tone:"neutral",active:!1})}return e}render(){if(!this.hass||!this.config)return V``;const t=this.config,e=this.weatherBg?"natt"===this.theme?"--hub-card:rgba(19,19,22,0.86);--hub-chip-bg:rgba(21,21,25,0.86);--hub-teal-bg:rgba(16,20,24,0.86);--hub-lavender-bg:rgba(20,18,23,0.86);":"--hub-card:rgba(255,255,255,0.88);--hub-chip-bg:rgba(255,255,255,0.88);--hub-teal-bg:rgba(255,255,255,0.88);--hub-lavender-bg:rgba(255,255,255,0.88);--hub-amber-bg:rgba(255,255,255,0.88);":"";return V`
      ${this.weatherBg?V`<hub-weather-bg
            .hass=${this.hass}
            .entity=${t.weather_entity}
            .theme=${this.theme}
            .active=${this.pageActive}
          ></hub-weather-bg>`:G}
      <div class="page" style=${e}>
        <div class="top">
          <hub-clock
            .hass=${this.hass}
            .weatherEntity=${t.weather_entity}
            .bgActive=${this.weatherBg}
          ></hub-clock>
          <div class="chips">
            ${this._chips.map(t=>V`
                <hub-status-chip
                  style=${t.goto||t.open?"cursor:pointer":""}
                  .icon=${t.icon}
                  .label=${t.label}
                  .tone=${t.tone}
                  ?active=${t.active}
                  @click=${t.open??(t.goto?()=>this._gotoPage(t.goto):G)}
                ></hub-status-chip>
              `)}
          </div>
        </div>

        <div class="widgets">
          <hub-lighting-tile .hass=${this.hass} .config=${t}></hub-lighting-tile>
          <hub-vacuum-card .hass=${this.hass} .config=${t}></hub-vacuum-card>
          <hub-todo-card .hass=${this.hass} .config=${t}></hub-todo-card>
        </div>

        <div class="info">
          <hub-energy-strip class="energy" .hass=${this.hass} .config=${t}></hub-energy-strip>
          <hub-transit-card class="transit" .hass=${this.hass} .config=${t}></hub-transit-card>
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
          ${t.kcal?.planner_entity?V`<hub-meal-card
                class="meal"
                .hass=${this.hass}
                .plannerEntity=${t.kcal.planner_entity}
              ></hub-meal-card>`:G}
        </div>
      </div>
    `}}ci.styles=[Tt,o`
      /* Host is a flex column that fills the page section but may grow past it:
         when the wall is too short for everything, the section (its own
         overflow-y:auto) scrolls instead of anything overlapping. */
      :host {
        display: flex;
        flex-direction: column;
        min-height: 100%;
        position: relative;
      }
      .page {
        flex: 1;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding: var(--hub-page-pad);
        position: relative;
        z-index: 1;
      }
      .top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        flex-shrink: 0;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
        max-width: 56%;
        padding-right: 56px; /* clear the corner theme toggle */
      }
      /* The grid grows into spare height but its flex-basis is the true content
         size and it never shrinks below min-content — so a shrunk band can never
         be painted over. Rows are minmax(min-content, 1fr): fill slack, never
         collapse below a tile. */
      .widgets {
        flex: 1 1 auto;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-auto-rows: minmax(min-content, 1fr);
        gap: var(--hub-gap);
      }
      .widgets .cal {
        grid-column: span 2;
      }

      /* Two glanceable bands below the rooms, fixed-height and non-shrinking. */
      .info,
      .bottom {
        display: flex;
        gap: var(--hub-gap);
        align-items: stretch;
        flex-shrink: 0;
      }
      .info {
        height: clamp(116px, 15vh, 148px);
      }
      .bottom {
        height: clamp(94px, 12vh, 124px);
      }
      .info .energy {
        flex: 3;
        min-width: 0;
      }
      .info .transit {
        flex: 2;
        min-width: 0;
      }
      .bottom .np {
        flex: 2;
        min-width: 0;
      }
      .bottom .kc {
        flex: 1;
        min-width: 0;
      }
      .bottom .meal {
        flex: 1.4;
        min-width: 0;
      }

      /* 2-col regime (≤1400): the room grid becomes three rows, so reclaim
         vertical space — tighter vertical padding and gaps, slimmer bands, and
         equal-width band cards so neither second card is squeezed. Everything
         fits without scrolling down to ~700px tall; shorter than that the page
         scrolls rather than overlapping. */
      @media (max-width: 1400px) {
        .page {
          gap: 10px;
          padding: clamp(14px, 1.8vw, 22px) var(--hub-page-pad);
        }
        .widgets {
          grid-template-columns: repeat(2, 1fr);
        }
        .info {
          height: clamp(104px, 13.5vh, 130px);
        }
        .bottom {
          height: clamp(88px, 11.5vh, 114px);
        }
        .info .energy,
        .info .transit,
        .bottom .np,
        .bottom .kc,
        .bottom .meal {
          flex: 1;
        }
      }
    `],t([gt({attribute:!1})],ci.prototype,"config",void 0),t([gt({attribute:!1})],ci.prototype,"theme",void 0),t([gt({attribute:!1})],ci.prototype,"weatherBg",void 0),t([gt({attribute:!1})],ci.prototype,"pageActive",void 0),customElements.define("hub-home-page",ci);const di=new Set(["unavailable","unknown"]);class pi extends mt{constructor(){super(...arguments),this._flash=!1,this._longPressed=!1,this._downX=0,this._downY=0,this._onPointerDown=t=>{this._dead||(this._longPressed=!1,this._downX=t.clientX,this._downY=t.clientY,this._pressTimer=window.setTimeout(()=>{this._longPressed=!0,this.dispatchEvent(new CustomEvent("hub-light-open",{detail:{entity:this.light.entity,name:this.light.name},bubbles:!0,composed:!0}))},500))},this._onPointerMove=t=>{void 0!==this._pressTimer&&(jt(t.clientX-this._downX)||jt(t.clientY-this._downY))&&this._cancelPress()},this._cancelPress=()=>{void 0!==this._pressTimer&&(clearTimeout(this._pressTimer),this._pressTimer=void 0)},this._onClick=()=>{this._dead||(this._longPressed?this._longPressed=!1:(this.callService("light","toggle",void 0,this.light.entity),this._flash=!0,void 0!==this._flashTimer&&clearTimeout(this._flashTimer),this._flashTimer=window.setTimeout(()=>{this._flash=!1,this._flashTimer=void 0},200)))}}disconnectedCallback(){super.disconnectedCallback(),this._cancelPress(),void 0!==this._flashTimer&&(clearTimeout(this._flashTimer),this._flashTimer=void 0)}get _dead(){const t=this.getEntity(this.light.entity);return!t||di.has(t.state)}get _stateLabel(){const t=this.getEntity(this.light.entity);if(!t||di.has(t.state))return"Ej tillgänglig";if("on"!==t.state)return"Av";const e=t.attributes.brightness;return"number"==typeof e?`${Math.round(e/255*100)} %`:"På"}render(){if(!this.hass||!this.light)return V``;const t=this.isOn(this.light.entity),e=this._dead;return V`
      <div
        class="tile ${t?"on":""} ${this._flash?"flash":""} ${e?"dead":""}"
        @pointerdown=${this._onPointerDown}
        @pointermove=${this._onPointerMove}
        @pointerup=${this._cancelPress}
        @pointercancel=${this._cancelPress}
        @pointerleave=${this._cancelPress}
        @click=${this._onClick}
      >
        <span class="ic">${Ot.lamp}</span>
        <span class="name">${this.light.name}</span>
        <span class="state">${this._stateLabel}</span>
      </div>
    `}}pi.styles=[Tt,o`
      :host {
        display: block;
      }
      .tile {
        box-sizing: border-box;
        min-height: 52px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        border-radius: var(--hub-radius-sm, 12px);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        transition: background var(--hub-fade) ease, border-color var(--hub-fade) ease,
          transform 150ms cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      .tile.on {
        background: var(--hub-amber-bg);
        border-color: var(--hub-amber-border);
      }
      .tile.flash {
        transform: scale(0.96);
      }
      .tile.dead {
        cursor: default;
        opacity: 0.55;
      }
      .ic {
        width: 30px;
        height: 30px;
        flex-shrink: 0;
        border-radius: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--hub-icon-chip-bg);
        color: var(--hub-icon-chip-color);
        transition: background var(--hub-fade) ease, color var(--hub-fade) ease;
      }
      .ic svg {
        width: 15px;
        height: 15px;
      }
      .tile.on .ic {
        background: var(--hub-amber);
        color: var(--hub-surface);
      }
      .name {
        flex: 1;
        min-width: 0;
        font: 500 13.5px var(--hub-font-body);
        color: var(--hub-text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .tile.on .name {
        color: var(--hub-amber-text);
        font-weight: 600;
      }
      .state {
        flex-shrink: 0;
        font: 600 12px var(--hub-font-body);
        color: var(--hub-text-dim);
        font-variant-numeric: tabular-nums;
      }
      .tile.on .state {
        color: var(--hub-amber-text);
      }
    `],t([gt({attribute:!1})],pi.prototype,"light",void 0),t([bt()],pi.prototype,"_flash",void 0),customElements.define("hub-light-tile",pi);const ui=new Set(["unavailable","unknown"]);function gi(t){return!!t&&!ui.has(t.state)}class bi extends mt{constructor(){super(...arguments),this._armed=!1,this._flash=!1,this._headLongPressed=!1,this._headDownX=0,this._headDownY=0,this._onAllOff=()=>{if(!this._armed)return this._armed=!0,void 0!==this._armTimer&&clearTimeout(this._armTimer),void(this._armTimer=window.setTimeout(()=>{this._armed=!1,this._armTimer=void 0},3e3));void 0!==this._armTimer&&clearTimeout(this._armTimer),this._armTimer=void 0,this._armed=!1,this._flash=!0,this.callService("light","turn_off",void 0,"all"),void 0!==this._flashTimer&&clearTimeout(this._flashTimer),this._flashTimer=window.setTimeout(()=>{this._flash=!1,this._flashTimer=void 0},200)},this._onHeadMove=t=>{void 0!==this._headPressTimer&&(jt(t.clientX-this._headDownX)||jt(t.clientY-this._headDownY))&&this._cancelHeadPress()},this._cancelHeadPress=()=>{void 0!==this._headPressTimer&&(clearTimeout(this._headPressTimer),this._headPressTimer=void 0)}}disconnectedCallback(){super.disconnectedCallback(),this._clearTimers()}_clearTimers(){void 0!==this._armTimer&&clearTimeout(this._armTimer),void 0!==this._flashTimer&&clearTimeout(this._flashTimer),this._armTimer=void 0,this._flashTimer=void 0,this._armed=!1,this._flash=!1,this._cancelHeadPress()}_activateScene(t){this.callService("scene","turn_on",void 0,t)}_onHeadDown(t,e){this._headLongPressed=!1,this._headDownX=t.clientX,this._headDownY=t.clientY,this._headPressTimer=window.setTimeout(()=>{this._headLongPressed=!0,this.dispatchEvent(new CustomEvent("hub-room-open",{detail:{roomId:e.id},bubbles:!0,composed:!0}))},500)}_onHeadClick(t){if(this._headLongPressed)return void(this._headLongPressed=!1);const e=function(t,e){const i=t.lights.some(t=>"on"===e[t.entity]?.state);return i?{service:"turn_off",entities:t.lights.map(t=>t.entity)}:{service:"turn_on",entities:t.default_lights?.length?t.default_lights:[t.main_entity]}}(t,this.hass.states);this.callService("light",e.service,{entity_id:e.entities})}_section(t){const e=function(t,e){const i=t.lights.filter(t=>"on"===e[t.entity]?.state),a=i.length;if(0===a)return{onCount:0,pct:null,label:"Släckt"};const s=i.map(t=>e[t.entity]?.attributes.brightness).filter(t=>"number"==typeof t),r=s.length?Math.round(s.reduce((t,e)=>t+e,0)/s.length/255*100):null,o=1===a?"1 lampa":`${a} lampor`;return{onCount:a,pct:r,label:null!==r?`${o} · ${r} %`:o}}(t,this.hass.states),i=e.onCount>0;return V`
      <div class="section">
        <div
          class="sec-head ${i?"active":""}"
          @pointerdown=${e=>this._onHeadDown(e,t)}
          @pointermove=${this._onHeadMove}
          @pointerup=${this._cancelHeadPress}
          @pointercancel=${this._cancelHeadPress}
          @pointerleave=${this._cancelHeadPress}
          @click=${()=>this._onHeadClick(t)}
        >
          <span class="sec-name">${t.name}</span>
          <span class="sec-meta">${e.label}</span>
        </div>
        <div class="tiles">
          ${t.lights.map(t=>V`<hub-light-tile .hass=${this.hass} .light=${t}></hub-light-tile>`)}
        </div>
      </div>
    `}render(){if(!this.hass||!this.config)return V``;const t=this.config,e=function(t,e){let i=0,a=0;for(const s of t.rooms??[])for(const t of s.lights){const s=e[t.entity];gi(s)&&(a+=1,"on"===s.state&&(i+=1))}return{on:i,total:a}}(t,this.hass.states);return V`
      <div class="page">
        <div class="header">
          <div class="heading">
            <span class="title">Ljus</span>
            <span class="subtitle">
              ${e.on>0?V`<span class="lit">${e.on} tända</span>`:V`Allt släckt`}
            </span>
          </div>
          <div class="actions">
            ${(t.scenes??[]).map(t=>V`
                <button
                  class="action"
                  @click=${()=>this._activateScene(t.entity)}
                >
                  ${Ot[t.icon]?V`<span class="ic">${Ot[t.icon]}</span>`:G}
                  <span>${t.name}</span>
                </button>
              `)}
            <button
              class="action ${this._armed?"armed":""} ${this._flash?"flash":""}"
              aria-label="Släck alla lampor"
              @click=${this._onAllOff}
            >
              <span class="ic">${Ot.power}</span>
              <span>${this._armed?"Säker? Tryck igen":"Allt släckt"}</span>
            </button>
          </div>
        </div>

        <div class="body">
          ${(t.rooms??[]).map(t=>this._section(t))}
        </div>
      </div>
    `}}bi.styles=[Tt,o`
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

      /* ── Room sections in a 3-column flow ─────────────────── */
      .body {
        flex: 1;
        min-height: 0;
        overflow-y: auto; /* emergency fallback only — content must fit 1280×800 */
        overscroll-behavior: contain;
        padding-bottom: 56px;
        -webkit-overflow-scrolling: touch;
        columns: 3;
        column-gap: var(--hub-gap);
      }
      @media (max-width: 1100px) {
        .body {
          columns: 2;
        }
      }

      .section {
        break-inside: avoid;
        margin-bottom: 16px;
      }
      .sec-head {
        display: flex;
        align-items: baseline;
        gap: 8px;
        padding: 2px 4px 8px;
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      }
      .sec-name {
        font: 600 15px var(--hub-font-body);
        color: var(--hub-text);
      }
      .sec-head.active .sec-name {
        color: var(--hub-amber-text);
      }
      .sec-meta {
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
      .sec-head.active .sec-meta {
        color: var(--hub-amber-muted);
      }
      .tiles {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      hub-light-tile {
        display: block;
      }
    `],t([gt({attribute:!1})],bi.prototype,"config",void 0),t([bt()],bi.prototype,"_armed",void 0),t([bt()],bi.prototype,"_flash",void 0),customElements.define("hub-lights-page",bi);class vi extends ht{constructor(){super(...arguments),this.gridAddOre=0,this._detail=null}disconnectedCallback(){super.disconnectedCallback(),void 0!==this._detailTimer&&(clearTimeout(this._detailTimer),this._detailTimer=void 0)}_slots(){const t=this.model,e=t?.today??[],i=t?.tomorrow??[],a=t?.now?t.now.start.getTime():null,s=t?.cheapestWindow,r=s?s.start.getTime():null,o=s?s.end.getTime():null,n=t=>{const e=t.start.getTime();let i="future",s=null;return null!==a&&(e<a?i="past":e===a&&(i="current",s=String(Math.round(t.ore)))),null!==r&&e>=r&&e<o&&(i+=" cheap"),{kind:"bar",hour:t,cls:i,label:s}},l=e.map(n);if(i.length){l.push({kind:"divider"});for(const t of i)l.push(n(t))}return l}_toggleDetail(t){this._detail=this._detail===t?null:t,void 0!==this._detailTimer&&clearTimeout(this._detailTimer),null!==this._detail&&(this._detailTimer=window.setTimeout(()=>{this._detail=null,this._detailTimer=void 0},6e3))}_bounds(){const t=[...this.model?.today??[],...this.model?.tomorrow??[]].map(t=>t.ore);return{min:Math.min(...t),max:Math.max(...t)}}_height(t,e,i){const a=i-e;return!Number.isFinite(a)||a<=0?60:100*(.14+(t-e)/a*.86)}_tint(t,e,i){const a=i-e,s=a>0?(i-t)/a:.5;return`color-mix(in srgb, var(--hub-green) ${Math.round(22+58*s)}%, var(--hub-track))`}_tick(t){const e=t.start.getHours();return V`<span class="tick ${0===e?"day":""}"
      >${e%6==0?String(e).padStart(2,"0"):""}</span
    >`}_flyout(t,e,i){const a=String(t.start.getHours()).padStart(2,"0"),s=String((t.start.getHours()+1)%24).padStart(2,"0"),r=e<2?"edge-l":e>i-3?"edge-r":"",o=function(t,e){return null===t.spotOre?null:{spot:t.spotOre,taxes:t.totalOre-t.spotOre,grid:e}}(t,this.gridAddOre);return V`
      <div class="flyout ${r}">
        <div class="fly-hour">${a}–${s}</div>
        <div class="fly-price">${Math.round(t.ore)} öre/kWh</div>
        ${o?V`<div class="fly-rows">
              <div class="fly-row"><span>Spot</span><span>${Math.round(o.spot)} öre</span></div>
              <div class="fly-row"><span>Skatt &amp; moms</span><span>${Math.round(o.taxes)} öre</span></div>
              <div class="fly-row"><span>Elnät</span><span>${Math.round(o.grid)} öre</span></div>
            </div>`:G}
      </div>
    `}render(){if(!this.model||0===this.model.today.length)return V``;const t=this._slots(),{min:e,max:i}=this._bounds(),a=t.map(t=>"divider"===t.kind?"8px":"minmax(0, 1fr)").join(" ");return V`
      <div class="chart">
        <div class="plot" style="grid-template-columns:${a}">
          ${t.map((a,s)=>{if("divider"===a.kind)return V`<div class="divider"></div>`;const r=this._height(a.hour.ore,e,i),o=a.cls.startsWith("future")?`background:${this._tint(a.hour.ore,e,i)}`:"";return V`
              <div
                class="cell ${a.cls}"
                style="--bar-h:${r}%"
                @click=${()=>this._toggleDetail(s)}
              >
                ${this._detail===s?this._flyout(a.hour,s,t.length):G}
                ${a.label&&this._detail!==s?V`<span class="cell-label">${a.label}</span>`:G}
                <div class="bar" style="height:${r}%;${o}"></div>
              </div>
            `})}
        </div>
        <div class="axis" style="grid-template-columns:${a}">
          ${t.map(t=>"divider"===t.kind?V`<span></span>`:this._tick(t.hour))}
        </div>
      </div>
    `}}vi.styles=[Tt,o`
      :host {
        display: block;
        height: 100%;
      }
      .chart {
        box-sizing: border-box;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .plot {
        flex: 1;
        min-height: 0;
        display: grid;
        align-items: end;
        gap: 3px;
      }
      .cell {
        position: relative;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
      }
      .bar {
        width: 100%;
        border-radius: 4px 4px 2px 2px;
        background: var(--hub-track);
        transition: height var(--hub-fade) ease, background var(--hub-fade) ease;
      }
      .cell.past .bar {
        background: var(--hub-text-dim);
        opacity: 0.3;
      }
      .cell.current .bar {
        background: var(--hub-green);
        box-shadow: 0 0 16px var(--hub-green-border);
      }
      .cell.cheap .bar {
        outline: 1.5px solid var(--hub-green);
        outline-offset: 1px;
      }
      .cell-label {
        position: absolute;
        bottom: calc(var(--bar-h) + 8px);
        left: 50%;
        transform: translateX(-50%);
        font: 600 13px var(--hub-font-body);
        color: var(--hub-green);
        white-space: nowrap;
        letter-spacing: -0.01em;
      }
      .divider {
        width: 1px;
        justify-self: center;
        height: 82%;
        align-self: center;
        background: var(--hub-card-border);
      }

      .axis {
        display: grid;
        gap: 3px;
      }
      .tick {
        text-align: center;
        font: 500 10.5px var(--hub-font-body);
        color: var(--hub-text-dim);
        white-space: nowrap;
        overflow: visible;
      }
      .tick.day {
        color: var(--hub-text-muted);
        font-weight: 600;
      }
      .cell {
        cursor: pointer;
      }
      .flyout {
        position: absolute;
        bottom: calc(var(--bar-h) + 10px);
        left: 50%;
        transform: translateX(-50%);
        z-index: 5;
        min-width: 132px;
        padding: 10px 12px;
        border-radius: var(--hub-radius-sm, 12px);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        pointer-events: none;
      }
      .flyout.edge-l {
        left: 0;
        transform: none;
      }
      .flyout.edge-r {
        left: auto;
        right: 0;
        transform: none;
      }
      .fly-hour {
        font: 600 11.5px var(--hub-font-body);
        color: var(--hub-text-dim);
        white-space: nowrap;
      }
      .fly-price {
        margin-top: 2px;
        font: 600 17px var(--hub-font-display);
        color: var(--hub-text);
        white-space: nowrap;
      }
      .fly-rows {
        margin-top: 6px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .fly-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        font: 500 11px var(--hub-font-body);
        color: var(--hub-text-muted);
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }
    `],t([gt({attribute:!1})],vi.prototype,"model",void 0),t([gt({type:Number})],vi.prototype,"gridAddOre",void 0),t([bt()],vi.prototype,"_detail",void 0),customElements.define("hub-price-chart",vi);const mi={"låg":"lågt",normal:"normalt","hög":"högt"};class fi extends mt{constructor(){super(...arguments),this._now=new Date,this._view=ri()}connectedCallback(){super.connectedCallback(),this._interval=window.setInterval(()=>{this._now=new Date},6e4)}disconnectedCallback(){super.disconnectedCallback(),void 0!==this._interval&&(clearInterval(this._interval),this._interval=void 0)}_model(){const t=this.config.price_series_entity?this.getEntity(this.config.price_series_entity):void 0;if(!t)return null;const e=t.attributes;let i=ii(e,t.state,this._now,this._view,"allin"===this._view?oi(this.config):0);return"spot"!==this._view||ai(i)||(i=ii(e,t.state,this._now,"allin",oi(this.config))),i}_setView(t){this._view=t,function(t){try{localStorage.setItem(si,t)}catch{}}(t)}_currentOre(t){if(t?.now)return Math.round(t.now.ore);const e=this.config.price_entity?this.getEntity(this.config.price_entity):void 0;return e&&!Number.isNaN(Number(e.state))?Math.round(100*Number(e.state)):null}_chips(t){const e=this.config,i=[],a=e.co2_entity?this.getEntity(e.co2_entity):void 0;a&&!Number.isNaN(Number(a.state))&&i.push({icon:"leaf",label:`${Math.round(Number(a.state))} g CO₂`,tone:"green"});const s=e.fossil_entity?this.getEntity(e.fossil_entity):void 0;if(s&&!Number.isNaN(Number(s.state))){const t=Math.round(Number(s.state));i.push({icon:"leaf",label:`${t} % fossilt`,tone:t>=40?"coral":"green"})}const r=t?.cheapestWindow;if(r){const t=r.start.getHours(),e=r.end.getHours();i.push({icon:"clock",label:`Billigast ${t}–${e}`,tone:"green"})}return i}render(){if(!this.hass||!this.config)return V``;const t=this._model(),e=this._currentOre(t),i=t?.now?t.level:"normal",a=!!t&&t.today.length>0,s=this._chips(t),r=!!t&&ai(t),o="låg"===i?"low":"hög"===i?"high":"",n=!!t?.now&&"normal"!==i;return V`
      <div class="page">
        <div class="header">
          <div class="head-row">
            <div>
              <div class="price">
                <span class="price-num ${o}">${null===e?"—":e}</span>
                <span class="price-unit">öre/kWh</span>
              </div>
              <div class="subline">
                ${"spot"===this._view?"spotpris":"allt-in"} just nu${n?V` ·
                      <span class=${"låg"===i?"accent-low":"accent-high"}
                        >${mi[i]}</span
                      >`:G}
              </div>
            </div>
            ${r?V`<div class="view-toggle">
                  <button
                    class=${"spot"===this._view?"sel":""}
                    @click=${()=>this._setView("spot")}
                  >
                    Spot
                  </button>
                  <button
                    class=${"allin"===this._view?"sel":""}
                    @click=${()=>this._setView("allin")}
                  >
                    Allt-in
                  </button>
                </div>`:G}
          </div>
        </div>

        <div class="chart-wrap">
          ${a?V`<hub-price-chart .model=${t} .gridAddOre=${oi(this.config)}></hub-price-chart>`:V`<div class="waiting">Väntar på prisdata</div>`}
        </div>

        <div class="chips">
          ${s.map(t=>V`
              <hub-status-chip
                .icon=${t.icon}
                .label=${t.label}
                .tone=${t.tone}
                active
              ></hub-status-chip>
            `)}
        </div>
      </div>
    `}}async function xi(t){if(!t)return null;try{const i=await(e=t,new Promise((t,i)=>{const a=new Image;a.crossOrigin="anonymous",a.onload=()=>t(a),a.onerror=()=>i(new Error("image load failed")),a.src=e})),a=document.createElement("canvas");a.width=8,a.height=8;const s=a.getContext("2d");if(!s)return null;s.drawImage(i,0,0,8,8);const{data:r}=s.getImageData(0,0,8,8);let o=0,n=0,l=0,h=0;for(let t=0;t<r.length;t+=4){0!==r[t+3]&&(o+=r[t],n+=r[t+1],l+=r[t+2],h+=1)}return 0===h?null:[Math.round(o/h),Math.round(n/h),Math.round(l/h)]}catch{return null}var e}fi.styles=[Tt,o`
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

      /* ── Header: the current price, oversized ─────────────── */
      .header {
        padding-right: 56px; /* clear the corner theme toggle */
        margin-bottom: 8px;
      }
      .view-toggle {
        display: inline-flex;
        gap: 2px;
        padding: 3px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
      }
      .view-toggle button {
        min-height: 42px;
        padding: 0 16px;
        border: none;
        border-radius: var(--hub-radius-pill);
        background: transparent;
        color: var(--hub-text-muted);
        font: 600 13px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: background 150ms ease, color 150ms ease;
      }
      .view-toggle button.sel {
        background: var(--hub-green-bg);
        color: var(--hub-green);
      }
      .head-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }
      .price {
        display: flex;
        align-items: baseline;
        gap: 12px;
        line-height: 1;
      }
      .price-num {
        font: 200 clamp(56px, 8vw, 76px) / 1 var(--hub-font-display);
        letter-spacing: -0.03em;
        color: var(--hub-text);
        transition: color var(--hub-fade) ease;
        font-variant-numeric: tabular-nums;
      }
      .price-num.low {
        color: var(--hub-green);
      }
      .price-num.high {
        color: var(--hub-coral);
      }
      .price-unit {
        font: 400 15px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .subline {
        margin-top: 6px;
        font: 500 14px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .subline .accent-low {
        color: var(--hub-green);
        font-weight: 600;
      }
      .subline .accent-high {
        color: var(--hub-coral);
        font-weight: 600;
      }

      /* ── Chart fills the middle ───────────────────────────── */
      .chart-wrap {
        flex: 1;
        min-height: 0;
        margin: 12px 0 16px;
      }
      .waiting {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        font: 400 clamp(16px, 2.4vw, 22px) var(--hub-font-body);
        color: var(--hub-text-dim);
        letter-spacing: 0.01em;
      }

      /* ── Bottom chips ─────────────────────────────────────── */
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding-bottom: 44px; /* clear the page dots */
      }
    `],t([gt({attribute:!1})],fi.prototype,"config",void 0),t([bt()],fi.prototype,"_now",void 0),t([bt()],fi.prototype,"_view",void 0),customElements.define("hub-energy-page",fi);const yi=new Set(["unavailable","unknown"]);class _i extends mt{constructor(){super(...arguments),this.groupMaster=null,this._drag=null}_entity(){return this.hass?.states[this.player.entity]}_volume(){if(null!==this._drag)return this._drag;const t=this._entity()?.attributes.volume_level;return"number"==typeof t?t:0}_onInput(t){this._drag=Number(t.target.value)}_onChange(t){const e=Number(t.target.value);this._drag=null,this.callService("media_player","volume_set",{volume_level:e},this.player.entity)}_stop(t){t.stopPropagation()}_toggleGroup(t){this.groupMaster&&(t?this.callService("media_player","unjoin",void 0,this.player.entity):this.callService("media_player","join",{group_members:[this.player.entity]},this.groupMaster))}render(){if(!this.hass||!this.player)return V``;const t=this._entity(),e=!t||yi.has(t.state),i=this._volume(),a=Math.round(100*i),s=!e&&i>0,r=this.player.entity===this.groupMaster,o=!r&&!!this.groupMaster&&(n=this.hass.states[this.groupMaster]?.attributes.group_members,l=this.player.entity,Array.isArray(n)&&n.includes(l));var n,l;const h=`linear-gradient(90deg, var(--hub-teal) 0 ${a}%, var(--hub-track) ${a}% 100%)`;return V`
      <div class="row ${s?"active":""}">
        <span class="ic">${Ot.speaker}</span>
        <div class="main">
          <div class="top">
            <span class="name">${this.player.name}</span>
            ${e?G:V`<span class="pct">${a}%</span>`}
          </div>
          ${e?V`<span class="dead">Ej tillgänglig</span>`:V`
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  .value=${String(i)}
                  style=${`--track-bg:${h}`}
                  aria-label=${`Volym ${this.player.name}`}
                  @input=${this._onInput}
                  @change=${this._onChange}
                  @pointerdown=${this._stop}
                  @pointermove=${this._stop}
                  @pointerup=${this._stop}
                  @touchstart=${this._stop}
                  @touchmove=${this._stop}
                />
              `}
        </div>
        ${e||r?G:V`
              <button
                class="chip ${o?"on":""}"
                @click=${()=>this._toggleGroup(o)}
              >
                ${o?"I gruppen":"Gruppera"}
              </button>
            `}
      </div>
    `}}_i.styles=[Tt,o`
      :host {
        display: block;
      }
      .row {
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px 16px;
        border-radius: var(--hub-radius);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        transition: border-color var(--hub-fade) ease;
      }
      .row.active {
        border-color: var(--hub-teal-border);
      }
      .ic {
        width: 34px;
        height: 34px;
        flex-shrink: 0;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--hub-icon-chip-bg);
        color: var(--hub-icon-chip-color);
        transition: background var(--hub-fade) ease, color var(--hub-fade) ease;
      }
      .row.active .ic {
        background: var(--hub-teal-bg);
        color: var(--hub-teal);
      }
      .ic svg {
        width: 17px;
        height: 17px;
      }
      .main {
        flex: 1;
        min-width: 0;
      }
      .top {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 8px;
      }
      .name {
        font: 600 14px var(--hub-font-body);
        color: var(--hub-text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .row.active .name {
        color: var(--hub-teal-text);
      }
      .pct {
        font: 600 12.5px var(--hub-font-body);
        color: var(--hub-text-dim);
        font-variant-numeric: tabular-nums;
        flex-shrink: 0;
      }
      .row.active .pct {
        color: var(--hub-teal);
      }

      /* Native range, restyled. 48px hit height, slim visible track. */
      input[type='range'] {
        -webkit-appearance: none;
        appearance: none;
        display: block;
        width: 100%;
        height: 48px;
        margin: -14px 0;
        background: transparent;
        cursor: pointer;
        touch-action: none;
      }
      input[type='range']::-webkit-slider-runnable-track {
        height: 6px;
        border-radius: 3px;
        background: var(--track-bg, var(--hub-track));
      }
      input[type='range']::-moz-range-track {
        height: 6px;
        border-radius: 3px;
        background: var(--hub-track);
      }
      input[type='range']::-moz-range-progress {
        height: 6px;
        border-radius: 3px;
        background: var(--hub-teal);
      }
      input[type='range']::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        margin-top: -6px;
        border-radius: 50%;
        background: var(--hub-teal);
        border: none;
        box-shadow: 0 0 0 4px var(--hub-teal-bg);
      }
      input[type='range']::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--hub-teal);
        border: none;
        box-shadow: 0 0 0 4px var(--hub-teal-bg);
      }

      .chip {
        flex-shrink: 0;
        min-height: 48px;
        padding: 0 16px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        font: 600 12.5px var(--hub-font-body);
        white-space: nowrap;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: transform 120ms ease, background 160ms ease,
          border-color 160ms ease, color 160ms ease;
      }
      .chip:active {
        transform: scale(0.95);
      }
      .chip.on {
        background: var(--hub-teal-bg);
        border-color: var(--hub-teal-border);
        color: var(--hub-teal-text);
      }

      /* Unavailable speaker → quiet, non-interactive row. */
      .dead {
        color: var(--hub-text-dim);
        font: 500 12.5px var(--hub-font-body);
        margin-left: auto;
      }
    `],t([gt({attribute:!1})],_i.prototype,"player",void 0),t([gt({attribute:!1})],_i.prototype,"groupMaster",void 0),t([bt()],_i.prototype,"_drag",void 0),customElements.define("hub-volume-row",_i);const wi=new Set(["off","unavailable","unknown","standby","idle"]);function ki(t){const e=Number.isFinite(t)&&t>0?t:0,i=Math.floor(e/60),a=Math.floor(e%60);return`${i}:${String(a).padStart(2,"0")}`}class $i extends mt{constructor(){super(...arguments),this._sel=null,this._rgb=null,this._now=Date.now()}connectedCallback(){super.connectedCallback(),this._interval=window.setInterval(()=>{this._now=Date.now()},1e3)}disconnectedCallback(){super.disconnectedCallback(),void 0!==this._interval&&(clearInterval(this._interval),this._interval=void 0)}get _players(){return this.config?.media_players??[]}_selId(){if(this._sel)return this._sel;const t=Te(this.hass?.states??{},this._players);return t?.entity.entity_id??this._players[0]?.entity??null}_theme(){const t=this.getRootNode()?.host;return"dag"===t?.getAttribute("data-theme")?"dag":"natt"}updated(t){const e=this._selId(),i=e?this.hass?.states[e]?.attributes.entity_picture:void 0;i!==this._pic&&(this._pic=i,i?xi(i).then(t=>{this._pic===i&&(this._rgb=t)}):this._rgb=null)}_transport(t,e){this.callService("media_player",t,void 0,e)}_hero(t,e){const i="playing"===t.state,a=t.attributes.media_title||e,s=t.attributes.media_artist||e,r=t.attributes.entity_picture,o="number"==typeof t.attributes.media_duration?t.attributes.media_duration:0,n=Pe(t,this._now),l=n/100*o,h=t.entity_id;return V`
      <div class="hero">
        <div class="art" style=${r?`background-image:url('${r}')`:""}></div>
        <div class="meta">
          <div class="title">${a}</div>
          <div class="artist">${s}</div>
        </div>
        ${o>0?V`
              <div class="progress">
                <div class="bar"><div class="fill" style="width:${n}%"></div></div>
                <div class="times">
                  <span>${ki(l)}</span>
                  <span>${ki(o)}</span>
                </div>
              </div>
            `:G}
        <div class="transport">
          <button
            class="tbtn side"
            aria-label="Föregående"
            @click=${()=>this._transport("media_previous_track",h)}
          >
            ${Ot.prev}
          </button>
          <button
            class="tbtn play ${i?"on":""}"
            aria-label=${i?"Pausa":"Spela"}
            @click=${()=>this._transport("media_play_pause",h)}
          >
            ${i?Ot.pause:Ot.play}
          </button>
          <button
            class="tbtn side"
            aria-label="Nästa"
            @click=${()=>this._transport("media_next_track",h)}
          >
            ${Ot.next}
          </button>
        </div>
      </div>
    `}_quiet(){return V`
      <div class="quiet">
        <span class="qic">${Ot.note}</span>
        <span class="qtext">Ingenting spelas</span>
      </div>
    `}render(){if(!this.hass||!this.config)return V``;const t=this._players,e=this.hass.states,i=this._selId(),a=i?e[i]:void 0,s=t.find(t=>t.entity===i)?.name??"",r=!!a&&!wi.has(a.state),o=function(t,e){for(const i of e)if("playing"===t[i.entity]?.state)return i.entity;return e[0]?.entity??null}(e,t),n=function(t,e){if(!t)return"none";const[i,a,s]=t;return`radial-gradient(80% 60% at 30% 20%, rgba(${i}, ${a}, ${s}, ${"natt"===e?"0.22":"0.12"}), transparent 70%)`}(this._rgb,this._theme());return V`
      <div class="page">
        <div class="bleed" style=${`background:${n}`}></div>
        <div class="content">
          ${t.length>1?V`
                <div class="tabs">
                  ${t.map(t=>V`
                      <button
                        class="tab ${t.entity===i?"on":""}"
                        @click=${()=>this._sel=t.entity}
                      >
                        ${t.name}
                      </button>
                    `)}
                </div>
              `:G}

          ${r?this._hero(a,s):this._quiet()}

          <div class="speakers ${r?"":"pushed"}">
            ${t.map(t=>V`
                <hub-volume-row
                  .hass=${this.hass}
                  .player=${t}
                  .groupMaster=${o}
                ></hub-volume-row>
              `)}
          </div>
        </div>
      </div>
    `}}$i.styles=[Tt,o`
      :host {
        display: block;
        height: 100%;
      }
      .page {
        position: relative;
        box-sizing: border-box;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        padding: var(--hub-page-pad);
      }
      /* Ambient art bleed, painted behind everything. */
      .bleed {
        position: absolute;
        inset: 0;
        pointer-events: none;
        transition: background 900ms ease;
        z-index: 0;
      }
      .content {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
      }

      /* ── Speaker tabs ─────────────────────────────────────── */
      .tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding-right: 56px; /* clear the corner theme toggle */
        margin-bottom: 20px;
      }
      .tab {
        min-height: 48px;
        padding: 0 18px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        font: 600 13px var(--hub-font-body);
        white-space: nowrap;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: background 160ms ease, border-color 160ms ease, color 160ms ease;
      }
      .tab.on {
        background: var(--hub-teal-bg);
        border-color: var(--hub-teal-border);
        color: var(--hub-teal-text);
      }

      /* ── Hero: art + meta + transport ─────────────────────── */
      .hero {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 22px;
        margin-bottom: 28px;
      }
      .art {
        width: min(38vh, 340px);
        height: min(38vh, 340px);
        border-radius: 20px;
        flex-shrink: 0;
        background: linear-gradient(135deg, #1b5a6e, #2f7d70);
        background-size: cover;
        background-position: center;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
      }
      .meta {
        max-width: 100%;
      }
      .title {
        font: 400 26px var(--hub-font-display);
        letter-spacing: -0.01em;
        color: var(--hub-text);
        line-height: 1.15;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
      .artist {
        margin-top: 6px;
        font: 500 15px var(--hub-font-body);
        color: var(--hub-text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .progress {
        width: min(100%, 420px);
      }
      .bar {
        height: 5px;
        border-radius: 3px;
        background: var(--hub-track);
        overflow: hidden;
      }
      .fill {
        height: 100%;
        border-radius: 3px;
        background: var(--hub-teal);
        transition: width 0.9s linear;
      }
      .times {
        display: flex;
        justify-content: space-between;
        margin-top: 8px;
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-dim);
        font-variant-numeric: tabular-nums;
      }

      .transport {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 28px;
      }
      .tbtn {
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        padding: 0;
        cursor: pointer;
        color: var(--hub-text-muted);
        -webkit-tap-highlight-color: transparent;
        transition: color var(--hub-fade) ease, transform 120ms ease;
      }
      .tbtn:active {
        transform: scale(0.9);
      }
      .tbtn.side {
        width: 48px;
        height: 48px;
      }
      .tbtn.side svg {
        width: 28px;
        height: 28px;
      }
      .tbtn.play {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: var(--hub-chip-bg);
        border: 1px solid var(--hub-chip-border);
        color: var(--hub-text);
      }
      .tbtn.play.on {
        background: var(--hub-teal);
        border-color: var(--hub-teal);
        color: var(--hub-surface);
        box-shadow: 0 0 30px rgba(99, 214, 194, 0.25);
      }
      .tbtn.play svg {
        width: 28px;
        height: 28px;
      }

      /* ── Quiet / empty state ──────────────────────────────── */
      .quiet {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: 14px;
        padding: 40px 0 44px;
      }
      .quiet .qic {
        width: 44px;
        height: 44px;
        color: var(--hub-text-dim);
      }
      .quiet .qic svg {
        width: 100%;
        height: 100%;
      }
      .quiet .qtext {
        font: 300 clamp(24px, 4vw, 34px) var(--hub-font-display);
        color: var(--hub-text-muted);
        letter-spacing: 0.01em;
      }

      /* ── Speaker volume list ──────────────────────────────── */
      .speakers {
        display: flex;
        flex-direction: column;
        gap: var(--hub-gap);
        padding-bottom: 56px; /* clear the page dots */
      }
      .speakers.pushed {
        margin-top: auto;
      }
    `],t([gt({attribute:!1})],$i.prototype,"config",void 0),t([bt()],$i.prototype,"_sel",void 0),t([bt()],$i.prototype,"_rgb",void 0),t([bt()],$i.prototype,"_now",void 0),customElements.define("hub-media-page",$i);let Ei=0;class Ci extends ht{constructor(){super(...arguments),this.points=[],this.stroke="--hub-lavender",this.width=560,this.height=130,this._gid="hub-spark-"+Ei++}render(){const t=function(t,e,i,a=.1){const s=t.length;if(0===s)return[];if(1===s)return[{x:e,y:i/2}];const r=t.map(t=>t.value),o=Math.min(...r),n=Math.max(...r)-o,l=o-n*a,h=n*(1+2*a);return t.map((t,a)=>({x:a/(s-1)*e,y:n<=0?i/2:i-(t.value-l)/h*i}))}(this.points,this.width,this.height);if(0===t.length)return V``;const e=t.map(t=>`${t.x.toFixed(2)},${t.y.toFixed(2)}`).join(" "),i=t[t.length-1],a=t[0],s=t.length>=2,r=`${e} ${i.x.toFixed(2)},${this.height} ${a.x.toFixed(2)},${this.height}`;return V`
      <div class="spark" style="--spark-stroke:var(${this.stroke})">
        ${X`
          <svg
            viewBox="0 0 ${this.width} ${this.height}"
            preserveAspectRatio="none"
            style="height:${this.height}px"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="${this._gid}" x1="0" y1="0" x2="0" y2="1">
                <stop class="grad-a" offset="0%"></stop>
                <stop class="grad-b" offset="100%"></stop>
              </linearGradient>
            </defs>
            ${s?X`<polygon points="${r}" fill="url(#${this._gid})" stroke="none"></polygon>
                       <polyline points="${e}" vector-effect="non-scaling-stroke"></polyline>`:G}
          </svg>
        `}
        <span
          class="dot"
          style="left:${(i.x/this.width*100).toFixed(3)}%;top:${(i.y/this.height*100).toFixed(3)}%"
        ></span>
      </div>
    `}}Ci.styles=o`
    :host {
      display: block;
    }
    .spark {
      position: relative;
      width: 100%;
      line-height: 0;
    }
    svg {
      display: block;
      width: 100%;
      overflow: visible;
    }
    polyline {
      fill: none;
      stroke: var(--spark-stroke, #b99cf2);
      stroke-width: 2.5px;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .grad-a {
      stop-color: var(--spark-stroke, #b99cf2);
      stop-opacity: 0.24;
    }
    .grad-b {
      stop-color: var(--spark-stroke, #b99cf2);
      stop-opacity: 0;
    }
    .dot {
      position: absolute;
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--spark-stroke, #b99cf2);
      transform: translate(-50%, -50%);
      pointer-events: none;
      box-shadow: 0 0 0 5px color-mix(in srgb, var(--spark-stroke, #b99cf2) 16%, transparent);
    }
  `,t([gt({attribute:!1})],Ci.prototype,"points",void 0),t([gt()],Ci.prototype,"stroke",void 0),t([gt({type:Number})],Ci.prototype,"width",void 0),t([gt({type:Number})],Ci.prototype,"height",void 0),customElements.define("hub-sparkline",Ci);const Si=new Intl.NumberFormat("sv-SE"),Mi=new Intl.NumberFormat("sv-SE",{minimumFractionDigits:1,maximumFractionDigits:1}),Ai=new Intl.NumberFormat("sv-SE",{maximumFractionDigits:1}),Ti=new Intl.DateTimeFormat("sv-SE",{day:"numeric",month:"short",timeZone:"UTC"}),Pi=new Intl.DateTimeFormat("sv-SE",{weekday:"long",day:"numeric",month:"long",timeZone:"UTC"});function Ni(t){if(!t)return"";const e=new Date(`${t}T00:00:00Z`);return Number.isNaN(e.getTime())?"":Ti.format(e).replace(/\.$/,"")}class zi extends mt{_meals(t){const e=t.attributes.meals;return Array.isArray(e)?e.filter(t=>!!t&&"object"==typeof t).map(t=>({name:"string"==typeof t.name?t.name:"",kcal:"number"==typeof t.kcal?t.kcal:Number(t.kcal)||0})).filter(t=>t.name):[]}_num(t){return"number"==typeof t?t:NaN}_offline(){return V`
      <div class="page">
        <div class="offline">
          <div class="off-ring"></div>
          <div class="off-text">Kcal · offline</div>
        </div>
      </div>
    `}_weightCard(){const t=this.config.kcal?.forecast_entity,e=t?this.getEntity(t):void 0,i=e?Number(e.state):NaN;if(!e||"unavailable"===e.state||"unknown"===e.state||Number.isNaN(i))return V`
        <section class="card">
          <span class="w-eyebrow">Vikt</span>
          <div class="w-num-row"><span class="w-num">${"−"}</span><span class="w-unit">kg</span></div>
          <div class="spark-wrap"><span class="spark-empty">Ingen viktdata</span></div>
        </section>
      `;const a=e.attributes.weight_trend,s=Array.isArray(a)?a.filter(t=>!!t&&"object"==typeof t).map(t=>({date:String(t.date??""),value:Number(t.kg)})).filter(t=>Number.isFinite(t.value)):[],r=function(t){if(t.length<2)return null;const e=new Date(`${t[0].date}T00:00:00Z`).getTime(),i=new Date(`${t[t.length-1].date}T00:00:00Z`).getTime();return Number.isNaN(e)||Number.isNaN(i)?null:Math.round((i-e)/864e5)}(s),o=s.length>=2?s[s.length-1].value-s[0].value:null,n=null===o||null===r?null:`${o<0?"−":o>0?"+":""}${Mi.format(Math.abs(o))} kg på ${r} ${1===r?"dag":"dagar"}`,l=e.attributes.forecast,h=l&&"object"==typeof l?l:null,c=h?function(t){const e="number"==typeof t.goal_kg?`Mål ${Ai.format(t.goal_kg)} kg`:"",i=t.eta?Ni(t.eta):"",a=t.eta_early&&t.eta_late?`${Ni(t.eta_early)}–${Ni(t.eta_late)}`:"";return[e,i?`ETA ${i}${a?` (${a})`:""}`:""].filter(Boolean).join(" · ")}(h):"",d=!!h?.on_track;return V`
      <section class="card">
        <span class="w-eyebrow">Vikt</span>
        <div class="w-num-row">
          <span class="w-num">${Mi.format(i)}</span>
          <span class="w-unit">kg</span>
        </div>
        ${n?V`<span class="w-delta">${n}</span>`:G}

        <div class="spark-wrap">
          ${s.length>=2?V`<hub-sparkline
                .points=${s}
                stroke="--hub-lavender"
                .width=${560}
                .height=${130}
              ></hub-sparkline>`:V`<span class="spark-empty">Samlar viktdata</span>`}
        </div>

        <div class="forecast">
          ${c?V`<span class="fc-line">${c}</span>`:V`<span class="fc-line">Ingen prognos ännu</span>`}
          ${d?V`<span class="fc-chip">i fas ✓</span>`:G}
        </div>
      </section>
    `}render(){if(!this.hass||!this.config)return V``;const t=this.config.kcal?.today_entity,e=t?this.getEntity(t):void 0,i=e?Number(e.state):NaN;if(!e||"unavailable"===e.state||"unknown"===e.state||Number.isNaN(i))return this._offline();const a=this._num(e.attributes.kcal_target),s=Fe(i,a),r=Number.isFinite(a)&&a>0,o=r?a-i:NaN,n=r?o>0?`${Si.format(Math.round(o))} kcal kvar`:0===o?"Målet nått":`${Si.format(Math.round(-o))} över målet`:null,l=this._num(e.attributes.protein_g),h=this._num(e.attributes.protein_target_g),c=Number.isFinite(l)&&Number.isFinite(h)&&h>0,d=c?Math.max(0,Math.min(100,l/h*100)):0,p=this._meals(e),u=e.attributes.date,g="string"!=typeof u||Number.isNaN(new Date(`${u}T00:00:00Z`).getTime())?"":Pi.format(new Date(`${u}T00:00:00Z`));return V`
      <div class="page">
        <div class="header">
          <h1 class="title">Kcal</h1>
          ${g?V`<span class="subtitle">${g}</span>`:G}
        </div>

        <div class="grid">
          <section class="card">
            <div class="ring-wrap">
              <div class="ring-glow"></div>
              <div class="ring" style="--pct:${s}"></div>
              <div class="ring-center">
                <span class="kc-num">${Si.format(Math.round(i))}</span>
                <span class="kc-target">
                  ${r?`/ ${Si.format(a)} kcal`:"kcal"}
                </span>
              </div>
            </div>
            ${n?V`<div class="kc-remain">${n}</div>`:G}

            ${c?V`
                  <div class="metric">
                    <div class="metric-head">
                      <span class="metric-label">Protein</span>
                      <span class="metric-val">
                        ${Math.round(l)} / ${Math.round(h)} g
                      </span>
                    </div>
                    <div class="bar"><div class="bar-fill" style="width:${d}%"></div></div>
                  </div>
                `:G}

            <div class="meals">
              <div class="meals-title">Idag</div>
              ${p.length?p.map(t=>V`
                      <div class="meal">
                        <span class="meal-name">${t.name}</span>
                        <span class="meal-kcal">${Si.format(Math.round(t.kcal))} kcal</span>
                      </div>
                    `):V`<div class="empty">Inga måltider loggade ännu</div>`}
            </div>
          </section>

          ${this._weightCard()}
        </div>
      </div>
    `}}zi.styles=[Tt,o`
      :host {
        display: block;
        height: 100%;
      }
      .page {
        box-sizing: border-box;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        padding: var(--hub-page-pad);
        padding-bottom: clamp(48px, 6vh, 66px);
      }

      /* ── Header ────────────────────────────────────────────── */
      .header {
        padding-right: 56px; /* clear the corner theme toggle */
        margin-bottom: clamp(14px, 2vh, 22px);
        display: flex;
        align-items: baseline;
        gap: 14px;
        flex-wrap: wrap;
      }
      .title {
        margin: 0;
        font: 200 clamp(30px, 4.4vw, 46px) var(--hub-font-display);
        letter-spacing: -0.02em;
        color: var(--hub-text);
      }
      .subtitle {
        font: 500 14px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
      /* Swedish keeps weekdays/months lowercase — only lift the leading letter. */
      .subtitle::first-letter {
        text-transform: uppercase;
      }

      /* ── Two-column deck ───────────────────────────────────── */
      .grid {
        flex: 1;
        min-height: 0;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--hub-gap);
      }
      /* Stack only on genuinely narrow / portrait panels; landscape walls keep
         both columns side by side and fit without vertical scroll. */
      @media (max-width: 760px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
      .card {
        box-sizing: border-box;
        min-height: 0;
        display: flex;
        flex-direction: column;
        padding: clamp(20px, 2.6vw, 34px);
        border-radius: var(--hub-radius-lg);
        background: var(--hub-lavender-bg);
        border: 1px solid var(--hub-lavender-border);
        box-shadow: var(--hub-shadow);
      }

      /* ── Left: kcal ring + protein + meals ─────────────────── */
      .ring-wrap {
        position: relative;
        width: clamp(176px, 23vh, 236px);
        aspect-ratio: 1;
        margin: 2px auto 0;
        flex-shrink: 0;
      }
      .ring-glow {
        position: absolute;
        inset: -6%;
        border-radius: 50%;
        background: radial-gradient(
          circle,
          color-mix(in srgb, var(--hub-lavender) 20%, transparent),
          transparent 68%
        );
        filter: blur(10px);
      }
      .ring {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: conic-gradient(
          var(--hub-lavender) calc(var(--pct, 0) * 1%),
          var(--hub-track) 0
        );
        -webkit-mask: radial-gradient(circle, transparent 67%, #000 67.5%);
        mask: radial-gradient(circle, transparent 67%, #000 67.5%);
        transition: --pct var(--hub-fade) ease;
      }
      .ring-center {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .kc-num {
        font: 200 clamp(42px, 6vw, 62px) / 1 var(--hub-font-display);
        letter-spacing: -0.02em;
        color: var(--hub-lavender-text);
        font-variant-numeric: tabular-nums;
      }
      .kc-target {
        margin-top: 4px;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-lavender-muted);
        font-variant-numeric: tabular-nums;
      }
      .kc-remain {
        margin: 12px auto 0;
        text-align: center;
        font: 500 14px var(--hub-font-body);
        color: var(--hub-text-muted);
        font-variant-numeric: tabular-nums;
      }

      .metric {
        margin-top: clamp(18px, 2.6vh, 30px);
        flex-shrink: 0;
      }
      .metric-head {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 8px;
      }
      .metric-label {
        font: 600 12px var(--hub-font-body);
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--hub-text-muted);
      }
      .metric-val {
        font: 600 14px var(--hub-font-body);
        color: var(--hub-lavender-text);
        font-variant-numeric: tabular-nums;
      }
      .bar {
        height: 8px;
        border-radius: 99px;
        background: var(--hub-track);
        overflow: hidden;
      }
      .bar-fill {
        height: 100%;
        border-radius: 99px;
        background: linear-gradient(
          90deg,
          color-mix(in srgb, var(--hub-lavender) 62%, transparent),
          var(--hub-lavender)
        );
        transition: width var(--hub-fade) ease;
      }

      .meals {
        margin-top: clamp(16px, 2.4vh, 26px);
        min-height: 0;
        flex: 1;
        overflow-y: auto;
        overscroll-behavior: contain;
      }
      .meals-title {
        font: 600 12px var(--hub-font-body);
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
        margin-bottom: 6px;
      }
      .meal {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 14px;
        padding: 8px 0;
        border-top: 1px solid color-mix(in srgb, var(--hub-lavender-border) 55%, transparent);
      }
      .meal:first-of-type {
        border-top: none;
      }
      .meal-name {
        font: 500 15px var(--hub-font-body);
        color: var(--hub-text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .meal-kcal {
        flex-shrink: 0;
        font: 500 14px var(--hub-font-body);
        color: var(--hub-text-muted);
        font-variant-numeric: tabular-nums;
      }
      .empty {
        padding: 10px 0;
        font: 400 14px var(--hub-font-body);
        color: var(--hub-text-dim);
      }

      /* ── Right: weight ─────────────────────────────────────── */
      .w-eyebrow {
        font: 600 12px var(--hub-font-body);
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
      }
      .w-num-row {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin-top: 8px;
      }
      .w-num {
        font: 200 clamp(58px, 8.4vw, 88px) / 1 var(--hub-font-display);
        letter-spacing: -0.03em;
        color: var(--hub-text);
        font-variant-numeric: tabular-nums;
      }
      .w-unit {
        font: 500 18px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .w-delta {
        margin-top: 10px;
        font: 500 13.5px var(--hub-font-body);
        color: var(--hub-lavender-text);
        font-variant-numeric: tabular-nums;
      }
      .spark-wrap {
        flex: 1;
        min-height: 96px;
        margin: clamp(18px, 3vh, 34px) 0;
        display: flex;
        align-items: center;
      }
      .spark-empty {
        width: 100%;
        text-align: center;
        font: 400 14px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
      .forecast {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .fc-line {
        font: 500 15px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .fc-chip {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 5px 12px;
        border-radius: 99px;
        font: 600 13px var(--hub-font-body);
        background: var(--hub-green-bg);
        color: var(--hub-green);
        border: 1px solid var(--hub-green-border);
        white-space: nowrap;
      }

      /* ── Offline ───────────────────────────────────────────── */
      .offline {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 24px;
      }
      .off-ring {
        width: clamp(156px, 21vh, 208px);
        aspect-ratio: 1;
        border-radius: 50%;
        background: var(--hub-track);
        -webkit-mask: radial-gradient(circle, transparent 67%, #000 67.5%);
        mask: radial-gradient(circle, transparent 67%, #000 67.5%);
      }
      .off-text {
        font: 300 clamp(26px, 4vw, 38px) var(--hub-font-display);
        color: var(--hub-text-muted);
        letter-spacing: 0.01em;
      }
    `],t([gt({attribute:!1})],zi.prototype,"config",void 0),customElements.define("hub-kcal-page",zi);const Fi=new Intl.NumberFormat("sv-SE"),Di=new Intl.DateTimeFormat("sv-SE",{weekday:"long",day:"numeric",month:"long",timeZone:"UTC"});class Bi extends mt{constructor(){super(...arguments),this._openDate=null,this._confirming=!1}_model(){const t=this.config?.kcal?.planner_entity;if(!t)return null;const e=this.getEntity(t);return e&&"unavailable"!==e.state&&"unknown"!==e.state?He(e.attributes):null}_confirm(t){this._confirming||t.confirmed||0===t.meals.length||(this._confirming=!0,this.callService("rest_command","kcal_confirm_day",{date:t.date}),window.setTimeout(()=>{const t=this.config?.kcal?.planner_entity;t&&this.callService("homeassistant","update_entity",void 0,t),this._confirming=!1,this._openDate=null},1500))}_dayPopup(t){const e=t.days.find(t=>t.date===this._openDate);if(!e)return G;const i=Di.format(new Date(`${e.date}T00:00:00Z`)),a=!e.confirmed&&e.meals.some(t=>!t.logged);return V`
      <div class="scrim" @click=${()=>this._openDate=null}>
        <div class="popup" @click=${t=>t.stopPropagation()}>
          <h2 class="popup-title">${i}</h2>
          <div class="popup-sub">
            ${e.day_type} · ${Fi.format(e.total_kcal)} / ${Fi.format(e.target_kcal)} kcal
            ${e.confirmed?" · bekräftad ✓":""}
          </div>
          ${e.meals.map(t=>V`
              <div class="pm">
                <div>
                  <span class="pm-slot">${Be[t.slot]}${t.logged?" · loggad":""}</span>
                  <span class="pm-name">${t.name}</span>
                </div>
                <span class="pm-macro">
                  ${Fi.format(t.kcal)} kcal<br />
                  P ${Fi.format(t.protein)} · F ${Fi.format(t.fat)} · K ${Fi.format(t.carbs)}
                </span>
              </div>
            `)}
          ${0===e.meals.length?V`<div class="empty-day">Inget planerat.</div>`:G}
          <div class="popup-actions">
            ${e.confirmed?V`<span class="confirmed-note">Dagen är låst ✓</span>`:G}
            <button class="btn" @click=${()=>this._openDate=null}>Stäng</button>
            ${a?V`
                  <button class="btn primary" ?disabled=${this._confirming} @click=${()=>this._confirm(e)}>
                    ${this._confirming?"Bekräftar…":"Bekräfta dagen"}
                  </button>
                `:G}
          </div>
        </div>
      </div>
    `}_dayCard(t,e){const i=je.filter(e=>t.meals.some(t=>t.slot===e));return V`
      <button
        class="day${t.date===e?" today":""}${t.confirmed?" confirmed":""}"
        @click=${()=>this._openDate=t.date}
      >
        <div class="day-head">
          <span class="day-name">${t.weekday.slice(0,3)}</span>
          <span class="day-date">${t.date.slice(8)}</span>
          <span class="day-flex"></span>
          ${t.confirmed?V`<span class="lock">✓</span>`:G}
          <span class="type-chip ${t.day_type}">${a=t.day_type,Le[a]??"·"}</span>
        </div>
        <div class="slots">
          ${0===i.length?V`<span class="empty-day">—</span>`:G}
          ${i.map(e=>V`
              <div>
                <span class="slot-label">${Be[e]}</span>
                ${t.meals.filter(t=>t.slot===e).map(t=>V`
                      <div class="meal">
                        <span class="meal-name${t.logged?" logged":""}">${t.name}</span>
                        <span class="meal-kcal">${Fi.format(t.kcal)} kcal</span>
                      </div>
                    `)}
              </div>
            `)}
        </div>
        <div class="day-foot">
          ${t.meals.length>0?V`${Fi.format(t.total_kcal)} / ${Fi.format(t.target_kcal)}
              ${t.kcal_ok&&t.protein_ok?G:V`<span class="warn"> ⚠</span>`}`:V`&nbsp;`}
        </div>
      </button>
    `;var a}render(){if(!this.hass||!this.config)return V``;const t=this._model();return t?V`
      <div class="page">
        <div class="header">
          <h1 class="title">Vecka</h1>
          <span class="subtitle">${t.confirmedDays} / 7 bekräftade</span>
        </div>
        <div class="grid">${t.days.map(e=>this._dayCard(e,t.today))}</div>
      </div>
      ${this._openDate?this._dayPopup(t):G}
    `:V`<div class="page"><div class="offline">Vecka · offline</div></div>`}}Bi.styles=[Tt,o`
      :host {
        display: block;
        height: 100%;
        position: relative; /* containing block for the day-popup overlay */
      }
      .page {
        box-sizing: border-box;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        padding: var(--hub-page-pad);
        padding-bottom: clamp(48px, 6vh, 66px);
      }

      .header {
        padding-right: 56px;
        margin-bottom: clamp(14px, 2vh, 22px);
        display: flex;
        align-items: baseline;
        gap: 14px;
        flex-wrap: wrap;
      }
      .title {
        margin: 0;
        font: 200 clamp(30px, 4.4vw, 46px) var(--hub-font-display);
        letter-spacing: -0.02em;
        color: var(--hub-text);
      }
      .subtitle {
        font: 500 14px var(--hub-font-body);
        color: var(--hub-text-dim);
      }

      /* ── Week grid ─────────────────────────────────────────── */
      .grid {
        flex: 1;
        min-height: 0;
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: clamp(8px, 1vw, 14px);
      }
      @media (max-width: 900px) {
        .grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      .day {
        box-sizing: border-box;
        min-height: 0;
        display: flex;
        flex-direction: column;
        padding: clamp(10px, 1.2vw, 16px);
        border-radius: var(--hub-radius-lg);
        background: var(--hub-lavender-bg);
        border: 1px solid var(--hub-lavender-border);
        box-shadow: var(--hub-shadow);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        text-align: left;
        font: inherit;
        color: inherit;
      }
      .day.today {
        border-color: var(--hub-lavender);
      }
      .day.confirmed {
        opacity: 0.78;
      }

      .day-head {
        display: flex;
        align-items: baseline;
        gap: 6px;
        margin-bottom: 8px;
      }
      .day-name {
        font: 600 13px var(--hub-font-body);
        color: var(--hub-text);
        text-transform: capitalize;
      }
      .day-date {
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-dim);
        font-variant-numeric: tabular-nums;
      }
      .day-flex {
        flex: 1;
      }
      .type-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        font: 600 11px var(--hub-font-body);
        background: var(--hub-chip-bg);
        border: 1px solid var(--hub-chip-border);
        color: var(--hub-text-muted);
        flex-shrink: 0;
      }
      .type-chip.gymdag {
        background: var(--hub-green-bg);
        border-color: var(--hub-green-border);
        color: var(--hub-green);
      }
      .type-chip.flexdag {
        background: var(--hub-teal-bg);
        border-color: var(--hub-teal-border);
        color: var(--hub-teal);
      }
      .lock {
        font: 600 12px var(--hub-font-body);
        color: var(--hub-green);
      }

      .slots {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .slot-label {
        font: 600 10px var(--hub-font-body);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
      }
      .meal {
        display: flex;
        flex-direction: column;
        margin-top: 2px;
      }
      .meal-name {
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .meal-name.logged {
        color: var(--hub-text-dim);
      }
      .meal-kcal {
        font: 500 11px var(--hub-font-body);
        color: var(--hub-text-muted);
        font-variant-numeric: tabular-nums;
      }
      .empty-day {
        font: 400 12px var(--hub-font-body);
        color: var(--hub-text-dim);
      }

      .day-foot {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid color-mix(in srgb, var(--hub-lavender-border) 55%, transparent);
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-muted);
        font-variant-numeric: tabular-nums;
      }
      .day-foot .warn {
        color: var(--hub-coral);
      }

      /* ── Day popup ─────────────────────────────────────────── */
      /* Absolute, not fixed: the swipe strip's translateX makes it the
         containing block for fixed elements, which would center the popup
         across the whole strip instead of the visible page. */
      .scrim {
        position: absolute;
        inset: 0;
        background: color-mix(in srgb, var(--hub-surface) 62%, transparent);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 40;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }
      .popup {
        box-sizing: border-box;
        width: min(560px, 94vw);
        max-height: 86vh;
        overflow-y: auto;
        overscroll-behavior: contain;
        padding: clamp(20px, 3vw, 32px);
        border-radius: var(--hub-radius-lg);
        background: var(--hub-card);
        border: 1px solid var(--hub-lavender-border);
        box-shadow: var(--hub-shadow);
      }
      .popup-title {
        margin: 0 0 4px;
        font: 300 clamp(24px, 3.4vw, 32px) var(--hub-font-display);
        color: var(--hub-text);
      }
      .popup-title::first-letter {
        text-transform: uppercase;
      }
      .popup-sub {
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-dim);
        margin-bottom: 14px;
      }
      .pm {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 12px;
        padding: 9px 0;
        border-top: 1px solid color-mix(in srgb, var(--hub-lavender-border) 55%, transparent);
      }
      .pm-name {
        font: 500 15px var(--hub-font-body);
        color: var(--hub-text);
      }
      .pm-slot {
        font: 600 10px var(--hub-font-body);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
        display: block;
      }
      .pm-macro {
        flex-shrink: 0;
        text-align: right;
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-muted);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .popup-actions {
        margin-top: 18px;
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }
      .btn {
        font: 600 14px var(--hub-font-body);
        padding: 12px 22px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .btn.primary {
        background: var(--hub-lavender-bg);
        border-color: var(--hub-lavender-border);
        color: var(--hub-lavender-text);
      }
      .btn:disabled {
        opacity: 0.5;
      }
      .confirmed-note {
        font: 500 13px var(--hub-font-body);
        color: var(--hub-green);
        align-self: center;
        margin-right: auto;
      }

      /* ── Offline ───────────────────────────────────────────── */
      .offline {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font: 300 clamp(26px, 4vw, 38px) var(--hub-font-display);
        color: var(--hub-text-muted);
      }
    `],t([gt({attribute:!1})],Bi.prototype,"config",void 0),t([bt()],Bi.prototype,"_openDate",void 0),t([bt()],Bi.prototype,"_confirming",void 0),customElements.define("hub-planner-page",Bi);const ji=X`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <path d="M6 6l12 12M18 6L6 18"></path>
  </svg>
`;class Li extends mt{constructor(){super(...arguments),this.room=null,this._onScrim=t=>{t.target===t.currentTarget&&this._close()}}_close(){this.dispatchEvent(new CustomEvent("hub-popup-close",{bubbles:!0,composed:!0}))}_activateScene(t){this.callService("scene","turn_on",void 0,t)}render(){if(!this.room||!this.hass)return V``;const t=this.room;return V`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label=${t.name}>
          <div class="head">
            <span class="title">${t.name}</span>
            <button class="close" aria-label="Stäng" @click=${this._close}>
              ${ji}
            </button>
          </div>
          <div class="lights">
            ${t.lights.map(t=>V`
                <glass-light-slider
                  .hass=${this.hass}
                  ._config=${{type:"glass-light-slider",entity:t.entity,name:t.name}}
                ></glass-light-slider>
              `)}
          </div>
          ${t.scenes?.length?V`<div class="scenes">
                ${t.scenes.map(t=>V`
                    <button class="scene-chip" @click=${()=>this._activateScene(t.entity)}>
                      ${t.name}
                    </button>
                  `)}
              </div>`:G}
        </div>
      </div>
    `}}Li.styles=[Tt,o`
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
      .scenes {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 16px;
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
    `],t([gt({attribute:!1})],Li.prototype,"room",void 0),customElements.define("hub-room-popup",Li);const Oi=X`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <path d="M6 6l12 12M18 6L6 18"></path>
  </svg>
`;class Ii extends mt{constructor(){super(...arguments),this.entity="",this.name="",this._onScrim=t=>{t.target===t.currentTarget&&this._close()}}_close(){this.dispatchEvent(new CustomEvent("hub-popup-close",{bubbles:!0,composed:!0}))}render(){return this.entity&&this.hass?V`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label=${this.name}>
          <div class="head">
            <span class="title">${this.name}</span>
            <button class="close" aria-label="Stäng" @click=${this._close}>${Oi}</button>
          </div>
          <glass-light-slider
            .hass=${this.hass}
            ._config=${{type:"glass-light-slider",entity:this.entity,name:this.name}}
          ></glass-light-slider>
        </div>
      </div>
    `:V``}}Ii.styles=[Tt,o`
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
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .card {
        width: 100%;
        max-width: 440px;
        box-sizing: border-box;
        padding: 20px;
        border-radius: var(--hub-radius-lg);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        animation: pop 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      @keyframes pop {
        from { opacity: 0; transform: translateY(12px) scale(0.98); }
        to { opacity: 1; transform: none; }
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
      glass-light-slider {
        display: block;
      }
    `],t([gt()],Ii.prototype,"entity",void 0),t([gt()],Ii.prototype,"name",void 0),customElements.define("hub-light-popup",Ii);const Ri=X`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <path d="M6 6l12 12M18 6L6 18"></path>
  </svg>
`,Hi=new Set(["EXPECTED","ATSTOP"]);class Ui extends mt{constructor(){super(...arguments),this._onScrim=t=>{t.target===t.currentTarget&&this._close()}}_close(){this.dispatchEvent(new CustomEvent("hub-popup-close",{bubbles:!0,composed:!0}))}_departures(t,e,i){if(!t)return[];const a=this.getEntity(t);return Ge(a?.attributes.departures??[],e,i).slice(0,6)}_depRow(t){const e=function(t){return"string"==typeof t.state&&t.state.length>0&&!Hi.has(t.state)}(t),i=Ke(t.expected??t.scheduled)??"–";return V`
      <div class="dep-row">
        <span class="dep-time ${e?"delayed":""}">${i}</span>
        <span class="dep-dest">${t.destination??"–"}</span>
        <span class="dep-in ${e?"delayed":""}">${t.display??""}</span>
      </div>
    `}_depSection(t,e,i){return V`
      <div class="section">
        <div class="sec-title">${t}</div>
        ${e.length?e.map(t=>this._depRow(t)):V`<div class="empty">${i}</div>`}
      </div>
    `}_storSection(t){return 0===t.length?G:V`
      <div class="section">
        <div class="sec-title">Störningar</div>
        ${t.map(t=>V`
            <div class="stor">
              <div class="stor-head">
                ${t.badges.map(t=>V`<span class="badge">${t}</span>`)}
                <span class="stor-header">${t.header}</span>
              </div>
              ${t.details?V`<div class="stor-details">${t.details}</div>`:G}
              ${t.scope?V`<div class="stor-scope">Berör: ${t.scope}</div>`:G}
            </div>
          `)}
      </div>
    `}render(){if(!this.hass||!this.config)return V``;const t=this.config,e=this._departures(t.departures?.list_entity,"43",""),i=t.transit?.bus,a=i?this._departures(i.entity,i.line,i.exclude_destination):[],s=t.disturbances_entity?this.getEntity(t.disturbances_entity):void 0,r=s&&"unavailable"!==s.state&&"unknown"!==s.state?qe(s.attributes.deviations):[];return V`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label="Resor och störningar">
          <div class="head">
            <span class="title">Resor & störningar</span>
            <button class="close" aria-label="Stäng" @click=${this._close}>${Ri}</button>
          </div>
          ${this._depSection("Pendeltåg",e,"–")}
          ${this._depSection(i?.label??"Buss",a,"Inga avgångar idag")}
          ${this._storSection(r)}
        </div>
      </div>
    `}}Ui.styles=[Tt,o`
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
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .card {
        width: 100%;
        max-width: 560px;
        max-height: 100%;
        overflow: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        box-sizing: border-box;
        padding: 20px;
        border-radius: var(--hub-radius-lg);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        animation: pop 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      @keyframes pop {
        from { opacity: 0; transform: translateY(12px) scale(0.98); }
        to { opacity: 1; transform: none; }
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

      .section + .section {
        margin-top: 18px;
        padding-top: 16px;
        border-top: 1px solid var(--hub-card-border);
      }
      .sec-title {
        font: 600 13px var(--hub-font-body);
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
        margin-bottom: 8px;
      }
      .empty {
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-dim);
      }

      /* ── Departure rows ─────────────────────────────────── */
      .dep-row {
        display: flex;
        align-items: baseline;
        gap: 10px;
        min-height: 30px;
      }
      .dep-time {
        flex-shrink: 0;
        width: 52px;
        font: 600 14px var(--hub-font-body);
        color: var(--hub-text);
        font-variant-numeric: tabular-nums;
      }
      .dep-time.delayed {
        color: var(--hub-coral);
      }
      .dep-dest {
        flex: 1;
        min-width: 0;
        font: 500 14px var(--hub-font-body);
        color: var(--hub-text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .dep-in {
        flex-shrink: 0;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-dim);
        font-variant-numeric: tabular-nums;
      }
      .dep-in.delayed {
        color: var(--hub-coral);
      }

      /* ── Störningar ─────────────────────────────────────── */
      .stor + .stor {
        margin-top: 12px;
      }
      .stor-head {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .badge {
        min-width: 24px;
        padding: 1px 6px;
        border-radius: 6px;
        text-align: center;
        background: var(--hub-coral);
        color: var(--hub-surface);
        font: 700 10.5px var(--hub-font-body);
      }
      .stor-header {
        font: 600 14px var(--hub-font-body);
        color: var(--hub-coral);
      }
      .stor-details {
        margin-top: 4px;
        font: 400 13px var(--hub-font-body);
        line-height: 1.45;
        color: var(--hub-text-muted);
        white-space: pre-line;
      }
      .stor-scope {
        margin-top: 3px;
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
    `],t([gt({attribute:!1})],Ui.prototype,"config",void 0),customElements.define("hub-transit-popup",Ui);const Vi=X`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <path d="M6 6l12 12M18 6L6 18"></path>
  </svg>
`,Xi=new Intl.DateTimeFormat("sv-SE",{weekday:"short"});class Wi extends mt{constructor(){super(...arguments),this._loc=0,this._hours=[],this._days=[],this._bgOn=zt(),this._loadedFor="",this._onScrim=t=>{t.target===t.currentTarget&&this._close()}}get _locations(){const t=this.config;return t?.weather_locations?.length?t.weather_locations:t?.weather_entity?[{entity:t.weather_entity,name:"Hem"}]:[]}updated(t){const e=this._locations[this._loc]?.entity;e&&this.hass&&(t.has("hass")||t.has("config"))&&this._loadedFor!==e&&this._load(e)}async _load(t){this._loadedFor=t;const[e,i]=await Promise.all([xe(this.hass,t,"hourly"),xe(this.hass,t,"daily")]);this._loadedFor===t&&(this._hours=e?Wt(e):[],this._days=i?Gt(i):[])}_pickLoc(t){if(t===this._loc)return;this._loc=t,this._hours=[],this._days=[];const e=this._locations[t]?.entity;e&&this._load(e)}_close(){this.dispatchEvent(new CustomEvent("hub-popup-close",{bubbles:!0,composed:!0}))}_toggleBg(){this._bgOn=!this._bgOn,Ft(this._bgOn),this.dispatchEvent(new CustomEvent("hub-weather-bg-toggle",{detail:{on:this._bgOn},bubbles:!0,composed:!0}))}get _isNight(){return"below_horizon"===this.hass?.states["sun.sun"]?.state}_hero(){const t=this.getEntity(this._locations[this._loc]?.entity??"");if(!t)return G;const e=t.attributes.temperature,i=t.attributes.apparent_temperature,a=t.attributes.wind_speed,s=t.attributes.wind_speed_unit??"km/h";return V`
      <div class="hero">
        ${me(t.state,this._isNight)}
        <span class="hero-temp">${"number"==typeof e?Math.round(e):"–"}°</span>
        <span class="hero-meta">
          <span class="hero-cond">${this.hass.formatEntityState(t)}</span>
          ${"number"==typeof i?V`<span>Känns som ${Math.round(i)}°</span>`:G}
          ${"number"==typeof a?V`<span>Vind ${Math.round(a)} ${s}</span>`:G}
        </span>
      </div>
    `}_hourly(){const t=Date.now()-36e5,e=this._hours.filter(e=>e.ts>=t).slice(0,24);return V`
      <div class="section">
        <div class="sec-title">Idag</div>
        ${e.length?V`<div class="hours">
              ${e.map(t=>V`
                  <div class="hour">
                    <span class="hour-t">${String(new Date(t.ts).getHours()).padStart(2,"0")}</span>
                    ${me(t.condition,this._isNight)}
                    <span class="hour-temp">${Math.round(t.temp)}°</span>
                    <span class="hour-precip">${t.precip>=.1?`${t.precip.toFixed(1)}`:""}</span>
                  </div>
                `)}
            </div>`:V`<div class="empty">Ingen timprognos</div>`}
      </div>
    `}_daily(){const t=this._days.slice(0,7),e=function(t){if(0===t.length)return null;let e=1/0,i=-1/0;for(const a of t)null!==a.low&&a.low<e&&(e=a.low),a.high>i&&(i=a.high),a.high<e&&(e=Math.min(e,a.high));return Number.isFinite(e)&&Number.isFinite(i)?{min:e,max:i}:null}(t),i=e?Math.max(e.max-e.min,1):1;return V`
      <div class="section">
        <div class="sec-title">7 dagar</div>
        ${t.length&&e?t.map((t,a)=>{const s=t.low??t.high,r=(s-e.min)/i*100,o=Math.max((t.high-s)/i*100,4);return V`
                <div class="day-row">
                  <span class="day-name">${0===a?"Idag":function(t){return t.length?t.charAt(0).toUpperCase()+t.slice(1):t}(Xi.format(new Date(t.ts)))}</span>
                  ${me(t.condition,!1)}
                  <span class="day-prob">${null!==t.precipProb&&t.precipProb>=20?`${Math.round(t.precipProb)}%`:""}</span>
                  <span class="day-lo">${null!==t.low?`${Math.round(t.low)}°`:""}</span>
                  <span class="day-bar">
                    <span class="day-bar-fill" style="left:${r}%;width:${o}%"></span>
                  </span>
                  <span class="day-hi">${Math.round(t.high)}°</span>
                </div>
              `}):V`<div class="empty">Ingen veckoprognos</div>`}
      </div>
    `}render(){if(!this.hass||!this.config)return V``;const t=this._locations;return V`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label="Väder">
          <div class="head">
            <div class="pills">
              ${t.map((t,e)=>V`
                  <button class="pill ${e===this._loc?"active":""}" @click=${()=>this._pickLoc(e)}>
                    ${t.name}
                  </button>
                `)}
            </div>
            <button class="close" aria-label="Stäng" @click=${()=>this._close()}>${Vi}</button>
          </div>
          ${this._hero()}
          ${this._hourly()}
          ${this._daily()}
          <div class="section">
            <div class="toggle-row">
              <span class="toggle-label">Animerad bakgrund</span>
              <button
                class="switch ${this._bgOn?"on":""}"
                role="switch"
                aria-checked=${this._bgOn}
                aria-label="Animerad bakgrund"
                @click=${()=>this._toggleBg()}
              ></button>
            </div>
          </div>
        </div>
      </div>
    `}}Wi.styles=[Tt,o`
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
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .card {
        width: 100%;
        max-width: 620px;
        max-height: 100%;
        overflow: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        box-sizing: border-box;
        padding: 20px;
        border-radius: var(--hub-radius-lg);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        animation: pop 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      @keyframes pop {
        from { opacity: 0; transform: translateY(12px) scale(0.98); }
        to { opacity: 1; transform: none; }
      }
      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 14px;
      }
      .pills {
        display: flex;
        gap: 6px;
      }
      .pill {
        padding: 7px 16px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        font: 600 13px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: color 150ms ease, border-color 150ms ease;
      }
      .pill.active {
        color: var(--hub-text);
        border-color: var(--hub-text-dim);
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
      .close svg { width: 22px; height: 22px; }

      /* ── Current hero ───────────────────────────────────── */
      .hero {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 4px 0 16px;
      }
      .hero svg {
        width: 52px;
        height: 52px;
        color: var(--hub-text-muted);
      }
      .hero-temp {
        font: 200 56px var(--hub-font-display);
        letter-spacing: -0.03em;
        color: var(--hub-text);
        line-height: 1;
      }
      .hero-meta {
        display: flex;
        flex-direction: column;
        gap: 3px;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .hero-cond {
        font: 600 15px var(--hub-font-body);
        color: var(--hub-text);
      }

      .section {
        padding-top: 14px;
        border-top: 1px solid var(--hub-card-border);
      }
      .section + .section { margin-top: 14px; }
      .sec-title {
        font: 600 13px var(--hub-font-body);
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
        margin-bottom: 10px;
      }
      .empty { font: 500 13px var(--hub-font-body); color: var(--hub-text-dim); }

      /* ── Hourly strip ───────────────────────────────────── */
      .hours {
        display: flex;
        gap: 4px;
        overflow-x: auto;
        padding-bottom: 6px;
        -webkit-overflow-scrolling: touch;
      }
      .hour {
        flex: 0 0 52px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        font-variant-numeric: tabular-nums;
      }
      .hour-t { font: 500 12px var(--hub-font-body); color: var(--hub-text-dim); }
      .hour svg { width: 22px; height: 22px; color: var(--hub-text-muted); }
      .hour-temp { font: 600 14px var(--hub-font-body); color: var(--hub-text); }
      .hour-precip { font: 500 11px var(--hub-font-body); color: var(--hub-teal); min-height: 13px; }

      /* ── Daily list ─────────────────────────────────────── */
      .day-row {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 40px;
      }
      .day-name {
        width: 44px;
        flex-shrink: 0;
        font: 600 14px var(--hub-font-body);
        color: var(--hub-text);
      }
      .day-row svg { width: 24px; height: 24px; color: var(--hub-text-muted); flex-shrink: 0; }
      .day-prob {
        width: 40px;
        flex-shrink: 0;
        font: 500 12px var(--hub-font-body);
        color: var(--hub-teal);
        font-variant-numeric: tabular-nums;
      }
      .day-lo, .day-hi {
        width: 34px;
        flex-shrink: 0;
        font: 500 14px var(--hub-font-body);
        font-variant-numeric: tabular-nums;
      }
      .day-lo { color: var(--hub-text-dim); text-align: right; }
      .day-hi { color: var(--hub-text); }
      .day-bar {
        flex: 1;
        height: 4px;
        border-radius: 2px;
        background: var(--hub-track);
        position: relative;
        overflow: hidden;
      }
      .day-bar-fill {
        position: absolute;
        top: 0;
        bottom: 0;
        border-radius: 2px;
        background: linear-gradient(90deg, var(--hub-teal), var(--hub-amber));
      }

      /* ── Background toggle ──────────────────────────────── */
      .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 44px;
      }
      .toggle-label { font: 500 14px var(--hub-font-body); color: var(--hub-text); }
      .switch {
        position: relative;
        width: 46px;
        height: 28px;
        border-radius: 14px;
        border: none;
        cursor: pointer;
        background: var(--hub-track);
        transition: background 200ms ease;
        -webkit-tap-highlight-color: transparent;
      }
      .switch.on { background: var(--hub-amber); }
      .switch::after {
        content: '';
        position: absolute;
        top: 3px;
        left: 3px;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: var(--hub-card);
        transition: transform 200ms ease;
      }
      .switch.on::after { transform: translateX(18px); }
    `],t([gt({attribute:!1})],Wi.prototype,"config",void 0),t([bt()],Wi.prototype,"_loc",void 0),t([bt()],Wi.prototype,"_hours",void 0),t([bt()],Wi.prototype,"_days",void 0),t([bt()],Wi.prototype,"_bgOn",void 0),customElements.define("hub-weather-popup",Wi);const Gi=o`
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
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .card {
    width: 100%;
    max-width: 560px;
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
    from { opacity: 0; transform: translateY(12px) scale(0.98); }
    to { opacity: 1; transform: none; }
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
  @media (max-width: 600px) {
    .scrim { padding: 0; }
    .card {
      max-width: none;
      height: 100%;
      max-height: none;
      border-radius: 0;
    }
  }
`;class qi extends mt{constructor(){super(...arguments),this._onScrim=t=>{t.target===t.currentTarget&&this._close()},this._allOff=()=>{const t=[...new Set((this.config.rooms??[]).flatMap(t=>t.lights.map(t=>t.entity)))];this.hass?.callService("light","turn_off",{},{entity_id:t})}}_close(){this.dispatchEvent(new CustomEvent("hub-popup-close",{bubbles:!0,composed:!0}))}_scene(t){this.callService("scene","turn_on",void 0,t)}render(){if(!this.hass||!this.config)return V``;const t=this.config.rooms??[];return V`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label="Belysning">
          <div class="head">
            <span class="title">Belysning</span>
            <button class="all-off" @click=${this._allOff}>Släck allt</button>
            <button class="close" aria-label="Stäng" @click=${()=>this._close()}>
              ${Ot.close}
            </button>
          </div>
          ${t.map(t=>{const e=t.lights.filter(t=>"on"===this.getEntity(t.entity)?.state).length;return V`
              <div class="room">
                <div class="room-head">
                  <span class="room-name">${t.name}</span>
                  <span class="room-count">${e>0?`${e} tänd${1===e?"":"a"}`:""}</span>
                </div>
                <div class="lights">
                  ${t.lights.map(t=>V`
                      <glass-light-slider
                        .hass=${this.hass}
                        ._config=${{type:"glass-light-slider",entity:t.entity,name:t.name}}
                      ></glass-light-slider>
                    `)}
                </div>
                ${t.scenes?.length?V`<div class="scenes">
                      ${t.scenes.map(t=>V`
                          <button class="scene-chip" @click=${()=>this._scene(t.entity)}>
                            ${t.name}
                          </button>
                        `)}
                    </div>`:G}
              </div>
            `})}
        </div>
      </div>
    `}}qi.styles=[Tt,Gi,o`
      .all-off {
        min-height: 48px;
        padding: 0 16px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        font: 500 13px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .all-off:active {
        transform: scale(0.96);
      }
      .room {
        margin-top: 18px;
      }
      .room:first-of-type {
        margin-top: 0;
      }
      .room-head {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin-bottom: 8px;
      }
      .room-name {
        font: 500 16px var(--hub-font-display);
        color: var(--hub-text);
      }
      .room-count {
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
      .lights {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      glass-light-slider {
        display: block;
      }
      .scenes {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 8px;
      }
      .scene-chip {
        min-height: 44px;
        padding: 0 14px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        font: 500 12.5px var(--hub-font-body);
        white-space: nowrap;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .scene-chip:active {
        transform: scale(0.95);
        background: var(--hub-amber-bg);
        border-color: var(--hub-amber-border);
        color: var(--hub-amber-text);
      }
    `],t([gt({attribute:!1})],qi.prototype,"config",void 0),customElements.define("hub-lights-modal",qi);class Yi extends mt{constructor(){super(...arguments),this._onScrim=t=>{t.target===t.currentTarget&&this._close()}}_close(){this.dispatchEvent(new CustomEvent("hub-popup-close",{bubbles:!0,composed:!0}))}_press(t){this.callService("button","press",void 0,t)}_vac(t){this.config.vacuum_entity&&this.callService("vacuum",t,void 0,this.config.vacuum_entity)}_selectOption(t,e){this.callService("select","select_option",{option:e},t)}_selectChips(t){if(!t)return G;const e=this.getEntity(t),i=e?.attributes.options??[];return i.length?V`<div class="chips">
      ${i.map(i=>V`
          <button class="chip ${e?.state===i?"sel":""}" @click=${()=>this._selectOption(t,i)}>
            ${i}
          </button>
        `)}
    </div>`:G}render(){if(!this.hass||!this.config)return V``;const t=this.config.vacuum_controls,e=this.config.vacuum_entity?this.getEntity(this.config.vacuum_entity):void 0,i=e?.state??"unknown",a=t?.status_entity?this.getEntity(t.status_entity)?.state:i,s=t?.battery_entity?this.getEntity(t.battery_entity)?.state:void 0,r=t?.current_room_entity?this.getEntity(t.current_room_entity)?.state:void 0,o="cleaning"===i||"returning"===i,n="paused"===i;return V`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label="Roborock">
          <div class="head">
            <span class="title">Roborock</span>
            <button class="close" aria-label="Stäng" @click=${()=>this._close()}>
              ${Ot.close}
            </button>
          </div>
          <div class="status">
            <span class="state">${a??"–"}${o&&r?` · ${r}`:""}</span>
            ${s?V`<span class="batt">${s}%</span>`:G}
          </div>
          <div class="actions">
            ${o||n?V`
                  <button class="act" @click=${()=>this._vac(n?"start":"pause")}>
                    ${n?"Fortsätt":"Pausa"}
                  </button>
                  <button class="act" @click=${()=>this._vac("return_to_base")}>Åk hem</button>
                `:V`
                  ${t?.full_button?V`<button class="act primary" @click=${()=>this._press(t.full_button)}>
                        Städa allt
                      </button>`:G}
                  ${(t?.room_buttons??[]).map(t=>V`
                      <button class="act" @click=${()=>this._press(t.entity)}>${t.name}</button>
                    `)}
                `}
          </div>
          ${t?.mop_mode_entity?V`<div class="sect">Mopläge</div>${this._selectChips(t.mop_mode_entity)}`:G}
          ${t?.mop_intensity_entity?V`<div class="sect">Moppintensitet</div>${this._selectChips(t.mop_intensity_entity)}`:G}
          ${t?.consumables?.length?V`<div class="sect">Förbrukning</div>
                <div class="cons">
                  ${t.consumables.map(t=>{const e=this.getEntity(t.entity),i=e?.attributes.unit_of_measurement??"";return V`<div class="cons-row">
                      <span>${t.name}</span><span>${e?.state??"–"} ${i}</span>
                    </div>`})}
                </div>`:G}
        </div>
      </div>
    `}}Yi.styles=[Tt,Gi,o`
      .status {
        display: flex;
        align-items: baseline;
        gap: 10px;
        margin-bottom: 16px;
      }
      .state {
        font: 500 18px var(--hub-font-display);
        color: var(--hub-text);
      }
      .batt {
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .act {
        min-height: 52px;
        border-radius: var(--hub-radius);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text);
        font: 600 14px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .act:active {
        transform: scale(0.97);
      }
      .act.primary {
        grid-column: span 2;
        background: var(--hub-teal-bg);
        color: var(--hub-teal);
        border-color: transparent;
      }
      .sect {
        margin-top: 18px;
        font: 500 12px var(--hub-font-body);
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 8px;
      }
      .chip {
        min-height: 44px;
        padding: 0 14px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        font: 500 12.5px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .chip.sel {
        background: var(--hub-teal-bg);
        border-color: transparent;
        color: var(--hub-teal);
      }
      .cons {
        margin-top: 8px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .cons-row {
        display: flex;
        justify-content: space-between;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
    `],t([gt({attribute:!1})],Yi.prototype,"config",void 0),customElements.define("hub-vacuum-popup",Yi);class Ki extends mt{constructor(){super(...arguments),this._items=null,this._lastCount="",this._onScrim=t=>{t.target===t.currentTarget&&this._close()}}updated(t){super.updated(t);const e=this.config?.todo_entity;if(!e||!this.hass)return;const i=this.getEntity(e)?.state??"";i!==this._lastCount&&(this._lastCount=i,this._refresh())}async _refresh(){this.hass&&this.config?.todo_entity&&(this._items=await Se(this.hass,this.config.todo_entity))}_close(){this.dispatchEvent(new CustomEvent("hub-popup-close",{bubbles:!0,composed:!0}))}async _add(){const t=this.shadowRoot?.querySelector("input"),e=t?.value.trim();e&&this.config.todo_entity&&(this.callService("todo","add_item",{item:e},this.config.todo_entity),t&&(t.value=""))}_toggle(t){if(!this.config.todo_entity)return;const e="completed"===t.status?"needs_action":"completed";this.callService("todo","update_item",{item:t.uid,status:e},this.config.todo_entity),window.setTimeout(()=>{this._refresh()},400)}_clearDone(){this.config.todo_entity&&(this.callService("todo","remove_completed_items",void 0,this.config.todo_entity),window.setTimeout(()=>{this._refresh()},400))}render(){if(!this.hass||!this.config?.todo_entity)return V``;const{open:t,done:e}=Ce(this._items),i=V`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 13l4 4L19 7"></path></svg>`;return V`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label="Att göra">
          <div class="head">
            <span class="title">Att göra</span>
            <button class="close" aria-label="Stäng" @click=${()=>this._close()}>${Ot.close}</button>
          </div>
          <div class="add">
            <input
              placeholder="Lägg till…"
              @keydown=${t=>"Enter"===t.key&&this._add()}
            />
            <button @click=${()=>this._add()}>Lägg till</button>
          </div>
          ${[...t,...e].map(t=>V`
              <div class="row ${"completed"===t.status?"done":""}">
                <button class="box" aria-label="Växla" @click=${()=>this._toggle(t)}>${i}</button>
                <span class="txt">${t.summary}</span>
              </div>
            `)}
          ${e.length?V`<button class="clear" @click=${()=>this._clearDone()}>Rensa klara (${e.length})</button>`:G}
        </div>
      </div>
    `}}Ki.styles=[Tt,Gi,o`
      .add {
        display: flex; gap: 8px; margin-bottom: 14px;
      }
      .add input {
        flex: 1; min-width: 0; height: 48px;
        padding: 0 14px; box-sizing: border-box;
        border-radius: var(--hub-radius);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text);
        font: 500 14px var(--hub-font-body);
        outline: none;
      }
      .add button {
        height: 48px; padding: 0 18px;
        border-radius: var(--hub-radius);
        border: none;
        background: var(--hub-lavender-bg, var(--hub-chip-bg));
        color: var(--hub-lavender, var(--hub-text));
        font: 600 14px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .row {
        display: flex; align-items: center; gap: 12px;
        min-height: 48px;
        border-top: 1px solid var(--hub-card-border);
      }
      .box {
        width: 22px; height: 22px; flex-shrink: 0;
        border-radius: 7px;
        border: 1.5px solid var(--hub-text-dim);
        background: transparent;
        cursor: pointer; padding: 0;
        -webkit-tap-highlight-color: transparent;
        display: flex; align-items: center; justify-content: center;
        color: transparent;
      }
      .row.done .box { color: var(--hub-text-dim); border-color: var(--hub-text-dim); }
      .box svg { width: 14px; height: 14px; }
      .txt { flex: 1; min-width: 0; font: 500 14.5px var(--hub-font-body); color: var(--hub-text); }
      .row.done .txt { color: var(--hub-text-dim); text-decoration: line-through; }
      .clear {
        margin-top: 14px; min-height: 44px; padding: 0 14px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: transparent; color: var(--hub-text-dim);
        font: 500 12.5px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
    `],t([gt({attribute:!1})],Ki.prototype,"config",void 0),t([bt()],Ki.prototype,"_items",void 0),customElements.define("hub-todo-popup",Ki);const Zi={hem:{label:"Hem",icon:"home",tone:"neutral"},ljus:{label:"Ljus",icon:"lamp",tone:"amber"},media:{label:"Media",icon:"note",tone:"teal"},energi:{label:"Energi",icon:"bolt",tone:"green"},kcal:{label:"Kcal",icon:"ring",tone:"lavender"},vecka:{label:"Vecka",icon:"calendar",tone:"lavender"}};class Ji extends ht{constructor(){super(...arguments),this.pages=[],this.active=0}_select(t){this.dispatchEvent(new CustomEvent("hub-goto-page",{detail:{page:t},bubbles:!0,composed:!0}))}render(){return V`
      <nav>
        <div class="rail"></div>
        <div class="items">
          ${this.pages.map((t,e)=>{const i=function(t){const e=Zi[t];return e?{id:t,...e}:{id:t,label:t.charAt(0).toUpperCase()+t.slice(1),icon:"",tone:"neutral"}}(t),a=e===this.active,s=Ot[i.icon];return V`
              <button
                class="item tone-${i.tone} ${a?"active":""}"
                aria-label=${i.label}
                aria-current=${a?"page":G}
                @click=${()=>this._select(t)}
              >
                <span class="pill">
                  ${s?V`<span class="icon">${s}</span>`:G}
                </span>
                <span class="label">${i.label}</span>
              </button>
            `})}
        </div>
        <div class="rail controls">
          <slot name="controls"></slot>
        </div>
      </nav>
    `}}Ji.styles=[Tt,o`
      :host {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 30;
        display: block;
      }
      nav {
        display: flex;
        align-items: stretch;
        height: var(--hub-nav-h);
        padding-bottom: env(safe-area-inset-bottom, 0px);
        box-sizing: border-box;
        background: var(--hub-navbar-bg);
        border-top: 1px solid var(--hub-navbar-border);
        backdrop-filter: blur(24px) saturate(1.4);
        -webkit-backdrop-filter: blur(24px) saturate(1.4);
      }
      /* Three-column bar: an empty left rail balances the right control
         cluster so the 5 nav items stay optically centred at any width. */
      .rail {
        flex: 1 1 0;
        min-width: 0;
        display: flex;
        align-items: center;
      }
      .rail.controls {
        justify-content: flex-end;
        gap: 4px;
        padding-right: 12px;
      }
      /* Quiet divider between the nav items and the theme/kiosk controls. */
      .rail.controls::before {
        content: '';
        width: 1px;
        height: 26px;
        margin-right: 8px;
        background: var(--hub-card-border);
      }
      .items {
        flex: 0 0 auto;
        display: flex;
        align-items: stretch;
      }
      .item {
        flex: 0 0 auto;
        min-width: 64px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 0 6px;
        border: none;
        background: transparent;
        cursor: pointer;
        color: var(--hub-text-dim);
        -webkit-tap-highlight-color: transparent;
        transition: color 150ms ease;
      }
      .pill {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 30px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid transparent;
        transition:
          background 150ms ease,
          border-color 150ms ease;
      }
      .icon {
        display: flex;
        width: 24px;
        height: 24px;
      }
      .icon svg {
        width: 100%;
        height: 100%;
      }
      .label {
        font: 500 11px var(--hub-font-body);
        letter-spacing: 0.02em;
        color: inherit;
        transition: color 150ms ease;
      }

      /* Active — icon + label take the page's domain colour, and a subtle
         tinted pill sits behind the icon. Mirrors the chip tone tokens. */
      .item.active.tone-neutral {
        color: var(--hub-text);
      }
      .item.active.tone-neutral .pill {
        background: var(--hub-icon-chip-bg);
        border-color: var(--hub-card-border);
      }
      .item.active.tone-amber {
        color: var(--hub-amber-text);
      }
      .item.active.tone-amber .pill {
        background: var(--hub-amber-bg);
        border-color: var(--hub-amber-border);
      }
      .item.active.tone-green {
        color: var(--hub-green);
      }
      .item.active.tone-green .pill {
        background: var(--hub-green-bg);
        border-color: var(--hub-green-border);
      }
      .item.active.tone-teal {
        color: var(--hub-teal-text);
      }
      .item.active.tone-teal .pill {
        background: var(--hub-teal-bg);
        border-color: var(--hub-teal-border);
      }
      .item.active.tone-lavender {
        color: var(--hub-lavender-text);
      }
      .item.active.tone-lavender .pill {
        background: var(--hub-lavender-bg);
        border-color: var(--hub-lavender-border);
      }
    `],t([gt({attribute:!1})],Ji.prototype,"pages",void 0),t([gt({type:Number})],Ji.prototype,"active",void 0),customElements.define("hub-nav-bar",Ji);const Qi=["hem","ljus","media","energi","kcal","vecka"],ta={hem:"Hem",ljus:"Ljus",media:"Media",energi:"Energi",kcal:"Kcal",vecka:"Vecka"};const ea=["auto","dag","natt"];let ia=0;class aa extends mt{constructor(){super(...arguments),this.theme="natt",this.kiosk=new URLSearchParams(location.search).has("kiosk"),this._page=0,this._dragX=0,this._openRoom=null,this._openLight=null,this._openTransit=!1,this._openWeather=!1,this._openLights=!1,this._openVacuum=!1,this._openTodo=!1,this._weatherBgOn=zt(),this._override=function(){const t=localStorage.getItem(Pt);return"natt"===t||"dag"===t?t:"auto"}(),this._pointerActive=!1,this._dragging=!1,this._startX=0,this._startY=0,this._lastX=0,this._lastT=0,this._velocity=0,this._onRoomOpen=t=>{const e=t.detail?.roomId;this._openRoom=this._cfg?.rooms?.find(t=>t.id===e)??null},this._onLightOpen=t=>{const e=t.detail;this._openLight=e?.entity?{entity:e.entity,name:e.name??e.entity}:null},this._onGotoPage=t=>{const e=t.detail?.page;e&&this.goToPage(e)},this._onTransitOpen=()=>{this._openTransit=!0},this._onLightsOpen=()=>{this._openLights=!0},this._onVacuumOpen=()=>{this._openVacuum=!0},this._onTodoOpen=()=>{this._openTodo=!0},this._onWeatherOpen=()=>{this._openWeather=!0},this._onWeatherBgToggle=t=>{this._weatherBgOn=t.detail?.on??zt(),Ft(this._weatherBgOn)},this._onPopupClose=()=>{this._openRoom=null,this._openLight=null,this._openTransit=!1,this._openWeather=!1,this._openLights=!1,this._openVacuum=!1,this._openTodo=!1},this._onAnyInteraction=()=>{this._resetIdle()},this._onPointerDown=t=>{this._pointerActive=!0,this._dragging=!1,this._startX=t.clientX,this._startY=t.clientY,this._lastX=t.clientX,this._lastT=t.timeStamp,this._velocity=0,this._dragX=0},this._onPointerMove=t=>{if(!this._pointerActive)return;const e=t.clientX-this._startX,i=t.clientY-this._startY;if(!this._dragging){if(!jt(e)&&!jt(i))return;if(!function(t,e){return Math.abs(t)>Math.abs(e)}(e,i))return void(this._pointerActive=!1);this._dragging=!0,t.currentTarget.setPointerCapture?.(t.pointerId),this._lastX=t.clientX,this._lastT=t.timeStamp}const a=t.timeStamp-this._lastT;a>0&&(this._velocity=(t.clientX-this._lastX)/a),this._lastX=t.clientX,this._lastT=t.timeStamp,this._dragX=e},this._onPointerUp=t=>{if(!this._pointerActive)return;const e=this._dragging;if(this._pointerActive=!1,this._dragging=!1,e){t.currentTarget.releasePointerCapture?.(t.pointerId);const e=this.clientWidth||window.innerWidth;this._page=function(t,e,i,a,s){const r=.2*e,o=Math.abs(i)>.5;let n=a;return t<-r||o&&i<-.5?n=a+1:(t>r||o&&i>.5)&&(n=a-1),Math.max(0,Math.min(s-1,n))}(this._dragX,e,this._velocity,this._page,this._pages.length),ia=this._page}this._dragX=0,this._velocity=0}}setConfig(t){super.setConfig(t)}get _cfg(){return this._config}get _pages(){return this._cfg?.pages??Qi}connectedCallback(){super.connectedCallback(),function(){if(document.getElementById("glass-hub-fonts"))return;const t=document.createElement("style");t.id="glass-hub-fonts",t.textContent="\n@font-face{font-family:'Outfit';src:url('/local/glass-cards/fonts/outfit-variable.woff2') format('woff2-variations');font-weight:100 900;font-display:swap;}\n@font-face{font-family:'Inter';src:url('/local/glass-cards/fonts/inter-variable.woff2') format('woff2-variations');font-weight:100 900;font-display:swap;}\n",document.head.appendChild(t)}(),this._applyTheme(),this._page=ia,this._resetIdle(),this._startKioskDrawerShim(),function(){const t=new URLSearchParams(location.search).get("weather");t&&(Dt=t),window.__hubForceWeather=t=>{Dt=t,window.dispatchEvent(new CustomEvent("hub-weather-force"))}}(),this.addEventListener("pointerdown",this._onAnyInteraction),this.addEventListener("hub-room-open",this._onRoomOpen),this.addEventListener("hub-light-open",this._onLightOpen),this.addEventListener("hub-transit-open",this._onTransitOpen),this.addEventListener("hub-goto-page",this._onGotoPage),this.addEventListener("hub-popup-close",this._onPopupClose),this.addEventListener("hub-weather-open",this._onWeatherOpen),this.addEventListener("hub-lights-open",this._onLightsOpen),this.addEventListener("hub-vacuum-open",this._onVacuumOpen),this.addEventListener("hub-todo-open",this._onTodoOpen),this.addEventListener("hub-weather-bg-toggle",this._onWeatherBgToggle)}disconnectedCallback(){super.disconnectedCallback(),this._clearIdle(),void 0!==this._kioskTimer&&(clearInterval(this._kioskTimer),this._kioskTimer=void 0),this.removeEventListener("pointerdown",this._onAnyInteraction),this.removeEventListener("hub-room-open",this._onRoomOpen),this.removeEventListener("hub-light-open",this._onLightOpen),this.removeEventListener("hub-transit-open",this._onTransitOpen),this.removeEventListener("hub-goto-page",this._onGotoPage),this.removeEventListener("hub-popup-close",this._onPopupClose),this.removeEventListener("hub-weather-open",this._onWeatherOpen),this.removeEventListener("hub-lights-open",this._onLightsOpen),this.removeEventListener("hub-vacuum-open",this._onVacuumOpen),this.removeEventListener("hub-todo-open",this._onTodoOpen),this.removeEventListener("hub-weather-bg-toggle",this._onWeatherBgToggle)}willUpdate(t){t.has("hass")&&this._applyTheme()}goToPage(t){const e=this._pages.indexOf(t);e>=0&&(this._page=e,ia=e,this._dragX=0)}_applyTheme(){const t=this.hass?.states["sun.sun"]?.attributes?.elevation,e="number"==typeof t?t:null;this.theme=function(t,e,i=4){return"auto"!==e?e:null===t?"natt":t>i?"dag":"natt"}(e,this._override,this._cfg?.day_elevation??4)}_cycleTheme(){const t=ea.indexOf(this._override);this._override=ea[(t+1)%ea.length],function(t){localStorage.setItem(Pt,t)}(this._override),this._applyTheme()}_toggleKiosk(){const t=new URLSearchParams(location.search);t.has("kiosk")?t.delete("kiosk"):t.set("kiosk","true");const e=t.toString();location.assign(location.pathname+(e?`?${e}`:""))}_resetIdle(){this._clearIdle();const t=this._cfg?.idle_return_s??120;this._idleTimer=window.setTimeout(()=>{0!==this._page&&this.goToPage(this._pages[0])},1e3*t)}_clearIdle(){void 0!==this._idleTimer&&(clearTimeout(this._idleTimer),this._idleTimer=void 0)}_startKioskDrawerShim(){if(!new URLSearchParams(location.search).has("kiosk"))return;const t=Date.now(),e=()=>{const t=document.querySelector("home-assistant")?.shadowRoot?.querySelector("home-assistant-main");if(!t)return!1;t.style.setProperty("--mdc-drawer-width","0px");const e=t.shadowRoot?.querySelector("ha-drawer");return e?.style.setProperty("--mdc-drawer-width","0px"),!0};e()||(this._kioskTimer=window.setInterval(()=>{(e()||Date.now()-t>5e3)&&(clearInterval(this._kioskTimer),this._kioskTimer=void 0)},250))}_themeGlyph(){return"auto"===this._override?V`<span class="glyph-auto">A</span>`:"dag"===this._override?X`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
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
      </svg>`:X`<svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M20 14.5A8 8 0 0 1 9.5 4a6.5 6.5 0 1 0 10.5 10.5z"></path>
    </svg>`}render(){const t=this._pages,e=t.length,i=`--page-count:${e};width:calc(100% * ${e});transform:translateX(calc(${-this._page} * 100% / ${e} + ${this._dragX}px));transition:${this._dragging?"none":"transform 320ms cubic-bezier(.3,.7,.3,1)"};`;return V`
      <div
        class="strip"
        style=${i}
        @pointerdown=${this._onPointerDown}
        @pointermove=${this._onPointerMove}
        @pointerup=${this._onPointerUp}
        @pointercancel=${this._onPointerUp}
      >
        ${t.map(e=>V`
            <section class="page" data-page-id=${e}>
              ${"hem"===e?V`<hub-home-page
                    .hass=${this.hass}
                    .config=${this._cfg}
                    .theme=${this.theme}
                    .weatherBg=${this._weatherBgOn}
                    .pageActive=${"hem"===t[this._page]}
                  ></hub-home-page>`:"ljus"===e?V`<hub-lights-page
                      .hass=${this.hass}
                      .config=${this._cfg}
                    ></hub-lights-page>`:"energi"===e?V`<hub-energy-page
                        .hass=${this.hass}
                        .config=${this._cfg}
                      ></hub-energy-page>`:"media"===e?V`<hub-media-page
                          .hass=${this.hass}
                          .config=${this._cfg}
                        ></hub-media-page>`:"kcal"===e?V`<hub-kcal-page
                            .hass=${this.hass}
                            .config=${this._cfg}
                          ></hub-kcal-page>`:"vecka"===e?V`<hub-planner-page
                              .hass=${this.hass}
                              .config=${this._cfg}
                            ></hub-planner-page>`:V`<h1 class="page-placeholder">${function(t){return ta[t]??t.charAt(0).toUpperCase()+t.slice(1)}(e)}</h1>`}
            </section>
          `)}
      </div>

      <hub-nav-bar .pages=${t} .active=${this._page}>
        <button
          slot="controls"
          class="kiosk-toggle"
          aria-label=${this.kiosk?"Avsluta helskärm":"Helskärmsläge"}
          @click=${this._toggleKiosk}
        >
          ${this.kiosk?Ot.compress:Ot.expand}
        </button>
        <button
          slot="controls"
          class="theme-toggle"
          aria-label="Byt tema"
          @click=${this._cycleTheme}
        >
          ${this._themeGlyph()}
        </button>
      </hub-nav-bar>

      ${this._openRoom?V`<hub-room-popup
            .hass=${this.hass}
            .room=${this._openRoom}
          ></hub-room-popup>`:G}
      ${this._openLight?V`<hub-light-popup
            .hass=${this.hass}
            .entity=${this._openLight.entity}
            .name=${this._openLight.name}
          ></hub-light-popup>`:G}
      ${this._openTransit?V`<hub-transit-popup
            .hass=${this.hass}
            .config=${this._cfg}
          ></hub-transit-popup>`:G}
      ${this._openWeather?V`<hub-weather-popup
            .hass=${this.hass}
            .config=${this._cfg}
          ></hub-weather-popup>`:G}
      ${this._openLights?V`<hub-lights-modal .hass=${this.hass} .config=${this._cfg}></hub-lights-modal>`:G}
      ${this._openVacuum?V`<hub-vacuum-popup .hass=${this.hass} .config=${this._cfg}></hub-vacuum-popup>`:G}
      ${this._openTodo?V`<hub-todo-popup .hass=${this.hass} .config=${this._cfg}></hub-todo-popup>`:G}
    `}}aa.styles=[Tt,o`
      :host {
        position: absolute;
        inset: 0;
        box-sizing: border-box;
        overflow: hidden;
        background: var(--hub-surface);
        color: var(--hub-text);
        font-family: var(--hub-font-body);
        transition: background var(--hub-fade) ease;
        -webkit-tap-highlight-color: transparent;
      }
      /* Outside kiosk mode HA still shows its own header on top of us; inset
         the whole hub so the top row clears it. HA exposes --header-height. */
      :host(:not([kiosk])) {
        padding-top: var(--header-height, 56px);
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
        box-sizing: border-box;
        padding-bottom: var(--hub-nav-h);
        overflow-y: auto;
        overflow-x: hidden;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
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

      /* Quiet control cluster — slotted into the nav bar's right edge. */
      .theme-toggle,
      .kiosk-toggle {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: none;
        border-radius: 50%;
        background: transparent;
        color: var(--hub-text-dim);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: color 150ms ease;
      }
      .theme-toggle svg,
      .kiosk-toggle svg {
        width: 24px;
        height: 24px;
      }
      .theme-toggle .glyph-auto {
        font-family: var(--hub-font-display);
        font-weight: 500;
        font-size: 20px;
      }
    `],t([gt({reflect:!0,attribute:"data-theme"})],aa.prototype,"theme",void 0),t([gt({reflect:!0,type:Boolean})],aa.prototype,"kiosk",void 0),t([bt()],aa.prototype,"_page",void 0),t([bt()],aa.prototype,"_dragX",void 0),t([bt()],aa.prototype,"_openRoom",void 0),t([bt()],aa.prototype,"_openLight",void 0),t([bt()],aa.prototype,"_openTransit",void 0),t([bt()],aa.prototype,"_openWeather",void 0),t([bt()],aa.prototype,"_openLights",void 0),t([bt()],aa.prototype,"_openVacuum",void 0),t([bt()],aa.prototype,"_openTodo",void 0),t([bt()],aa.prototype,"_weatherBgOn",void 0),customElements.define("glass-hub",aa);const sa=window;sa.customCards=sa.customCards||[],sa.customCards.push({type:"glass-background",name:"Glass Background",description:"Animated gradient background"},{type:"glass-button",name:"Glass Button",description:"Toggle/info button"},{type:"glass-chip",name:"Glass Chip",description:"Small status pill"},{type:"glass-header",name:"Glass Header",description:"Greeting, weather, status chips"},{type:"glass-room-card",name:"Glass Room Card",description:"Room with sub-buttons and popup"},{type:"glass-light-slider",name:"Glass Light Slider",description:"Brightness slider with glow"},{type:"glass-popup",name:"Glass Popup",description:"Modal overlay"},{type:"glass-nav-bar",name:"Glass Nav Bar",description:"Bottom navigation"},{type:"glass-vacuum-card",name:"Glass Vacuum Card",description:"Vacuum controls"},{type:"glass-info-row",name:"Glass Info Row",description:"Information display"},{type:"glass-section",name:"Glass Section",description:"Section header label"},{type:"glass-departure-card",name:"Glass Departure Card",description:"Train departure list"},{type:"glass-hub",name:"Glass Hub",description:"Full-screen wall hub"}),console.info("%c GLASS CARDS %c v0.1.0 ","color: white; background: #4FC3F7; font-weight: bold; padding: 2px 6px; border-radius: 4px 0 0 4px;","color: #4FC3F7; background: rgba(79,195,247,0.1); padding: 2px 6px; border-radius: 0 4px 4px 0;");
