(() => {
  // check for preact then load/reload app
  if (this.preact === undefined) {
    loadPreact(App);
  } else {
    App();
  }

  function loadPreact(cb) {
    let s = document.createElement('script');
    s.src = "https://www.online-dds.com/tpn/c/C777/docs/htm-preact-standalone.js";
    s.async = true;
    document.body.appendChild(s);
    if (s.readyState) {
      s.onreadystatechange = function () {
        if (s.readyState === "loaded" || s.readyState === "complete") {
          s.onreadystatechange = null;
          if (cb && typeof cb === "function") {
            cb();
          }
        }
      };
    } else {
      s.onload = function () {
        if (cb && typeof cb === "function") {
          cb();
        }
      };
    }
  };

  function App() {
    const colorSwap = document.querySelector('#color-swap') ? document.querySelector('#color-swap') : document.createElement('div');
    colorSwap.id = 'color-swap';
    document.querySelector('body').insertAdjacentElement("beforeend", colorSwap);
    const dropRecieveDivs = [...document.querySelectorAll('.TPBand ~ .TPBand')];
    dropRecieveDivs.forEach((tpband, idx) => {
      const dropRecieve = `<div id="drop-recieve-${idx}" class="drop-recieve"></div>`;
      tpband.insertAdjacentHTML('beforebegin', dropRecieve);
    });

    // get preact functions
    const html = preact.html,
      render = preact.render,
      useState = preact.useState,
      useRef = preact.useRef,
      useCallback = preact.useCallback,
      useEffect = preact.useEffect;

    // get document stylesheets, map only the weo webpage stylesheet and get rid of the rest. then get the css text and the selector text for those style sheets and join them together into one array.
    const originalStyles = [...document.styleSheets].map((stysh, idx) => {
      try {
        return stysh.cssRules.length > 0
          && stysh.href.match(/webpage\.css\?vers/)
          ? [...stysh.cssRules].map(rule =>
            rule.cssText.match(/rgb/)
            && (
              // get back all the color styles used in css
              {
                cssText: rule.cssText,
                selectorText: rule.selectorText
              }
            )
            || null).filter(res =>
              // filter out null responses
              res !== null
            )
          : null
      } catch (e) {
        console.error('skipping css');
        return null
      }
    }).filter(res => res !== null).reduce((acc, cur) =>
      // flatten map into one array of cssStyleRules
      acc
        ? [...acc, ...cur]
        : console.log({ acc })
    );

    // create an object to store original theme color and associated styles where that color shows up, as well as an id and hex/rgba versions. 
    // Gets put into state later.
    const themeColors = [...[...document.styleSheets].filter(stysh =>
      stysh.href
      && stysh.href.match(/webpage\.css\?vers/) !== null
    )[0].cssRules].filter(rule =>
      rule.cssText.match(/TPweoc\d{1,}-?\d{0,}/) !== null
    ).map((cssStyRule, idx) => {
      const preSelectedColors = cssStyRule.cssText.split('content:')[1].split(';').filter(tcolor => {
        return tcolor.match(/((<?rgba?)\([^\)]+\))/) !== null || tcolor.match(/((<?#)[\da-f]{3,8})/i) !== null
      }).map(tcolor => {
        if (tcolor.match(/((<?rgba?)\([^\)]+\))/) !== null) {
          const { r, g, b, a } = rgba(tcolor.match(/((<?rgba?)\([^\)]+\))/)[1]);
          return `rgba(${r}, ${g}, ${b}, ${a})`
        }
        if (tcolor.match(/((<?#)[\da-f]{3,8})/i) !== null) {
          const { red, green, blue, alpha } = hexToRgba(tcolor.match(/((<?#)[\da-f]{3,8})/i)[1]);
          const res = !alpha
            ? `rgb(${red}, ${green}, ${blue})`
            : `rgba(${red}, ${green}, ${blue}, ${alpha})`;
          return res
        }
        console.log('problem with:,', tcolor);
      });
      if (preSelectedColors === []) {
        return null
      }
      const mainThemeColor = preSelectedColors[0];
      const { r, g, b, a } = rgba(mainThemeColor);
      const colorRegExp = new RegExp(mainThemeColor.replace('(', '\\(').replace(')', '\\)'));
      const cssStyles = originalStyles.filter(style => style.cssText.match(colorRegExp) !== null).map(style => style.cssText);
      const colorRules = cssStyles.map(cSty => {
        const selector = cSty.split('{')[0];
        const rules = cSty.split('{')[1].split(';');
        const colorRule = rules.filter(rule =>
          rule.match(colorRegExp)
        ).map(rule =>
          selector + '{' + rule + '}'
        ).join(' ');
        return colorRule;
      });
      // get back just the theme colors and put in css syntax
      return {
        cssText: cssStyles,
        colorRules: colorRules,
        originalColor: mainThemeColor,
        preSelectedColors: preSelectedColors,
        id: `Color ${idx + 1}-${mainThemeColor}`,
        hexColor: rgbToHex(r, g, b),
        alpha: Number(a) * 100,
        hexAndAlpha: colorAndAlpha2rgbaHex(rgbToHex(r, g, b), Number(a) * 100),
        textHexAndAlpha: colorAndAlpha2rgbaHex(rgbToHex(r, g, b), Number(a) * 100),
        textHexColor: rgbToHex(r, g, b)
      }
    }).filter(theColorObj => theColorObj !== null);

    // put theme colors into an object so you can call it with the rgb original color
    let processedStyles = {};
    themeColors.forEach(color => { processedStyles[color.id] = color });

    // **********************************
    // ****** start the components ******
    // **********************************
    // gear svg
    const GearSVGBtn = (props) => {
      return (html`
        <button onClick=${props.onClick} style=${props.style}>
          <svg id="TPsvg-gear" class="TPsvg" aria-labelledby="TPsvg-gear-title" aria-describedby="TPsvg-gear-description" role="img" fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="123.6" height="122.1" overflow="visible" viewBox="0 0 123.6 122.1" style="${{ width: '100%', height: 'auto' }}"><title id="TPsvg-gear-title">gear</title> <desc id="TPsvg-gear-description">a single gear</desc><path d="M72.9,122.1H49.2l-1.4-15.5c-3.4-1-6.7-2.4-9.9-4.2l-11.6,9.8L9,95.2l10.1-12c-1.6-3-2.9-6.3-3.9-10L0,72.1v-24l15.8-1.4 c1.1-3.3,2.6-6.6,4.3-9.6l-9.8-11.5l17.3-17l12,10.1c3.1-1.6,6.3-2.8,9.9-3.7l1.2-15h24.2l1.4,15.5c3.4,1,6.7,2.4,9.8,4.2 l11.4-9.8l17.3,17l-10.2,12.1c1.7,3.2,3,6.6,3.8,9.9l15.1,1.2v24l-15.8,1.4c-1.1,3.3-2.6,6.6-4.3,9.6l9.8,11.5l-17.3,17l-12-10.1 c-3.1,1.6-6.3,2.8-9.9,3.7L72.9,122.1z M57.2,113.2h7.6l1-13.4l3.2-0.7c5-1.1,9.4-2.7,13.2-5l2.7-1.6l10.6,8.9l5.7-5.6l-8.8-10.3 l1.9-2.8c2.6-3.8,4.6-8.2,5.8-12.7l0.8-3l13.9-1.2v-7.8L101,57.1l-0.6-3.4c-0.7-4.4-2.4-8.8-4.9-13L93.9,38l8.9-10.5l-5.7-5.6 l-10.3,8.8L84,28.8c-4-2.7-8.3-4.6-12.8-5.5l-3.2-0.7L66.8,8.8h-8l-1,13.4l-3.2,0.7c-5,1.1-9.4,2.7-13.2,5l-2.7,1.6L28,20.5 l-5.7,5.6l8.8,10.3l-1.9,2.8c-2.6,3.8-4.6,8.2-5.8,12.7l-0.8,3L8.8,56.1v7.8l13.6,1l0.7,3.2c1.1,5.1,2.7,9.4,5.1,13.1L30,84 l-9,10.6l5.7,5.6l10.5-8.8l2.8,1.9c4,2.7,8.3,4.6,12.8,5.5l3.2,0.7L57.2,113.2z"></path><path d="M61.8,84.3c-12.9,0-23.4-10.4-23.4-23.2S48.9,38,61.8,38c12.9,0,23.4,10.4,23.4,23.2S74.7,84.3,61.8,84.3z M61.8,46.8 c-8,0-14.6,6.4-14.6,14.3c0,7.9,6.5,14.3,14.6,14.3c8,0,14.6-6.4,14.6-14.3C76.4,53.2,69.8,46.8,61.8,46.8z"></path></svg>
        </button>
      `)
    }

    // reusable internal component. 
    // this is used when a feature is selected and needs to display new information.
    // like the colorswap or insert drag drop
    const PopUpWidget = (props) => {
      const escFunction = useCallback((event) => {
        if (event.keyCode === 27) {
          closePopWidget();
        }
      }, []);
      const popBtnRef = useRef(null);
      const widgetRef = useRef(null);
      useEffect(() => {
        document.addEventListener("keydown", escFunction, false);

        return () => {
          document.removeEventListener("keydown", escFunction, false);
        };
      }, []);
      function closePopWidget() {
        widgetRef.current.style.display = 'none';
        popBtnRef.current.style.display = 'inline-block';
        typeof props.closePopWidgetCallBack === 'function' && props.closePopWidgetCallBack();
      }
      const popWidget = () => {
        widgetRef.current.style.display = 'block';
        popBtnRef.current.style.display = 'none';
        typeof props.popWidgetCallBack === 'function' && props.popWidgetCallBack();
      }
      return (html`
        <div>
          <button
            onClick=${popWidget}
            class="btn TPbtn TPmargin-5"
            ref=${popBtnRef}
          >
            ${props.buttonContent}
          </button>
          <div
            ref=${widgetRef}
            style=${{
          display: 'none',
          minWidth: '200px',
          maxHeight: '80vh',
          background: '#fff',
          border: 'solid 3px #ddd',
          padding: '0',
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          overflowY: 'auto',
          zIndex: '1000'
        }}
          >
            <div 
              class="widget-top-bar" 
              style=${{
          minHeight: '30px',
          background: '#ddd',
          position: 'sticky',
          top: '-1px',
          zIndex: '1'
        }}
            >
              <button 
                class="close-insert-band" 
                onClick=${closePopWidget} 
                style=${{
          position: 'absolute',
          top: '0px',
          right: '15px',
          padding: '1em',
          zIndex: '1',
          cursor: 'pointer',
          border: 'none',
          background: 'transparent'
        }}
              >
                <div 
                  style=${
        /* this is the first line of the x for the close button on the PopUpWidget */
        {
          transform: 'rotate(45deg) translate(-5px, 2px)',
          position: 'absolute',
          border: 'solid 1px #000',
          width: '12px',
        }}
                ></div>
                <div 
                  style=${
        /* this is the second line of the x for the close button on the PopUpWidget */
        {
          transform: 'rotate(-45deg) translate(-2px, -5px)',
          position: 'absolute',
          border: 'solid 1px #000',
          width: '12px'
        }}
                ></div>
              </button>
            </div>
            ${props.heading && html`<div style=${{ padding: '0 1em' }}>
              ${props.heading}
            </div>`}
            ${props.children}
          </div>
        </div>
      `)
    }

    // make a color box, a color box is a section that has color inputs for text and non text like backgrounds, as well as a range slider for transparency. 
    // called "boxes" in ColorSwapWidget component
    const ColorSelectorBox = (props) => {
      const theColorObj = props.state.styles[props.id];
      const textColor = () => {
        const { red: r, green: g, blue: b } = hexToRgba(theColorObj.hexColor);
        if (Number(r) + Number(g) + Number(b) < 400) {
          return '#ffffff'
        } else {
          return '#000000'
        }
      };
      const textShadowColor = () => {
        const { red: r, green: g, blue: b } = hexToRgba(theColorObj.hexColor);
        if (Number(r) + Number(g) + Number(b) < 400) {
          return '#000000 0px 0px 6px'
        } else {
          return '#ffffff 0px 0px 6px'
        }
      };
      const handleColorChange = e => {
        const colorId = e.target.id;
        const hexValue = e.target.value;
        props.setState(prevState => ({
          ...prevState,
          styles: {
            ...prevState.styles,
            [colorId]: {
              ...prevState.styles[colorId],
              hexColor: hexValue,
              hexAndAlpha: colorAndAlpha2rgbaHex(hexValue, prevState.styles[colorId].alpha)
            }
          }
        }));
      }
      const handleTextColorChange = e => {
        const colorId = e.target.id;
        const hexValue = e.target.value;
        props.setState(prevState => ({
          ...prevState,
          styles: {
            ...prevState.styles,
            [colorId]: {
              ...prevState.styles[colorId],
              textHexColor: hexValue,
              textHexAndAlpha: colorAndAlpha2rgbaHex(hexValue, prevState.styles[colorId].alpha)
            }
          }
        }));
      }
      const handleAlphaChange = e => {
        const colorId = e.target.id.replace(/-alpha/, '');
        const alphaValue = e.target.value;
        props.setState(prevState => ({
          ...prevState,
          styles: {
            ...prevState.styles,
            [colorId]: {
              ...prevState.styles[colorId],
              alpha: alphaValue,
              hexAndAlpha: colorAndAlpha2rgbaHex(theColorObj.hexColor, alphaValue)
            }
          }
        }));
      }
      return (html`
          <div>
            <label
              style=${{
          minWidth: '50px',
          minHeight: '50px',
          padding: '.5em',
          margin: '.5em',
          display: "inline-block",
          background: theColorObj.hexAndAlpha,
          border: `3px solid ${textColor()}`
        }}
            >
              <p style=${{ color: textColor(), fontSize: '16px', fontWeight: 'normal' }}>${props.children} Non Text</p>
              <input
                type="color" 
                id="${props.id}" 
                value=${theColorObj.hexColor}
                onInput=${handleColorChange}
              />
            </label>
            <label
              style=${{
          minWidth: '50px',
          minHeight: '50px',
          padding: '.5em',
          margin: '.5em',
          display: "inline-block",
          background: theColorObj.textHexAndAlpha,
          border: `3px solid ${textColor()}`
        }}
            >
            <p style=${{ color: textColor(), fontSize: '16px', fontWeight: 'normal' }}>${props.children} Text</p>
              <input
                type="color" 
                id="${props.id}" 
                value=${theColorObj.textHexColor}
                onInput=${handleTextColorChange}
              />
            </label>
            <label
              style=${{
          minWidth: '50px',
          minHeight: '50px',
          padding: '.5em',
          margin: '.5em',
          display: "block",
          background: theColorObj.hexAndAlpha,
          textShadow: textShadowColor(),
          border: `3px solid ${textColor()}`
        }}
            >
              <input
                type="range"
                id="${props.id}-alpha"
                name="${props.id}-alpha"
                min="0"
                max="100"
                value=${theColorObj.alpha}
                onInput=${handleAlphaChange}
              />
              <p style=${{ color: textColor(), fontSize: '16px', fontWeight: 'normal' }}>Alpha Transparency</p>
            </label>
          </div>
        `
      )
    }

    // component to handle adding new styles that are changed by the user.
    // used in the ReColorStyles component
    const ColorStyle = (props) => {
      return (
        html`
            ${props.children}
            ${props.color}
        `
      )
    }

    // collecting all the styles adjusted by the user - "allStyles"
    // finding original color in original styles and updating to new color
    // also adding styles for drag drop stuff - "bandDropInStylesMain"
    const ReColorStyles = (props) => {
      const allStyles = Object.values(props.state.styles).map(color => {
        const lines = color.colorRules.join(' ').split(color.originalColor);
        return lines.map((line, idx) => {
          // set either for css {color: ''} or everything besides css {color: ''}
          // gives the user the option to change text color or bkg/border/etc. separately.
          const isTextOnly = line.match(/{\s?[^-]?color:/) !== null
            ? props.state.styles[color.id].textHexAndAlpha
            : props.state.styles[color.id].hexAndAlpha;
          return (html`<${ColorStyle}
            key="${color.id}-ref${idx}"
            color=${(idx + 1) === lines.length
              ? ''
              : isTextOnly}
            >
              ${line}
            </${ColorStyle}>`)
        });
      });
      const bandDropInStylesMain = `.draggable > * { transform: scale(0.1); transform-origin: top left; } .draggable { overflow: hidden; margin: 15px auto; border: 3px solid #dddddd; cursor: pointer;} .draggable:hover, .draggable:focus, .draggable:active {background: #eeeeee} .draggable>*:before { content: ''; display: block; position: absolute; width: 100%; z-index: 1; } .drop-recieve.bkgImg {background-image: url('https://fpoimg.com/600x400?text=Background Image'); background-size: cover; background-position: center; padding: 8% 0; -webkit-box-shadow: inset 0px 0px 0px 5000px rgb(0 90 125 / 50%); -moz-box-shadow: inset 0px 0px 0px 5000px rgba(90, 90, 90, 0.5); box-shadow: inset 0px 0px 0px 5000px rgb(90 90 90 / 50%);}`;
      return (html`
        <style>
          ${bandDropInStylesMain}
          ${allStyles}
        </style>
      `)
    }

    // buttons at the top of color customizer feature that resets colors to theme colors
    const themeTrigger = (props) => {
      const trigger = useRef(null);
      const setNewTheme = () => {
        // get the value from the theme attribute
        const theme = trigger.current.attributes.theme.nodeValue;
        props.setState(prevState => ({
          ...prevState,
          theme: theme
        }));
        Object.values(props.state.styles).forEach(color => {
          props.setState(prevState => ({
            ...prevState,
            styles: {
              ...prevState.styles,
              [color.id]: {
                ...prevState.styles[color.id],
                hexColor: (() => {
                  const { r, g, b } = rgba(props.state.styles[color.id].preSelectedColors[theme]);
                  return rgbToHex(r, g, b);
                })(),
                hexAndAlpha: (() => {
                  const { r, g, b, a } = rgba(props.state.styles[color.id].preSelectedColors[theme]);
                  return colorAndAlpha2rgbaHex(rgbToHex(r, g, b), Number(a) * 100);
                })(),
                textHexColor: (() => {
                  const { r, g, b } = rgba(props.state.styles[color.id].preSelectedColors[theme]);
                  return rgbToHex(r, g, b);
                })(),
                textHexAndAlpha: (() => {
                  const { r, g, b, a } = rgba(props.state.styles[color.id].preSelectedColors[theme]);
                  return colorAndAlpha2rgbaHex(rgbToHex(r, g, b), Number(a) * 100);
                })(),
              }
            }
          }))
        });
      }
      return (html`
        <button
          ref=${trigger}
          theme=${props.theme}
          class="btn TPbtn TPmargin-5"
          onClick=${setNewTheme}
          style=${{

        }}
        >Theme ${props.theme}</button>
      `)
    };

    // the panel that houses the color customizer features
    const ColorSwapWidget = (props) => {
      const state = props.state;
      const setState = props.setState;
      // boxes are the individual theme colors. these are all the ColorSelectorBox components
      const boxes = Object.values(state.styles).map((color) => {
        return (html`
        <${ColorSelectorBox} 
          state=${state} 
          setState=${setState} 
          key=${state.styles[color.id].id}
          id=${state.styles[color.id].id}
        >
          ${state.styles[color.id].id.toString().replace(/-rgba?.*$/, '')}
        <//>
        `)
      });
      // getting the number of themes available and making a theme button for each one.
      const themeTriggers = Object.values(state.styles)[0].preSelectedColors.map((color, idx) => {
        return (html`
        <${themeTrigger} 
          state=${state} 
          setState=${setState} 
          key='theme-${idx}'
          theme=${idx}
        ><//>
        `)
      });
      // color swap pop up widget
      return (html`
        <${PopUpWidget} buttonContent="Customize Color" >
          ${themeTriggers}
          ${boxes}
          <${ReColorStyles} state=${state}/>
        <//>
      `)
    };

    // logo upload feature with support for whether its for mobile or desktop logo versions
    // use the prop mobile for mobile version
    const LogoUpload = (props) => {
      const fileElem = useRef(null);
      const handleClick = () => {
        fileElem.current.click();
      };
      const handleUpload = () => {
        const fileSrc = URL.createObjectURL(fileElem.current.files[0]);
        const img = document.createElement("img");
        img.src = fileSrc;
        img.style = 'width: 0; height: 0; overflow: hidden;';
        img.onload = function () {
          URL.revokeObjectURL(fileSrc);
        };
        document.body.appendChild(img);
        props.mobile
          ? document.querySelector('.TPnavbar-brand-alt img').src = fileSrc
          : document.querySelector('.TPnavbar-brand img').src = fileSrc;
      }
      return (html`
        <div class="LogoUpload">
          <input 
            ref=${fileElem}
            onChange=${handleUpload}
            type="file" 
            id="fileElem" 
            accept="image/*" 
            style=${{
          display: 'none',
          position: 'absolute',
          height: '1px',
          width: '1px',
          overflow: 'hidden',
          clip: 'rect(1px, 1px, 1px, 1px)'
        }}
          />
           <button
            class="btn TPbtn TPmargin-5"
            onClick=${handleClick}
           >Upload ${props.mobile ? 'Mobile' : 'Desktop'} Logo</button>
        </div>
      `)
    };
    // button to export the currently set css styles (the allStyles component) to the user clipboard
    const CopyStylesToClipboard = (props) => {
      const copyElem = useRef(null);
      const colorsForCopy = Object.values(props.state.styles).map(colorObj => `\n ${colorObj.id.toString().replace(/-rgba?.*$/, '')} non text: ${colorObj.alpha < 100 ? colorAndAlpha2rgba(colorObj.hexColor, colorObj.alpha) : colorObj.hexColor}\n ${colorObj.id.toString().replace(/-rgba?.*$/, '')} text: ${colorObj.alpha < 100 ? colorAndAlpha2rgba(colorObj.textHexColor, colorObj.alpha) : colorObj.textHexColor}\n `).join('');
      const handleClick = (e) => {
        copyElem.current.select();
        document.execCommand("copy");
        e.target.classList.add('btn-success');
        setTimeout(() => {
          e.target.classList.remove('btn-success');
        }, 3000);
      }
      return (html`
        <div class="CopyStylesToClipboard">
          <textarea            
            ref=${copyElem}
            type="text"
            id="copyElem"
            value=${colorsForCopy}
            readonly
            style=${{
          position: 'fixed',
          bottom: '-60px',
        }}></textarea>
          ${document.queryCommandSupported('copy') && html`<button
            class="btn TPbtn TPmargin-5"
            onClick=${handleClick}
          >Copy Styles</button>`}
        </div>
      `)
    }

    // InsertBand components
    // here be the drag drop stuff
    // Droppable thumbnail houses the custom code from the weo designers from various websites and templates
    // needs a prop.name in order to render anything.
    // watch out for the props.name conditional statement
    const DroppableThumbnail = (props) => {
      const droppableRef = useRef(null);
      const drag = (e) => {
        // putting react prop info into drag drop dataTransfer as stringified json obj
        // see DropReciever for when info comes back into react
        e.dataTransfer.setData('text/plain', JSON.stringify({
          name: droppableRef.current.id.replace(/-thumb/, ''),
          fullWidth: droppableRef.current.dataset.fullwidth,
          bkgImg: droppableRef.current.dataset.bkgimg
        }));
      }
      return (props.name && html`
        ${// setting full width on container
        props.fullWidth && !props.draggable && html`<style>${`.drop-recieve .${props.name} > .TPBandCol { width: 100%; padding: 0; }`}</style>`}
        ${// setting height specific styles for minimized thumb as well as hr and h6 thumb title
        props.draggable && html`
            <style>
              ${`.${props.name}.draggable { height: ${'calc(' + props.height + 'px * 0.1)'}; width: calc(1230px * 0.1); } .${props.name}.draggable>*:before { height: ${props.height}px; width: ${props.width}px; }`}
            </style>
            <hr />
            <h6 style=${{ textAlign: 'center' }}>${titleCaseAndRemoveDash(props.name)}</h6>`
        }
        <div 
          id="${props.name}-thumb"
          ref=${droppableRef} 
          class="${props.name} ${props.dropped ? 'TPBand' : 'draggable'}"
          draggable=${props.draggable} 
          onDragStart=${e => drag(e)}
          data-fullWidth=${props.fullWidth}
          data-bkgImg=${props.bkgImg}
        >
          ${// style tags inside these components need to be escaped and stringified. I used a nested template string.
        // props.name conditional statement
        props.name === 'smile-gallery-1' && html`
              <style>
                ${`${props.name} .TPcard { background: #fafafa; color: #616161; transition: box-shadow 135ms 0ms cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 1px 1px 0 rgba(66, 66, 66, 0.08), 0 1px 3px 1px rgba(66, 66, 66, 0.16); transition: width 235ms 0ms cubic-bezier(0.4, 0, 0.2, 1); border-radius: 3px; z-index: 1; padding: 10px; margin: 60px auto; border-radius: 20px; max-width: 300px; } ${props.name} .TPcard-border { border: 2px dotted #dbdbdb; padding: 20px; border-radius: 20px 20px 0 0; } ${props.name} .TPamount { height: 100px; width: 100px; margin: 10px auto 0; -webkit-border-radius: 50px; -moz-border-radius: 50px; border-radius: 50px; color: #fafafa; border: 2px solid #dbdbdb; background: #cacaca; padding: 30px 0; line-height: 1.2; font-weight: 700; font-size: 36px; position: relative; } ${props.name} .TPdollar { font-size: 20px; padding-top: 0px; position: absolute; left: 16px; } ${props.name} .TPtext-sub { font-size: 18px; } ${props.name} .TPvalid { font-size: 14px; line-height: 1.2; padding: 10px; }`}
              </style >
              <div class="TPbw TPBandCol">
                <div>
                  <div class="TProw TParticle">
                    <div class="TPcol-md-6">
                      <img
                        class="TPimgLeft TPimg-responsive"
                        src="https://fpoimg.com/555x185?text=Before and After Photo"
                        border="0"
                        alt="Before after smile"
                        title="Before after smile"
                        width="555"
                        height="185"
                        align="left"
                      />
                    </div>
                    <div class="TPcol-md-6 TPtext-center">
                      <div
                        data-aos="fade-right"
                        data-aos-duration="900"
                        class="aos-init aos-animate"
                      >
                        <h2 class="TPline">Smile Gallery</h2>
                      </div>
                      <div
                        data-aos="fade-right"
                        data-aos-duration="900"
                        data-aos-delay="200"
                        class="aos-init aos-animate"
                      >
                        Our mission is to create great looking, healthy smiles that enable our
                        patients to project the image they desire for themselves with the
                        utmost pride and confidence. We believe in listening first, and then
                              delivering individualized, uncompromised care.<br title="b11" />
                        <br title="b11" /><a
                          class="TPbtn TPbtn-primary TPbtn-2 TPbtn-2left"
                          href="#"
                          title="Photo Gallery D.D.S."
                        >View our smile results</a
                        >
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              `
        || props.name === 'logo-and-socials-1' && html`
                  <style>
                    ${`.${props.name} .TPfooter-logo { max-width: 350px; max-height: 100px; margin:0 auto; } .${props.name} .TPsocial-media { text-align: center; padding-top:25px; } @media (max-width:767px){ .${props.name} .TPsocial-media { padding-top:0 ;} } .${props.name} .TPsm-fill .fa { background: #e8e8e8; color: #aaa; }`}
                  </style>
                  <div class="TPbw TPBandCol">
                    <div>
                      <div class="TProw">
                        <div
                          class="TPcol-sm-7 TPcol-md-6 TPcol-md-offset-1 TPcol-lg-4 TPcol-lg-offset-2"
                        >
                          <a href="#" target="_blank"
                            ><img
                              class="TPimg-responsive TPfooter-logo"
                              src="https://fpoimg.com/337x98?text=Large Logo Image"
                              border="0"
                              alt="Smile Craft Dental in Redwood City, CA"
                              title="Smile Craft Dental in Redwood City, CA"
                          /></a>
                        </div>
                        <br class="TPvisible-xs" />
                        <div class="TPcol-sm-5 TPcol-md-4 TPcol-lg-4 TPsocial-media">
                          <a
                            class="TPsm TPsm-circle TPsm-fill TPsm-color-hover"
                            href="#"
                            target="_blank"
                            ><i class="fa fa-facebook-f"></i
                          ></a>
                          <a
                            class="TPsm TPsm-circle TPsm-fill TPsm-color-hover"
                            href="#"
                            target="_blank"
                            ><i class="fa fa-google"></i
                          ></a>
                          <a
                            class="TPsm TPsm-circle TPsm-fill TPsm-color-hover"
                            href="#"
                            target="_blank"
                            ><i class="fa fa-instagram"></i
                          ></a>
                          <a
                            class="TPsm TPsm-circle TPsm-fill TPsm-color-hover"
                            href="#"
                            target="_blank"
                            ><i class="fa fa-yelp"></i
                          ></a>
                          <a
                            class="TPsm TPsm-circle TPsm-fill TPsm-color-hover"
                            href="#"
                            target="_blank"
                            ><i class="fa fa-yelp"></i
                          ></a>
                        </div>
                        <div class="TPhidden-sm TPcol-md-1 TPcol-lg-2"></div>
                      </div>
                    </div>
                  </div>
                `
        || props.name === 'specials-1' && html`
          <style>
            ${`.${props.name} .TPcard { background: #fafafa; color: #616161; transition: box-shadow 135ms 0ms cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 1px 1px 0 rgba(66, 66, 66, 0.08), 0 1px 3px 1px rgba(66, 66, 66, 0.16); transition: width 235ms 0ms cubic-bezier(0.4, 0, 0.2, 1); border-radius: 3px; z-index: 1; padding: 10px; margin: 60px auto; border-radius: 20px; max-width: 300px; } .${props.name} .TPcard-border { border: 2px dotted #dbdbdb; padding: 20px; border-radius: 20px 20px 0 0; } .${props.name} .TPamount { height: 100px; width: 100px; margin: 10px auto 0; -webkit-border-radius: 50px; -moz-border-radius: 50px; border-radius: 50px; color: #fafafa; border: 2px solid #dbdbdb; background: #cacaca; padding: 30px 0; line-height: 1.2; font-weight: 700; font-size: 36px; position: relative; } .${props.name} .TPdollar { font-size: 20px; padding-top: 0px; position: absolute; left: 16px; } .${props.name} .TPtext-sub { font-size: 18px; } .${props.name} .TPvalid { font-size: 14px; line-height: 1.2; padding: 10px; }`}
          </style>
                  <div class="TPbw TPBandCol">
                    <div>
                      <div class="TProw">
                        <div class="TPcol-xs-12 TPtext-center">
                          <div
                            data-aos="fade-up"
                            data-aos-delay="600"
                            data-aos-duration="800"
                            class="aos-init aos-animate"
                          >
                            <h2>Now Offering New Patient Specials!</h2>
                            <br title="b11" />
                            <hr />
                            <span class="TParticle"
                              >We want your visits to be efficient and gentle.<br title="b11" />We
                              are dedicated to being your dentist.</span
                            >
                          </div>
                        </div>
                      </div>
                      <br title="b11" />
                      <div class="TProw">
                        <div class="TPcol-md-4 TPtext-center">
                          <div
                            data-aos="fade-up"
                            data-aos-delay="800"
                            data-aos-duration="800"
                            class="aos-init aos-animate"
                          >
                            <div class="TPcard">
                              <div class="TPcard-border">
                                <h3 class="TPtext-color2">
                                  Adult's<br title="b11" />Complete Checkup
                                </h3>
                                <br title="b11" />
                                <hr />
                                <div class="TPamount">
                                  <span class="TPdollar">$</span> <span>88</span>
                                </div>
                                <br title="b11" />
                                <div class="TPtext-sub">
                                  Includes exam and cleaning for healthy patients.
                                </div>
                                <br title="b11" /><a class="TPbtn TPbtn-primary"
                                  >Request an appointment</a
                                >
                                <br title="b11" />
                              </div>
                              <br title="b11" />
                              <div class="TPvalid">
                                Limited time offer.<br title="b11" />For new patients only.
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="TPcol-md-4 TPtext-center">
                          <div
                            data-aos="fade-up"
                            data-aos-delay="1000"
                            data-aos-duration="800"
                            class="aos-init aos-animate"
                          >
                            <div class="TPcard">
                              <div class="TPcard-border">
                                <h3 class="TPtext-color2">Emergency<br title="b11" />Exam</h3>
                                <br title="b11" />
                                <hr />
                                <div class="TPamount">
                                  <span class="TPdollar">$</span> <span>29</span>
                                </div>
                                <br title="b11" />
                                <div class="TPtext-sub">Includes exam with complete X-rays.</div>
                                <br title="b11" /><a class="TPbtn TPbtn-primary"
                                  >Request an appointment</a>
                                <br title="b11" />
                              </div>
                              <br title="b11" />
                              <div class="TPvalid">
                                Cleaning not included. Limited time offer. For new patients only.
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="TPcol-md-4 TPtext-center">
                          <div
                            data-aos="fade-up"
                            data-aos-delay="1200"
                            data-aos-duration="800"
                            class="aos-init aos-animate"
                          >
                            <div class="TPcard">
                              <div class="TPcard-border">
                                <h3 class="TPtext-color2">
                                  Implant<br title="b11" />Consultation
                                </h3>
                                <br title="b11" />
                                <hr />
                                <div class="TPamount">
                                  <span class="TPdollar"></span> <span>FREE</span>
                                </div>
                                <br title="b11" />
                                <div class="TPtext-sub">
                                  Includes consultation and panoramic radiograph.
                                </div>
                                <br title="b11" /><a class="TPbtn TPbtn-primary"
                                  >Request an appointment</a
                                >
                                <br title="b11" />
                              </div>
                              <br title="b11" />
                              <div class="TPvalid">
                                Limited time offer.<br title="b11" />For new patients only.
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                `
        || props.name === 'specials-2' && html`
                  <div class="TPbw TPBandCol">
                    <div>
                      <table
                        width="100%"
                        class="TPartBox"
                        border="0"
                        cellspacing="0"
                        cellpadding="0"
                      >
                        <tbody>
                          <tr valign="top">
                            <td id="" class="TParticle">
                              <div class="TProw">
                                <div class="TPcol-md-6">
                                  <div
                                    data-aos="fade-right"
                                    data-aos-duration="1000"
                                    class="aos-init aos-animate"
                                  >
                                    <h1 class="H1">
                                      Welcome to our Dental Office<br title="b11" /><span
                                        class="TPsubtitle"
                                        >Your Dentist, in your location
                                      </span>
                                    </h1>
                                  </div>
                                  <br title="b11" />Lorem ipsum dolor sit amet, consectetur
                                  adipisicing elit, sed do eiusmod tempor incididunt ut labore et
                                  dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                                  exercitation ullamco laboris nisi ut aliquip.Lorem ipsum dolor
                                  sit amet, consectetur adipisicing elit, sed do eiusmod tempor
                                  incididunt ut labore et dolore.
                                </div>
                                <div class="TPcol-md-6 TPtext-center">
                                  <div class="TPspecial-contain TPtext-center">
                                    <h2 class="H2">$79 Exam And Cone Beam Scan</h2>
                                    <hr />
                                    <h4 class="H4">Normally A $379 Value</h4>
                                    <br title="b11" />
                                    <br title="b11" /><a
                                      class="TPbtn TPbtn-primary TPbtn-default TPbtn-5"
                                      href="#"
                                      title="Contact Us Bruce Gopin, DDS, MS Periodontics + Implant Surgery El Paso, TX"
                                      >Contact Us</a
                                    >
                                    <br title="b11" />
                                    <h4 class="H4">or</h4>
                                    <br title="b11" /><a
                                      class="TParticle"
                                      href="tel:/555-555-5555"
                                      ><h3 class="H3">Call: 555-555-5555</h3></a
                                    >
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                `
        || props.name === 'associations-1' && html`
                  <style>
                    ${`.${props.name} .TPassociations { text-align: center; margin-top: 25px; } .${props.name} .TPassociations svg { width: 150px; height: auto; vertical-align: middle; padding: 5px 15px; color: #68686b; }`}
                  </style>
                  <div class="TPbw TPBandCol TPart4Col">
                    <table
                      width="100%"
                      class="TPartBox TPartBox4"
                      border="0"
                      cellspacing="0"
                      cellpadding="0"
                    >
                      <tbody>
                        <tr valign="top">
                          <td id="ArtID4" class="TParticle">
                            <div class="TProw">
                              <div style="">
                                <div
                                  class="TPcol-xs-12 TPcol-sm-10 TPcol-sm-offset-1 TPassociations"
                                >
                                  <svg
                                    id="TPsvg-AAO_American_Association_of_Orthodontists"
                                    class="TPsvg"
                                    style="fill: currentColor"
                                    enable-background="new 0 0 200 69.6"
                                    height="69.6"
                                    viewBox="0 0 200 69.6"
                                    width="200"
                                    xmlns="http://www.w3.org/2000/svg"
                                    aria-labelledby="TPsvg-AAO_American_Association_of_Orthodontists-title"
                                    role="img"
                                  >
                                    <title
                                      id="TPsvg-AAO_American_Association_of_Orthodontists-title"
                                    >
                                      American Association of Orthodontists logo
                                    </title>
                                    <path
                                      d="m72.2 46.4c-20.8 17.8-51.4 17.8-72.2 0v16.5c0 3.7 3 6.6 6.6 6.6h58.9c3.7 0 6.6-3 6.6-6.6v-16.5z"
                                    ></path>
                                    <path
                                      d="m59.5 42.1c-3 0-5.9-.9-8.4-2.5l-6.8-15.9c1.6-8.4 9.7-14 18.1-12.4 4 .7 7.6 3 9.9 6.4v-11c0-3.7-3-6.6-6.6-6.6h-59.1c-3.6-.1-6.6 2.9-6.6 6.5v20.7l6.1-15.1h6l12.3 29.8h-5.8l-2.6-6.5h-14l-2 5c20 19.8 52.2 19.8 72.1 0v-4.9c-2.8 4.1-7.6 6.5-12.6 6.5zm-16.5 0-2.6-6.6h-13l-1.4 3.6-3-7.3 8-19.5h6l12.3 29.8z"
                                    ></path>
                                    <path d="m29.3 30.4 4.3-11.9 4.6 11.9z"></path>
                                    <path d="m4.5 30.4 4.3-11.9 4.7 11.9z"></path>
                                    <path
                                      d="m59.5 36.3c-5.4 0-9.7-4.4-9.7-9.7s4.4-9.7 9.7-9.7c5.4 0 9.7 4.4 9.7 9.7.1 5.4-4.3 9.7-9.7 9.7z"
                                    ></path>
                                    <path
                                      d="m93.4 7.6h2.9l3.6 15.2h-2.3l-.7-3.4h-4.3l-.7 3.4h-2.1zm-.4 10h3.6l-1.8-8.2z"
                                    ></path>
                                    <path
                                      d="m101.6 12.2h2.1v1c.6-.7 1.5-1.1 2.4-1.1.7 0 1.4.2 2 .7.2.2.4.4.5.7l.1-.1c.8-.9 1.7-1.3 2.5-1.3.8-.1 1.5.2 2.1.7.5.5.8 1.3.7 2v8h-2v-7.6c0-.5-.1-.9-.4-1.3-.3-.3-.6-.5-1-.4-.5 0-1 .2-1.3.6-.3.5-.4 1.1-.4 1.8v7h-2.1v-7.6c0-.5-.1-.9-.4-1.3-.3-.3-.7-.5-1.1-.4-.5 0-1 .2-1.3.6-.3.5-.5 1.1-.4 1.8v7h-2.1z"
                                    ></path>
                                    <path
                                      d="m119.3 23c-1.3 0-2.3-.3-2.8-.9s-.8-1.7-.8-3.2v-3.1c0-1.3.3-2.3.9-2.9s1.5-1 2.7-1c1.3 0 2.2.3 2.8.9s.9 1.6.9 2.9v2.3h-5.2v.8c0 1 .1 1.7.3 2.1.2.3.6.5 1.2.5.4 0 .9-.1 1.2-.4s.4-.8.4-1.2v-.3h2v.3c.1 1-.2 1.8-.8 2.3-.6.7-1.5.9-2.8.9zm1.6-6.3v-.9c0-.9-.1-1.5-.3-1.9-.3-.4-.7-.6-1.2-.5-.5-.1-.9.2-1.2.6-.3.6-.4 1.2-.4 1.8v.8z"
                                    ></path>
                                    <path
                                      d="m124.9 12.2h2.1v1.3l.3-.4c.6-.7 1.4-1.1 2.3-1.1v2c-1 0-1.6.2-2 .7s-.6 1.2-.6 2.4v5.8h-2v-10.7z"
                                    ></path>
                                    <path d="m131.2 7.6h2.2v2h-2.2zm0 4.6h2.1v10.6h-2.1z"></path>
                                    <path
                                      d="m142.3 19.5v.3c0 1.1-.2 1.9-.8 2.4-.5.5-1.4.8-2.6.8s-2.1-.3-2.7-.8c-.6-.6-.8-1.5-.8-2.7v-3.6c0-1.4.3-2.4.8-3s1.4-.9 2.7-.9c1.1 0 2 .3 2.5.8s.8 1.2.7 2.2v.5h-2.1v-.2c.1-.5 0-.9-.2-1.3-.2-.3-.6-.4-.9-.4-.4 0-.8.1-1.1.4-.3.5-.4 1-.3 1.6v3.9c0 .6.1 1.2.3 1.7.3.4.7.5 1.1.5s.8-.1 1-.4c.2-.4.3-.9.3-1.3v-.4h2.1z"
                                    ></path>
                                    <path
                                      d="m146.9 23c-.7.1-1.4-.2-1.9-.8s-.7-1.4-.6-2.2c0-1.4.4-2.4 1.1-2.9s2-.8 3.8-.8h.2v-1.3c0-.4-.1-.8-.4-1.2-.3-.3-.6-.4-1-.4s-.8.1-1.1.4c-.3.4-.4.8-.4 1.3h-2c-.1-.9.2-1.7.9-2.4.7-.6 1.7-.9 2.6-.8 1.2 0 2.1.3 2.6.8.6.5.8 1.3.8 2.4v7.6h-2.1v-1.1l-.2.4c-.4.7-1.2 1-2.3 1zm2.5-5.2h-.4c-.7 0-1.4.1-1.9.6-.4.4-.7 1-.6 1.6 0 .4.1.8.3 1.2.2.3.6.4 1 .4.5 0 1.1-.3 1.4-.7.3-.6.5-1.4.4-2.1v-1z"
                                    ></path>
                                    <path
                                      d="m153.7 12.2h2.1v.9c.6-.7 1.5-1 2.4-1 .7 0 1.4.2 2 .7.5.5.7 1.2.7 1.9v8.2h-2v-7.6c0-.5-.1-.9-.4-1.3-.3-.3-.7-.5-1.1-.4-.5 0-1 .2-1.3.6-.3.5-.4 1.1-.4 1.7v7h-2.1z"
                                    ></path>
                                    <path
                                      d="m93.4 27h2.9l3.6 15.2h-2.3l-.7-3.4h-4.3l-.7 3.4h-2.1zm-.4 10h3.6l-1.8-8.2z"
                                    ></path>
                                    <path
                                      d="m106.2 34.6v-.3c.1-.4 0-.8-.2-1.2-.2-.3-.6-.4-.9-.4s-.6.1-.9.3c-.2.2-.3.5-.3.8s.1.6.3.9c.4.4.9.7 1.4 1 .8.5 1.6 1.1 2.3 1.8.4.4.6 1 .6 1.6.1.9-.3 1.7-.9 2.3-.7.6-1.6.9-2.6.8-1.2 0-2.1-.3-2.6-.8-.6-.6-.9-1.4-.8-2.2v-.2h2v.3c-.1.4.1.9.3 1.2.3.3.7.4 1.1.4s.8-.1 1.1-.3c.3-.3.4-.6.4-1s-.1-.8-.4-1c-.5-.5-1-.9-1.6-1.2-.8-.5-1.5-1-2.1-1.7-.3-.4-.5-1-.5-1.6 0-.8.3-1.5.8-2 .7-.5 1.5-.8 2.4-.7 1.1 0 2 .2 2.5.7s.7 1.2.7 2.1v.5h-2.1z"
                                    ></path>
                                    <path
                                      d="m114.7 34.6v-.3c.1-.4 0-.8-.2-1.2-.2-.3-.6-.4-.9-.4s-.6.1-.9.3c-.2.2-.3.5-.3.8s.1.6.3.9c.4.4.9.7 1.4 1 .8.5 1.6 1.1 2.3 1.8.4.4.6 1 .6 1.6.1.9-.3 1.7-.9 2.3-.7.6-1.6.9-2.6.8-1.2 0-2.1-.3-2.6-.8-.6-.6-.9-1.4-.8-2.2v-.2h2v.3c-.1.4.1.9.3 1.2.3.3.7.4 1.1.4s.8-.1 1.1-.3c.3-.3.4-.6.4-1s-.1-.8-.4-1c-.5-.5-1-.9-1.6-1.2-.8-.5-1.5-1-2.1-1.7-.3-.4-.5-1-.5-1.6 0-.8.3-1.5.8-2 .7-.5 1.5-.8 2.4-.7 1.1 0 2 .2 2.5.7s.7 1.2.7 2.1v.5h-2.1z"
                                    ></path>
                                    <path
                                      d="m119.7 41.4c-.6-.6-.9-1.7-.9-3.1v-3c0-1.2.3-2.2.9-2.8.7-.7 1.7-1.1 2.6-1 1.3 0 2.2.3 2.7.9.6.6.9 1.6.9 2.9v3.1c0 1.4-.3 2.5-.8 3.1-.6.6-1.5 1-2.8 1-1.1-.1-2-.4-2.6-1.1zm3.9-1.1c.3-.6.4-1.2.4-1.8v-3.1c0-.7-.1-1.3-.4-2-.4-.6-1.3-.8-1.9-.4-.1.1-.3.2-.4.4-.3.6-.4 1.3-.4 1.9v3.1c0 .9.1 1.6.3 2 .3.4.7.6 1.2.5.5.1 1-.2 1.2-.6z"
                                    ></path>
                                    <path
                                      d="m135.1 38.8v.3c0 1.1-.2 1.9-.8 2.4-.5.5-1.4.8-2.6.8s-2.1-.3-2.7-.8-.8-1.5-.8-2.7v-3.6c0-1.4.3-2.4.8-3s1.4-.9 2.7-.9c1.1 0 2 .3 2.5.8s.8 1.2.7 2.2v.6h-2.1v-.3c.1-.5 0-.9-.2-1.3-.2-.3-.6-.4-.9-.4-.4 0-.8.1-1.1.4-.3.5-.4 1-.3 1.6v3.9c0 .6.1 1.2.3 1.7.3.4.7.5 1.1.5s.8-.1 1-.4c.2-.4.3-.9.3-1.3v-.4h2.1z"
                                    ></path>
                                    <path d="m137.1 27h2.2v2h-2.2zm.1 4.6h2.1v10.5h-2.1z"></path>
                                    <path
                                      d="m143.9 42.4c-.7.1-1.4-.2-1.9-.8s-.7-1.4-.6-2.2c0-1.4.4-2.4 1.1-2.9s2-.8 3.8-.8h.3v-1.2c0-.4-.1-.8-.4-1.2-.3-.3-.6-.4-1-.4s-.8.1-1.1.4c-.3.4-.4.8-.4 1.3h-2c-.1-.9.2-1.7.9-2.4.7-.6 1.7-.9 2.6-.8 1.2 0 2.1.3 2.6.8s.8 1.3.8 2.4v7.6h-2.1v-1.1l-.2.4c-.5.6-1.3.9-2.4.9zm2.6-5.3h-.5c-.7 0-1.4.1-1.9.6-.4.4-.7 1-.6 1.6 0 .4.1.8.3 1.2.2.3.6.4 1 .4.5 0 1.1-.3 1.4-.7.3-.6.5-1.4.4-2.1v-1z"
                                    ></path>
                                    <path
                                      d="m155.5 42.2c-.4.1-.9.2-1.3.2-.9 0-1.5-.2-1.9-.5s-.6-.9-.6-1.7v-7.2h-1.4v-1.5h1.4v-1.9l2.1-.8v2.7h1.6v1.5h-1.6v6.8c0 .3.1.6.4.8.4.2.8.3 1.3.2z"
                                    ></path>
                                    <path d="m157.5 27h2.2v2h-2.2zm.1 4.6h2.1v10.5h-2.1z"></path>
                                    <path
                                      d="m162.7 41.4c-.6-.6-.9-1.7-.9-3.1v-3c0-1.2.3-2.2.9-2.8.7-.7 1.7-1.1 2.6-1 1.3 0 2.2.3 2.7.9.6.6.9 1.6.9 2.9v3.1c0 1.4-.3 2.5-.8 3.1-.6.6-1.5 1-2.8 1-1.1-.1-2-.4-2.6-1.1zm3.9-1.1c.3-.6.4-1.2.4-1.8v-3.1c0-.7-.1-1.3-.4-2-.4-.6-1.3-.8-1.9-.4-.1.1-.3.2-.4.4-.3.6-.4 1.3-.4 1.9v3.1c0 .9.1 1.6.3 2 .3.4.7.6 1.2.5.5.1.9-.2 1.2-.6z"
                                    ></path>
                                    <path
                                      d="m171.2 31.6h2v.8c.6-.7 1.5-1 2.4-1 .7 0 1.4.2 2 .7.5.5.7 1.2.7 1.9v8.2h-2v-7.6c0-.5-.1-.9-.4-1.3-.3-.3-.7-.5-1.1-.4-.5 0-1 .2-1.3.6-.3.5-.4 1.1-.4 1.7v7h-2.1z"
                                    ></path>
                                    <path
                                      d="m186.5 41.4c-.6-.6-.9-1.7-.9-3.1v-3c0-1.2.3-2.2.9-2.8.7-.7 1.7-1.1 2.6-1 1.3 0 2.2.3 2.7.9.6.6.9 1.6.9 2.9v3.1c0 1.4-.3 2.5-.8 3.1-.6.6-1.5 1-2.8 1-1.1-.1-2-.4-2.6-1.1zm3.9-1.1c.3-.6.4-1.2.4-1.8v-3.1c0-.7-.1-1.3-.4-2-.4-.6-1.3-.8-1.9-.4-.1.1-.3.2-.4.4-.3.6-.4 1.3-.4 1.9v3.1c0 .9.1 1.6.3 2 .3.4.7.6 1.2.5.5.1.9-.2 1.2-.6z"
                                    ></path>
                                    <path
                                      d="m198.2 33v9.1h-2.1v-9.1h-1.5v-1.4h1.5v-2c0-1 .2-1.7.6-2.1s1-.6 1.8-.6c.5 0 1 0 1.5.1v1.4h-.6c-.3 0-.7.1-.9.3-.2.3-.3.6-.3 1v2h1.8v1.3z"
                                    ></path>
                                    <path
                                      d="m91.3 60.3c-.6-.7-1-2.1-1-4v-5.6c0-1.7.4-2.9 1.1-3.7.7-.7 1.9-1.1 3.5-1.1s2.8.4 3.5 1.1 1 2 1 3.8v6.4c0 1.5-.4 2.6-1.1 3.3s-1.9 1-3.5 1c-1.7-.1-2.9-.4-3.5-1.2zm5.3-1.3c.4-.5.6-1.2.6-2.3v-6.4c0-1-.2-1.8-.5-2.2s-1-.6-1.8-.6c-.7-.1-1.4.2-1.8.8-.4.5-.6 1.3-.6 2.4v5.6c0 1.3.2 2.2.5 2.6s1 .7 1.8.7c.7.2 1.4-.1 1.8-.6z"
                                    ></path>
                                    <path
                                      d="m101.9 50.7h2.1v1.3l.3-.4c.6-.7 1.4-1.1 2.3-1.1v2c-1 0-1.6.2-2 .7s-.6 1.2-.6 2.4v5.8h-2.1z"
                                    ></path>
                                    <path
                                      d="m113 61.3c-.4.1-.9.2-1.3.2-.9 0-1.5-.2-1.9-.5s-.6-.9-.6-1.7v-7.1h-1.4v-1.4h1.4v-1.9l2.1-.8v2.7h1.6v1.4h-1.6v6.8c0 .3.1.6.4.8.4.2.8.3 1.3.2z"
                                    ></path>
                                    <path
                                      d="m115.1 46.1h2.1v5.6c.6-.7 1.4-1.1 2.4-1.1.7 0 1.4.2 2 .7.5.5.7 1.2.7 1.9v8.2h-2v-7.7c0-.5-.1-.9-.4-1.3-.3-.3-.6-.5-1-.4-.5 0-.9.2-1.2.6-.3.5-.4 1.1-.4 1.8v7h-2.1v-15.3z"
                                    ></path>
                                    <path
                                      d="m125.2 60.5c-.6-.6-.9-1.7-.9-3.1v-3.1c0-1.2.3-2.2.9-2.8.7-.7 1.7-1.1 2.6-1 1.3 0 2.2.3 2.7.9s.9 1.6.9 2.9v3.1c0 1.4-.3 2.5-.8 3.1-.6.6-1.5 1-2.8 1-1.1 0-2-.3-2.6-1zm3.9-1.1c.3-.6.4-1.2.4-1.8v-3.1c0-.7-.1-1.3-.4-2-.4-.6-1.3-.8-1.9-.4-.1.1-.3.2-.4.4-.3.6-.4 1.3-.4 1.9v3.1c0 .9.1 1.6.3 2 .3.4.7.6 1.2.5.5.1 1-.2 1.2-.6z"
                                    ></path>
                                    <path
                                      d="m136.7 61.5c-1 0-1.8-.3-2.2-.9s-.7-1.5-.7-2.7v-3.4c0-1.4.2-2.4.7-3.1s1.3-1.1 2.2-1c.8 0 1.6.3 2.2.9v-5.3h2.1v15.2h-2.1v-.9c-.6.8-1.4 1.2-2.2 1.2zm.6-9.5c-.4 0-.9.1-1.2.5-.3.5-.4 1.1-.4 1.7v3.8c0 .8.1 1.3.3 1.6s.6.4 1.1.4c.5.1 1-.2 1.3-.6.2-.4.4-1.1.4-2.2v-3.2c.1-.5 0-1-.3-1.5-.3-.3-.7-.5-1.2-.5z"
                                    ></path>
                                    <path
                                      d="m144 60.5c-.6-.6-.9-1.7-.9-3.1v-3.1c0-1.2.3-2.2.9-2.8.7-.7 1.7-1.1 2.6-1 1.3 0 2.2.3 2.7.9.6.6.9 1.6.9 2.9v3.1c0 1.4-.3 2.5-.8 3.1s-1.5 1-2.8 1c-1.2 0-2.1-.3-2.6-1zm3.9-1.1c.3-.6.4-1.2.4-1.8v-3.1c0-.7-.1-1.3-.4-2-.4-.6-1.3-.8-1.9-.4-.1.1-.3.2-.4.4-.3.6-.4 1.3-.4 1.9v3.1c0 .9.1 1.6.3 2 .3.4.7.6 1.2.5.5.1.9-.2 1.2-.6z"
                                    ></path>
                                    <path
                                      d="m152.5 50.7h2.1v.9c.6-.7 1.5-1 2.4-1 .7 0 1.4.2 2 .7.5.5.7 1.2.7 1.9v8.2h-2v-7.6c0-.5-.1-.9-.4-1.3-.3-.3-.7-.5-1.1-.4-.5 0-1 .2-1.3.6-.3.5-.4 1.1-.4 1.7v7h-2.1v-10.7z"
                                    ></path>
                                    <path
                                      d="m166.6 61.3c-.4.1-.9.2-1.3.2-.9 0-1.5-.2-1.9-.5s-.6-.9-.6-1.7v-7.1h-1.4v-1.4h1.4v-1.9l2.1-.8v2.7h1.6v1.4h-1.6v6.8c0 .3.1.6.4.8.4.2.8.3 1.3.2z"
                                    ></path>
                                    <path d="m168.6 46.1h2.2v2h-2.2zm0 4.6h2.1v10.5h-2.1z"></path>
                                    <path
                                      d="m177.3 53.8v-.3c.1-.4 0-.8-.2-1.2-.2-.3-.6-.4-.9-.4s-.6.1-.9.3c-.2.2-.3.5-.3.8s.1.6.3.9c.4.4.9.7 1.4 1 .8.5 1.6 1.1 2.3 1.8.4.4.6 1 .6 1.6.1.9-.3 1.7-.9 2.3-.7.6-1.6.9-2.6.8-1.2 0-2.1-.3-2.6-.8-.6-.6-.9-1.4-.8-2.2v-.5h2v.3c-.1.4.1.9.3 1.2.3.3.7.4 1.1.4s.8-.1 1.1-.3c.3-.3.4-.6.4-1s-.1-.8-.4-1c-.5-.5-1-.9-1.6-1.2-.8-.5-1.5-1-2.1-1.7-.3-.4-.5-1-.5-1.6 0-.8.3-1.5.8-2 .7-.5 1.5-.8 2.4-.7 1.1 0 2 .2 2.5.7s.7 1.2.7 2.1v.5z"
                                    ></path>
                                    <path
                                      d="m186.1 61.3c-.4.1-.9.2-1.3.2-.9 0-1.5-.2-1.9-.5s-.6-.9-.6-1.7v-7.1h-1.4v-1.4h1.5v-1.9l2.1-.8v2.7h1.6v1.4h-1.6v6.8c0 .3.1.6.4.8.4.2.8.3 1.3.2z"
                                    ></path>
                                    <path
                                      d="m192.6 53.8v-.3c.1-.4 0-.8-.2-1.2-.2-.3-.6-.4-.9-.4s-.6.1-.9.3c-.2.2-.3.5-.3.8s.1.6.3.9c.4.4.9.7 1.4 1 .8.5 1.6 1.1 2.3 1.8.4.4.6 1 .6 1.6.1.9-.3 1.7-.9 2.3-.7.6-1.6.9-2.6.8-1.2 0-2.1-.3-2.6-.8-.6-.6-.9-1.4-.8-2.2v-.5h2v.3c-.1.4.1.9.3 1.2.3.3.7.4 1.1.4s.8-.1 1.1-.3c.3-.3.4-.6.4-1s-.1-.8-.4-1c-.5-.5-1-.9-1.6-1.2-.8-.5-1.5-1-2.1-1.7-.3-.4-.5-1-.5-1.6 0-.8.3-1.5.8-2 .7-.5 1.5-.8 2.4-.7 1.1 0 2 .2 2.5.7s.7 1.2.7 2.1v.5z"
                                    ></path>
                                  </svg>
                                  <svg
                                    id="TPsvg-ABO_American_Board_of_Orthodontics"
                                    class="TPsvg"
                                    style="fill: currentColor"
                                    enable-background="new 0 0 200 169.6"
                                    height="169.6"
                                    viewBox="0 0 200 169.6"
                                    width="200"
                                    xmlns="http://www.w3.org/2000/svg"
                                    aria-labelledby="TPsvg-ABO_American_Board_of_Orthodontics-title"
                                    role="img"
                                  >
                                    <title id="TPsvg-ABO_American_Board_of_Orthodontics-title">
                                      American Board of Orthodontics logo
                                    </title>
                                    <path
                                      d="m96.5 169.6c-1.1-.6-2.3-.4-3.4-.4-37.3-3.2-68-30.3-75.5-66.8-9.4-45.3 19.8-89.9 65.1-99.4 45-9.5 89.8 19.5 99.4 64.4 9.8 45.7-19.1 90.5-64.9 100.2-4.5 1-9 1.5-13.6 1.7-.3 0-.6-.2-.8.3-.2 0-.4 0-.5 0-1.8-.4-3.5-.4-5.3 0-.1 0-.3 0-.5 0zm84.2-84.3c0-44.5-36.2-80.6-80.7-80.7-44.5 0-80.8 36.2-80.8 80.7s36.1 80.6 80.7 80.7c44.5.1 80.8-36.2 80.8-80.7z"
                                    ></path>
                                    <path
                                      d="m152.8 0c2.2.6 4.2 1.6 5.7 3.4 1 1.2 1.5 2.6 2.1 4 2.5-1.1 4.2.2 5.9 1.7 1.6 1.5 2.4 3.5 2.8 5.7 2.7-.8 4.3.8 5.7 2.6 1.3 1.6 1.7 3.6 1.9 5.8 2-.5 3.3.6 4.4 2 1.6 2 2.2 4.4 1.9 6.9 4 .5 5.4 3.2 5.3 9.7 2.5.5 4.1 2.5 4.5 5.5.2 1.6 0 3.2-.5 4.7 3 1.2 4.5 4.3 3.8 7.9-.2.9-.5 1.9-.8 2.8 2 .4 2.6 2 3 3.7.6 2.5-.1 4.8-1.3 6.9 3.4 2 3.6 5.8.7 10.9 2.9 1.7 3 7-.6 10.9 2.7 2 2.4 7.3-1.8 10.9 2.6 2.8 1.6 6.3-2.8 10.6 2.3 3 .8 6.7-4 10.1 1.9 2.6 0 7.7-5.2 9.7 1.4 3.9-.8 7-6.3 9.1.6 3.5-1.7 6.9-5.6 7.9-1.6.4-3.3.5-5 .5-1.8 0-3.3.4-4.7 1.7-3.7 3.2-7.7 6-11.9 8.5-.5.3-1 .8-1.5.1-.4-.7.2-1 .7-1.3 2.8-1.7 5.4-3.5 8-5.3 1.6-1.1 2.3-2.5 2.5-4.3.2-1.6.4-3.1.8-4.7.5-1.9 1.5-3.5 3-4.7 1.1-.9 2.3-1.4 3.8-.9.7-3.7 1.3-7.5 6.3-8.2 0-1.6 0-3.5.9-5.2s2-3.2 4.2-3.2c-.3-3.8-.4-7.5 4.1-9.2-.5-1.7-.8-3.5-.3-5.3s1.3-3.4 3.4-3.8c-1.7-5.5-1.1-8.2 2-9.7-.8-1.6-1.6-3.3-1.5-5.2s.5-3.6 2.5-4.5c-2-3.3-3.4-6.6-.2-10-3.4-3.9-3.3-7.9-1-9.7-3.7-3.8-4.4-7.1-2.1-9.6-1.5-1.1-2.9-2.3-3.6-4.1s-1-3.6.4-5.3c-1.7-.9-3.1-2-4-3.7s-1.5-3.4-.3-5.2c-5-2.9-6.4-5.1-5.3-8.5-5.3-2.2-7.1-4.5-6.2-7.8-5.6-1.5-7.9-3.7-7.4-7.2-2 0-3.9-.4-5.6-1.5-.8-.5-1.5-1.1-2-1.9-1.4-2-.8-4 1.6-4.7.4-.1.8-.2 1.4-.3-1-1.1-1.9-1.9-2.7-3-.6-.8-1-1.7-1.3-2.7-.3-1.6.1-2.4 1.8-3.5.1 0 .3 0 .4 0zm23.5 31.8c.1.2.3.1.5.1-.1-.1-.1-.2-.2-.3-1-1.7-2.3-3.3-3.5-4.9-1-1.4-2.4-1.6-3.9-1.5-1.2.1-1.7.8-1.3 2 .7 1.9 2.1 3.1 4 3.7 1.3.5 2.8.7 4.4.9zm-8.1-12.9c0-2.5-.2-4.9-1.4-7-.8-1.5-2-2.7-3.6-3.3-1.1-.4-1.8-.1-1.8.9-.1 1.6.2 3.2 1.3 4.3 1.6 1.8 3.5 3.3 5.5 5.1zm-8.2-7.3c-.4-2.7-.9-5.1-2.4-7.1-1.1-1.4-2.4-2.4-4.2-2.9-1.3-.3-1.8.2-1.5 1.5.2 1 .7 1.8 1.3 2.6 1.8 2.4 4.3 4 6.8 5.9zm5.6 140.9c2.2 0 4.1.1 6-.6s3.3-2 4.1-3.9c.3-.8.4-1.7-.8-2-1.4-.3-3-.1-4 .9-1.8 1.7-3.4 3.7-5.3 5.6zm7.4-7.9c2-.1 3.7-.3 5.4-1.1 1.9-.8 3.2-2.3 3.9-4.2.4-1.3.1-2-1-2.1-1.5 0-3 .4-4 1.6-1.4 1.8-2.7 3.7-4.3 5.8zm2.2-117.6c.2-1.9.3-3.5 0-5.2-.4-2.3-1.5-4.2-3.5-5.5-.7-.4-1.6-.7-1.9.4-.4 1.6-.3 3.3.7 4.7 1.4 2 3.1 3.7 4.7 5.6zm4.1 109c2.2-.4 4.3-.9 6-2.2 1.4-1.1 2.3-2.5 2.6-4.3.2-.9 0-1.8-1.2-1.7-1.4.1-2.9.7-3.7 1.8-1.3 2-2.4 4.1-3.7 6.4zm1.9-100.1c.4-2 .8-3.6.6-5.4-.1-2.3-1-4.2-2.8-5.6-.7-.5-1.5-.8-1.9.3-.6 1.4-.7 3 0 4.3 1.1 2.2 2.6 4.2 4.1 6.4zm-18.4-20.1c-1.7-1.4-3.4-2.7-5.1-4.1-1.3-1.2-2.8-1.1-4.3-.6-1.3.4-1.6 1.2-.8 2.3 1.2 1.7 2.9 2.5 4.9 2.8 1.7.2 3.4-.1 5.3-.4zm21.7 111c1.8-.6 3.4-1.2 4.8-2.2 1.8-1.3 2.9-3.1 3-5.4 0-1.2-.6-1.6-1.7-1.3-1.2.4-2.5 1-3.1 2.1-1.1 2.1-2 4.4-3 6.8zm9.5-40.5c2-1.9 3.6-3.6 4.2-6 .4-1.5.4-3-.3-4.4-.4-.8-1-1.2-1.8-.6-1.1.9-2 2.1-2.1 3.5-.1 2.4 0 4.7 0 7.5zm-23.6-62.8c-1.6-1.7-3.1-3.1-4.4-4.6-1.2-1.3-2.6-1.5-4.2-1.2-1.3.2-1.7 1-1.1 2.2.8 1.7 2.3 2.6 4 3.2 1.8.4 3.6.5 5.7.4zm15.7 21.6c.3-1.2.7-2.4.9-3.6.5-2.2.3-4.3-1-6.2-.5-.8-1.1-1.8-2.1-1.5-1.1.3-1.1 1.4-1.3 2.4-.5 3.6 2.4 5.8 3.5 8.9zm7.3 51.5c1.6-1.2 3-2.4 4-3.9 1.1-1.8 1.5-3.7.9-5.7-.2-.8-.7-1.5-1.6-.9-1.3.7-2.3 1.9-2.6 3.3-.4 2.3-.5 4.6-.7 7.2zm-4.8 20.4c1.8-.8 3.3-1.5 4.5-2.7 1.6-1.5 2.4-3.4 2.3-5.6-.1-.9-.5-1.5-1.6-1.2-1.3.4-2.5 1.3-3 2.5-.9 2.2-1.4 4.5-2.2 7zm5.2-41.4c1.5-1.8 2.7-3.5 3.2-5.6.4-1.7.3-3.3-.6-4.9-.6-1.1-1.3-1.1-2.1-.2-.9 1-1.6 2.2-1.5 3.4.2 2.4.7 4.8 1 7.3zm-32.8 79c1.8-1.7 3.3-3.1 4.9-4.6 1.4-1.2 1.5-2.8 1.3-4.5-.2-1.3-.9-1.6-2.1-1-1.6.9-2.5 2.4-3.1 4.1-.5 1.9-.6 3.8-1 6zm28.7-99.6c.9-1.8 1.7-3.5 1.9-5.4.3-2-.2-3.9-1.6-5.5-.6-.7-1.3-.9-1.9 0-.9 1.3-1.3 2.8-.9 4.3.7 2.1 1.6 4.3 2.5 6.6zm1.9 51.9c1.8-1 3.4-2.1 4.6-3.7 1.1-1.5 1.6-3.2 1.3-5.1-.2-1.4-1-1.7-2.1-1-1 .6-2 1.5-2.3 2.6-.7 2.3-1 4.7-1.5 7.2zm.7-41.7c1.4-2.1 2.5-4.1 2.7-6.5.1-1.5-.2-3-1.1-4.3-.5-.7-1.1-1.1-1.8-.3-1 1.1-1.6 2.5-1.4 4 .3 2.3 1 4.6 1.6 7.1zm-10.2-24.4c-1.1-2.2-2.2-4-3.3-5.8-.4-.6-.8-1-1.5-1.2-1.1-.4-2.4-1.1-3.3 0-1 1.1 0 2.3.7 3.3 1.8 2.4 4.5 2.9 7.4 3.7zm4 9.4c.2-.5 0-.9-.2-1.3-.6-1.4-1.3-2.8-1.8-4.2-.5-1.5-1.7-2.2-3.1-2.6-1.6-.5-2.5.3-2.1 2s1.4 3 2.8 4c1.4.9 2.9 1.3 4.4 2.1zm3 9.6c.3-.5.1-1 0-1.4-.5-1.5-1-2.9-1.4-4.4-.2-.9-.7-1.5-1.4-2-.9-.6-2-1.4-3-.7-1.1.8-.6 2.1-.2 3.2 1.2 2.8 3.6 4 6 5.3zm-19.9 87c1.3-1.5 2.5-3.1 3.9-4.6 1.2-1.4 1.1-3 .7-4.6-.3-1.1-1.1-1.3-2-.7-1.3.9-2.1 2.2-2.5 3.8-.6 1.9-.5 3.9-.1 6.1zm6.3-8.1c1.4-1.8 2.4-3.5 3.5-5.2.6-.9.8-1.8.6-2.7-.2-1-.2-2.3-1.4-2.6-1.3-.3-1.9.9-2.4 1.9-1.4 2.7-.7 5.5-.3 8.6zm16.8-48.2c.1 0 .3-.1.4-.1 0-2 0-4 0-6.1 0-1.7-1-2.8-2.3-3.7-.8-.6-1.5-.3-1.9.7-.6 1.7-.3 3.3.5 4.8.8 1.7 2 3 3.3 4.4zm.2-10.1c.1-2.2-.2-4.2-.3-6.1-.1-1.7-1.2-2.8-2.6-3.6-1-.6-1.7-.2-2 .9-.2.7-.2 1.5 0 2.2.5 2.9 2.7 4.5 4.9 6.6zm-1.1-10.4c0-2.2-.6-3.9-.8-5.8-.2-1.3-.9-2.2-1.9-2.9-.7-.5-1.6-1.1-2.4-.5-.8.5-.7 1.5-.6 2.4.6 3.3 3 4.9 5.7 6.8zm-2.4 41.1c.5-2.2 1-4.2 1.5-6.1.5-1.7-.3-3.1-1.4-4.3-.8-.9-1.5-.7-2.1.3-.7 1.2-.8 2.5-.6 3.8.3 2.2 1.4 4.1 2.6 6.3zm2.3-10.1c.3-2.4.6-4.5.8-6.5.2-1.7-.7-2.9-2-3.9-.7-.6-1.4-.4-1.8.4-.5 1-.7 2.2-.5 3.3.4 2.5 1.9 4.4 3.5 6.7zm-5.9 19.5c1.1-1.7 1.5-3.6 2.3-5.4.7-1.6.2-3-.7-4.3-.8-1.3-1.7-1.2-2.5 0-1 1.5-1 3.2-.7 5 .3 1.5 1 3.1 1.6 4.7zm-4.1 9.2c.9-1.8 1.8-3.6 2.7-5.4.8-1.6.3-3.1-.5-4.5-.5-.9-1.3-.9-2.1-.1-.8.9-1.2 1.9-1.4 3.1-.4 2.4.5 4.6 1.3 6.9z"
                                    ></path>
                                    <path
                                      d="m47.1 0c2.5 1 3.1 2.4 1.8 5-.4.8-.9 1.5-1.5 2.2-.5.7-1.2 1.3-1.9 2 .5.1 1 .3 1.5.4 2.2.7 2.9 2.6 1.5 4.6-1.6 2.2-3.8 3.2-6.4 3.5-.4 0-.9.1-1.3.1.5 3.5-2 6-7.4 7.2.7 2-.1 3.6-1.4 5.1s-3 2.2-4.9 2.7c1.1 3.5-.6 6.3-5.3 8.5 1 1.8.7 3.5-.2 5.2s-2.3 2.8-4 3.7c1.8 3.4 1 5.8-3.2 9.5 1.5 1.4 1.5 3.2.9 5.1-.5 1.8-1.7 3.2-3.1 4.5 2.5 2.5 2.2 5.2-1.1 9.9 2.3 1.3 3 5.4-.1 9.8 2.5 1.3 3.5 5 1 9.8 3.2 2.1 3.7 4.3 2 9.7 3.2 1.1 4 3.5 3.1 9.3 3.4 1 4.4 3.2 4 9 3.6.7 4.8 2.7 5.2 8.5 3.6.3 4.8 1.9 6.2 8.1 1.7-.5 3 .2 4.2 1.4 2 1.9 2.7 4.4 3 7v.5c.1 2.8 1.2 4.9 3.7 6.4 2.4 1.5 4.7 3.2 7.1 4.6.5.3 1.2.5.7 1.3-.4.7-1 .2-1.5-.1-4.2-2.5-8.2-5.3-11.9-8.5-1.4-1.2-2.9-1.7-4.7-1.7-1.6 0-3.3 0-4.8-.5-2.2-.6-3.9-1.9-5.2-3.9-.8-1.2-1.2-2.5-.4-4.1-2.2-.6-4.1-1.4-5.4-3.2-1.3-1.7-2.3-3.6-1-5.9-2-.8-3.8-1.9-4.9-3.8s-1.9-3.8-.4-5.9c-4.9-3.4-6.4-7.2-4.1-10.2-4.5-4.2-5.4-7.8-2.8-10.6-4-4.3-4.6-8.4-1.7-10.8-1.4-1.6-2.5-3.3-2.7-5.4s-.2-4.2 2.1-5.5c-1.2-1.7-2.1-3.5-2.1-5.7 0-2.1.3-4.2 2.7-5.2-1-1.8-1.8-3.8-1.5-6 .3-2.1.8-4.1 3.2-4.8-1.7-6.1-.7-9.7 3-10.6-.6-2-.9-4.1-.2-6.2.7-2 1.7-3.8 4.2-4-.4-2.1-.4-4.2.5-6.1s2-3.7 4.7-3.6c-.1-2.1.1-4.2 1.3-6.1 1.2-1.8 2.4-3.4 5.1-3 .2-2.1.6-4.2 2-5.9s3-3.2 5.5-2.4c1.7-5.9 5.1-8.9 8.7-7.5.3-.6.5-1.3.8-1.9 1.4-2.7 3.4-4.6 6.5-5.3.1 0 .2-.2.3-.2.5 0 .5 0 .6 0zm-23.4 31.8c1.5-.2 3-.4 4.5-.9 1.8-.7 3.3-1.9 4-3.7.3-.9.2-1.6-.7-1.9-1.1-.4-3.3.1-4 .9-1.4 1.7-2.8 3.5-4 5.4-.1.1-.1.2-.2.3.1 0 .3.1.4-.1zm8.1-12.9c1.7-1.6 3.1-3 4.6-4.2 1.2-1 1.8-2.1 2.1-3.5.2-.9.6-2-.3-2.6-1-.7-1.9.1-2.7.7-3.3 2.4-3.6 5.8-3.7 9.6zm8.1-7.2c2.5-1.9 4.9-3.5 6.7-5.8.7-.9 1.3-1.8 1.5-2.9s-.3-1.5-1.3-1.3-1.9.7-2.7 1.3c-2.9 2-3.6 5.1-4.2 8.7zm-5.5 140.8c-1.6-1.7-3.1-3.1-4.4-4.7-1.1-1.3-2.6-1.8-4.2-1.8s-2.1.7-1.4 2.2c.9 2 2.6 3.3 4.7 3.9 1.6.5 3.3.4 5.3.4zm-7.4-7.9c-1.4-1.9-2.8-3.7-4-5.4-1-1.4-2.5-1.8-4.1-2-1-.1-1.4.5-1.3 1.5.1.8.5 1.5.9 2.2 1.9 3 5 3.4 8.5 3.7zm-6.4-8.6c-1.2-2-2.3-3.8-3.3-5.7-.9-1.6-2.3-2.2-3.9-2.5-1-.2-1.5.4-1.4 1.4 0 .8.3 1.5.7 2.2 1.6 3.1 4.6 3.9 7.9 4.6zm4.1-108.9c1.4-1.6 2.5-3.2 3.9-4.5 1.4-1.4 1.8-3.1 1.7-4.9-.1-1.6-.9-2-2.3-1.1-1.6 1-2.6 2.5-3.1 4.3-.5 1.9-.4 3.9-.2 6.2zm12.3-11.1c2.1.1 4 .4 5.8 0 1.9-.3 3.5-1.2 4.6-2.8.5-.8.6-1.5-.3-2-1.3-.7-2.8-.9-3.9-.2-2.2 1.4-4.1 3.1-6.2 5zm-18.2 19.9c1.2-1.9 2.3-3.6 3.4-5.2 1.2-1.6 1.2-3.3.8-5-.3-1.3-1.1-1.5-2.1-.7-1.1.8-1.8 2-2.3 3.3-.9 2.5-.4 4.9.2 7.6zm-3.3 90.8c-.9-2-1.7-3.7-2.4-5.5-.5-1.2-1.2-2.1-2.3-2.7-.8-.5-1.8-1.2-2.6-.5-.9.7-.5 1.8-.3 2.7 1.1 3.7 4.1 4.9 7.6 6zm-9.6-40.4c0-2.5 0-4.7 0-6.9 0-1.7-.9-3-2.1-4-.6-.5-1.2-.4-1.6.3-.3.5-.4.9-.5 1.5-.7 3.8 1.5 6.3 4.2 9.1zm8.1-41.1c1-1.9 1.8-3.8 2.8-5.5.9-1.7.7-3.3.2-5-.4-1.2-1.2-1.4-2.1-.5-1.5 1.4-2.2 3.3-2.1 5.3-.1 2 .5 3.8 1.2 5.7zm15.6-21.6c2.1 0 3.8 0 5.5-.5 1.8-.5 3.2-1.5 4.1-3.1.4-.8.5-1.7-.6-2.1-1.3-.5-2.8-.5-3.8.3-1.8 1.4-3.5 3.3-5.2 5.4zm-23.3 72.9c.3-.3.2-.6.1-.9-.1-1.8-.3-3.6-.4-5.3 0-1.7-1-2.9-2.2-3.9-1.1-.9-1.8-.6-2.2.7-.6 2.2 0 4.3 1.3 6.1 1 1.3 2.2 2.2 3.4 3.3zm5.1 20.6c-.7-2.2-1.3-4.2-1.9-6.1-.2-.8-.6-1.5-1.3-2.1-.9-.7-1.9-1.9-3.1-1.2s-.7 2.1-.4 3.3c.9 3.2 3.6 4.6 6.7 6.1zm27.5 37.4c-.3-2.1-.4-4-1-5.8s-1.6-3.3-3.3-4.2c-.9-.5-1.5-.2-1.8.8-.4 1.4-.3 2.9.5 3.9 1.6 2 3.5 3.6 5.6 5.3zm-32.7-78.8c.3-2.3.5-4.4.8-6.5.3-1.8-.5-3.1-1.6-4.4-.6-.7-1.3-.6-1.8.2s-.8 1.8-.8 2.7c-.3 3.1 1.4 5.4 3.4 8zm4.1-20.7c.8-2.1 1.5-4.1 2.2-6 .7-1.8.2-3.4-.6-4.9-.4-.8-1.1-.8-1.8-.2-.8.8-1.3 1.8-1.6 2.9-.7 3 .5 5.5 1.8 8.2zm-1.9 52c-.5-2.5-.8-4.9-1.4-7.2-.3-1.3-1.4-2.2-2.6-2.8-.9-.5-1.5-.1-1.8.8s-.2 1.9 0 2.9c.7 3 3.1 4.6 5.8 6.3zm-.7-41.8c.5-2.2.9-4.1 1.5-6 .4-1.2.2-2.3-.2-3.3-.4-.9-.6-2.1-1.7-2.1-1.2 0-1.5 1.2-1.8 2.1-1.3 3.5.3 6.3 2.2 9.3zm10.1-24.4c2.3-.6 4.4-1 6.1-2.4 1.1-.9 1.9-2 2.2-3.3.2-.8 0-1.6-.9-1.7-1.4-.3-2.9.1-3.7 1.2-1.4 1.8-2.5 3.9-3.7 6.2zm-4.3 9.4c2.7-1 5.1-1.8 6.7-4.1.5-.8.9-1.6 1-2.5.1-1.2-.4-1.8-1.6-1.6-1.5.2-2.9.8-3.5 2.4-.9 1.8-1.7 3.6-2.6 5.8zm-3.1 9.5c.3 0 .5.1.7 0 1.6-.8 3.1-1.6 4.3-2.9 1.1-1.1 1.7-2.4 1.8-4 0-1.3-.7-1.9-1.9-1.5-1.5.5-2.7 1.2-3.1 2.9-.6 1.8-1.2 3.6-1.8 5.5zm20.7 87.2c0-2.3.2-4.3-.3-6.2-.4-1.6-1.1-3-2.5-3.9-.7-.4-1.4-.6-1.8.3-.7 1.4-.9 3 0 4.3 1.2 1.9 2.8 3.7 4.6 5.5zm-6.7-8c.5-2.3.7-4.3.5-6.3-.2-1.6-.7-3-2-4.1-.6-.5-1.2-.7-1.8 0-.8.9-1.2 3.4-.5 4.4 1.1 1.9 2.3 3.8 3.8 6zm-17-58.5c1.5-1.4 2.9-2.5 3.9-4 .9-1.5 1.5-3.1 1-4.9-.2-.9-.8-1.3-1.7-.9-1.3.6-2.5 1.5-2.7 3-.3 2.1-.5 4.3-.5 6.8zm.9-10.6c.3 0 .6 0 .7-.1 1.5-1.1 3.1-2.1 4.2-3.7.8-1.2 1.3-2.5 1.1-4-.1-.9-.6-1.5-1.6-1.3-1.3.3-2.6 1.1-3 2.4-.7 2.1-1 4.4-1.4 6.7zm-.8 20.9c1.3-1.6 2.6-2.8 3.4-4.4s1.1-3.2.6-5c-.3-.8-.8-1.3-1.6-.9-1.4.7-2.4 1.8-2.6 3.3-.2 2.2 0 4.5.2 7zm1.2 10.2c1.3-1.9 2.5-3.5 3.2-5.5.4-1.4.5-2.9-.2-4.2-.4-.8-1-1.2-1.8-.7-1.2.8-2.1 2-2.1 3.4 0 2.3.4 4.5.9 7zm2.3 10.2c1-1.9 2-3.5 2.5-5.4.4-1.6.4-3.2-.4-4.7-.4-.8-1-1.3-1.9-.6-1.2 1-2 2.3-1.7 3.9.2 2.2.9 4.4 1.5 6.8zm3.4 9.5c1.1-2.6 2.1-4.8 1.9-7.4-.1-1-.4-2-1-2.8-.5-.6-1.1-1-1.8-.3-1.1 1.1-1.8 2.5-1.4 3.9.4 2.2 1.2 4.2 2.3 6.6zm4.5 9.4c.5-2 1-3.7 1.1-5.4.1-1.8-.2-3.4-1.4-4.8-.6-.7-1.3-1-2-.1-.9 1.2-1.4 2.7-.9 4.1.8 2 1.9 4 3.2 6.2z"
                                    ></path>
                                    <path
                                      d="m180.1 164.3c1.1-.8.1-3.1 2.5-2.9.1 1.5.2 2.9.4 4.4-.8.4-1 0-1-.7 0-.6-.1-1.1-.5-1.6-.4.4-.4.9-.6 1.3s-.1 1-.8 1c-.8 0-.7-.7-.9-1.1-.2-.6-.4-1.2-.6-1.9-.6 1.1.2 2.4-1.2 3.3-.2-1.6.2-2.8.2-4.2 0-.4.2-.7.6-.6.4 0 .8-.1 1 .5.3.9.6 1.7.9 2.5z"
                                    ></path>
                                    <path
                                      d="m174.7 162.4c-.6-.3-1.1 0-1.5-.4.1-.9.8-.6 1.3-.5.9 0 1.9-.3 2.8.3-.6.6-1.1.3-1.6.5-.3 1-.1 2-.1 3 0 .3 0 .6-.4.6s-.5-.3-.5-.6c0-.9 0-1.9 0-2.9z"
                                    ></path>
                                    <path
                                      d="m159.9 85.4c0 33.1-27 60-60 59.9-33 0-59.9-27-59.9-60 0-33.1 27-60 60.2-59.9 32.9.1 59.8 27 59.7 60zm-3.4-.1c0-31.1-25.3-56.4-56.5-56.5-31.2 0-56.6 25.4-56.6 56.6s25.4 56.5 56.6 56.5 56.5-25.4 56.5-56.6z"
                                    ></path>
                                    <path
                                      d="m50.4 35.2c1.3-.3 2.2.2 2.8 1.3.6 1 .3 2-.4 2.8-1.1 1.3-2.3 2.5-3.5 3.9-2.2-2-4.3-4-6.6-6.1 1.2-1.3 2.4-2.6 3.7-3.7 1.7-1.4 3.4-.6 4 1.8zm-2.5 3.6c.6.8 1.1 1.2 1.6 1.6.6-.6 1.1-1.2 1.7-1.8.4-.5.4-1-.1-1.4-.4-.4-.9-.3-1.3.1-.7.5-1.3 1-1.9 1.5zm-1.1-.8c.6-.6 1-1.1 1.5-1.6.4-.4.5-.8.1-1.3-.5-.4-.9-.3-1.3.1-.5.5-1.1 1-1.5 1.7.4.4.8.7 1.2 1.1z"
                                    ></path>
                                    <path
                                      d="m150.6 30.3c1.2 1.3 2.5 2.5 3.5 3.8 1.5 1.9 1.1 3.7-.9 5.6-1.9 1.7-3.8 1.9-5.5.4-1.2-1-2.2-2.1-3.3-3.1 2.1-2.3 4.1-4.4 6.2-6.7zm-3.2 6.8c.8.7 1.4 2.2 3 1.8 1.2-.3 2.2-1.2 2.4-2.4.3-1.5-1.1-2.1-2-3.2-1.2 1.3-2.3 2.5-3.4 3.8z"
                                    ></path>
                                    <path
                                      d="m77 14.1c1.6-.4 3-.9 4.5-1.1 2.5-.5 4.1.6 4.8 3.4.7 2.7-.1 4.4-2.6 5.2-1.4.5-2.8.8-4.4 1.2-.7-2.9-1.5-5.7-2.3-8.7zm3.9 6.4c1.3-.6 3-.3 3.3-2 .2-1.1-.1-2.4-1-3.2-1.2-1-2.4 0-3.7.2.6 1.7 1 3.2 1.4 5z"
                                    ></path>
                                    <path
                                      d="m60.6 31.1c0 2-2.7 4.6-4.9 4.5-2.1 0-4.7-2.9-4.8-5.1 0-2.1 2.8-4.7 5-4.6 2.2 0 4.8 2.9 4.7 5.2zm-2.1.2c0-1.2-1.8-3.2-2.9-3.3-1.1 0-2.5 1.3-2.5 2.3 0 1.2 1.9 3.2 2.9 3.2s2.5-1.3 2.5-2.2z"
                                    ></path>
                                    <path
                                      d="m67.7 17.9c1.5-.6 2.8-1.2 4.2-1.7 1.2-.4 2.4-.4 3.3.8.8 1.1.8 2.1-.1 3.6 1.1.7 2.3 1.5 3.4 2.2-1.5 1.3-1.9 1.3-3.5.2-.9-.6-1.7-1.8-3-.6.3.9.7 1.8 1.1 2.9-.6.3-1.2.5-1.9.8-1.2-2.7-2.3-5.4-3.5-8.2zm3.5 2.8c.9-.4 2-.4 2.4-1.5.2-.5-.1-1.1-.5-1.2-1-.3-1.8.3-2.7.8.3.7.6 1.3.8 1.9z"
                                    ></path>
                                    <path
                                      d="m114.5 17.6c.6 1.3 1.1 2.5 1.7 3.8-2.3 0-2.3 0-3.1-1.9-.4-1-.4-2.3-2.1-2-.5.9-.3 2-.7 2.9-.7.1-1.3-.2-2-.3.5-2.9 1-5.7 1.6-8.7 1.7.3 3.4.5 5 1 1.1.4 1.8 1.2 1.8 2.4s-.4 2.2-1.6 2.6c-.3 0-.4.1-.6.2zm-3.3-2.1c1 .2 1.9.7 2.8.1.4-.3.5-.9.2-1.3-.6-.9-1.7-.7-2.7-.8-.1.7-.2 1.3-.3 2z"
                                    ></path>
                                    <path
                                      d="m102.6 12.6v1.5c1.2.1 2.5.2 3.8.3.3.6.1 1.1 0 1.7-1.3-.1-2.5-.1-3.7-.2-.4.5-.2 1.1-.3 1.8l4.8.3c.2.6 0 1.2-.1 1.9-2.2-.1-4.5-.2-6.9-.3.1-2.9.3-5.8.4-8.9 2.3.1 4.5.2 6.7.3.2.7.1 1.2 0 1.9-1.5-.1-3-.2-4.7-.3z"
                                    ></path>
                                    <path
                                      d="m144 27.5c-.3.4-.6.8-.9 1.2 1 .8 2 1.7 3.1 2.5-.4.5-.7.8-1 1.3-1-.8-2-1.6-3-2.3-.6.3-.8.8-1.2 1.3 1.2 1 2.4 2 3.7 3-.2.6-.7 1-1.1 1.5-1.8-1.4-3.6-2.8-5.5-4.3 1.8-2.3 3.7-4.6 5.5-7 1.8 1.4 3.6 2.8 5.3 4.2-.3.6-.6 1.1-1.1 1.5-1.3-1-2.5-1.9-3.8-2.9z"
                                    ></path>
                                    <path
                                      d="m29 75.4c1.5.9 2.7 1.8 4.1 2.4 1.3.7 1.9 1.4 1.1 3-2.4-1.4-5-2-7.9-1 .1-.9.2-1.6.3-2.3s.7-.6.9-.3c.9 1.5 2.3.6 3.3 1.1.1-.1.1-.3.2-.4-1-.6-2.1-1.2-3.1-1.9-.4-.3-1.1-.3-1-1s.8-.6 1.3-.7c1.2-.4 2.4-.5 3.5-1.2-1.5 0-2.9-1-4.5.4.2-1.3.3-2.1.4-2.8.3-.2.6-.3.7-.1 1.6 1.9 4 .8 5.9 1.6h.2c.3-.5.8-1.1 1.1-.2.2.6.4 1.7-.8 2-1.9.2-3.7.8-5.7 1.4z"
                                    ></path>
                                    <path
                                      d="m62 31.4c-.4-3.1-.8-6-1.2-8.9-.1-.7.2-1 .7-1.2s.9-.9 1.7-.3c2.3 1.8 4.8 3.4 7.3 5.3-1.1.6-1.9 1.8-3.1.4-.3-.3-.6-.2-.9 0-.6.4-1.2.8-1.8 1.1-.8.4-1.1.8-.9 1.7.3 1.4-1.1 1.3-1.8 1.9zm3.4-6.2c-.9-.7-1.5-1.6-2.8-1.7.2 1 .4 1.9.7 2.9.8-.4 1.4-.8 2.1-1.2z"
                                    ></path>
                                    <path
                                      d="m129.8 26.7c-.7-.2-1.3-.5-1.9-1 1.4-2.6 2.7-5.2 4.1-7.8 2 1.1 4 2.1 6 3.2-.3.6-.6 1.1-.9 1.7-1.4-.7-2.7-1.4-4-2.1-.5.3-.6.8-.9 1.4 1.1.6 2.2 1.2 3.4 1.9-.3.5-.5 1-.8 1.6-1.2-.6-2.3-1.2-3.5-1.8-.5 1-1 1.9-1.5 2.9z"
                                    ></path>
                                    <path
                                      d="m99.2 19c-2.3 1.3-5.1 1.1-6.4-.2-1.3-1.4-1.6-4.5-.6-6.2s3.7-2.4 6.3-1.5c.1.6 0 1.1-.1 1.7-1.5 0-3.3-.8-4.3 1-.6 1.1-.5 2.6.4 3.6 1.2 1.3 2.8.5 4.3.1.1.4.2.9.4 1.5z"
                                    ></path>
                                    <path
                                      d="m164.9 93.9c.1-.8.2-1.6.3-2.3.2-.3.6-.2.6-.1.8 1.4 2.2 1 3.4 1.3s2.5.4 3.8.6c.3.9-.1 1.2-.8 1.5-1.7.8-3.4 1.6-5.1 2.5 1.8.3 3.5 1.2 5.4-.1-.1.8-.1 1.3-.2 1.7s.1 1-.4 1.2c-.6.2-.6-.3-.8-.7-.1-.2-.5-.2-.8-.3-1-.2-2.1-.4-3.1-.5-.7-.1-1.6-.6-2.2.4-.1.2-.5 0-.7-.2-.2-1.2.4-1.9 1.5-2.4 1.5-.6 3.1-1.3 4.4-2.3-1.7.1-3.3-1.6-5.1.1-.1-.1-.1-.3-.2-.4z"
                                    ></path>
                                    <path
                                      d="m45.6 130.6c1.4-1 3-1.8 3.3-4 .8.9 1.3 1.6 1.9 2.3-.2.2-.3.4-.4.4-1.8-.3-2.5 1.2-3.7 2-.9.6-1.7 1.3-2.6 2-.8-.4-.8-1-.6-1.7.6-1.7 1.1-3.3 1.6-5 .1-.1.2-.3 0-.4 0 0-.2.1-.3.2-1.3 1-3 1.7-3.2 3.8-.9-.7-1.4-1.5-2-2.3 2.8-.7 4.9-2.3 6.3-4.9 1.1.8 1.3 1.6.8 2.8-.6 1.5-1 3-1.5 4.5-.1.1-.2.3 0 .4s.3 0 .4-.1z"
                                    ></path>
                                    <path
                                      d="m83.1 153.7c.6 1 .4 2.2 1.4 2.8.1 0 .1.2.1.4s-.1.6-.3.5c-.8-.2-1.6-.4-2.4-.6-.3-.1-.2-.5 0-.7.8-1.3.3-2.5-1.1-2.9-.1 0-.3-.1-.4-.1-.9 1-.5 2-.1 3.1-.7.2-1.1 0-1.6-.2-.4-.1-1.1 0-1.2-.6s.4-.6.8-.7c.2-.1.2-.4.3-.7.3-1 .5-1.9.8-2.9.2-.9.9-1.7-.1-2.6-.1-.1.1-.4.2-.7 1.2.3 2.4.7 3.6.9 1.2.3 2.1.9 2.2 2.3.2 1.3-.6 2.2-2.2 2.7zm-2.7-1.7c1.1.2 2.1 1 3.2.2.4-.3.6-.9.5-1.4-.5-1.4-1.8-1-2.9-1.5-.3.9-.5 1.7-.8 2.7z"
                                    ></path>
                                    <path
                                      d="m157.5 131.5c-.7.8-1.2 1.4-2 2.3-.3-1.4-.9-2.5-2.1-3.1-.9.7-1.6 1.6-2.3 2.5.6 1.3 1.8 1.6 3.3 1.8-.8.9-1.4 1.5-2 2.3-1.3-2.7-3.2-4.5-6.1-5.4.7-.8 1.3-1.4 2.1-2.3.3 1.3.7 2.3 2 2.9.7-.8 1.5-1.6 2.2-2.5-.6-1.2-1.7-1.5-3-1.5.5-1 1.2-1.6 1.8-2.3 1.3 2.5 3.2 4.4 6.1 5.3z"
                                    ></path>
                                    <path
                                      d="m55.2 133.4c1 .8 1.9 1.6 2.8 2.3.8.7 1.5 1.4 1.3 2.6-.3 1.1-1.1 1.6-2.2 1.8.2 1.2-.2 2.2-1.3 2.8s-2-.1-2.8-.8c-.9-.8-1.9-1.6-3-2.5 2.7-1.3 4.4-3.3 5.2-6.2zm-3 6.8c1.1.6 1.5 1.9 2.9 1.6.5-.1.9-.6.9-1.1 0-1.4-1.3-1.7-2.1-2.5-.6.7-1.1 1.3-1.7 2zm2.4-2.9c.9.6 1.4 1.7 2.6 1.6.5-.1.9-.5.9-1 0-1.3-1.2-1.6-2-2.3-.5.6-1 1.1-1.5 1.7z"
                                    ></path>
                                    <path
                                      d="m140.1 145.7c-1.3-.4-2.4-1.6-3.5 0 .3 1.2 1.1 1.7 2.4 1.9-.1.1-.2.3-.2.4-.7.5-1.4.9-2.3 1.5-.5-2.9-1.8-5.2-4.4-6.8 1.4-.9 2.7-1.9 4.2-2.6.9-.4 1.7-.1 2.4.6.9.9 1 2 .4 3.1 1 .9 2.5.9 3.8 1.6-1.1.7-1.8 1.2-2.5 1.6-.5-.4-.7-.8-.3-1.3zm-4.1-1c.9-.8 2.2-.9 2.2-2.3 0-.5-.3-1-.9-1.2-1.3-.4-1.9.6-2.9 1.2.3.4.5.8.7 1.2.3.3.6.6.9 1.1z"
                                    ></path>
                                    <path
                                      d="m30.6 97.5c-1.1.6-1.7 1.8-2.9 2.8-.2-1.2-.3-2-.5-3.2 1.4.7 2.2-.2 2.9-1 .4-.4 0-1-.1-1.6-.8.2-1.9-.4-2.2 1-.1.2-.7.3-.8 0-.3-.8-.5-1.6-.3-2.4.1-.3.7-.4.8-.1.4.9 1 .5 1.6.4 1.3-.2 2.5-.4 3.8-.6.3 0 .7.1.8-.3.1-.5.3-.8.7-.7s.4.6.4.9c.1.8.2 1.6.4 2.3.2 1.3.3 2.5-1 3.3-1.2.6-2.3.4-3.6-.8zm.5-3.2c.4 2.8.7 3.3 1.9 3.1s1.4-1.1.7-3.5c-.8.1-1.7.2-2.6.4z"
                                    ></path>
                                    <path
                                      d="m120.7 23c-.7-.2-1.3-.4-2-.7.7-2.2 1.4-4.3 2.1-6.6-.9-.3-1.7-.6-2.6-1 .1-.6.3-1.2.6-1.8 2.4.8 4.8 1.5 7.3 2.3-.2.7-.3 1.2-.5 1.8-.9-.3-1.8-.5-2.7-.8-.7 2.4-1.4 4.6-2.2 6.8z"
                                    ></path>
                                    <path
                                      d="m157.7 116.5c.6-1.2 1.1-2.5 1.8-3.7s1.8-1.6 3.3-1.3c1 .2 1.9.6 2.7 1.3 1.4 1.1 1.8 2.3 1.1 3.9-.4 1-.9 1.9-1.3 2.9-.1.2-.2.5-.5.5-.3-.1-.7-.2-.5-.6.2-.5-.2-.6-.5-.7-1.3-.6-2.7-1.3-4-1.9-.4-.2-.7-.3-1 .1-.5.1-.7-.2-1.1-.5zm7.2 1.3c.5-1.1 1.5-2.1.6-3.3-.9-1.3-2.3-1.9-3.9-1.8-1.5.1-1.6 1.5-2.2 2.6 1.9.8 3.7 1.6 5.5 2.5z"
                                    ></path>
                                    <path
                                      d="m89 150.1c1.3.2 2.7.3 4 .5s2.1 1.1 2.3 2.4c.2 1.4 0 2.8-.6 4.1-.5.9-1.2 1.5-2.2 1.4-1.4 0-2.7-.2-4.1-.3-.2 0-.5-.1-.5-.4s0-.6.3-.7c.8-.1.6-.7.7-1.2.2-1.1.3-2.2.4-3.3.1-.6.5-1.3-.5-1.8-.2 0 0-.4.2-.7zm1 7.2c1.3.1 2.6.7 3.4-.5.9-1.3 1.1-2.8.5-4.3-.6-1.3-2-1-3.2-1.2-.2 2-.5 3.9-.7 6z"
                                    ></path>
                                    <path
                                      d="m37.7 122.7c.3-.5 1-.7.7-1.3-.4-.7-.6-1.7-1.4-2.1-.3-.1-1-.3-.9.6 0 .3-.2.5-.5.6-.4.2-.5-.2-.7-.5-.3-.6-.6-1.1-1-1.8 2.9-.2 5.9.3 8.2-1.9 0 0 .1.1.2.1 1.1 1.8 1.1 1.8-.3 3.5-1 1.1-1.8 2.3-2.9 3.2-.6.5-.1 1.7-1.3 1.9-.4-.7-.8-1.4-1.3-2.2.3-.8.7-.9 1.2-.1zm1.7-1.6c.5-1.1 1.4-1.5 1.7-2.4-1-.2-1.8.2-2.9.3.4.7.7 1.3 1.2 2.1z"
                                    ></path>
                                    <path
                                      d="m72.2 146.2c0-.4-.7-.6-.3-1.1.5-.5.8 0 1.2.1 1 .2 1.4.8 1.2 1.9-.2 1.6-.3 3.2-.4 4.9 0 .5-.3 1.1.3 1.6.3.2 0 .6-.3.9-.7-.3-1.5-.7-2.4-1 0-.7.2-1.1 1.1-.8.6-1.9-1.1-1.9-1.9-2.1-2.1-.7-.5 1.4-1.4 1.9-.7-.3-1.5-.6-2.7-1.2 2.5-1.3 3.9-3.4 5.6-5.1zm.9.7c-.9 1-1.6 1.7-2.3 2.5.8.2 1.3.7 2.1.7.1-1 .2-1.9.2-3.2z"
                                    ></path>
                                    <path
                                      d="m28.5 66.7c.1-.5.2-.9.4-1.4.2-.4 0-1 .6-1.1s.5.5.7.8c.3.4.9.4 1.3-.2.2-.3.2-.7.3-1 .6-1.9.6-1.9-1.2-1.6-.1 0-.3-.1-.6-.2.3-.8.5-1.6.9-2.9 1.5 2.4 3.7 3.5 5.5 5.1.6-.4.6-.4 1.3-.2 0 .1.1.2.1.2-.6 2.1-.6 2.1-2.9 2.2-1.3 0-2.5.1-3.8.1-.6 0-1.2-.2-1.7.5-.2.3-.6-.1-.9-.3zm4-1.5c1.1.1 2.1.1 3.2-.2-.9-.7-1.6-1.4-2.6-1.9-.2.8-.3 1.4-.6 2.1z"
                                    ></path>
                                    <path
                                      d="m63.4 140.4c2.7 0 4.3 2.5 3.4 4.8-.3.8-.8 1.5-1.3 2.1-1.3 1.6-2.8 1.8-4.4.8s-2.1-2.4-1.3-4.3c.4-.9.9-1.8 1.7-2.5.6-.6 1.2-.9 1.9-.9zm2.5 3.4c0-1.1-.4-1.6-1.1-2s-1.3-.5-2 0c-1.2.9-1.9 2.1-2.2 3.5-.2.8.2 1.4.9 1.8s1.4.7 2.1.2c1.3-.9 2-2.2 2.3-3.5z"
                                    ></path>
                                    <path
                                      d="m34.3 89.2c-.6 0-1.1 0-1.9 0 .9-1.2 1.3-2.5.8-3.9-.7-.2-1.4-.1-2.1 0-.2.9 0 1.7-.1 2.6 0 .4 0 .8-.6.8-.5 0-.5-.4-.5-.8 0-.8 0-1.7 0-2.6-.9 0-1.7 0-2.5 0-.4 1.4-.1 2.6.9 3.7-.7.3-1.3.2-2 .2 0-2 0-3.9 0-5.9 2.6 1 5.3 1.1 8-.2z"
                                    ></path>
                                    <path
                                      d="m109.9 155.1c0 2.6-1.5 4-4.1 3.7-1.7-.2-2.7-1.8-2.8-4.5-.1-2 .8-3.4 2.4-3.7 2.8-.6 4.5 1 4.5 4.5zm-5.7-.7c.1.4.1 1.1.3 1.8.3 1 .9 1.6 2.1 1.6 1.1-.1 1.7-.7 1.9-1.8.2-.8 0-1.6-.1-2.3-.3-1.6-1-2.2-2.3-2.1-1.2.1-1.9.8-1.9 2.8z"
                                    ></path>
                                    <path
                                      d="m167.5 109.2c-2.8 0-5.1-1.5-5.1-3.5-.1-2.2 1.3-3.7 3.2-3.7 2.8 0 5.2 1.7 5.2 3.7-.1 2-1.4 3.5-3.3 3.5zm-2-5.9c-1.1-.1-1.7.5-2 1.5s0 1.8.9 2.3 1.9.8 2.9.9 1.8-.3 2.2-1.3c.4-1.1.1-1.9-.8-2.5-1-.6-2.1-.9-3.2-.9z"
                                    ></path>
                                    <path
                                      d="m162.2 123.7c.1 2.8-2.4 4.5-4.7 3.5-.8-.3-1.6-.8-2.2-1.4-1.6-1.4-1.8-2.9-.6-4.5 1.1-1.6 2.6-2 4.4-1 1.4.8 2.9 1.7 3.1 3.4zm-3.1 2.6c.9 0 1.3-.5 1.7-1.2s.4-1.4-.1-2c-.8-1-1.9-1.7-3.1-2.1-.8-.2-1.5 0-2 .7-.5.6-.8 1.2-.5 2.1.5 1 2.8 2.5 4 2.5z"
                                    ></path>
                                    <path
                                      d="m132.5 149.7c0 1.5-.9 2.4-2.1 2.9-1.4.6-2.5.4-3.5-.6-.7-.8-1.2-1.7-1.5-2.7-.7-2.1-.1-3.5 1.7-4.3 1.9-.9 3.3-.4 4.4 1.6.5.9.9 1.9 1 3.1zm-4.1-4.1c-1.5 0-2.5 1.2-2.1 2.7.2.9.7 1.8 1.2 2.6.6.8 1.5 1.1 2.4.6 1-.4 1.4-1.2 1.2-2.2-.2-1.1-.7-2.2-1.4-3.1-.2-.3-.7-.6-1.3-.6z"
                                    ></path>
                                    <path
                                      d="m161.4 61.2c.3-.1.6-.2.9-.3s.6-.4.9.1-.1.6-.4.9c-.7.7 0 1.5.2 2.1.2.5.6.9 1.2.7.7-.2.8-.9.8-1.5s-.1-1.2 0-1.8c.1-1.1.5-1.9 1.6-2.2s2 .1 2.6 1.1.8 2.1 1 3.3c.1.5-1.2 1.3-1.6 1-.3-.2-.5-.5-.1-.9.7-.8.4-2.5-.5-3.1-.8-.5-1.4-.2-1.6.7-.1.6-.1 1.2-.1 1.8 0 1.8-.7 2.8-2 3-1.1.2-2-.6-2.5-2.2-.3-.9-.6-1.8-.4-2.7z"
                                    ></path>
                                    <path
                                      d="m164 69.1 1.5-.3c.3.3.5.8.2.9-1.4.6-.6 1.6-.4 2.5.2 1 1.1 1.2 2 1.2.8 0 1.7-.2 2.4-.5 1.6-.6 2.1-2.2 1.2-3.7-.2-.3-.3-.3-.6-.3-.5-.1-.5-.1-.7-.8 1.8-.7 1.8-.7 2.4 1.1.5 1.5.8 3-.7 4.2-1.4 1.1-4.4 1.6-5.8.8-1.1-.6-1.4-1.6-1.5-2.8-.2-.7-.3-1.5 0-2.3z"
                                    ></path>
                                    <path
                                      d="m117.5 148.6c.2.6.3 1.1.4 1.6-.8 1.2-1.1-.6-1.8-.3-.6.3-1.4.3-2.1.5.1.9.2 1.7.5 2.4 1.2.3 2.4-1 3.4-.1v.5c-1 .3-2.1.5-3.1.8-.2 1.4.6 2.2 1.6 3.1-1.2.3-2 .5-2.9.7-.1-.3-.3-.5-.2-.7 1.2-2.1-.6-3.9-.6-5.9 0-.1-.1-.2-.1-.2-1-1.1-1-1.1.6-1.5 1.4-.3 2.8-.6 4.3-.9z"
                                    ></path>
                                    <path
                                      d="m38 112.6c-.2-.2-.6-.6-.2-.8 1.3-.8.3-1.7 0-2.4-.4-.9-1.2-1-2.1-.9-.8.2-1.6.4-2.3.9-1.5.9-1.7 2.5-.6 3.8.2.2.3.3.5.3.4-.1.8-.1.9.4.1.4-.2.5-.5.6-.4.1-.8.5-1.3 0-2.3-2.3-1.8-5.3 1.1-6.6.2-.1.3-.1.5-.2 3-1.1 4.6-.2 5.4 2.8.3 1.1.3 2-1.4 2.1z"
                                    ></path>
                                    <path
                                      d="m139.6 22.1c.7.5 1.3.7 1.8 1.3-1.6 2.4-3.1 4.8-4.7 7.3-.7-.2-1.2-.7-1.9-1.1 1.6-2.5 3.2-4.9 4.8-7.5z"
                                    ></path>
                                    <path
                                      d="m127.8 16.1c.7.3 1.2.5 2 .8-1.1 2.7-2.3 5.4-3.4 8.2-.7-.3-1.3-.6-2-.9 1.1-2.7 2.2-5.3 3.4-8.1z"
                                    ></path>
                                    <path
                                      d="m173.5 87.3c-.2 0-.4.1-.4.1-1.5-1.5-3.4-.6-5.1-.8-.4-.1-.9 0-1.2 0-1 1.1 1 1.3.4 2.2-.5.2-1.1.1-1.7 0 0-1.9 0-3.8 0-5.8.6-.1 1.2-.1 1.7 0 .7 1-1.5 1-.4 2.3h5.1c.1 0 .3 0 .4-.1 1.3-.7 1.3-.7 1.3.8 0 .6-.1 1-.1 1.3z"
                                    ></path>
                                    <path
                                      d="m142.6 136.6c-.4.4-1.1.5-.8 1.1s0 .8-.5 1.1c-.4-.4-.8-.9-1.2-1.4 1.5-1.3 3-2.5 4.5-3.8.4.4.8.9 1.1 1.2-.2 1.4-1.8-.3-2 1.2 1.6 1.4 2.3 3.9 5 4.5-.6.8-1.3 1.3-2.2 2-.4-2.7-2.7-3.8-3.9-5.9z"
                                    ></path>
                                    <path
                                      d="m39.4 47.8c1.2 0 2.2 1 2.2 2.3s-1 2.2-2.3 2.2-2.3-1-2.2-2.3c0-1.1 1.1-2.2 2.3-2.2z"
                                    ></path>
                                    <path
                                      d="m160.7 52.4c-1.3 0-2.3-1-2.3-2.2s1-2.3 2.2-2.3 2.3 1 2.3 2.2-.9 2.2-2.2 2.3z"
                                    ></path>
                                    <path
                                      d="m36.2 101.3c.4.6.4 1.3.6 2 .2.6-.3 1-.6.7-.8-.9-1.6-.2-2.4-.1-.7.1-1.4.4-2.2.6-.7.2-1.6.2-1.8 1.3 0 .1-.4.1-.6.2-.5-.4-.4-.9-.5-1.3s-.5-.9-.1-1.3c.5-.4.7.1 1 .4.1.1.5 0 .7-.1 1-.3 2.1-.5 3-.8.7-.3 1.8 0 1.9-1.2.3-.3.7-.5 1-.4z"
                                    ></path>
                                    <path
                                      d="m165 77.7c2.8.8 5.5.6 8.1-.8.1 1 .2 1.8.3 2.8-2.8-.8-5.5-.7-8.1.9-.1-1.2-.2-2-.3-2.9z"
                                    ></path>
                                    <path
                                      d="m49.4 97.8h23c0-1.4 0-2.8 0-4.3-8 0-15.9 0-23.9 0-2.9-14.2 1.4-36 20.1-50 18.3-13.7 42.7-14.1 61.4-.9 19.2 13.6 24.3 35.4 21.4 50.8-8 0-16 0-24.1 0v4.2h23.2c-3.3 16.7-19.8 37.6-46.5 39.6-28.5 2.3-49.8-18-54.6-39.4zm62.8-21.4c.1.3.2.5.3.6 4.6 10.4 19.2 10.7 25.1 2.4 3-4.2 3.6-9 3-14-.8-6.4-4.8-11-10.7-12.5-6.2-1.6-12.4.5-15.9 5.4-2.3 3.2-3.1 6.9-3.2 10.9 0 .4.1.8-.2 1.3-1.1-1.4-2.5-2.2-4.2-2.8.3-.2.4-.3.6-.4 2.9-2.1 3.5-5 2.8-8.2s-2.9-4.9-6.1-5.4c-2-.3-3.9-.4-5.9-.4-3.8 0-7.6 0-11.5 0v2.8h1.9c.7 0 1.1.3 1.1 1v9.5c-1.9 0-3.6 0-5.4 0-1.5-4.3-3-8.5-4.5-12.7-.3-.8-.6-1-1.4-1-3.3-.2-5.6 1.2-7.1 4-1.3 2.2-2 4.6-2.9 6.9-1 2.8-1 2.8-3.9 2.8-.4 0-.9-.1-1.1.4-.3.9-.6 1.8-.9 2.7 1.3.3 2.5-.1 3.7.3-1 2.9-2.1 5.8-3 8.7-.6 1.9-1.3 3.4-3.8 2.9v2.7h10.6c0-.7 0-1.4 0-2.1 0-.2 0-.3-.1-.6-.4 0-.8 0-1.2 0-1.8 0-2.1-.4-1.5-2.1 1-2.9 2-5.8 3-8.7.2-.6.4-.9 1.2-.9h8.7c.4 0 .8 0 .9.5 1.2 3.4 2.3 6.7 3.5 10.1.3.8-.1 1.1-.9 1.2-.6 0-1.3-.2-1.9.1v2.6h.8 18.9c6.9-.1 9-1.6 11.2-8zm-15.9 50.1h16.3c1.1 0 2-.7 2.5-1.7.3-.4.5-.9.1-1.3s-.8 0-1.1.3c-1.1.8-2.4 1-3.9.9 1.1-1.1 2-2 2.6-3.2 2.1-4.2.7-9.3-3.5-12.5-3.5-2.6-7.5-3.1-11.7-2.7-3.6.4-6.8 1.8-9.1 4.8-3.4 4.2-3 9.4.8 13 .2.1.3.3.2.5-1.3 0-2.6-.2-3.7-1-.3-.2-.6-.6-1-.2-.3.3-.2.7 0 1.1.5 1.1 1.4 1.8 2.5 1.9 2.6.1 5.3 0 7.9 0 .2-1.1-.5-1.4-1.3-1.8-2.9-1.5-4.3-3.9-4.8-7.2h8.7c.8 0 1.2.4 1.2 1.2v3.8c0 1.1-.4 1.9-1.5 2.4-.7.4-1.3.7-1.2 1.7zm-12.4-33.8c-1.8 0-3.2 0-4.6 0v5.7h4.5c0-.3.1-.7 0-.7-1-.6-2.2 0-3.3-.4 0-.5-.1-.9.2-1.4h1.9c.3 0 .7 0 .7-.4 0-.5-.4-.5-.7-.5-.6 0-1.3.1-1.9-.1-.1-.4-.2-.8 0-1 .8-.6 2.3.5 3.2-1.2zm32.1 4.8c-.2.4-.3.7.2.9 1.1.6 3.2 0 3.8-1.2.8-1.7.3-3.9-1.1-4.5-.8-.3-1.6-.3-2.3.1-.8.3-1.1 1-1.1 1.8s.5 1.4 1.3 1.6 1.5 0 2.3-.1c-.4 1.5-.7 1.7-3.1 1.4zm-11.1.1c-.2.5-.2.7.3.9.9.4 2.7 0 3.3-.7.8-1 1-3.2.2-4.2-.6-.9-1.9-1.2-3.1-.9-.9.3-1.3 1-1.3 1.9s.5 1.4 1.4 1.7c.7.2 1.4-.1 2.2-.1-.3 1.4-.5 1.5-3 1.4zm-16.3-3.8c.2-.4.3-.7 0-.9-.7-.5-2.9-.3-3.5.4-.7.8-.6 1.9.4 2.4.5.3 1.1.4 1.6.6.4.1.9.2.8.8s-.6.6-1 .6c-.7 0-1.4-.2-2-.3-.3.5-.2.9.3 1.1.9.3 1.9.4 2.8 0 .7-.3 1.1-.8 1.1-1.6 0-.7-.4-1.2-1.1-1.5-.4-.1-.8-.3-1.3-.4-.4-.1-1-.2-.9-.8.1-.5.6-.6 1.1-.6.6 0 1.2.1 1.7.2zm23.3 3.5c.5-.4 1-.7 1.4-1.1.8-.7 1.5-1.6.8-2.8-.5-.9-2.5-1.1-3.6-.5-.6.3-.7.6-.2 1.1.5-.1.9-.3 1.4-.4s1.1-.1 1.4.5 0 1-.4 1.4c-.7.6-1.4 1.2-2.1 1.8-.4.3-.8.6-.5 1.2h4.5c-.5-1.7-1.8-.6-2.7-1.2zm-20.4-3.5v4.8c.4-.1.8.1 1.3-.3 0-1.4 0-3 0-4.5 1.8-.1 1.8-.1 1.7-1.1-1.6 0-3.2 0-4.8 0 0 1 0 1 1.8 1.1zm9.7 3.8c-.9.2-.9.2-1 1 1.1 0 2.2.1 3.3-.1.2-1.1-.8-.5-1.1-1.1 0-1.4 0-3 0-4.6-1.5.1-2.5.9-2.4 1.9.5.1.7-.5 1.3-.2-.1.9-.1 1.9-.1 3.1zm-5.4.4c0-.4-.2-.6-.6-.6s-.7.2-.7.6.2.5.6.6c.4 0 .7-.1.7-.6z"
                                    ></path>
                                    <path
                                      d="m136 68.5c-.1 2.8-.4 5.5-1.7 8.1-1.9 3.6-5 5.2-9 5-3.9-.2-6.8-1.9-8.3-5.5-2-4.8-2-9.7 0-14.5 1.7-4.1 5.1-5.9 10-5.5 4 .3 7.1 2.9 8.3 7 .6 1.7.7 3.6.7 5.4z"
                                    ></path>
                                    <path
                                      d="m93.9 69.8c3 .1 5.9-.2 8.9.2s4.6 2.3 4.7 5.4c.1 3.2-1.4 4.9-4.5 5.5-.4.1-.8.1-1.2.1-2.6 0-5.2 0-7.9 0 0-3.6 0-7.3 0-11.2z"
                                    ></path>
                                    <path
                                      d="m93.9 66.6c0-3.4 0-6.6 0-10 2.6.1 5.2-.2 7.8.2 2.7.4 4 2 4.1 4.5 0 2.8-1.4 4.5-4 5.1-.6.1-1.2.2-1.8.2-2.1 0-4.1 0-6.1 0z"
                                    ></path>
                                    <path
                                      d="m76 56.7c1.2 3.4 2.3 6.6 3.5 9.9-2.7 0-5.2 0-8 0 1.3-3.4 2-6.9 4.5-9.9z"
                                    ></path>
                                    <path
                                      d="m85.1 69.9h4.2v10.6c-.1 0-.2.1-.4.1-1.2-3.5-2.5-7-3.8-10.7z"
                                    ></path>
                                    <path
                                      d="m104.9 117.6c1.1 0 2.2-.1 3.3 0 1.5.1 2.1 1.1 1.8 2.6-.5 2.8-4 5.3-6.8 4.9-1.6-.2-2.4-1.1-2.4-2.7 0-1.1 0-2.2 0-3.3 0-1 .4-1.6 1.5-1.5.9-.1 1.8-.1 2.6 0 0-.1 0-.1 0 0z"
                                    ></path>
                                    <path
                                      d="m89.2 115.6c.7-5.1 5.3-7.3 8.5-7.6.8-.1 1.3.2 1.3 1.1v5.3c0 .8-.5 1.2-1.2 1.2-2.9 0-5.7 0-8.6 0z"
                                    ></path>
                                    <path
                                      d="m104.9 115.6c-.9 0-1.8 0-2.6 0-1 0-1.5-.5-1.5-1.4 0-1.6 0-3.3 0-4.9 0-.9.5-1.4 1.4-1.2 3 .4 5.5 1.7 7.2 4.3 1.1 1.8.6 3-1.5 3.1-1 .1-2 0-3 .1 0-.1 0 0 0 0z"
                                    ></path>
                                    <path
                                      d="m117.7 93.5c.7 0 1.3.3 1.4 1.1 0 .8-.6.7-1.1.8-.6 0-1.3 0-1.4-.8s.4-1 1.1-1.1z"
                                    ></path>
                                    <path
                                      d="m106.8 95.4c-.7 0-1.3-.1-1.3-.9s.5-.9 1.2-.9c.8 0 1.3.4 1.3 1.2 0 .7-.7.5-1.2.6z"
                                    ></path>
                                  </svg>
                                  <svg
                                    id="TPsvg-AOS_American_Orthodontic_Society"
                                    class="TPsvg"
                                    style="fill: currentColor"
                                    enable-background="new 0 0 200 76.5"
                                    height="76.5"
                                    viewBox="0 0 200 76.5"
                                    width="200"
                                    xmlns="http://www.w3.org/2000/svg"
                                    aria-labelledby="TPsvg-AOS_American_Orthodontic_Society-title"
                                    role="img"
                                  >
                                    <title id="TPsvg-AOS_American_Orthodontic_Society-title">
                                      American Orthodontic Society logo
                                    </title>
                                    <path
                                      d="m21.8 76v.2.1s-.1 0-.2.1c-.1 0-.2 0-.3 0s-.2 0-.3 0-.1 0-.2 0c0 0-.1 0-.1-.1v-.1l-.6-1.8h-3.1l-.6 1.8v.1s0 0-.1.1c0 0-.1 0-.2 0s-.2 0-.3 0-.2 0-.3 0-.1 0-.1-.1v-.1c0-.1 0-.1 0-.2l2.5-6.8s0-.1.1-.1c0 0 .1 0 .1-.1h.2.3.3.2s.1 0 .1.1c0 0 0 .1.1.1zm-3.2-6-1.3 3.7h2.6z"
                                    ></path>
                                    <path
                                      d="m31.6 76.2s0 .1 0 0c0 .1-.1.1-.1.1h-.1c-.1 0-.1 0-.2 0s-.2 0-.2 0c-.1 0-.1 0-.2 0 0 0-.1 0-.1-.1 0 0 0 0 0-.1v-6.4l-2.6 6.4v.1h-.1-.1c-.1 0-.1 0-.2 0s-.1 0-.2 0-.1 0-.1 0h-.1s0 0 0-.1l-2.5-6.4v6.4.1s0 0-.1.1-.1 0-.2 0-.1 0-.2 0-.2 0-.2 0c-.1 0-.1 0-.1 0s-.1 0-.1-.1c0 0 0 0 0-.1v-6.8c0-.2 0-.3.1-.3-.1 0 0 0 .1 0h.6.3c.1 0 .2.1.2.1.1 0 .1.1.2.2 0 .1.1.2.1.3l2.1 5.3 2.2-5.3c0-.1.1-.2.1-.3.1-.1.1-.1.2-.2.1 0 .1-.1.2-.1h.3.6.2c.1 0 .1 0 .1.1 0 0 .1.1.1.1v.2z"
                                    ></path>
                                    <path
                                      d="m38.3 75.9v.2.1s0 .1-.1.1h-.1-3.5c-.1 0-.2 0-.2-.1-.1-.1-.1-.2-.1-.3v-6.6c0-.1 0-.3.1-.3.1-.1.2-.1.2-.1h3.5.1s0 0 .1.1v.1.2.2.1s0 .1-.1.1h-.1-2.9v2.3h2.5.1s0 0 .1.1v.1.2.2.1s0 .1-.1.1-.1 0-.1 0h-2.5v2.6h2.9.1s0 0 .1.1v.1z"
                                    ></path>
                                    <path
                                      d="m45.4 76.2s0 .1 0 0c0 .1-.1.1-.1.1s-.1 0-.2 0-.2 0-.3 0-.2 0-.2 0c-.1 0-.1 0-.2 0 0 0-.1 0-.1-.1 0 0 0-.1-.1-.1l-.7-1.7c-.1-.2-.2-.4-.2-.5-.1-.2-.2-.3-.3-.4s-.3-.2-.4-.3c-.2-.1-.4-.1-.6-.1h-.7v3.1.1s0 0-.1.1h-.1c-.1 0-.1 0-.2 0s-.2 0-.2 0c-.1 0-.1 0-.2 0 0 0-.1 0-.1-.1 0 0 0 0 0-.1v-6.8c0-.1 0-.3.1-.3.1-.1.2-.1.2-.1h1.6.5.3c.3 0 .5.1.8.2.2.1.4.2.5.4s.3.3.3.6c.1.2.1.4.1.7 0 .2 0 .5-.1.7s-.2.4-.3.5c-.1.2-.3.3-.4.4-.2.1-.4.2-.6.3.1.1.2.1.3.2l.3.3c.1.1.2.2.2.4.1.1.2.3.2.5l.7 1.6c.1.1.1.2.1.3.2 0 .2.1.2.1zm-1.5-5.2c0-.3-.1-.5-.2-.7s-.3-.3-.6-.4c-.1 0-.2 0-.3-.1-.1 0-.3 0-.5 0h-.8v2.5h1c.3 0 .5 0 .7-.1s.3-.1.5-.3c.1-.1.2-.2.3-.4-.1-.1-.1-.3-.1-.5z"
                                    ></path>
                                    <path
                                      d="m48.4 76.2s0 .1 0 0c0 .1-.1.1-.1.1s-.1 0-.2 0-.1 0-.2 0-.2 0-.2 0c-.1 0-.1 0-.2 0 0 0-.1 0-.1-.1 0 0 0 0 0-.1v-7.1-.1s0 0 .1-.1h.2.2.2.2s.1 0 .1.1v.1z"
                                    ></path>
                                    <path
                                      d="m55.9 75.3v.2.1.1s0 .1-.1.1c0 0-.1.1-.2.2s-.3.2-.5.2c-.2.1-.4.1-.6.2s-.5.1-.8.1c-.5 0-.9-.1-1.3-.2-.4-.2-.7-.4-1-.7s-.5-.7-.6-1.2-.2-1-.2-1.6.1-1.2.2-1.6.4-.9.7-1.2.6-.6 1-.8.8-.3 1.3-.3c.2 0 .4 0 .6.1.2 0 .4.1.6.2s.3.1.5.2c.1.1.2.1.3.2s.1.1.1.1v.1.1.2.2.1s0 .1-.1.1 0 0-.1 0-.1 0-.2-.1-.2-.2-.4-.2c-.2-.1-.3-.2-.5-.2s-.5-.1-.8-.1-.6.1-.9.2-.5.3-.7.6-.3.6-.4.9c-.1.4-.2.8-.2 1.3s.1.9.2 1.2c.1.4.2.7.4.9s.4.4.7.5.6.2.9.2.5 0 .8-.1c.2-.1.4-.2.6-.2.2-.1.3-.2.4-.2.1-.1.2-.1.2-.1h.1v.1.1c0-.2 0-.1 0 0z"
                                    ></path>
                                    <path
                                      d="m63.3 76v.2.1s-.1 0-.2.1c-.1 0-.2 0-.3 0s-.2 0-.3 0-.1 0-.2 0c0 0-.1 0-.1-.1v-.1l-.6-1.8h-3.1l-.5 1.8v.1s0 0-.1.1c0 0-.1 0-.2 0s-.2 0-.3 0-.2 0-.3 0-.1 0-.1-.1v-.1c0-.1 0-.1 0-.2l2.5-6.8s0-.1.1-.1c0 0 .1 0 .1-.1h.2.3.3.2s.1 0 .1.1c0 0 0 .1.1.1zm-3.1-6-1.3 3.7h2.6z"
                                    ></path>
                                    <path
                                      d="m70.7 75.9v.2c0 .1-.1.1-.1.1s-.1.1-.1.1c-.1 0-.1 0-.2 0h-.3c-.1 0-.2 0-.3 0s-.1-.1-.2-.1c-.1-.1-.1-.1-.2-.2s-.1-.2-.2-.4l-2.2-4.2c-.1-.2-.2-.4-.4-.7-.1-.2-.2-.5-.3-.7v.8.8 4.4.1s0 0-.1.1h-.1c-.1 0-.1 0-.2 0s-.2 0-.2 0c-.1 0-.1 0-.1 0s-.1 0-.1-.1c0 0 0 0 0-.1v-6.8c0-.2 0-.3.1-.3.1-.1.2-.1.3-.1h.5.3c.1 0 .1.1.2.1s.1.1.2.2.1.2.2.3l1.7 3.2c.1.2.2.4.3.6s.2.4.3.6.2.4.3.5c.1.2.2.4.3.5 0-.3 0-.6 0-.9s0-.6 0-.9v-4-.1s0 0 .1-.1h.1.2.2.2s.1 0 .1.1v.1 6.9z"
                                    ></path>
                                    <path
                                      d="m82.7 72.6c0 .6-.1 1.1-.2 1.6s-.3.9-.6 1.2-.6.6-1 .8-.9.3-1.5.3-1-.1-1.4-.2c-.4-.2-.7-.4-1-.7s-.5-.7-.6-1.2-.2-1-.2-1.6.1-1.1.2-1.6.4-.9.6-1.2c.3-.3.6-.6 1.1-.8.4-.2.9-.3 1.5-.3.5 0 1 .1 1.4.2.4.2.7.4 1 .7s.5.7.6 1.2c0 .5.1 1 .1 1.6zm-1 .1c0-.4 0-.8-.1-1.2s-.2-.7-.4-.9c-.2-.3-.4-.5-.7-.6s-.6-.2-1.1-.2c-.4 0-.8.1-1.1.2-.3.2-.5.4-.7.6-.2.3-.3.6-.4.9-.1.4-.1.7-.1 1.1s0 .8.1 1.2.2.7.4.9c.2.3.4.5.7.6s.6.2 1.1.2c.4 0 .8-.1 1.1-.2.3-.2.5-.4.7-.6.2-.3.3-.6.4-.9 0-.4.1-.8.1-1.1z"
                                    ></path>
                                    <path
                                      d="m89.8 76.2s0 .1 0 0c0 .1-.1.1-.1.1s-.1 0-.2 0-.2 0-.3 0-.2 0-.2 0c-.1 0-.1 0-.2 0 0 0-.1 0-.1-.1 0 0 0-.1-.1-.1l-.6-1.7c-.1-.2-.2-.4-.2-.5-.1-.2-.2-.3-.3-.4s-.3-.2-.4-.3c-.2-.1-.4-.1-.6-.1h-.7v3.1.1s0 0-.1.1h-.1c-.1 0-.1 0-.2 0s-.2 0-.2 0c-.1 0-.1 0-.2 0 0 0-.1 0-.1-.1 0 0 0 0 0-.1v-6.8c0-.1 0-.3.1-.3.1-.1.2-.1.2-.1h1.6.5.3c.3 0 .5.1.8.2.2.1.4.2.5.4s.3.3.3.6c.1.2.1.4.1.7 0 .2 0 .5-.1.7s-.2.4-.3.5c-.1.2-.3.3-.4.4-.2.1-.4.2-.6.3.1.1.2.1.3.2l.3.3c.1.1.2.2.2.4.1.1.2.3.2.5l.7 1.6c.1.1.1.2.1.3.1 0 .1.1.1.1zm-1.5-5.2c0-.3-.1-.5-.2-.7s-.3-.3-.6-.4c-.1 0-.2 0-.3-.1-.1 0-.3 0-.5 0h-.8v2.5h1c.3 0 .5 0 .7-.1s.3-.1.5-.3c.1-.1.2-.2.3-.4s-.1-.3-.1-.5z"
                                    ></path>
                                    <path
                                      d="m96.3 69.4v.2.1s0 .1-.1.1h-.1-2.1v6.4.1s0 0-.1.1c0 0-.1 0-.2 0s-.1 0-.2 0-.2 0-.2 0c-.1 0-.1 0-.2 0 0 0-.1 0-.1-.1 0 0 0 0 0-.1v-6.4h-2-.1s0 0-.1-.1v-.1c0-.1 0-.1 0-.2s0-.1 0-.2 0-.1 0-.1 0-.1.1-.1h.1 5.1.1s0 0 .1.1v.1z"
                                    ></path>
                                    <path
                                      d="m103.3 76.2s-.1.1 0 0c0 .1-.1.1-.1.1s-.1 0-.2 0-.1 0-.2 0-.2 0-.2 0c-.1 0-.1 0-.1 0s-.1 0-.1-.1c0 0 0 0 0-.1v-3.3h-3.3v3.3.1s0 0-.1.1c0 0-.1 0-.2 0s-.1 0-.2 0-.2 0-.2 0c-.1 0-.1 0-.2 0 0 0-.1 0-.1-.1 0 0 0 0 0-.1v-7.1-.1s0 0 .1-.1h.2.2.2.2s.1 0 .1.1v.1 2.9h3.3v-2.9-.1s0 0 .1-.1h.1.2.2.2s.1 0 .1.1v.1z"
                                    ></path>
                                    <path
                                      d="m112 72.6c0 .6-.1 1.1-.2 1.6s-.3.9-.6 1.2-.6.6-1 .8-.9.3-1.5.3-1-.1-1.4-.2c-.4-.2-.7-.4-1-.7s-.5-.7-.6-1.2-.2-1-.2-1.6.1-1.1.2-1.6.4-.9.6-1.2c.3-.3.6-.6 1.1-.8.4-.2.9-.3 1.5-.3.5 0 1 .1 1.4.2.4.2.7.4 1 .7s.5.7.6 1.2c0 .5.1 1 .1 1.6zm-1 .1c0-.4 0-.8-.1-1.2s-.2-.7-.4-.9c-.2-.3-.4-.5-.7-.6s-.6-.2-1.1-.2c-.4 0-.8.1-1.1.2-.3.2-.5.4-.7.6-.2.3-.3.6-.4.9-.1.4-.1.7-.1 1.1s0 .8.1 1.2.2.7.4.9c.2.3.4.5.7.6s.6.2 1.1.2c.4 0 .8-.1 1.1-.2.3-.2.5-.4.7-.6s.3-.6.4-.9c0-.4.1-.8.1-1.1z"
                                    ></path>
                                    <path
                                      d="m119.8 72.6c0 .6-.1 1.2-.2 1.7-.2.5-.4.9-.7 1.2s-.7.5-1.2.7-1 .2-1.6.2h-1.6c-.1 0-.2 0-.2-.1-.1-.1-.1-.2-.1-.3v-6.6c0-.1 0-.3.1-.3.1-.1.2-.1.2-.1h1.7c.6 0 1.2.1 1.6.2.4.2.8.4 1.1.7s.5.7.7 1.1c.1.5.2 1 .2 1.6zm-1 0c0-.4 0-.8-.1-1.1s-.3-.6-.5-.9c-.2-.2-.5-.4-.8-.6-.3-.1-.7-.2-1.2-.2h-1v5.7h1c.5 0 .9-.1 1.2-.2s.6-.3.8-.5.4-.5.5-.9c0-.4.1-.8.1-1.3z"
                                    ></path>
                                    <path
                                      d="m128.1 72.6c0 .6-.1 1.1-.2 1.6s-.3.9-.6 1.2-.6.6-1 .8-.9.3-1.5.3-1-.1-1.4-.2c-.4-.2-.7-.4-1-.7s-.5-.7-.6-1.2-.2-1-.2-1.6.1-1.1.2-1.6.4-.9.6-1.2c.3-.3.6-.6 1.1-.8s.9-.3 1.5-.3c.5 0 1 .1 1.4.2.4.2.7.4 1 .7s.5.7.6 1.2c0 .5.1 1 .1 1.6zm-1.1.1c0-.4 0-.8-.1-1.2s-.2-.7-.4-.9c-.2-.3-.4-.5-.7-.6s-.6-.2-1.1-.2c-.4 0-.8.1-1.1.2-.3.2-.5.4-.7.6-.2.3-.3.6-.4.9-.1.4-.1.7-.1 1.1s0 .8.1 1.2.2.7.4.9c.2.3.4.5.7.6s.6.2 1.1.2c.4 0 .8-.1 1.1-.2.3-.2.5-.4.7-.6s.3-.6.4-.9c.1-.4.1-.8.1-1.1z"
                                    ></path>
                                    <path
                                      d="m135.8 75.9v.2c0 .1-.1.1-.1.1s-.1.1-.1.1c-.1 0-.1 0-.2 0h-.4c-.1 0-.2 0-.3 0s-.1-.1-.2-.1c-.1-.1-.1-.1-.2-.2s-.1-.2-.2-.4l-2.2-4.2c-.1-.2-.2-.4-.4-.7-.1-.2-.2-.5-.3-.7v.8.8 4.4.1s0 0-.1.1c0 0-.1 0-.2 0s-.1 0-.2 0-.2 0-.2 0c-.1 0-.1 0-.1 0s-.1 0-.1-.1c0 0 0 0 0-.1v-6.8c0-.2 0-.3.1-.3.1-.1.2-.1.3-.1h.5.3c.1 0 .1.1.2.1s.1.1.2.2.1.2.2.3l1.7 3.2c.1.2.2.4.3.6s.2.4.3.6.2.4.3.5c.1.2.2.4.3.5 0-.3 0-.6 0-.9s0-.6 0-.9v-4-.1s0 0 .1-.1h.2.2.2.2s.1 0 .1.1v.1 6.9z"
                                    ></path>
                                    <path
                                      d="m143 69.4v.2.1s0 .1-.1.1h-.1-2.1v6.4.1s0 0-.1.1c0 0-.1 0-.2 0s-.1 0-.2 0-.2 0-.2 0c-.1 0-.1 0-.2 0s-.1 0-.1-.1c0 0 0 0 0-.1v-6.4h-2.1-.1s0 0-.1-.1v-.1c0-.1 0-.1 0-.2s0-.1 0-.2 0-.1 0-.1 0-.1.1-.1h.1 5.1.1s0 0 .1.1v.1c.1.1.1.1.1.2z"
                                    ></path>
                                    <path
                                      d="m145.6 76.2s0 .1 0 0c0 .1-.1.1-.1.1s-.1 0-.2 0-.1 0-.2 0-.2 0-.2 0c-.1 0-.1 0-.2 0 0 0-.1 0-.1-.1 0 0 0 0 0-.1v-7.1-.1s0 0 .1-.1h.2.2.2.2s.1 0 .1.1v.1z"
                                    ></path>
                                    <path
                                      d="m153.1 75.3v.2.1.1s0 .1-.1.1c0 0-.1.1-.2.2s-.3.2-.5.2-.4.1-.6.2-.5.1-.8.1c-.5 0-.9-.1-1.3-.2-.4-.2-.7-.4-1-.7s-.5-.7-.6-1.2-.2-1-.2-1.6.1-1.2.2-1.6.4-.9.7-1.2.6-.6 1-.8.8-.3 1.3-.3c.2 0 .4 0 .6.1.2 0 .4.1.6.2s.3.1.5.2c.1.1.2.1.3.2s.1.1.1.1v.1.1.2.2.1s0 .1-.1.1c0 0 0 0-.1 0s-.1 0-.2-.1-.2-.2-.4-.2c-.2-.1-.3-.2-.5-.2-.2-.1-.5-.1-.8-.1s-.6.1-.9.2-.5.3-.7.6-.3.6-.4.9c-.1.4-.2.8-.2 1.3s.1.9.2 1.2c.1.4.2.7.4.9s.4.4.7.5.6.2.9.2.5 0 .8-.1.4-.2.6-.2c.2-.1.3-.2.4-.2.1-.1.2-.1.2-.1h.1v.1.1c0-.2 0-.1 0 0z"
                                    ></path>
                                    <path
                                      d="m162.2 74.3c0 .3-.1.7-.2.9-.1.3-.3.5-.5.7s-.5.3-.8.4-.6.1-1 .1c-.2 0-.5 0-.7-.1-.2 0-.4-.1-.6-.2s-.3-.1-.4-.2-.2-.1-.2-.2c0 0-.1-.1-.1-.2s0-.2 0-.3 0-.2 0-.2c0-.1 0-.1 0-.1s0-.1.1-.1h.1c.1 0 .1 0 .2.1s.2.1.4.2.3.1.5.2.5.1.7.1.4 0 .6-.1.3-.1.5-.2c.1-.1.2-.2.3-.4s.1-.3.1-.5 0-.4-.1-.5-.2-.3-.4-.4-.3-.2-.5-.3-.4-.2-.6-.3-.4-.2-.6-.3-.4-.3-.5-.4c-.2-.2-.3-.3-.4-.6-.1-.2-.1-.5-.1-.8s.1-.6.2-.8.3-.4.5-.6.4-.3.7-.4.6-.1.9-.1h.5c.2 0 .3.1.5.1.1 0 .3.1.4.2s.2.1.2.1.1.1.1.1v.1.1s0 .1 0 .2v.2.1.1s0 0-.1 0c0 0-.1 0-.2-.1s-.2-.1-.3-.2-.3-.1-.5-.2-.4-.1-.6-.1-.4 0-.5.1c-.2.1-.3.1-.4.2s-.2.2-.2.3-.1.3-.1.4c0 .2 0 .4.1.5s.2.3.4.4.3.2.5.3l.6.3.6.3c.2.1.4.3.5.4.2.2.3.3.4.6z"
                                    ></path>
                                    <path
                                      d="m170.4 72.6c0 .6-.1 1.1-.2 1.6s-.3.9-.6 1.2-.6.6-1 .8-.9.3-1.5.3-1-.1-1.4-.2c-.4-.2-.7-.4-1-.7s-.5-.7-.6-1.2-.2-1-.2-1.6.1-1.1.2-1.6.4-.9.6-1.2c.3-.3.6-.6 1.1-.8s.9-.3 1.5-.3c.5 0 1 .1 1.4.2.4.2.7.4 1 .7s.5.7.6 1.2c0 .5.1 1 .1 1.6zm-1 .1c0-.4 0-.8-.1-1.2s-.2-.7-.4-.9c-.2-.3-.4-.5-.7-.6s-.6-.2-1.1-.2c-.4 0-.8.1-1.1.2-.3.2-.5.4-.7.6-.2.3-.3.6-.4.9-.1.4-.1.7-.1 1.1s0 .8.1 1.2.2.7.4.9c.2.3.4.5.7.6s.6.2 1.1.2c.4 0 .8-.1 1.1-.2.3-.2.5-.4.7-.6.2-.3.3-.6.4-.9 0-.4.1-.8.1-1.1z"
                                    ></path>
                                    <path
                                      d="m177.5 75.3v.2.1.1s0 .1-.1.1c0 0-.1.1-.2.2s-.3.2-.5.2-.4.1-.6.2-.5.1-.8.1c-.5 0-.9-.1-1.3-.2-.4-.2-.7-.4-1-.7s-.5-.7-.6-1.2-.2-1-.2-1.6.1-1.2.2-1.6.4-.9.7-1.2.6-.6 1-.8.8-.3 1.3-.3c.2 0 .4 0 .6.1.2 0 .4.1.6.2s.3.1.5.2c.1.1.2.1.3.2s.1.1.1.1v.1.1.2.2.1s0 .1-.1.1c0 0 0 0-.1 0s-.1 0-.2-.1-.2-.2-.4-.2c-.2-.1-.3-.2-.5-.2-.2-.1-.5-.1-.8-.1s-.6.1-.9.2-.5.3-.7.6-.3.6-.4.9c-.1.4-.2.8-.2 1.3s.1.9.2 1.2c.1.4.2.7.4.9s.4.4.7.5.6.2.9.2.5 0 .8-.1.4-.2.6-.2c.2-.1.3-.2.4-.2.1-.1.2-.1.2-.1h.1v.1.1c0-.2 0-.1 0 0z"
                                    ></path>
                                    <path
                                      d="m180.3 76.2s0 .1 0 0c0 .1-.1.1-.1.1s-.1 0-.2 0-.1 0-.2 0-.2 0-.2 0c-.1 0-.1 0-.2 0s-.1 0-.1-.1c0 0 0 0 0-.1v-7.1-.1s0 0 .1-.1h.2.2.2.2s.1 0 .1.1v.1z"
                                    ></path>
                                    <path
                                      d="m187 75.9v.2.1s0 .1-.1.1-.1 0-.1 0h-3.5c-.1 0-.2 0-.2-.1-.1-.1-.1-.2-.1-.3v-6.6c0-.1 0-.3.1-.3.1-.1.2-.1.2-.1h3.5.1s0 0 .1.1v.1.2.2.1s0 .1-.1.1h-.1-2.9v2.3h2.5.1s0 0 .1.1v.1.2.2.1s0 .1-.1.1-.1 0-.1 0h-2.5v2.6h2.9.1s0 0 .1.1v.1z"
                                    ></path>
                                    <path
                                      d="m193.8 69.4v.2.1s0 .1-.1.1h-.1-2.1v6.4.1s0 0-.1.1c0 0-.1 0-.2 0s-.1 0-.2 0-.2 0-.2 0c-.1 0-.1 0-.2 0s-.1 0-.1-.1c0 0 0 0 0-.1v-6.4h-2.1-.1s0 0-.1-.1v-.1c0-.1 0-.1 0-.2s0-.1 0-.2 0-.1 0-.1 0-.1.1-.1h.1 5.1.1s0 0 .1.1v.1c.1.1.1.1.1.2z"
                                    ></path>
                                    <path
                                      d="m197.8 73.5v2.7.1s0 0-.1.1c0 0-.1 0-.2 0s-.1 0-.2 0-.2 0-.2 0c-.1 0-.1 0-.2 0 0 0-.1 0-.1-.1 0 0 0 0 0-.1v-2.7l-2.1-4.1c0-.1-.1-.2-.1-.2v-.1s.1 0 .2-.1h.3.3.2s.1 0 .1.1c0 0 0 .1.1.1l1 2.1c.1.2.2.4.3.6s.2.4.3.7c.1-.2.2-.4.3-.6s.2-.4.3-.6l1-2.1v-.1s0 0 .1-.1h.2.2.3c.1 0 .1 0 .2.1v.1s0 .1-.1.2z"
                                    ></path>
                                    <path
                                      d="m184.5 26.2c-3.6 0-19.7 0-19.7 0s-6.6 0-6.6-6.6 5.1-8.7 8.7-8.7h29.1v-8.7s-26.2 0-31.3 0-18.2 2.9-18.2 17.5 10.2 17.5 16 17.5 15.3 0 18.2 0 6.6 2.2 6.6 6.6-2.2 9.5-7.3 9.5-32 0-32 0v8.7h35.7c3.6 0 15.3-2.2 15.3-18.2s-10.8-17.6-14.5-17.6z"
                                    ></path>
                                    <path
                                      d="m114.6 2.2c-8.8 0-16.8 3.8-22.2 9.9-9.6 1.3-18.3 2.7-26.3 4l-9.3-16.1-11.7 20.1c-58.1 12.2-55.6 24.2-17.7 30.4l-6.7 11.4h13.1l5.6-9.8c10.5 1.2 22.9 2 36.8 2.4l4.2 7.4h12.4l-26-44.6c7.7-1.7 16.3-3.4 25.5-5-4.7 5.3-7.5 12.2-7.5 19.8 0 16.5 13.4 29.9 29.9 29.9s29.9-13.4 29.9-29.9-13.5-29.9-30-29.9zm-80.6 36.9c-18.3-3.8-12-9.6 9.3-15.9zm35.4 3.5c-4.7-.2-9-.5-13-.8v-2.5h-9.7l10.4-18.2zm45.2 9.8c-11.3 0-20.4-9.1-20.4-20.4s9.1-20.4 20.4-20.4 20.4 9.2 20.4 20.4c0 11.3-9.1 20.4-20.4 20.4z"
                                    ></path>
                                  </svg>
                                  <svg
                                    id="TPsvg-PCSO_Pacific_Coast_Society_of_Orthodontics"
                                    class="TPsvg"
                                    style="fill: currentColor"
                                    enable-background="new 0 0 200 137.8"
                                    height="137.8"
                                    viewBox="0 0 200 137.8"
                                    width="200"
                                    xmlns="http://www.w3.org/2000/svg"
                                    aria-labelledby="TPsvg-PCSO_Pacific_Coast_Society_of_Orthodontics-title"
                                    role="img"
                                  >
                                    <title
                                      id="TPsvg-PCSO_Pacific_Coast_Society_of_Orthodontics-title"
                                    >
                                      Pacific Coast Society of Orthodontics logo
                                    </title>
                                    <path
                                      d="m198.3 7.7c-1.1-.1-2.2-.3-3.3-.2-2.2 0-4.4.1-6.7.3-29.7 3.1-57.7 11.8-84 26.1-11.9 6.5-23.8 12.9-36.2 18.3-15.1 6.6-31.1 9.2-47.5 5.8-6-1.2-11.8-3.6-17.8-5.5v13.3c4.6 1.5 9.2 4.1 13.8 4.2 12.8.4 26 1.7 38.3-1 16.1-3.5 31.7-9.9 47.1-15.9 18.7-7.4 37.6-10.2 56.2-1.4 11.3 5.4 21.4 13.2 32 20 1.8 1.2 3.3 2.7 5.6 4.7.5-3.7 1-6.5 1.3-9.3.9-7.5 2.7-49 2.7-53s-.9-4.1-1.5-6.4z"
                                    ></path>
                                    <path
                                      d="m33.8 78.9c-11.2-.8-22.5-.5-33.8-.7v2.7l7 2v48.3c-2.8.7-4.9 1.2-7 1.7v2.7h27.6c0-.6 0-1.3.1-1.9-2.6-.9-5.2-1.9-8.3-3 0-6.2 0-12.3 0-18.6 1.7.3 3.5 1.2 5.1.8 5.7-1.3 11.9-1.9 16.8-4.7 6.1-3.4 7.8-10 6.5-16.9-1.5-7.5-6.8-11.8-14-12.4zm-.4 25.2c-3.1 4.4-7.7 5.5-14.2 3.3 0-8 0-16.1 0-24.3 5.6-2.2 10.2-1.5 13.9 2.9s3.7 13.1.3 18.1z"
                                    ></path>
                                    <path
                                      d="m173.7 76.8c-11.2-.5-20.6 6.6-24.5 18.6-5.6 17.1 0 31.5 16.2 41.6 6.7 1.4 9.7.9 12 0 15.9-7.9 22.3-21.2 18.6-38.8-2.5-12.2-11.7-20.9-22.3-21.4zm9.4 49.1c-4.1 9.4-14.5 10.2-19.8 1.5-7.6-12.8-8.3-26.5-1.8-40 4.5-9.3 14.9-9.6 19.7-.4 3.4 6.4 5.4 13.9 5.2 20.5-.3 6.6-1 13-3.3 18.4z"
                                    ></path>
                                    <path
                                      d="m135.3 106.8c-3.4-2.5-7.3-4.1-11-6.2-2.5-1.4-5.7-2.5-7.1-4.7-1.7-2.6-3.3-6.8-2.4-9.3.9-2.6 4.7-5.1 7.7-5.8 5-1.1 8.8 1.9 11.4 6.3 1 1.7 2.1 3.5 3.1 5.2.8-.2 1.6-.5 2.4-.7-.5-4.3-1.1-8.5-1.7-13.2-4.9-.6-9-1.5-13.2-1.5-10.4-.1-18.2 5.1-20.2 12.9s1.7 13.9 11.5 19.4c2.1 1.2 4.4 2.2 6.5 3.4s4.2 2.5 6 4.1c3.3 2.9 4.5 6.5 2.8 10.8-1.9 4.6-5.6 6.1-10.2 5.8-6.2-.4-9.9-4.4-12.8-9.4-1.1-1.9-2.3-3.7-3.4-5.6-.8.3-1.5.6-2.3.8.7 5 1.5 9.9 2.1 14.3 3.2 1.5 5.3 2.5 7.5 3.5 4.9 1.2 9.8 1.1 14.7 0 2.2-1 4.5-1.8 6.6-3 11.4-6.2 12.5-19.5 2-27.1z"
                                    ></path>
                                    <path
                                      d="m91.5 126.5c-5.7 8.1-14.7 8.6-21.5 1.5-9.2-9.6-9.6-32.2-.7-42.2 7.3-8.1 18.7-6.3 23.3 3.7.7 1.4 1.4 2.8 2.1 4.3.7-.2 1.4-.3 2.1-.5-.5-4.8-1-9.5-1.5-13.9-23.3-7.7-41.1 3.7-42.6 26.3-1 14.6 5.4 24.2 20.8 31.2 4.9 1 9.8 1.4 14.7 0 1.9-.9 3.9-1.8 6.5-3 1-4.2 2.1-8.7 3.2-13.2-.7-.2-1.4-.4-2-.7-1.7 2.2-2.9 4.4-4.4 6.5z"
                                    ></path>
                                    <path
                                      d="m78.4 42.7c-15.8 1.8-31.1 1.3-45.3-6.8-14.2-8.3-22.4-21.3-29.2-35.9-.6 6.8-2.3 14.2.3 19.6 13.6 28.4 48.9 33.8 74.2 23.1z"
                                    ></path>
                                    <path
                                      d="m71.5 47.7c-27 5.8-51.3 2.5-70.3-20.1.5 5.9 1 11.9 1.5 17.5 13.1 12.9 49.6 14.4 68.8 2.6z"
                                    ></path>
                                  </svg>
                                  <svg
                                    id="TPsvg-ADA_American_Dental_Association"
                                    class="TPsvg"
                                    style="fill: currentColor"
                                    enable-background="new 0 0 200 69.7"
                                    height="69.7"
                                    viewBox="0 0 200 69.7"
                                    width="200"
                                    xmlns="http://www.w3.org/2000/svg"
                                    aria-labelledby="TPsvg-ADA_American_Dental_Association-title"
                                    role="img"
                                  >
                                    <title id="TPsvg-ADA_American_Dental_Association-title">
                                      American Dental Association logo
                                    </title>
                                    <path
                                      d="m73.6 34.9c0-10.6.1-21.2 0-31.8 0-2.2.4-3.1 2.9-3 8.2.1 16.5-.3 24.7.2 5 .3 10.1 1.1 14.7 2.8 8.5 3 13.2 9.9 15.1 18.5 1 4.6 1.7 9.5 1.6 14.2-.2 8.8-2 17.4-7.9 24.4-3.9 4.6-9 7.4-14.9 8.4-11.3 2-22.8.8-34.2 1.1-2.2.1-2-1.3-2-2.8 0-10.7 0-21.4 0-32zm14.4 22.1c5.2 0 10.1.4 14.9-.1 6.1-.7 11.2-2.7 13.5-10.3 2.2-7 1.9-14.1.7-21.2-.7-4.2-2.4-8.3-6.5-10.6-2.1-1.1-4.5-2.2-6.9-2.4-5.2-.3-10.5-.1-15.8-.1.1 15 .1 29.6.1 44.7z"
                                    ></path>
                                    <path
                                      d="m56.6 37.2c-4.4 0-8.5.1-12.6-.1-.7 0-1.7-1.3-2-2.2-2.5-6.5-4.8-13.1-7.2-19.6-.3-.1-.5-.1-.8-.2-3.5 9.4-6.9 18.9-10.5 28.7 1.4.1 2.4.2 3.4.2 9.3 0 18.6.1 27.9 0 2.9-.1 4.8 1.4 5.7 3.6 2.9 6.8 5.4 13.8 8 20.7.1.3 0 .7 0 1.4-4.4 0-8.8.1-13.1-.1-.7 0-1.7-1.5-2-2.5-1.2-3.1-2.3-6.2-3.2-9.4-.6-2-1.7-2.7-3.7-2.6-8.1.1-16.2.1-24.2 0-1.8 0-2.8.5-3.3 2.4-1 3.6-2.3 7.1-3.6 10.6-.3.7-1 1.7-1.6 1.7-4.5-.1-9-.2-13.8-.2 2.1-5.6 3.9-10.8 5.9-16 6.5-17.1 13.1-34.3 19.6-51.6.6-1.5 1.2-2.1 2.8-2 3.4.2 6.9.4 10.3.5 3.2.1 4.7 2 5.7 4.7 3.5 9.2 7.1 18.5 10.6 27.7.6 1.3 1 2.6 1.7 4.3z"
                                    ></path>
                                    <path
                                      d="m187.6 37.2c-4.6 0-8.8.1-13-.1-.5 0-1.1-1.1-1.4-1.9-2.3-6.1-4.5-12.2-6.7-18.2-.3-.7-.5-1.4-1.1-2.9-3.7 10.3-7.2 19.8-10.9 29.9h3.5 28.4c2.4 0 4.3 1 5.1 3.2 2.9 7.4 5.6 14.8 8.6 22.5-4.7 0-9.2.1-13.7-.1-.6 0-1.4-1.1-1.7-1.9-1.3-3.4-2.5-6.9-3.6-10.4-.5-1.6-1.2-2.4-3-2.4-8.4.1-16.8.1-25.3 0-1.6 0-2.4.6-2.8 2-1.1 3.6-2.4 7.1-3.5 10.7-.4 1.5-1.1 2.1-2.7 2.1-4.2-.1-8.3 0-12.8 0 2.2-5.9 4.3-11.6 6.4-17.2 6.1-16.5 12.4-32.9 18.6-49.3.8-2.2 1.8-3.4 4.4-3.1 3.3.4 6.7.4 10 .6 2.4.2 3.7 1.6 4.6 3.9 4 10.7 8.2 21.3 12.6 32.6z"
                                    ></path>
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                `
        || props.name === 'video-reviews-1' && html`
                  <style>
                    ${`.${props.name} #TPsvg-5-stars-rounded { width: 100%; max-width: 150px; height: auto; margin-bottom: 10px; color: gold; } .${props.name} #carousel-reviews { margin-bottom:25px; } .${props.name} .carousel-indicators { z-index:4; bottom:-50px!important; } .${props.name} .carousel-indicators li {border: 1px solid currentColor;} .${props.name} .carousel-indicators .active {background-color: currentColor;}`}
                  </style>
                  <div class="TPbw TPBandCol">
                    <table
                      width="100%"
                      class="TPartBox"
                      border="0"
                      cellspacing="0"
                      cellpadding="0"
                    >
                      <tbody>
                        <tr valign="top">
                          <td id="" class="TParticle">
                            <div class="container-fluid TPbs-carousel">
                              <div
                                class="carousel slide"
                                id="carousel-reviews"
                                data-ride="carousel"
                                data-interval="false"
                              >
                                <ol class="carousel-indicators">
                                  <li
                                    data-target="#carousel-reviews"
                                    data-slide-to="0"
                                    class="active"
                                  ></li>
                                  <li
                                    data-target="#carousel-reviews"
                                    data-slide-to="1"
                                    class=""
                                  ></li>
                                  <li
                                    data-target="#carousel-reviews"
                                    data-slide-to="2"
                                    class=""
                                  ></li>
                                </ol>
                                <div class="carousel-inner" role="listbox">
                                  <div class="item active">
                                    <div class="TProw">
                                      <div class="TPcol-xs-12">
                                        <div
                                          class="TPinline-block aos-init aos-animate"
                                          data-aos="fade-up"
                                          data-aos-duration="800"
                                          data-aos-delay="0"
                                        >
                                          <svg
                                            id="TPsvg-5-stars-rounded"
                                            class="TPsvg"
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="480.1"
                                            height="90.5"
                                            fill="currentColor"
                                            viewBox="0 0 480.1 90.5"
                                          >
                                            <path
                                              d="M22.7 90.5c-1.6 0-3.1-.5-4.4-1.4-2.3-1.7-3.5-4.5-3-7.3l4-23.4-17-16.6c-2-2-2.8-5-1.9-7.7.9-2.7 3.2-4.7 6.1-5.1l23.5-3.4L40.4 4.2C41.7 1.6 44.3 0 47.2 0l0 0c2.9 0 5.5 1.6 6.7 4.2l10.5 21.3 23.5 3.4c2.8.4 5.2 2.4 6.1 5.1.9 2.7.1 5.7-1.9 7.7l-17 16.6 4 23.4c.5 2.8-.7 5.7-3 7.3-2.3 1.7-5.4 1.9-7.9.6l-21-11.1-21 11.1C25 90.2 23.8 90.5 22.7 90.5zM168.1 90.5c-1.2 0-2.4-.3-3.5-.9l-21-11.1-21 11.1c-2.5 1.3-5.6 1.1-7.9-.6-2.3-1.7-3.5-4.5-3-7.3l4-23.4-17-16.6c-2-2-2.8-5-1.9-7.7.9-2.7 3.2-4.7 6.1-5.1l23.5-3.4 10.5-21.3c1.3-2.6 3.9-4.2 6.7-4.2 2.9 0 5.5 1.6 6.7 4.2l10.5 21.3 23.5 3.4c2.8.4 5.2 2.4 6.1 5.1.9 2.7.1 5.7-1.9 7.7l-17 16.6 4 23.4c.5 2.8-.7 5.7-3 7.3C171.2 90 169.7 90.5 168.1 90.5zM264.6 90.5c-1.2 0-2.4-.3-3.5-.9l-21-11.1-21 11.1c-2.5 1.3-5.6 1.1-7.9-.6-2.3-1.7-3.5-4.5-3-7.3l4-23.4-17-16.6c-2-2-2.8-5-1.9-7.7.9-2.7 3.2-4.7 6.1-5.1l23.5-3.4 10.5-21.3c1.3-2.6 3.9-4.2 6.7-4.2 2.9 0 5.5 1.6 6.7 4.2l10.5 21.3 23.5 3.4c2.8.4 5.2 2.4 6.1 5.1.9 2.7.1 5.7-1.9 7.7l-17 16.6 4 23.4c.5 2.8-.7 5.7-3 7.3C267.7 90 266.1 90.5 264.6 90.5zM361 90.5c-1.2 0-2.4-.3-3.5-.9l-21-11.1-21 11.1c-2.5 1.3-5.6 1.1-7.9-.6-2.3-1.7-3.5-4.5-3-7.3l4-23.4-17-16.6c-2-2-2.8-5-1.9-7.7.9-2.7 3.2-4.7 6.1-5.1l23.5-3.4 10.5-21.3c1.3-2.6 3.9-4.2 6.7-4.2s5.5 1.6 6.7 4.2l10.5 21.3 23.5 3.4c2.8.4 5.2 2.4 6.1 5.1.9 2.7.1 5.7-1.9 7.7l-17 16.6 4 23.4c.5 2.8-.7 5.7-3 7.3C364.1 90 362.6 90.5 361 90.5zM457.4 90.5c-1.2 0-2.4-.3-3.5-.9l-21-11.1-21 11.1c-2.5 1.3-5.6 1.1-7.9-.6-2.3-1.7-3.5-4.5-3-7.3l4-23.4-17-16.6c-2-2-2.8-5-1.9-7.7.9-2.7 3.2-4.7 6.1-5.1l23.5-3.4 10.5-21.3c1.3-2.6 3.9-4.2 6.7-4.2s5.5 1.6 6.7 4.2l10.5 21.3 23.5 3.4c2.8.4 5.2 2.4 6.1 5.1.9 2.7.1 5.7-1.9 7.7l-17 16.6 4 23.4c.5 2.8-.7 5.7-3 7.3C460.6 90 459 90.5 457.4 90.5z"
                                            ></path>
                                          </svg>
                                        </div>
                                      </div>
                                    </div>
                                    <div class="TProw">
                                      <div class="TPcol-xs-12">
                                        <div
                                          class="TPinline-block aos-init aos-animate"
                                          data-aos="fade-up"
                                          data-aos-duration="800"
                                          data-aos-delay="100"
                                        >
                                          <h2 class="H2">"Feeling Relaxed and Confident"</h2>
                                        </div>
                                      </div>
                                    </div>
                                    <div class="TProw">
                                      <div class="TPcol-md-4 TPcol-md-push-8">
                                        <div class="TPvideo-container">
                                          <div
                                            class="TPembed-responsive TPembed-responsive-16by9"
                                          >
                                            <iframe
                                              class="TPembed-responsive-item"
                                              src="https://www.youtube.com/embed/NpEaa2P7qZI?rel=0"
                                            ></iframe>
                                          </div>
                                        </div>
                                      </div>
                                      <div class="TPcol-md-8 TPcol-md-pull-4">
                                        Lorem ipsum dolor sit amet, consectetur
                                        adipisicing elit. Iste, cumque vero? Id, fugit illum
                                        veniam voluptates placeat voluptatem quae harum sapiente
                                        quia soluta odio maiores error, iure minus explicabo
                                        libero! Lorem ipsum dolor sit amet, consectetur
                                        adipisicing elit. Voluptatem voluptatum quisquam
                                        distinctio harum beatae, sapiente officiis temporibus,
                                        eligendi architecto asperiores ad molestiae nesciunt
                                        voluptas esse quod minima saepe omnis nobis?
                                      </div>
                                    </div>
                                  </div>
                                  <div class="item">
                                    <div class="TProw">
                                      <div class="TPcol-xs-12">
                                        <div
                                          class="TPinline-block aos-init aos-animate"
                                          data-aos="fade-up"
                                          data-aos-duration="800"
                                          data-aos-delay="0"
                                        >
                                          <svg
                                            id="TPsvg-5-stars-rounded"
                                            class="TPsvg"
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="480.1"
                                            height="90.5"
                                            fill="currentColor"
                                            viewBox="0 0 480.1 90.5"
                                          >
                                            <path
                                              d="M22.7 90.5c-1.6 0-3.1-.5-4.4-1.4-2.3-1.7-3.5-4.5-3-7.3l4-23.4-17-16.6c-2-2-2.8-5-1.9-7.7.9-2.7 3.2-4.7 6.1-5.1l23.5-3.4L40.4 4.2C41.7 1.6 44.3 0 47.2 0l0 0c2.9 0 5.5 1.6 6.7 4.2l10.5 21.3 23.5 3.4c2.8.4 5.2 2.4 6.1 5.1.9 2.7.1 5.7-1.9 7.7l-17 16.6 4 23.4c.5 2.8-.7 5.7-3 7.3-2.3 1.7-5.4 1.9-7.9.6l-21-11.1-21 11.1C25 90.2 23.8 90.5 22.7 90.5zM168.1 90.5c-1.2 0-2.4-.3-3.5-.9l-21-11.1-21 11.1c-2.5 1.3-5.6 1.1-7.9-.6-2.3-1.7-3.5-4.5-3-7.3l4-23.4-17-16.6c-2-2-2.8-5-1.9-7.7.9-2.7 3.2-4.7 6.1-5.1l23.5-3.4 10.5-21.3c1.3-2.6 3.9-4.2 6.7-4.2 2.9 0 5.5 1.6 6.7 4.2l10.5 21.3 23.5 3.4c2.8.4 5.2 2.4 6.1 5.1.9 2.7.1 5.7-1.9 7.7l-17 16.6 4 23.4c.5 2.8-.7 5.7-3 7.3C171.2 90 169.7 90.5 168.1 90.5zM264.6 90.5c-1.2 0-2.4-.3-3.5-.9l-21-11.1-21 11.1c-2.5 1.3-5.6 1.1-7.9-.6-2.3-1.7-3.5-4.5-3-7.3l4-23.4-17-16.6c-2-2-2.8-5-1.9-7.7.9-2.7 3.2-4.7 6.1-5.1l23.5-3.4 10.5-21.3c1.3-2.6 3.9-4.2 6.7-4.2 2.9 0 5.5 1.6 6.7 4.2l10.5 21.3 23.5 3.4c2.8.4 5.2 2.4 6.1 5.1.9 2.7.1 5.7-1.9 7.7l-17 16.6 4 23.4c.5 2.8-.7 5.7-3 7.3C267.7 90 266.1 90.5 264.6 90.5zM361 90.5c-1.2 0-2.4-.3-3.5-.9l-21-11.1-21 11.1c-2.5 1.3-5.6 1.1-7.9-.6-2.3-1.7-3.5-4.5-3-7.3l4-23.4-17-16.6c-2-2-2.8-5-1.9-7.7.9-2.7 3.2-4.7 6.1-5.1l23.5-3.4 10.5-21.3c1.3-2.6 3.9-4.2 6.7-4.2s5.5 1.6 6.7 4.2l10.5 21.3 23.5 3.4c2.8.4 5.2 2.4 6.1 5.1.9 2.7.1 5.7-1.9 7.7l-17 16.6 4 23.4c.5 2.8-.7 5.7-3 7.3C364.1 90 362.6 90.5 361 90.5zM457.4 90.5c-1.2 0-2.4-.3-3.5-.9l-21-11.1-21 11.1c-2.5 1.3-5.6 1.1-7.9-.6-2.3-1.7-3.5-4.5-3-7.3l4-23.4-17-16.6c-2-2-2.8-5-1.9-7.7.9-2.7 3.2-4.7 6.1-5.1l23.5-3.4 10.5-21.3c1.3-2.6 3.9-4.2 6.7-4.2s5.5 1.6 6.7 4.2l10.5 21.3 23.5 3.4c2.8.4 5.2 2.4 6.1 5.1.9 2.7.1 5.7-1.9 7.7l-17 16.6 4 23.4c.5 2.8-.7 5.7-3 7.3C460.6 90 459 90.5 457.4 90.5z"
                                            ></path>
                                          </svg>
                                        </div>
                                      </div>
                                    </div>
                                    <div class="TProw">
                                      <div class="TPcol-xs-12">
                                        <div
                                          class="TPinline-block aos-init aos-animate"
                                          data-aos="fade-up"
                                          data-aos-duration="800"
                                          data-aos-delay="100"
                                        >
                                          <h2 class="H2">"Feeling Relaxed and Confident"</h2>
                                        </div>
                                      </div>
                                    </div>
                                    <div class="TProw">
                                      <div class="TPcol-md-4 TPcol-md-push-8">
                                        <div class="TPvideo-container">
                                          <div
                                            class="TPembed-responsive TPembed-responsive-16by9"
                                          >
                                            <iframe
                                              class="TPembed-responsive-item"
                                              src="https://www.youtube.com/embed/NpEaa2P7qZI?rel=0"
                                            ></iframe>
                                          </div>
                                        </div>
                                      </div>
                                      <div class="TPcol-md-8 TPcol-md-pull-4">
                                        Lorem, ipsum dolor sit amet consectetur
                                        adipisicing elit. Minima non earum voluptas. Amet
                                        reiciendis voluptates soluta aperiam eius, dolores numquam
                                        corrupti perspiciatis totam nihil veritatis repellendus
                                        quaerat tempore accusamus suscipit. Lorem ipsum dolor sit
                                        amet consectetur, adipisicing elit. Atque odit, numquam
                                        omnis nisi laborum incidunt impedit dolores, quam maxime
                                        obcaecati ratione vitae repellendus quis ipsam perferendis
                                        molestiae saepe ad molestias.
                                      </div>
                                    </div>
                                  </div>
                                  <div class="item">
                                    <div class="TProw">
                                      <div class="TPcol-xs-12">
                                        <div
                                          class="TPinline-block aos-init aos-animate"
                                          data-aos="fade-up"
                                          data-aos-duration="800"
                                          data-aos-delay="0"
                                        >
                                          <svg
                                            id="TPsvg-5-stars-rounded"
                                            class="TPsvg"
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="480.1"
                                            height="90.5"
                                            fill="currentColor"
                                            viewBox="0 0 480.1 90.5"
                                          >
                                            <path
                                              d="M22.7 90.5c-1.6 0-3.1-.5-4.4-1.4-2.3-1.7-3.5-4.5-3-7.3l4-23.4-17-16.6c-2-2-2.8-5-1.9-7.7.9-2.7 3.2-4.7 6.1-5.1l23.5-3.4L40.4 4.2C41.7 1.6 44.3 0 47.2 0l0 0c2.9 0 5.5 1.6 6.7 4.2l10.5 21.3 23.5 3.4c2.8.4 5.2 2.4 6.1 5.1.9 2.7.1 5.7-1.9 7.7l-17 16.6 4 23.4c.5 2.8-.7 5.7-3 7.3-2.3 1.7-5.4 1.9-7.9.6l-21-11.1-21 11.1C25 90.2 23.8 90.5 22.7 90.5zM168.1 90.5c-1.2 0-2.4-.3-3.5-.9l-21-11.1-21 11.1c-2.5 1.3-5.6 1.1-7.9-.6-2.3-1.7-3.5-4.5-3-7.3l4-23.4-17-16.6c-2-2-2.8-5-1.9-7.7.9-2.7 3.2-4.7 6.1-5.1l23.5-3.4 10.5-21.3c1.3-2.6 3.9-4.2 6.7-4.2 2.9 0 5.5 1.6 6.7 4.2l10.5 21.3 23.5 3.4c2.8.4 5.2 2.4 6.1 5.1.9 2.7.1 5.7-1.9 7.7l-17 16.6 4 23.4c.5 2.8-.7 5.7-3 7.3C171.2 90 169.7 90.5 168.1 90.5zM264.6 90.5c-1.2 0-2.4-.3-3.5-.9l-21-11.1-21 11.1c-2.5 1.3-5.6 1.1-7.9-.6-2.3-1.7-3.5-4.5-3-7.3l4-23.4-17-16.6c-2-2-2.8-5-1.9-7.7.9-2.7 3.2-4.7 6.1-5.1l23.5-3.4 10.5-21.3c1.3-2.6 3.9-4.2 6.7-4.2 2.9 0 5.5 1.6 6.7 4.2l10.5 21.3 23.5 3.4c2.8.4 5.2 2.4 6.1 5.1.9 2.7.1 5.7-1.9 7.7l-17 16.6 4 23.4c.5 2.8-.7 5.7-3 7.3C267.7 90 266.1 90.5 264.6 90.5zM361 90.5c-1.2 0-2.4-.3-3.5-.9l-21-11.1-21 11.1c-2.5 1.3-5.6 1.1-7.9-.6-2.3-1.7-3.5-4.5-3-7.3l4-23.4-17-16.6c-2-2-2.8-5-1.9-7.7.9-2.7 3.2-4.7 6.1-5.1l23.5-3.4 10.5-21.3c1.3-2.6 3.9-4.2 6.7-4.2s5.5 1.6 6.7 4.2l10.5 21.3 23.5 3.4c2.8.4 5.2 2.4 6.1 5.1.9 2.7.1 5.7-1.9 7.7l-17 16.6 4 23.4c.5 2.8-.7 5.7-3 7.3C364.1 90 362.6 90.5 361 90.5zM457.4 90.5c-1.2 0-2.4-.3-3.5-.9l-21-11.1-21 11.1c-2.5 1.3-5.6 1.1-7.9-.6-2.3-1.7-3.5-4.5-3-7.3l4-23.4-17-16.6c-2-2-2.8-5-1.9-7.7.9-2.7 3.2-4.7 6.1-5.1l23.5-3.4 10.5-21.3c1.3-2.6 3.9-4.2 6.7-4.2s5.5 1.6 6.7 4.2l10.5 21.3 23.5 3.4c2.8.4 5.2 2.4 6.1 5.1.9 2.7.1 5.7-1.9 7.7l-17 16.6 4 23.4c.5 2.8-.7 5.7-3 7.3C460.6 90 459 90.5 457.4 90.5z"
                                            ></path>
                                          </svg>
                                        </div>
                                      </div>
                                    </div>
                                    <div class="TProw">
                                      <div class="TPcol-xs-12">
                                        <div
                                          class="TPinline-block aos-init aos-animate"
                                          data-aos="fade-up"
                                          data-aos-duration="800"
                                          data-aos-delay="100"
                                        >
                                          <h2 class="H2">"Feeling Relaxed and Confident"</h2>
                                        </div>
                                      </div>
                                    </div>
                                    <div class="TProw">
                                      <div class="TPcol-md-4 TPcol-md-push-8">
                                        <div class="TPvideo-container">
                                          <div
                                            class="TPembed-responsive TPembed-responsive-16by9"
                                          >
                                            <iframe
                                              class="TPembed-responsive-item"
                                              src="https://www.youtube.com/embed/NpEaa2P7qZI?rel=0"
                                            ></iframe>
                                          </div>
                                        </div>
                                      </div>
                                      <div class="TPcol-md-8 TPcol-md-pull-4">
                                        Lorem ipsum dolor sit amet consectetur
                                        adipisicing elit. Harum recusandae sed ullam architecto,
                                        dolorum eum inventore voluptate! Voluptatum ipsum
                                        similique ea, labore ratione earum cumque vel, culpa vero,
                                        animi unde! Lorem ipsum, dolor sit amet consectetur
                                        adipisicing elit. Corporis ipsa repudiandae ex voluptatum
                                        illo rerum est id vitae minus, porro at soluta ad, error
                                        accusantium sapiente quas minima neque distinctio.
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <br title="b11" />
                            <center>
                              <div
                                class="TPinline-block aos-init aos-animate"
                                data-aos="fade-up"
                                data-aos-duration="800"
                                data-aos-delay="600"
                              >
                                <a
                                  class="TPbtn TPbtn-default"
                                  href="#"
                                  title="Patient Testimonials New York Oral, Maxillofacial, and Implant Surgery Scarsdale, NY dental implants Scarsdale NY"
                                  >Read more reviews</a
                                >
                                <br />
                                <br title="b11" /><a
                                  class="TPbtn TPbtn-default"
                                  href="#"
                                  target="_blank"
                                  >Leave a Review</a
                                >
                              </div>
                            </center>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                `
        || props.name === 'services-1' && html`
                  <style>
                    ${`.${props.name} .TPbtn-service { font-family:Montserrat, sans-serif; text-transform: uppercase; border: 1px solid #352D26; display: block; padding: 20px 30px; margin: 20px 0; background: rgba(61, 51, 43, 0.6); } .${props.name} .TPbtn-service:hover, .${props.name} .TPbtn-service:active, .${props.name} .TPbtn-service:focus { background: #fff; } .${props.name} .TPbtn-service, .${props.name} .TPbtn-service H3 { color: #fff; text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.5); transition: .25s all; } .${props.name} .TPbtn-service:hover, .${props.name} .TPbtn-service:hover H3, .${props.name} .TPbtn-service:active, .${props.name} .TPbtn-service:active H3 { color: #90aa48; text-decoration: none; text-shadow: none; } .${props.name} .TPbtn-service .TPmedia-left { padding-right: 20px; } .${props.name} .TPbtn-service svg { width: 50px; height: 50px; }`}
                  </style>
                  <div class="TPbw TPBandCol ">
                    <table
                      width="100%"
                      class="TPartBox "
                      border="0"
                      cellspacing="0"
                      cellpadding="0"
                    >
                      <tbody>
                        <tr valign="top">
                          <td id="" class="TParticle">
                            <div class="TProw TPservices">
                              <div class="TPcol-md-10 TPcol-md-offset-1 TPtext-center">
                                <h2 class="TPtitle TPtext-white TPtext-shadow">Our Services</h2>
                              </div>
                              <br title="b11" />
                              <div class="TPcol-lg-10 TPcol-lg-offset-1">
                                <div class="TProw">
                                  <div
                                    data-aos="zoom-in-up"
                                    data-aos-duration="800"
                                    class="aos-init aos-animate"
                                  >
                                    <div class="TPcol-xxs-12 TPcol-xs-6 TPcol-md-4">
                                      <span class="TPmedia TPbtn-service"
                                        ><div class="TPmedia-left">
                                          <svg
                                            version="1.1"
                                            id="TPsvg-implant"
                                            class="TPsvg"
                                            xmlns="http://www.w3.org/2000/svg"
                                            xmlns:xlink="http://www.w3.org/1999/xlink"
                                            x="0"
                                            y="0"
                                            width="56.8"
                                            height="88.8"
                                            viewBox="0 0 56.8 88.8"
                                            xml:space="preserve"
                                            enable-background="new 0 0 56.8 88.8"
                                            aria-labelledby="TPsvg-implant-title"
                                            aria-describedby="TPsvg-implant-description"
                                            role="img"
                                          >
                                            <title id="TPsvg-implant-title">
                                              Dental implant icon
                                            </title>
                                            <desc id="TPsvg-implant-description">
                                              Simplified dental crown affixed to a dental implant
                                              screw
                                            </desc>
                                            <style type="text/css">
                                              ${`#TPsvg-implant .st0,
                                              #TPsvg-implant .st1,
                                              #TPsvg-implant .st2,
                                              #TPsvg-implant .st3 {
                                                fill: none;
                                                stroke: currentColor;
                                                stroke-width: 4.5;
                                                stroke-miterlimit: 10;
                                              }
                                              #TPsvg-implant .st1 {
                                                stroke-linejoin: round;
                                              }
                                              #TPsvg-implant .st2,
                                              #TPsvg-implant .st3 {
                                                stroke-linecap: round;
                                                stroke-linejoin: round;
                                              }`}
                                            </style>
                                            <g>
                                              <rect
                                                x="13.3"
                                                y="37.3"
                                                class="st0"
                                                width="30.2"
                                                height="7.9"
                                              ></rect>
                                              <polygon
                                                class="st1"
                                                points="38.7,77.5 28.4,86.6 18,77.5"
                                              ></polygon>
                                              <polygon
                                                class="st0"
                                                points="38.7,55.8 18,51.2 18,45.2 38.7,45.2"
                                              ></polygon>
                                              <polyline
                                                class="st0"
                                                points="38.7,61.6 38.7,67.8 18,63.2 18,57"
                                              ></polyline>
                                              <polyline
                                                class="st0"
                                                points="38.7,73.6 38.7,77.5 18,77.5 18,69"
                                              ></polyline>
                                              <path
                                                class="st2"
                                                d="M54.5,14.3c-0.2-4.6-2-7.3-4.8-9.3C46.9,3.1,42.9,2.2,39,2.3c-3.6,0-7.2,0.8-9.7,1.8l-1,0.4l-1-0.4 c-1.9-0.9-4.7-1.5-7.5-1.8l-5,0.1C12,2.7,9.2,3.6,7,5c-2.8,1.9-4.6,4.6-4.8,9.3c0,0.4,0,5.5,4.2,14.9c2.1,4.7,3.2,8.2,3.2,8.2h37.5 c0,0,1.4-4.3,3.1-8.1c2.2-4.9,3.9-9.4,4.2-13.9C54.5,15,54.5,14.6,54.5,14.3z"
                                              ></path>
                                              <line
                                                class="st3"
                                                x1="28.4"
                                                y1="4.5"
                                                x2="38.1"
                                                y2="9.7"
                                              ></line>
                                              <line
                                                class="st0"
                                                x1="13.3"
                                                y1="50.1"
                                                x2="43.5"
                                                y2="56.9"
                                              ></line>
                                              <line
                                                class="st0"
                                                x1="13.3"
                                                y1="62.1"
                                                x2="43.5"
                                                y2="68.9"
                                              ></line>
                                            </g>
                                          </svg>
                                        </div>
                                        <div class="TPmedia-body TPmedia-middle">
                                          <h3 class="H3">Dental<br />Implants</h3>
                                        </div></span
                                      >
                                    </div>
                                  </div>
                                  <div
                                    data-aos="zoom-in-up"
                                    data-aos-duration="800"
                                    data-aos-delay="100"
                                    class="aos-init aos-animate"
                                  >
                                    <div class="TPcol-xxs-12 TPcol-xs-6 TPcol-md-4">
                                      <span class="TPmedia TPbtn-service"
                                        ><div class="TPmedia-left">
                                          <svg
                                            version="1.1"
                                            id="TPsvg-placed-crown"
                                            class="TPsvg"
                                            xmlns="http://www.w3.org/2000/svg"
                                            xmlns:xlink="http://www.w3.org/1999/xlink"
                                            x="0"
                                            y="0"
                                            width="76.9"
                                            height="88.5"
                                            viewBox="0 0 76.9 88.5"
                                            xml:space="preserve"
                                            enable-background="new 0 0 76.9 88.5"
                                          >
                                            <style type="text/css">
                                              ${`#TPsvg-placed-crown .st0 {
                                                fill: none;
                                                stroke: currentColor;
                                                stroke-width: 4.5;
                                                stroke-linecap: round;
                                                stroke-linejoin: round;
                                                stroke-miterlimit: 10;
                                              }`}
                                            </style>
                                            <g>
                                              <path
                                                class="st0"
                                                d="M74.7,18.9C74.4,12.5,71.9,8.8,68,6.1c-3.9-2.6-9.4-3.9-14.8-3.8c-5.1,0-10,1.1-13.4,2.6l-1.4,0.6l-1.3-0.6 c-2.7-1.2-6.5-2.1-10.4-2.5l-6.9,0.1c-4.1,0.5-7.9,1.6-10.9,3.6C5,8.8,2.5,12.5,2.3,18.9c0,0.5,0,1,0,1.4c0.1,9.1,2.2,12.4,4.7,17 c2.6,4.5,5.6,10.3,5.5,21c0,12.4,2.1,19.7,4.4,23.5c2.3,3.9,3.1,4.5,5.6,4.5c2.7,0,3.6-2.7,3.7-4.1c0.5-5.2-0.4-13.5,2.2-22.2 c0.7-2.4,1.7-5.5,3.5-8.2c2.4-3.7,9.1-6.6,13.2,0c1.7,2.8,2.7,5.8,3.5,8.2c2,6.7,2.6,13.6,2.1,19c-0.6,7.4,3.7,7.4,3.8,7.4 c2.3,0,3.3-0.6,5.6-4.5c2.3-3.8,4.4-11.1,4.4-23.5c-0.1-10.7,2.9-16.5,5.5-21c2.5-4.6,4.6-7.9,4.7-17 C74.7,19.9,74.7,19.4,74.7,18.9z"
                                              ></path>
                                              <line
                                                class="st0"
                                                x1="38.5"
                                                y1="5.4"
                                                x2="47.7"
                                                y2="10.3"
                                              ></line>
                                              <path
                                                class="st0"
                                                d="M67.6,41.9H55.4c0,0-3.6,0.1-4.6-3.4v-4.5c0,0,0.4-3.9-3.9-3.9H30c-4.3,0-3.9,3.9-3.9,3.9v4.5 c-1,3.4-4.6,3.4-4.6,3.4H9.3"
                                              ></path>
                                            </g>
                                          </svg>
                                        </div>
                                        <div class="TPmedia-body TPmedia-middle">
                                          <h3 class="H3">Dental<br />Crowns</h3>
                                        </div></span
                                      >
                                    </div>
                                  </div>
                                  <div
                                    data-aos="zoom-in-up"
                                    data-aos-duration="800"
                                    data-aos-delay="200"
                                    class="aos-init aos-animate"
                                  >
                                    <div class="TPcol-xxs-12 TPcol-xs-6 TPcol-md-4">
                                      <span class="TPmedia TPbtn-service"
                                        ><div class="TPmedia-left">
                                          <svg
                                            version="1.1"
                                            id="TPsvg-veneers"
                                            class="TPsvg"
                                            xmlns="http://www.w3.org/2000/svg"
                                            xmlns:xlink="http://www.w3.org/1999/xlink"
                                            x="0"
                                            y="0"
                                            width="92.4"
                                            height="89"
                                            viewBox="0 0 92.4 89"
                                            xml:space="preserve"
                                            enable-background="new 0 0 92.4 89"
                                          >
                                            <style type="text/css">
                                              ${`#TPsvg-veneers .st0 {
                                                stroke-linecap: round;
                                                stroke-linejoin: round;
                                              }
                                              #TPsvg-veneers .st0,
                                              #TPsvg-veneers .st1,
                                              #TPsvg-veneers .st2 {
                                                fill: none;
                                                stroke: currentColor;
                                                stroke-width: 4.5;
                                                stroke-miterlimit: 10;
                                              }
                                              #TPsvg-veneers .st2 {
                                                stroke-linejoin: round;
                                              }`}
                                            </style>
                                            <g>
                                              <path
                                                class="st0"
                                                d="M7.4,35.9v9.3c0,2.2,1.8,4,4,4h7.5c2.2,0,4-1.8,4-4v-3.5c0,0-0.8-15.8-10.1-15.8C7.4,25.9,7.4,35.9,7.4,35.9z"
                                              ></path>
                                              <path
                                                class="st0"
                                                d="M45.9,39.8c-0.8-5.3-3.3-12.1-11.3-12.1c-13.1,0-11.6,18.1-11.6,18.1v4.1c0,2.5,2.1,4.6,4.6,4.6"
                                              ></path>
                                              <path
                                                class="st0"
                                                d="M53.7,54.5h11.2c2.5,0,4.6-2.1,4.6-4.6v-4.1c0,0,1.4-18.1-11.6-18.1c-8.1,0-10.6,6.3-11.4,11.5"
                                              ></path>
                                              <path
                                                class="st1"
                                                d="M68.5,88.5l-3.1-12.6L45.3,58c0,0-1.7-0.9-0.7-2.7c0.7-1.2,2.3,0,2.3,0l25.7,13.8c1,0.7,1.7,1.8,1.9,2.9 l3.5,14.4"
                                              ></path>
                                              <polyline
                                                class="st2"
                                                points="48.6,68.3 60.5,81.1 60.5,88.5"
                                              ></polyline>
                                              <path
                                                class="st2"
                                                d="M53.3,65.1c-0.8,1.8-2.6,3.1-4.7,3.1H33.1c-2.8,0-5.1-2.3-5.1-5.1v-4.5c0,0-1.6-20,12.8-20 c14.4,0,12.8,20,12.8,20"
                                              ></path>
                                              <path
                                                class="st0"
                                                d="M7.4,38.8c0,0-3,0.7-4.5-3c-1.5-3.7,0-14.9,0-14.9S7.1,2.2,46.5,2.2c39.4,0,43,18.7,43,18.7s1.5,11.2,0,14.9 c-1.5,3.7-4.5,3-4.5,3"
                                              ></path>
                                              <path
                                                class="st0"
                                                d="M85,35.9v9.3c0,2.2-1.8,4-4,4h-7.5c-2.2,0-4-1.8-4-4v-3.5c0,0,0.8-15.8,10.1-15.8C85,25.9,85,35.9,85,35.9z"
                                              ></path>
                                            </g>
                                          </svg>
                                        </div>
                                        <div class="TPmedia-body TPmedia-middle">
                                          <h3 class="H3">Porcelain<br />Veneers</h3>
                                        </div></span
                                      >
                                    </div>
                                  </div>
                                  <div
                                    data-aos="zoom-in-up"
                                    data-aos-duration="800"
                                    data-aos-delay="300"
                                    class="aos-init aos-animate"
                                  >
                                    <div class="TPcol-xxs-12 TPcol-xs-6 TPcol-md-4">
                                      <span class="TPmedia TPbtn-service"
                                        ><div class="TPmedia-left">
                                          <svg
                                            version="1.1"
                                            id="TPsvg-root-canal"
                                            class="TPsvg"
                                            xmlns="http://www.w3.org/2000/svg"
                                            xmlns:xlink="http://www.w3.org/1999/xlink"
                                            x="0"
                                            y="0"
                                            width="87.9"
                                            height="108.1"
                                            viewBox="0 0 87.9 108.1"
                                            xml:space="preserve"
                                            enable-background="new 0 0 87.9 108.1"
                                          >
                                            <style type="text/css">
                                              ${`#TPsvg-root-canal .st0 {
                                                stroke-linecap: round;
                                                stroke-linejoin: round;
                                              }
                                              #TPsvg-root-canal .st0,
                                              #TPsvg-root-canal .st1,
                                              #TPsvg-root-canal .st2 {
                                                fill: none;
                                                stroke: currentColor;
                                                stroke-width: 4.5;
                                                stroke-miterlimit: 10;
                                              }
                                              #TPsvg-root-canal .st2 {
                                                stroke-linejoin: round;
                                              }`}
                                            </style>
                                            <g>
                                              <path
                                                class="st0"
                                                d="M72.8,43.3c-0.2-5.6-2.4-8.8-5.7-11.1c-3.4-2.3-8.1-3.3-12.8-3.3c-4.4,0-8.7,0.9-11.6,2.2l-1.2,0.5l-1.2-0.5 c-2.3-1.1-5.6-1.8-9-2.1l-6,0.1c-3.5,0.4-6.9,1.4-9.4,3.2c-3.3,2.3-5.5,5.5-5.7,11.1c0,0.5,0,0.9,0,1.2c0.1,7.9,1.9,10.7,4.1,14.7 c2.3,3.9,4.8,8.9,4.8,18.2c0,10.7,1.8,17,3.8,20.4c2,3.3,2.7,3.8,4.9,3.8c2.3,0,3.1-2.3,3.2-3.6c0.4-4.5-0.3-11.7,1.9-19.2 c0.6-2.1,1.4-4.7,3-7.1c2.1-3.2,7.8-5.7,11.4,0c1.5,2.4,2.4,5,3,7.1c1.7,5.8,2.2,11.8,1.8,16.4c-0.6,6.4,3.2,6.4,3.3,6.4 c2,0,2.9-0.5,4.9-3.8c2-3.3,3.8-9.6,3.8-20.4c-0.1-9.3,2.5-14.3,4.8-18.2c2.2-4,4-6.8,4.1-14.7C72.8,44.2,72.8,43.8,72.8,43.3z"
                                              ></path>
                                              <line
                                                class="st0"
                                                x1="41.4"
                                                y1="31.6"
                                                x2="49.4"
                                                y2="35.9"
                                              ></line>
                                              <path
                                                class="st0"
                                                d="M29.2,105.9c0,0-9.4-11.4-1.1-44.9c0,0,2-10.5,13.3-9.8c11.3,0.6,13.2,7.7,13.2,7.7s5.8,14.5,0.6,46.5"
                                              ></path>
                                              <path
                                                class="st0"
                                                d="M26.3,70.4c0,0,2.7-10.8,11.9-10.2"
                                              ></path>
                                              <path
                                                class="st0"
                                                d="M56.6,70.4c0,0-1.9-10.4-11.7-9.8"
                                              ></path>
                                              <path
                                                class="st1"
                                                d="M41.2,18V8.2c0-3.3-2.7-6-6-6c-3.3,0-6,2.7-6,6V18H41.2z"
                                              ></path>
                                              <polygon
                                                class="st2"
                                                points="67.8,11 41.2,8.4 41.2,13.1 67.8,20"
                                              ></polygon>
                                              <line
                                                class="st1"
                                                x1="35.2"
                                                y1="18"
                                                x2="28.8"
                                                y2="59.1"
                                              ></line>
                                              <polyline
                                                class="st0"
                                                points="85.6,11 67.8,11 67.8,20 85.6,20"
                                              ></polyline>
                                              <path
                                                class="st0"
                                                d="M2.2,70.2c0,0,8.1-2.3,15.9,0"
                                              ></path>
                                              <path
                                                class="st0"
                                                d="M64.7,70.2c0,0,8.1-2.3,15.9,0"
                                              ></path>
                                            </g>
                                          </svg>
                                        </div>
                                        <div class="TPmedia-body TPmedia-middle">
                                          <h3 class="H3">Root Canal<br />Therapy</h3>
                                        </div></span
                                      >
                                    </div>
                                  </div>
                                  <div
                                    data-aos="zoom-in-up"
                                    data-aos-duration="800"
                                    data-aos-delay="400"
                                    class="aos-init aos-animate"
                                  >
                                    <div class="TPcol-xxs-12 TPcol-xs-6 TPcol-md-4">
                                      <span class="TPmedia TPbtn-service"
                                        ><div class="TPmedia-left">
                                          <svg
                                            version="1.1"
                                            id="TPsvg-braces-teeth"
                                            class="TPsvg"
                                            xmlns="http://www.w3.org/2000/svg"
                                            xmlns:xlink="http://www.w3.org/1999/xlink"
                                            x="0"
                                            y="0"
                                            width="99.6"
                                            height="54.5"
                                            viewBox="0 0 99.6 54.5"
                                            xml:space="preserve"
                                            enable-background="new 0 0 99.6 54.5"
                                            aria-labelledby="TPsvg-braces-teeth-title"
                                            aria-describedby="TPsvg-braces-teeth-description"
                                            role="img"
                                          >
                                            <title id="TPsvg-braces-teeth-title">
                                              Teeth with braces icon
                                            </title>
                                            <desc id="TPsvg-braces-teeth-description">
                                              Two side by side teeth with roots held together with
                                              braces
                                            </desc>
                                            <style type="text/css">
                                              ${`#TPsvg-braces-teeth .st0 {
                                                fill: none;
                                                stroke: currentColor;
                                                stroke-width: 4.5;
                                                stroke-linecap: round;
                                                stroke-linejoin: round;
                                                stroke-miterlimit: 10;
                                              }`}
                                            </style>
                                            <path
                                              class="st0"
                                              d="M34.2,36.6c1.2,4,1.5,8.1,1.3,11.3c-0.4,4.4,2.2,4.4,2.3,4.4c1.4,0,2-0.3,3.4-2.6c1.4-2.3,2.6-6.6,2.6-14 c0-6.4,1.7-9.8,3.3-12.5c1.5-2.7,2.7-4.7,2.8-10.1c0-0.3,0-0.6,0-0.9c-0.1-3.8-1.6-6.1-3.9-7.6C43.5,3,40.2,2.2,37,2.3 c-3,0-6,0.6-8,1.5l-0.8,0.4l-0.8-0.4c-1.6-0.7-3.8-1.3-6.2-1.5l-4.1,0c-2.4,0.3-4.7,1-6.5,2.2c-2.3,1.6-3.8,3.8-3.9,7.6 c0,0.3,0,0.6,0,0.9c0,5.4,1.3,7.4,2.8,10.1c1.6,2.7,3.3,6.1,3.3,12.5c0,7.4,1.2,11.7,2.6,14c1.4,2.3,1.8,2.6,3.4,2.6 c1.6,0,2.2-1.6,2.2-2.5c0.3-3.1-0.2-8,1.3-13.2c0,0,1.1-4.2,6-4C32.9,32.8,34.2,36.6,34.2,36.6z"
                                            ></path>
                                            <line
                                              class="st0"
                                              x1="28.2"
                                              y1="4.1"
                                              x2="33.7"
                                              y2="7"
                                            ></line>
                                            <path
                                              class="st0"
                                              d="M77.3,36.6c1.2,4,1.5,8.1,1.3,11.3c-0.4,4.4,2.2,4.4,2.3,4.4c1.4,0,2-0.3,3.4-2.6c1.4-2.3,2.6-6.6,2.6-14 c0-6.4,1.7-9.8,3.3-12.5c1.5-2.7,2.7-4.7,2.8-10.1c0-0.3,0-0.6,0-0.9c-0.1-3.8-1.6-6.1-3.9-7.6c-2.3-1.6-5.6-2.3-8.8-2.3 c-3,0-6,0.6-8,1.5l-0.8,0.4l-0.8-0.4C69,3,66.7,2.5,64.3,2.3l-4.1,0c-2.4,0.3-4.7,1-6.5,2.2c-2.3,1.6-3.8,3.8-3.9,7.6 c0,0.3,0,0.6,0,0.9c0,5.4,1.3,7.4,2.8,10.1c1.6,2.7,3.3,6.1,3.3,12.5c0,7.4,1.2,11.7,2.6,14c1.4,2.3,1.8,2.6,3.4,2.6 c1.6,0,2.2-1.6,2.2-2.5c0.3-3.1-0.2-8,1.3-13.2c0,0,1.1-4.2,6-4C76.1,32.8,77.3,36.6,77.3,36.6z"
                                            ></path>
                                            <line
                                              class="st0"
                                              x1="71.4"
                                              y1="4.1"
                                              x2="76.9"
                                              y2="7"
                                            ></line>
                                            <rect
                                              x="22.5"
                                              y="14.7"
                                              class="st0"
                                              width="11.6"
                                              height="11.5"
                                            ></rect>
                                            <rect
                                              x="65.6"
                                              y="14.7"
                                              class="st0"
                                              width="11.6"
                                              height="11.5"
                                            ></rect>
                                            <line
                                              class="st0"
                                              x1="22.5"
                                              y1="20.5"
                                              x2="2.2"
                                              y2="20.5"
                                            ></line>
                                            <line
                                              class="st0"
                                              x1="34"
                                              y1="20.5"
                                              x2="65.6"
                                              y2="20.5"
                                            ></line>
                                            <line
                                              class="st0"
                                              x1="77.2"
                                              y1="20.5"
                                              x2="97.3"
                                              y2="20.5"
                                            ></line>
                                          </svg>
                                        </div>
                                        <div class="TPmedia-body TPmedia-middle">
                                          <h3 class="H3">Traditional<br />Braces</h3>
                                        </div></span
                                      >
                                    </div>
                                  </div>
                                  <div
                                    data-aos="zoom-in-up"
                                    data-aos-duration="800"
                                    data-aos-delay="500"
                                    class="aos-init aos-animate"
                                  >
                                    <div class="TPcol-xxs-12 TPcol-xs-6 TPcol-md-4">
                                      <span class="TPmedia TPbtn-service"
                                        ><div class="TPmedia-left">
                                          <svg
                                            version="1.1"
                                            id="TPsvg-sleep-sedation"
                                            class="TPsvg"
                                            xmlns="http://www.w3.org/2000/svg"
                                            xmlns:xlink="http://www.w3.org/1999/xlink"
                                            x="0"
                                            y="0"
                                            width="93.1"
                                            height="95.3"
                                            viewBox="0 0 93.1 95.3"
                                            xml:space="preserve"
                                            enable-background="new 0 0 93.1 95.3"
                                          >
                                            <style type="text/css">
                                              ${`#TPsvg-sleep-sedation .st0,
                                              #TPsvg-sleep-sedation .st1,
                                              #TPsvg-sleep-sedation .st2 {
                                                fill: none;
                                                stroke: currentColor;
                                                stroke-width: 4.5;
                                                stroke-miterlimit: 10;
                                              }
                                              #TPsvg-sleep-sedation .st1,
                                              #TPsvg-sleep-sedation .st2 {
                                                stroke-linejoin: round;
                                              }
                                              #TPsvg-sleep-sedation .st2 {
                                                stroke-linecap: round;
                                              }`}
                                            </style>
                                            <g>
                                              <path
                                                class="st0"
                                                d="M90.8,25.2c0,12.7-11.6,23-25.9,23c-3.4,0-9.1-1-12-2l-10.5,3.6l2-10.6c-3.3-3.9-5.3-8.7-5.3-14 c0-12.7,11.6-23,25.9-23C79.2,2.2,90.8,12.5,90.8,25.2z"
                                              ></path>
                                              <polyline
                                                class="st1"
                                                points="51.5,23.4 59.2,23.4 52.7,31.2 60.4,31.2"
                                              ></polyline>
                                              <polyline
                                                class="st1"
                                                points="63.5,18.9 75.7,18.9 65.5,31.2 77.6,31.2"
                                              ></polyline>
                                              <path
                                                class="st1"
                                                d="M58.4,72.9c0,11.1-9,20.2-20.2,20.2c-11.1,0-20.2-9-20.2-20.2c0-11.1,9-20.2,20.2-20.2 C49.4,52.7,58.4,61.7,58.4,72.9z"
                                              ></path>
                                              <path
                                                class="st1"
                                                d="M44.5,80.6c0,3.1-2.5,5.6-5.6,5.6c-3.1,0-5.6-2.5-5.6-5.6c0-3.1,2.5-5.6,5.6-5.6C42,75,44.5,77.5,44.5,80.6z"
                                              ></path>
                                              <path
                                                class="st2"
                                                d="M25.2,68.3c2.1,2.1,5.6,2.1,7.7,0"
                                              ></path>
                                              <path
                                                class="st2"
                                                d="M43.4,68.3c2.1,2.1,5.6,2.1,7.7,0"
                                              ></path>
                                              <path
                                                class="st2"
                                                d="M74.2,54.8v24.9c0,3.6-2.9,6.6-6.6,6.6"
                                              ></path>
                                              <path
                                                class="st2"
                                                d="M8.8,86.2c-3.6,0-6.6-2.9-6.6-6.6V51.4c0-3.6,2.9-6.6,6.6-6.6h32.3"
                                              ></path>
                                            </g>
                                          </svg>
                                        </div>
                                        <div class="TPmedia-body TPmedia-middle">
                                          <h3 class="H3">Sedation<br />Dentistry</h3>
                                        </div></span
                                      >
                                    </div>
                                  </div>
                                  <div
                                    data-aos="zoom-in-up"
                                    data-aos-duration="800"
                                    data-aos-delay="600"
                                    class="aos-init aos-animate"
                                  >
                                    <div class="TPcol-xxs-12 TPcol-xs-6 TPcol-md-4">
                                      <span class="TPmedia TPbtn-service"
                                        ><div class="TPmedia-left">
                                          <svg
                                            version="1.1"
                                            id="TPsvg-teeth-dentures"
                                            class="TPsvg"
                                            xmlns="http://www.w3.org/2000/svg"
                                            xmlns:xlink="http://www.w3.org/1999/xlink"
                                            x="0"
                                            y="0"
                                            width="90.5"
                                            height="87.8"
                                            viewBox="0 0 90.5 87.8"
                                            xml:space="preserve"
                                            enable-background="new 0 0 90.5 87.8"
                                          >
                                            <style type="text/css">
                                              ${`#TPsvg-teeth-dentures .st0,
                                              #TPsvg-teeth-dentures .st1 {
                                                fill: none;
                                                stroke: currentColor;
                                                stroke-width: 4.5;
                                                stroke-linecap: round;
                                                stroke-miterlimit: 10;
                                              }
                                              #TPsvg-teeth-dentures .st1 {
                                                stroke-linejoin: round;
                                              }`}
                                            </style>
                                            <g>
                                              <path
                                                class="st0"
                                                d="M27.9,28.8v10.4c0,0-0.8,4.8,2.6,4.8h11.9c0,0,2.6-0.6,2.6-4.3v-9.4c0,0-4-7.1-11-7.1 C27.9,23.1,27.9,28.8,27.9,28.8z"
                                              ></path>
                                              <path
                                                class="st0"
                                                d="M15,28v9.1c0,0-0.6,4.3,2,4.3h8.9c0,0,2-0.5,2-3.9v-8.2c0,0-3-6.4-8.2-6.4C15,22.8,15,28,15,28z"
                                              ></path>
                                              <path
                                                class="st0"
                                                d="M3.8,28.1v8c0,0-0.5,3.9,1.7,3.9h7.8c0,0,1.7-0.5,1.7-3.5v-7.2c0,0-2.6-5.8-7.2-5.8 C3.8,23.4,3.8,28.1,3.8,28.1z"
                                              ></path>
                                              <path
                                                class="st0"
                                                d="M86.4,28.1v8c0,0,0.5,3.9-1.7,3.9h-7.8c0,0-1.7-0.5-1.7-3.5v-7.2c0,0,2.6-5.8,7.2-5.8 C86.4,23.4,86.4,28.1,86.4,28.1z"
                                              ></path>
                                              <path
                                                class="st0"
                                                d="M75.1,28v9.1c0,0,0.6,4.3-2,4.3h-8.9c0,0-2-0.5-2-3.9v-8.2c0,0,3-6.4,8.2-6.4C75.2,22.8,75.1,28,75.1,28z"
                                              ></path>
                                              <path
                                                class="st0"
                                                d="M62.2,28.8v10.4c0,0,0.8,4.8-2.6,4.8H47.7c0,0-2.6-0.6-2.6-4.3v-9.4c0,0,4-7.1,11-7.1 C62.2,23.1,62.2,28.8,62.2,28.8z"
                                              ></path>
                                              <path
                                                class="st0"
                                                d="M86.4,28.1c1.8-1.2,1.8-3.2,1.8-3.2v-11c0,0-11.6-11.6-43.7-11.6C12.3,2.2,2.2,14.1,2.2,14.1v10.2 c0,1.5,1.5,3.8,1.5,3.8"
                                              ></path>
                                              <path
                                                class="st1"
                                                d="M44.7,53.7L44.7,53.7c0-1.8-1.4-1-3.2-1h-6.7c-1.8,0-3.2-0.8-3.2,1v12.4c0,0,0.7,5.2,6.7,5.2 c6.1,0,6.4-4.5,6.4-4.5V53.7z"
                                              ></path>
                                              <path
                                                class="st1"
                                                d="M31.5,53.4L31.5,53.4c0-1.6-1.3-0.7-2.9-0.7h-5.9c-1.6,0-2.9-0.9-2.9,0.7v11.3c0,0,0,4.8,4.1,4.8 c5.8,0,7.5-4.2,7.5-4.2V53.4z"
                                              ></path>
                                              <path
                                                class="st1"
                                                d="M19.9,53.9L19.9,53.9c0-1.6-1.2-2.9-2.6-2.9h-5.4c-1.4,0-2.6,1.3-2.6,2.9v8.7c0,0,0,4.6,3.7,4.6 c5.3,0,6.8-4,6.8-4V53.9z"
                                              ></path>
                                              <path
                                                class="st1"
                                                d="M69.5,53.9L69.5,53.9c0-1.6,1.2-2.9,2.6-2.9h5.4c1.4,0,2.6,1.3,2.6,2.9v8.7c0,0,0,4.6-3.7,4.6 c-5.3,0-6.8-4-6.8-4V53.9z"
                                              ></path>
                                              <path
                                                class="st1"
                                                d="M57.8,53.4L57.8,53.4c0-1.6,1.3-0.7,2.9-0.7h5.9c1.6,0,2.9-0.9,2.9,0.7v11.3c0,0-0.1,4.8-4.1,4.8 c-5.8,0-7.5-4.2-7.5-4.2V53.4z"
                                              ></path>
                                              <path
                                                class="st1"
                                                d="M57.8,53.7L57.8,53.7c0-1.8-1.4-1-3.2-1h-6.7c-1.8,0-3.2-0.8-3.2,1v12.4c0,0,0.7,5.2,6.7,5.2 c6.1,0,6.4-4.5,6.4-4.5V53.7z"
                                              ></path>
                                              <path
                                                class="st1"
                                                d="M9.1,58c0,0-2,1.6-2,4.6V75c0,0,10.1,10.6,37.9,10.6c27.8,0,36.9-11.4,36.9-11.4V63.2c0,0,0.5-2.9-1.8-4.4"
                                              ></path>
                                            </g>
                                          </svg>
                                        </div>
                                        <div class="TPmedia-body TPmedia-middle">
                                          <h3 class="H3">Dentures</h3>
                                        </div></span
                                      >
                                    </div>
                                  </div>
                                  <div
                                    data-aos="zoom-in-up"
                                    data-aos-duration="800"
                                    data-aos-delay="700"
                                    class="aos-init aos-animate"
                                  >
                                    <div class="TPcol-xxs-12 TPcol-xs-6 TPcol-md-4">
                                      <span class="TPmedia TPbtn-service"
                                        ><div class="TPmedia-left">
                                          <svg
                                            version="1.1"
                                            id="TPsvg-tooth-clean-bubbles"
                                            class="TPsvg"
                                            xmlns="http://www.w3.org/2000/svg"
                                            xmlns:xlink="http://www.w3.org/1999/xlink"
                                            x="0"
                                            y="0"
                                            width="96.6"
                                            height="78.9"
                                            viewBox="0 0 96.6 78.9"
                                            xml:space="preserve"
                                            enable-background="new 0 0 96.6 78.9"
                                          >
                                            <style type="text/css">
                                              ${`#TPsvg-tooth-clean-bubbles .st0 {
                                                fill: none;
                                                stroke: currentColor;
                                                stroke-width: 4.5;
                                                stroke-linecap: round;
                                                stroke-linejoin: round;
                                                stroke-miterlimit: 10;
                                              }`}
                                            </style>
                                            <g>
                                              <path
                                                class="st0"
                                                d="M89.6,35.9c1.7-1.7,2.8-4,2.8-6.5c0-5-4.1-9.1-9.1-9.1c-4.9,0-8.9,3.9-9.1,8.8c-0.8-0.2-1.6-0.3-2.4-0.3 c-6.4,0-11.5,5.2-11.5,11.5c0,6.4,5.2,11.5,11.5,11.5c2.3,0,4.3-0.7,6.1-1.8c1.7,2,4.3,3.3,7.1,3.3c5.2,0,9.3-4.2,9.3-9.3 C94.4,40.5,92.4,37.5,89.6,35.9z"
                                              ></path>
                                              <path
                                                class="st0"
                                                d="M33.1,49.9c2-0.6,3.7-1.9,4.7-3.9c2-3.8,0.6-8.6-3.3-10.6c-3.8-2-8.4-0.6-10.5,3c-0.5-0.4-1.1-0.8-1.8-1.2 c-4.9-2.6-10.9-0.7-13.4,4.2c-2.6,4.9-0.7,10.9,4.2,13.4c1.7,0.9,3.6,1.2,5.4,1.1c0.5,2.2,1.9,4.2,4.1,5.4 c3.9,2.1,8.8,0.6,10.9-3.4C34.8,55.4,34.6,52.3,33.1,49.9z"
                                              ></path>
                                              <path
                                                class="st0"
                                                d="M28.1,6.2c0,2.2-1.8,4-4,4c-2.2,0-4-1.8-4-4s1.8-4,4-4C26.4,2.2,28.1,4,28.1,6.2z"
                                              ></path>
                                              <path
                                                class="st0"
                                                d="M85.1,65.7c0,2.4-1.9,4.3-4.3,4.3c-2.4,0-4.3-1.9-4.3-4.3c0-2.4,1.9-4.3,4.3-4.3 C83.1,61.4,85.1,63.3,85.1,65.7z"
                                              ></path>
                                              <path
                                                class="st0"
                                                d="M29.1,61.8c0-0.3,1,6.2,3.7,11.5c1.6,3,2.3,3.4,4.3,3.4c2,0,2.7-2,2.8-3.1c0.4-4-0.3-10.1,1.7-16.8 c0.6-1.8,1.2-4.1,2.6-6.2c1.8-2.8,6.8-5,9.9,0c1.3,2.1,2.1,4.3,2.6,6.2c1.5,5,1.9,10.3,1.6,14.3c-0.5,5.6,2.8,5.6,2.9,5.6 c1.7,0,2.5-0.4,4.2-3.4c1.7-2.9,3.3-8.4,3.3-17.7c0-1.5,0.1-2.8,0.2-4.1"
                                              ></path>
                                              <path
                                                class="st0"
                                                d="M76.2,23.7c-0.6-3.6-2.3-5.8-4.8-7.5c-2.9-2-7.1-2.9-11.2-2.9c-3.8,0-7.6,0.8-10.1,1.9l-1,0.4l-1-0.4 c-2-0.9-4.9-1.6-7.9-1.9l-5.2,0.1c-3.1,0.3-6,1.2-8.2,2.7c-0.7,0.5-1.3,1-1.8,1.5"
                                              ></path>
                                              <line
                                                class="st0"
                                                x1="49.1"
                                                y1="15.6"
                                                x2="56.1"
                                                y2="19.3"
                                              ></line>
                                              <path
                                                class="st0"
                                                d="M30.1,34.7c-0.3-1.4-0.9-2.7-1.8-3.7c-0.5-0.6-1.2-1.1-1.9-1.5c1.4-1.4,2.3-3.3,2.3-5.4c0-4.1-3.3-7.5-7.5-7.5 c-4,0-7.3,3.2-7.5,7.2c-0.6-0.1-1.3-0.2-2-0.2c-5.2,0-9.5,4.2-9.5,9.5c0,4.1,2.7,7.7,6.4,8.9"
                                              ></path>
                                              <path
                                                class="st0"
                                                d="M79,33.1c0,0-0.9-2.8-4.8-4"
                                              ></path>
                                            </g>
                                          </svg>
                                        </div>
                                        <div class="TPmedia-body TPmedia-middle">
                                          <h3 class="H3">Routine<br />Cleanings</h3>
                                        </div></span
                                      >
                                    </div>
                                  </div>
                                  <div
                                    data-aos="zoom-in-up"
                                    data-aos-duration="800"
                                    data-aos-delay="800"
                                    class="aos-init aos-animate"
                                  >
                                    <div class="TPcol-xxs-12 TPcol-xs-6 TPcol-md-4">
                                      <span class="TPmedia TPbtn-service"
                                        ><div class="TPmedia-left">
                                          <svg
                                            version="1.1"
                                            id="TPsvg-tooth-roots"
                                            class="TPsvg"
                                            xmlns="http://www.w3.org/2000/svg"
                                            xmlns:xlink="http://www.w3.org/1999/xlink"
                                            x="0"
                                            y="0"
                                            width="76.9"
                                            height="88.5"
                                            viewBox="0 0 76.9 88.5"
                                            xml:space="preserve"
                                            enable-background="new 0 0 76.9 88.5"
                                          >
                                            <style type="text/css">
                                              ${`#TPsvg-tooth-roots .st0,
                                              #TPsvg-tooth-roots .st1 {
                                                fill: none;
                                                stroke: currentColor;
                                                stroke-width: 4.5;
                                                stroke-linecap: round;
                                                stroke-miterlimit: 10;
                                              }
                                              #TPsvg-tooth-roots .st0 {
                                                stroke-linejoin: round;
                                              }
                                              #TPsvg-tooth-roots .st1 {
                                                stroke-dasharray: 0.2227, 7.7962;
                                              }`}
                                            </style>
                                            <g>
                                              <path
                                                class="st0"
                                                d="M74.7,18.9C74.4,12.5,71.9,8.8,68,6.1c-3.9-2.6-9.4-3.9-14.8-3.8c-5.1,0-10,1-13.4,2.6l-1.4,0.6l-1.3-0.6 c-2.7-1.2-6.4-2.1-10.4-2.5l-6.9,0.1c-4.1,0.5-7.9,1.6-10.9,3.6C5,8.8,2.5,12.5,2.3,18.9c0,0.5,0,1,0,1.4c0.1,9.1,2.2,12.4,4.7,17 c2.6,4.5,5.6,10.3,5.5,21c0,12.4,2.1,19.7,4.4,23.5c2.3,3.9,3.1,4.5,5.6,4.5c2.7,0,3.6-2.7,3.7-4.1c0.5-5.2-0.4-13.5,2.2-22.2 c0.7-2.4,1.7-5.5,3.5-8.2c2.4-3.7,9.1-6.6,13.2,0c1.7,2.8,2.7,5.8,3.5,8.2c2,6.7,2.6,13.6,2.1,19c-0.6,7.4,3.7,7.4,3.8,7.4 c2.3,0,3.3-0.6,5.6-4.5c2.3-3.8,4.4-11.1,4.4-23.5c-0.1-10.7,2.9-16.5,5.5-21c2.5-4.6,4.6-7.9,4.7-17 C74.7,19.9,74.7,19.4,74.7,18.9z"
                                              ></path>
                                              <line
                                                class="st0"
                                                x1="38.5"
                                                y1="5.4"
                                                x2="47.7"
                                                y2="10.3"
                                              ></line>
                                              <path
                                                class="st0"
                                                d="M11.3,47.8c0,0,2.7-5.5,5.7-2.6c3,2.9,6.3,1.6,8.2,0c1.9-1.6,4.1-3.4,6.7-3.1c2.6,0.4,4.5,6.1,4.5,6.1"
                                              ></path>
                                              <path
                                                class="st0"
                                                d="M46,53.5c0,0,1.8-4.6,5.2-5.2c3.3-0.6,4.1,3.9,5.9,2.6c1.9-1.3,0.9-8.9,5.6-8.7l4.7,0.2"
                                              ></path>
                                              <line
                                                class="st1"
                                                x1="17.8"
                                                y1="53.5"
                                                x2="23.8"
                                                y2="62.6"
                                              ></line>
                                              <line
                                                class="st1"
                                                x1="20.8"
                                                y1="68.3"
                                                x2="20.8"
                                                y2="70.9"
                                              ></line>
                                              <line
                                                class="st1"
                                                x1="56.7"
                                                y1="71.8"
                                                x2="59.3"
                                                y2="59.6"
                                              ></line>
                                            </g>
                                          </svg>
                                        </div>
                                        <div class="TPmedia-body TPmedia-middle">
                                          <h3 class="H3">Gum Disease<br />Prevention</h3>
                                        </div></span
                                      >
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                `
        || props.name === 'technology-1' && html`
                <div class="TPbw TPBandCol ">
                    <table
                      width="100%"
                      class="TPartBox "
                      border="0"
                      cellspacing="0"
                      cellpadding="0"
                    >
                      <tbody>
                        <tr valign="top">
                          <td id="" class="TParticle">
                            <div class="TProw">
                              <div class="TPcol-sm-7 TPtext-center">
                                <div
                                  data-aos="fade-right"
                                  data-aos-duration="1200"
                                  data-aos-delay="0"
                                  class="aos-init aos-animate"
                                >
                                  <h2 class="TPsubtitle TPtext-uppercase">
                                    Advanced Technology <br title="b11" /><span
                                      class="TPtitle TPtext-lowercase"
                                      >for high quality care</span
                                    >
                                  </h2>
                                </div>
                                <br title="b11" />
                                <div
                                  data-aos="fade-right"
                                  data-aos-duration="1200"
                                  data-aos-delay="200"
                                  class="aos-init aos-animate"
                                >
                                  Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do
                                  eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                                  enim ad minim veniam, quis nostrud exercitation ullamco laboris
                                  nisi ut aliquip.
                                </div>
                                <br title="b11" />
                                <br title="b11" />
                                <div
                                  data-aos="fade-right"
                                  data-aos-duration="1200"
                                  data-aos-delay="400"
                                  class="aos-init aos-animate"
                                >
                                  <a
                                    class="TPbtn TPbtn-lg TPbtn-primary"
                                    href="#"
                                    title="Subpage Double Boxes Dental Implants Beaverton, OR dentist"
                                    >Learn More About Our Technology</a
                                  >
                                </div>
                              </div>
                              <div class="TPcol-sm-5">
                                <div
                                  data-aos="fade-up"
                                  data-aos-duration="1200"
                                  data-aos-delay="0"
                                  class="aos-init aos-animate"
                                >
                                  <img
                                    class="TPimg-responsive TPimg-circle"
                                    src="https://fpoimg.com/458x458?text=detail photo"
                                    border="0"
                                    alt="image of art3"
                                    title="image of art3"
                                  />
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                `
        || props.name === 'call-to-action-1' && html`
                  <style>
                    ${`.${props.name} .TPcta-row {
                      margin: 0;
                    }
                    .${props.name} .TPcta,
                    .${props.name} .TPcta-col {
                      padding: 0;
                      text-align: center;
                    }
                    .${props.name} .TPcta img {
                      width: 100%;
                      transition: 0.25s all;
                    }
                    .${props.name} .TPcta:hover img,
                    .${props.name} .TPcta:focus img,
                    .${props.name} .TPcta:active img {
                      opacity: 0.7;
                    }
                    .${props.name} .TPcta .TPthumbnail {
                      padding: 0;
                      text-decoration: none !important;
                    }
                    .${props.name} .TPcta .TPtoken {
                      margin-top: -70px;
                    }
                    .${props.name} .TPcta .TPcaption {
                      padding: 9px 7.5%;
                    }
                    `}
                    ${`.${props.name} .TPline:after {
                      content: '';
                      display: block;
                      height: 1px;
                      width: 20%;
                      background: #68686b;
                      margin: 10px auto 15px;
                    }
                    .${props.name} .TPtoken {
                      position: relative;
                      margin: 0 auto 20px;
                      z-index: 1;
                      width: 100px;
                      height: 100px;
                      -webkit-border-radius: 5000px;
                      -moz-border-radius: 5000px;
                      border-radius: 5000px;
                    }
                    .${props.name} .TPtoken:before {
                      display: block;
                      content: '';
                      height: 100%;
                      width: 100%;
                      position: absolute;
                      -webkit-border-radius: 5000px;
                      -moz-border-radius: 5000px;
                      border-radius: 5000px;
                      border: 2.5px solid #d7d9db;
                    }
                    .${props.name} .TPtoken-color1 {
                      background: #333333;
                      border: 3px solid #aaaaaa;
                    }
                    .${props.name} .TPtoken-color2 {
                      background: #aaaaaa;
                      border: 3px solid #aaaaaa;
                    }
                    .${props.name} .TPtoken svg {
                      width: 100%;
                      height: 100%;
                      padding: 15px 20px;
                      color: #fff;
                    }
                    .${props.name} .TPtoken .st0,
                    .${props.name} .TPtoken .st1 { stroke-width: 3.5px !important; }
                    .${props.name} .TPsm .fa { color: #68686b; }
                    .${props.name} .TPsm:hover .fa { color: #aaaaaa; }
                  `}
                  </style>
                  <div class="TPbw TPBandCol ">
                    <table
                      width="100%"
                      class="TPartBox "
                      border="0"
                      cellspacing="0"
                      cellpadding="0"
                    >
                      <tbody>
                        <tr valign="top">
                          <td id="" class="TParticle">
                            <div class="TProw TPcta-row">
                              <div class="TPcol-lg-6 TPcta-col">
                                <div class="TProw TPcta-row">
                                  <div class="TPcol-sm-6 TPcta">
                                    <a
                                      class="TPthumbnail"
                                      href="#"
                                      title="Subpage - Enhanced Client 27 - Beaverton, OR"
                                      ><img
                                        class="TPimg-responsive"
                                        src="https://fpoimg.com/480x480?text=CTA photo"
                                        border="0"
                                        alt="Invisalign Clear Aligners"
                                        title="Invisalign Clear Aligners"
                                      />
                                      <div
                                        data-aos="fade-down"
                                        data-aos-duration="900"
                                        class="aos-init aos-animate"
                                      >
                                        <div class="TPtoken TPtoken-color1">
                                          <svg
                                            id="TPsvg-clear-aligner-2"
                                            class="TPsvg"
                                            height="32.7"
                                            width="100"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 100 32.7"
                                            fill="currentColor"
                                            aria-labelledby="TPsvg-clear-aligner-2-title"
                                            aria-describedby="TPsvg-clear-aligner-2-description"
                                            role="img"
                                          >
                                            <title id="TPsvg-clear-aligner-2-title">
                                              Clear aligner icon
                                            </title>
                                            <desc id="TPsvg-clear-aligner-2-description">
                                              Frontal view of an upper tooth clear aligner
                                            </desc>
                                            <path
                                              d="M87 27.2c1.4.9 3 1.6 4.8 1.6h.1c1.6 0 3-.6 4.1-1.7 3.5-3.5 5.3-18 2.9-23.8C97.7.4 95.7 0 94.6 0c-4.1 0-7.7 3.8-10 7.1-1.5-3.4-3.6-5.2-6.4-5.2-4.1 0-6.8 4.6-8.4 9.4-1.6-5.1-4.8-9.4-10.4-9.4-5 0-7.9 3.9-9.4 8.7-1.6-4.8-4.4-8.7-9.4-8.7-5.6 0-8.8 4.3-10.5 9.4-1.6-4.8-4.3-9.4-8.4-9.4-2.7 0-4.9 1.7-6.4 5.2C13.1 3.8 9.5 0 5.4 0 4.3 0 2.3.4 1.1 3.4-1.3 9.2.5 23.6 4 27.1a5.7 5.7 0 004.1 1.7h.1c1.7 0 3.4-.8 4.8-1.6 1.4 3 7.4 3 9.8 3 2.8 0 5.1-.2 5.2-.2l.9-.1.3-.5c1 1.3 2.6 2.2 4.4 2.4 4.3.5 10.8 1.4 14.5.6.7-.2 1.3-.5 1.9-.9.5.4 1.2.7 1.9.9 1.1.2 2.4.3 3.9.3 3.4 0 7.6-.5 10.7-.9a6.7 6.7 0 004.3-2.4l.3.5.9.1c.1 0 2.4.2 5.2.2 2.4-.1 8.5-.1 9.8-3zM8.1 25c-.6.1-1-.2-1.4-.6-2.1-2.1-4.1-14.6-2-19.6l.7-1c2.7 0 6.3 4.1 8.5 8.1-.6 2.9-1 6.5-1.1 10.6-1.1.9-3 2.5-4.7 2.5zm14.7 1.3c-4.3 0-5.8-.6-6.3-.8v-2.1c.1-4.6.5-8.4 1.2-11.4.5-2.4 1.8-6.3 3.9-6.3 3.1 0 6.2 9.3 6.2 14.6 0 2.7-.8 4.8-1.2 5.8l-3.8.2zM48 27.8c0 .4-.3.8-.7.9a51 51 0 01-13.3-.6c-1.2-.2-2.3-1.2-2.3-2.3 0-3.3.7-19.9 8.8-19.9 7.1 0 7.5 16 7.5 19.2v2.7zm46.6-24c.2 0 .4.3.7 1 2 4.9 0 17.5-2.1 19.6-.4.4-.9.7-1.4.6-1.6 0-3.6-1.5-4.6-2.5-.1-4.1-.5-7.6-1.1-10.5 2.3-4 5.8-8.2 8.5-8.2zM65.8 28c-3.8.5-10.1 1.3-13.1.6a1 1 0 01-.7-.9V25.9 25c0-3.2.4-19.2 7.5-19.2 8.2 0 8.8 16.6 8.8 19.9 0 1-1.1 2.1-2.5 2.3zm11.4-1.7l-3.8-.1c-.5-1.1-1.2-3.2-1.2-5.8 0-5.2 3.1-14.6 6.2-14.6 2.2 0 3.4 3.9 3.9 6.3.7 3 1.1 6.8 1.2 11.4v2c-.5.2-2 .8-6.3.8z"
                                            ></path>
                                          </svg>
                                        </div>
                                      </div>
                                      <div class="TPcaption">
                                        <h2 class="TPline">Invisalign</h2>
                                        <p>
                                          Lorem ipsum dolor sit amet, consectetur adipisicing
                                          elit, sed do eiusmod tempor incididunt ut labore et
                                          dolore magna aliqua. Ut enim ad minim veniam, quis
                                          nostrud exercitation ullamco laboris nisi ut aliquip ex
                                          ea commodo consequat.
                                        </p>
                                      </div>
                                      <div class="TPthumbnail-footer">Read More ${'>'}</div></a
                                    >
                                  </div>
                                  <div class="TPcol-sm-6 TPcta">
                                    <a
                                      class="TPthumbnail"
                                      href="#"
                                      title="Subpage - Enhanced Client 27 - Beaverton, OR"
                                      ><img
                                        class="TPimg-responsive"
                                        src="https://fpoimg.com/480x480?text=CTA photo"
                                        border="0"
                                        alt="Orthodontic Services"
                                        title="Orthodontic Services"
                                      />
                                      <div
                                        data-aos="fade-down"
                                        data-aos-duration="900"
                                        data-aos-delay="200"
                                        class="aos-init aos-animate"
                                      >
                                        <div class="TPtoken TPtoken-color1">
                                          <svg
                                            version="1.1"
                                            id="TPsvg-braces-teeth"
                                            class="TPsvg"
                                            xmlns="http://www.w3.org/2000/svg"
                                            xmlns:xlink="http://www.w3.org/1999/xlink"
                                            x="0"
                                            y="0"
                                            width="99.6"
                                            height="54.5"
                                            viewBox="0 0 99.6 54.5"
                                            xml:space="preserve"
                                            enable-background="new 0 0 99.6 54.5"
                                            aria-labelledby="TPsvg-braces-teeth-title"
                                            aria-describedby="TPsvg-braces-teeth-description"
                                            role="img"
                                          >
                                            <title id="TPsvg-braces-teeth-title">
                                              Teeth with braces icon
                                            </title>
                                            <desc id="TPsvg-braces-teeth-description">
                                              Two side by side teeth with roots held together with
                                              braces
                                            </desc>
                                            <style type="text/css">
                                              ${`#TPsvg-braces-teeth .st0 {
                                                fill: none;
                                                stroke: currentColor;
                                                stroke-width: 4.5;
                                                stroke-linecap: round;
                                                stroke-linejoin: round;
                                                stroke-miterlimit: 10;
                                              }`}
                                            </style>
                                            <path
                                              class="st0"
                                              d="M34.2,36.6c1.2,4,1.5,8.1,1.3,11.3c-0.4,4.4,2.2,4.4,2.3,4.4c1.4,0,2-0.3,3.4-2.6c1.4-2.3,2.6-6.6,2.6-14 c0-6.4,1.7-9.8,3.3-12.5c1.5-2.7,2.7-4.7,2.8-10.1c0-0.3,0-0.6,0-0.9c-0.1-3.8-1.6-6.1-3.9-7.6C43.5,3,40.2,2.2,37,2.3 c-3,0-6,0.6-8,1.5l-0.8,0.4l-0.8-0.4c-1.6-0.7-3.8-1.3-6.2-1.5l-4.1,0c-2.4,0.3-4.7,1-6.5,2.2c-2.3,1.6-3.8,3.8-3.9,7.6 c0,0.3,0,0.6,0,0.9c0,5.4,1.3,7.4,2.8,10.1c1.6,2.7,3.3,6.1,3.3,12.5c0,7.4,1.2,11.7,2.6,14c1.4,2.3,1.8,2.6,3.4,2.6 c1.6,0,2.2-1.6,2.2-2.5c0.3-3.1-0.2-8,1.3-13.2c0,0,1.1-4.2,6-4C32.9,32.8,34.2,36.6,34.2,36.6z"
                                            ></path>
                                            <line
                                              class="st0"
                                              x1="28.2"
                                              y1="4.1"
                                              x2="33.7"
                                              y2="7"
                                            ></line>
                                            <path
                                              class="st0"
                                              d="M77.3,36.6c1.2,4,1.5,8.1,1.3,11.3c-0.4,4.4,2.2,4.4,2.3,4.4c1.4,0,2-0.3,3.4-2.6c1.4-2.3,2.6-6.6,2.6-14 c0-6.4,1.7-9.8,3.3-12.5c1.5-2.7,2.7-4.7,2.8-10.1c0-0.3,0-0.6,0-0.9c-0.1-3.8-1.6-6.1-3.9-7.6c-2.3-1.6-5.6-2.3-8.8-2.3 c-3,0-6,0.6-8,1.5l-0.8,0.4l-0.8-0.4C69,3,66.7,2.5,64.3,2.3l-4.1,0c-2.4,0.3-4.7,1-6.5,2.2c-2.3,1.6-3.8,3.8-3.9,7.6 c0,0.3,0,0.6,0,0.9c0,5.4,1.3,7.4,2.8,10.1c1.6,2.7,3.3,6.1,3.3,12.5c0,7.4,1.2,11.7,2.6,14c1.4,2.3,1.8,2.6,3.4,2.6 c1.6,0,2.2-1.6,2.2-2.5c0.3-3.1-0.2-8,1.3-13.2c0,0,1.1-4.2,6-4C76.1,32.8,77.3,36.6,77.3,36.6z"
                                            ></path>
                                            <line
                                              class="st0"
                                              x1="71.4"
                                              y1="4.1"
                                              x2="76.9"
                                              y2="7"
                                            ></line>
                                            <rect
                                              x="22.5"
                                              y="14.7"
                                              class="st0"
                                              width="11.6"
                                              height="11.5"
                                            ></rect>
                                            <rect
                                              x="65.6"
                                              y="14.7"
                                              class="st0"
                                              width="11.6"
                                              height="11.5"
                                            ></rect>
                                            <line
                                              class="st0"
                                              x1="22.5"
                                              y1="20.5"
                                              x2="2.2"
                                              y2="20.5"
                                            ></line>
                                            <line
                                              class="st0"
                                              x1="34"
                                              y1="20.5"
                                              x2="65.6"
                                              y2="20.5"
                                            ></line>
                                            <line
                                              class="st0"
                                              x1="77.2"
                                              y1="20.5"
                                              x2="97.3"
                                              y2="20.5"
                                            ></line>
                                          </svg>
                                        </div>
                                      </div>
                                      <div class="TPcaption">
                                        <h2 class="TPline">Orthodontics</h2>
                                        <p>
                                          Lorem ipsum dolor sit amet, consectetur adipisicing
                                          elit, sed do eiusmod tempor incididunt ut labore et
                                          dolore magna aliqua. Ut enim ad minim veniam, quis
                                          nostrud exercitation ullamco laboris nisi ut aliquip ex
                                          ea commodo consequat.
                                        </p>
                                      </div>
                                      <div class="TPthumbnail-footer">Read More ${'>'}</div></a
                                    >
                                  </div>
                                </div>
                              </div>
                              <div class="TPcol-lg-6 TPcta-col">
                                <div class="TProw TPcta-row">
                                  <div class="TPcol-sm-6 TPcta">
                                    <a
                                      class="TPthumbnail"
                                      href="#"
                                      title="Subpage - Enhanced Client 27 - Beaverton, OR"
                                      ><img
                                        class="TPimg-responsive"
                                        src="https://fpoimg.com/480x480?text=CTA photo"
                                        border="0"
                                        alt="Our Advanced Dental Technology"
                                        title="Our Advanced Dental Technology"
                                      />
                                      <div
                                        data-aos="fade-down"
                                        data-aos-duration="900"
                                        data-aos-delay="400"
                                        class="aos-init aos-animate"
                                      >
                                        <div class="TPtoken TPtoken-color1">
                                          <svg
                                            version="1.1"
                                            id="TPsvg-teeth-xray-2"
                                            class="TPsvg"
                                            xmlns="http://www.w3.org/2000/svg"
                                            xmlns:xlink="http://www.w3.org/1999/xlink"
                                            x="0"
                                            y="0"
                                            width="91.3"
                                            height="67.3"
                                            viewBox="0 0 91.3 67.3"
                                            xml:space="preserve"
                                            enable-background="new 0 0 91.3 67.3"
                                          >
                                            <style type="text/css">
                                              ${`#TPsvg-teeth-xray-2 .st0 {
                                                fill: none;
                                                stroke: currentColor;
                                                stroke-width: 4.5;
                                                stroke-miterlimit: 10;
                                              }
                                              #TPsvg-teeth-xray-2 .st1 {
                                                stroke-linecap: round;
                                              }
                                              #TPsvg-teeth-xray-2 .st1,
                                              #TPsvg-teeth-xray-2 .st2 {
                                                fill: none;
                                                stroke: currentColor;
                                                stroke-width: 4.5;
                                                stroke-linejoin: round;
                                                stroke-miterlimit: 10;
                                              }`}
                                            </style>
                                            <g>
                                              <path
                                                class="st0"
                                                d="M2.2,2.2v62.8h81.2c3.1,0,5.6-2.5,5.6-5.6V2.2H2.2z"
                                              ></path>
                                              <path
                                                class="st1"
                                                d="M49.1,45.6c0.9,3,1.2,6.1,0.9,8.5c-0.3,3.3,1.7,3.3,1.7,3.3c1,0,1.5-0.3,2.5-2c1-1.7,2-5,2-10.6 c0-4.8,1.3-7.4,2.5-9.5c1.1-2.1,2.1-3.5,2.1-7.6c0-0.2,0-0.4,0-0.6c-0.1-2.9-1.2-4.6-3-5.8c-1.8-1.2-4.2-1.7-6.7-1.7 c-2.3,0-4.5,0.5-6,1.2l-0.6,0.3L44,20.8c-1.2-0.5-2.9-1-4.7-1.1l-3.1,0c-1.8,0.2-3.6,0.7-4.9,1.6c-1.7,1.2-2.9,2.9-3,5.8 c0,0.2,0,0.4,0,0.6c0,4.1,1,5.6,2.1,7.6c1.2,2,2.5,4.6,2.5,9.5c0,5.6,0.9,8.9,2,10.6c1,1.7,1.4,2,2.5,2c1.2,0,1.6-1.2,1.7-1.9 c0.2-2.4-0.2-6.1,1-10c0,0,0.8-3.2,4.5-3C48.1,42.7,49.1,45.6,49.1,45.6z"
                                              ></path>
                                              <line
                                                class="st1"
                                                x1="44.6"
                                                y1="21.1"
                                                x2="48.7"
                                                y2="23.3"
                                              ></line>
                                              <path
                                                class="st1"
                                                d="M8.6,43.6c0.7-0.6,1.7-1.1,3.2-1c3.6,0.2,4.5,3,4.5,3c0.9,3,1.2,6.1,0.9,8.5c-0.3,3.3,1.7,3.3,1.7,3.3 c1,0,1.5-0.3,2.5-2c1-1.7,2-5,2-10.6c0-4.8,1.3-7.4,2.5-9.5c1.1-2.1,2.1-3.5,2.1-7.6c0-0.2,0-0.4,0-0.6c-0.1-2.9-1.2-4.6-3-5.8 c-1.8-1.2-4.2-1.7-6.7-1.7c-2.3,0-4.5,0.5-6.1,1.2l-0.6,0.3l-0.6-0.3c-0.7-0.3-1.6-0.6-2.6-0.8"
                                              ></path>
                                              <line
                                                class="st1"
                                                x1="11.9"
                                                y1="21.1"
                                                x2="16"
                                                y2="23.3"
                                              ></line>
                                              <path
                                                class="st1"
                                                d="M82.7,19.7c-1.8,0.1-3.6,0.6-4.8,1.1l-0.6,0.3l-0.6-0.3c-1.2-0.5-2.9-1-4.7-1.1l-3.1,0 c-1.8,0.2-3.6,0.7-4.9,1.6c-1.7,1.2-2.9,2.9-3,5.8c0,0.2,0,0.4,0,0.6c0,4.1,1,5.6,2.1,7.6c1.2,2,2.5,4.6,2.5,9.5 c0,5.6,0.9,8.9,2,10.6c1,1.7,1.4,2,2.5,2c1.2,0,1.6-1.2,1.7-1.9c0.2-2.4-0.2-6.1,1-10c0,0,0.8-3.2,4.5-3c3.6,0.2,4.5,3,4.5,3 c0.9,3,1.2,6.1,0.9,8.5"
                                              ></path>
                                              <line
                                                class="st1"
                                                x1="77.3"
                                                y1="21.1"
                                                x2="81.4"
                                                y2="23.3"
                                              ></line>
                                              <line
                                                class="st2"
                                                x1="13.6"
                                                y1="10.1"
                                                x2="33.4"
                                                y2="10.1"
                                              ></line>
                                            </g>
                                          </svg>
                                        </div>
                                      </div>
                                      <div class="TPcaption">
                                        <h2 class="TPline">Our Technology</h2>
                                        <p>
                                          Lorem ipsum dolor sit amet, consectetur adipisicing
                                          elit, sed do eiusmod tempor incididunt ut labore et
                                          dolore magna aliqua. Ut enim ad minim veniam, quis
                                          nostrud exercitation ullamco laboris nisi ut aliquip ex
                                          ea commodo consequat.
                                        </p>
                                      </div>
                                      <div class="TPthumbnail-footer">Read More ${'>'}</div></a
                                    >
                                  </div>
                                  <div class="TPcol-sm-6 TPcta">
                                    <a
                                      class="TPthumbnail"
                                      href="#"
                                      title="Subpage - Enhanced Client 27 - Beaverton, OR"
                                      ><img
                                        class="TPimg-responsive"
                                        src="https://fpoimg.com/480x480?text=CTA photo"
                                        border="0"
                                        alt="The World Class Orthodontics Difference"
                                        title="The World Class Orthodontics Difference"
                                      />
                                      <div
                                        data-aos="fade-down"
                                        data-aos-duration="900"
                                        data-aos-delay="600"
                                        class="aos-init aos-animate"
                                      >
                                        <div class="TPtoken TPtoken-color1">
                                          <svg
                                            version="1.1"
                                            id="TPsvg-tooth-hands-2"
                                            class="TPsvg"
                                            xmlns="http://www.w3.org/2000/svg"
                                            xmlns:xlink="http://www.w3.org/1999/xlink"
                                            x="0"
                                            y="0"
                                            width="92.9"
                                            height="85.2"
                                            viewBox="0 0 92.9 85.2"
                                            xml:space="preserve"
                                            enable-background="new 0 0 92.9 85.2"
                                          >
                                            <style type="text/css">
                                              ${`#TPsvg-tooth-hands-2 .st0,
                                              #TPsvg-tooth-hands-2 .st1 {
                                                fill: none;
                                                stroke: currentColor;
                                                stroke-width: 4.5;
                                                stroke-miterlimit: 10;
                                              }
                                              #TPsvg-tooth-hands-2 .st1 {
                                                stroke-linecap: round;
                                                stroke-linejoin: round;
                                              }`}
                                            </style>
                                            <g>
                                              <path
                                                class="st0"
                                                d="M76.3,58.6l3.6-13.3c0,0,0.4-2.8-2.1-4.1c-2.5-1.3-4.8,1-4.8,1l-7.7,15.3v19.1v8.8"
                                              ></path>
                                              <path
                                                class="st0"
                                                d="M78.5,50.4l2.9-8.8l-1.7-17.1c0,0-0.8-3,2.5-3.8c3.3-0.8,4.5,2.2,4.5,2.2l2.9,12.2c2.9,12.2,0,21.6,0,21.6 L82,76.4v8.8"
                                              ></path>
                                              <path
                                                class="st0"
                                                d="M77.2,41.2l-3.4-11.9c-0.5-1.7,0.5-3.5,2.2-4c1.7-0.5,3.5,0.5,4,2.2"
                                              ></path>
                                              <path
                                                class="st0"
                                                d="M16.6,58.6L13,45.2c0,0-0.4-2.8,2.1-4.1c2.4-1.3,4.8,1,4.8,1l7.7,15.3v19.1v8.8"
                                              ></path>
                                              <path
                                                class="st0"
                                                d="M14.4,50.4l-2.8-8.8l1.7-17.1c0,0,0.8-3-2.4-3.8c-3.3-0.8-4.5,2.2-4.5,2.2L3.5,35.3c-2.9,12.2,0,21.6,0,21.6 L11,76.4v8.8"
                                              ></path>
                                              <path
                                                class="st0"
                                                d="M15.8,41.2l3.4-11.9c0.5-1.7-0.5-3.5-2.2-4s-3.5,0.5-4,2.2"
                                              ></path>
                                              <path
                                                class="st1"
                                                d="M66.2,11.3c-0.1-3.5-1.5-5.5-3.6-7c-2.1-1.4-5.1-2.1-8.1-2.1c-2.8,0-5.5,0.6-7.3,1.4L46.5,4l-0.7-0.3 C44.3,3,42.2,2.5,40,2.3l-3.8,0c-2.2,0.2-4.3,0.9-5.9,2c-2.1,1.5-3.5,3.5-3.6,7c0,0.3,0,0.5,0,0.8c0,5,1.2,6.7,2.6,9.3 c1.4,2.5,3.1,5.6,3,11.4c0,6.8,1.1,10.7,2.4,12.8c1.3,2.1,1.7,2.4,3.1,2.4c1.5,0,2-1.5,2-2.3c0.3-2.9-0.2-7.3,1.2-12.1 c0.4-1.3,0.9-3,1.9-4.5c1.3-2,4.9-3.6,7.2,0c0.9,1.5,1.5,3.1,1.9,4.5c1.1,3.6,1.4,7.4,1.1,10.3c-0.4,4,2,4,2.1,4 c1.3,0,1.8-0.3,3.1-2.4c1.3-2.1,2.4-6.1,2.4-12.8c0-5.8,1.6-9,3-11.4c1.4-2.5,2.5-4.3,2.6-9.2C66.2,11.9,66.2,11.6,66.2,11.3z"
                                              ></path>
                                              <line
                                                class="st1"
                                                x1="46.5"
                                                y1="4"
                                                x2="51.5"
                                                y2="6.6"
                                              ></line>
                                            </g>
                                          </svg>
                                        </div>
                                      </div>
                                      <div class="TPcaption">
                                        <h2 class="TPline">Our Difference</h2>
                                        <p>
                                          Lorem ipsum dolor sit amet, consectetur adipisicing
                                          elit, sed do eiusmod tempor incididunt ut labore et
                                          dolore magna aliqua. Ut enim ad minim veniam, quis
                                          nostrud exercitation ullamco laboris nisi ut aliquip ex
                                          ea commodo consequat.
                                        </p>
                                      </div>
                                      <div class="TPthumbnail-footer">Read More ${'>'}</div></a
                                    >
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                `
        || props.name === 'photos-1' && html`
                  <div class="TPbw TPBandCol ">
                    <table
                      width="100%"
                      class="TPartBox "
                      border="0"
                      cellspacing="0"
                      cellpadding="0"
                    >
                      <tbody>
                        <tr valign="top">
                          <td id="" class="TParticle">
                            <div class="TProw">
                              <div class="TPcol-md-3 TPcol-xs-6 TPpadding-0">
                                <div
                                  data-aos="fade-up"
                                  data-aos-duration="800"
                                  data-aos-delay="200"
                                  class="aos-init aos-animate"
                                >
                                  <img
                                    class="TPimg-responsive TPcenter-block"
                                    src="https://fpoimg.com/376x376?text=Office Detail Photo"
                                    border="0"
                                    alt="Alt Tag"
                                    title="Alt Tag"
                                  />
                                </div>
                              </div>
                              <div class="TPcol-md-3 TPcol-xs-6 TPpadding-0">
                                <div
                                  data-aos="fade-up"
                                  data-aos-duration="800"
                                  data-aos-delay="400"
                                  class="aos-init aos-animate"
                                >
                                  <img
                                    class="TPimg-responsive TPcenter-block"
                                    src="https://fpoimg.com/376x376?text=Office Detail Photo"
                                    border="0"
                                    alt="Alt Tag"
                                    title="Alt Tag"
                                  />
                                </div>
                              </div>
                              <div class="TPcol-md-3 TPcol-xs-6 TPpadding-0">
                                <div
                                  data-aos="fade-up"
                                  data-aos-duration="800"
                                  data-aos-delay="600"
                                  class="aos-init aos-animate"
                                >
                                  <img
                                    class="TPimg-responsive TPcenter-block"
                                    src="https://fpoimg.com/376x376?text=Office Detail Photo"
                                    border="0"
                                    alt="Alt Tag"
                                    title="Alt Tag"
                                  />
                                </div>
                              </div>
                              <div class="TPcol-md-3 TPcol-xs-6 TPpadding-0">
                                <div
                                  data-aos="fade-up"
                                  data-aos-duration="800"
                                  data-aos-delay="800"
                                  class="aos-init aos-animate"
                                >
                                  <img
                                    class="TPimg-responsive TPcenter-block"
                                    src="https://fpoimg.com/376x376?text=Office Detail Photo"
                                    border="0"
                                    alt="Alt Tag"
                                    title="Alt Tag"
                                  />
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                `
        || props.name === 'multi-doctors-1' && html`
                  <style>
                    ${`
                      .${props.name} .TPthumbnail {
                        padding: 0;
                        position:relative;
                      }
                      .${props.name} .TPcaption.TPoverlay{
                        position: absolute;
                        bottom: 10px;
                        right: 0;
                        background-color: #ffffff;
                        width: 80%;
                        padding: 5px 10px;
                        border-top: 4px solid #00acee;
                        text-align: right;
                      }
                      .${props.name} .TPcaption h2 small { font-size:85% }
                    `}
                  </style>
                  <div class="TPbw TPBandCol ">
                    <table
                      width="100%"
                      class="TPartBox "
                      border="0"
                      cellspacing="0"
                      cellpadding="0"
                    >
                      <tbody>
                        <tr valign="top">
                          <td id="" class="TParticle">
                            <div class="TProw">
                              <div class="TPcol-sm-6 TPcol-md-3">
                                <div
                                  data-aos="fade-up"
                                  data-aos-duration="800"
                                  data-aos-delay="0"
                                  class="aos-init aos-animate"
                                >
                                  <div class="TPthumbnail">
                                    <img
                                      class="TPimg-responsive"
                                      src="https://fpoimg.com/263x378?text=Doctor Portrait Photo"
                                      border="0"
                                      alt="Dr. Lorem Ipsum at your dental practice "
                                      title="Dr. Lorem Ipsum at your dental practice "
                                    />
                                    <div class="TPcaption TPoverlay TPstyle3">
                                      <b>Dr. Lorem Ipsum</b>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div class="TPcol-sm-6 TPcol-md-3">
                                <div
                                  data-aos="fade-up"
                                  data-aos-duration="800"
                                  data-aos-delay="200"
                                  class="aos-init aos-animate"
                                >
                                  <div class="TPthumbnail">
                                    <img
                                      class="TPimg-responsive"
                                      src="https://fpoimg.com/263x378?text=Doctor Portrait Photo"
                                      border="0"
                                      alt="Dr. Lorem Ipsum at your dental practice "
                                      title="Dr. Lorem Ipsum at your dental practice "
                                    />
                                    <div class="TPcaption TPoverlay TPstyle3">
                                      <b>Dr. Lorem Ipsum</b>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div class="TPcol-sm-6 TPcol-md-3">
                                <div
                                  data-aos="fade-up"
                                  data-aos-duration="800"
                                  data-aos-delay="400"
                                  class="aos-init aos-animate"
                                >
                                  <div class="TPthumbnail">
                                    <img
                                      class="TPimg-responsive"
                                      src="https://fpoimg.com/263x378?text=Doctor Portrait Photo"
                                      border="0"
                                      alt="Dr. Lorem Ipsum at your dental practice "
                                      title="Dr. Lorem Ipsum at your dental practice "
                                    />
                                    <div class="TPcaption TPoverlay TPstyle3">
                                      <b>Dr. Lorem Ipsum</b>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div class="TPcol-sm-6 TPcol-md-3">
                                <div
                                  data-aos="fade-up"
                                  data-aos-duration="800"
                                  data-aos-delay="600"
                                  class="aos-init aos-animate"
                                >
                                  <div class="TPthumbnail">
                                    <img
                                      class="TPimg-responsive"
                                      src="https://fpoimg.com/263x378?text=Doctor Portrait Photo"
                                      border="0"
                                        alt="Dr. Lorem Ipsum at your dental practice "
                                        title="Dr. Lorem Ipsum at your dental practice "
                                    />
                                    <div class="TPcaption TPoverlay TPstyle3">
                                        <b>Dr. Lorem Ipsum</b>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div class="TPcol-sm-6 TPcol-md-3">
                                <div
                                  data-aos="fade-up"
                                  data-aos-duration="800"
                                  data-aos-delay="800"
                                  class="aos-init aos-animate"
                                >
                                  <div class="TPthumbnail">
                                    <img
                                      class="TPimg-responsive"
                                      src="https://fpoimg.com/263x378?text=Doctor Portrait Photo"
                                      border="0"
                                      alt="Dr. Lorem Ipsum at your dental practice "
                                      title="Dr. Lorem Ipsum at your dental practice "
                                    />
                                    <div class="TPcaption TPoverlay TPstyle3">
                                      <b>Dr. Lorem Ipsum</b>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div class="TPcol-sm-6 TPcol-md-3">
                                <div
                                  data-aos="fade-up"
                                  data-aos-duration="800"
                                  data-aos-delay="1000"
                                  class="aos-init aos-animate"
                                >
                                  <div class="TPthumbnail">
                                    <img
                                      class="TPimg-responsive"
                                      src="https://fpoimg.com/263x378?text=Doctor Portrait Photo"
                                      border="0"
                                      alt="Dr. Lorem Ipsum at your dental practice "
                                      title="Dr. Lorem Ipsum at your dental practice "
                                    />
                                    <div class="TPcaption TPoverlay TPstyle3">
                                      <b>Dr. Lorem Ipsum</b>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div class="TPcol-sm-6 TPcol-md-3">
                                <div
                                  data-aos="fade-up"
                                  data-aos-duration="800"
                                  data-aos-delay="1200"
                                  class="aos-init aos-animate"
                                >
                                  <div class="TPthumbnail">
                                    <img
                                      class="TPimg-responsive"
                                      src="https://fpoimg.com/263x378?text=Doctor Portrait Photo"
                                      border="0"
                                      alt="Dr. Lorem Ipsum at your dental practice "
                                      title="Dr. Lorem Ipsum at your dental practice "
                                    />
                                    <div class="TPcaption TPoverlay TPstyle3">
                                      <b>Dr. Lorem Ipsum</b>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div class="TPcol-sm-6 TPcol-md-3">
                                <div
                                  data-aos="fade-up"
                                  data-aos-duration="800"
                                  data-aos-delay="1400"
                                  class="aos-init aos-animate"
                                >
                                  <div class="TPthumbnail">
                                    <img
                                      class="TPimg-responsive"
                                      src="https://fpoimg.com/263x378?text=Doctor Portrait Photo"
                                      border="0"
                                      alt="Dr. Lorem Ipsum your dental practice "
                                      title="Dr. Lorem Ipsum your dental practice "
                                    />
                                    <div class="TPcaption TPoverlay TPstyle3">
                                      <b>Dr. Lorem Ipsum</b>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div class="TPcol-sm-6 TPcol-md-3">
                                <div
                                  data-aos="fade-up"
                                  data-aos-duration="800"
                                  data-aos-delay="1600"
                                  class="aos-init aos-animate"
                                >
                                  <div class="TPthumbnail">
                                    <img
                                      class="TPimg-responsive"
                                      src="https://fpoimg.com/263x378?text=Doctor Portrait Photo"
                                      border="0"
                                      alt="Dr. Lorem Ipsum	at your dental practice "
                                      title="Dr. Lorem Ipsum	at your dental practice "
                                    />
                                    <div class="TPcaption TPoverlay TPstyle3">
                                      <b>Dr. Lorem Ipsum </b>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <br title="b11" />
                              <br title="b11" />
                              <div class="TPcol-sm-6 TPcol-md-3">
                                <div
                                  data-aos="fade-up"
                                  data-aos-duration="800"
                                  data-aos-delay="1800"
                                  class="aos-init aos-animate"
                                >
                                  <div class="TPthumbnail">
                                    <img
                                      class="TPimg-responsive"
                                      src="https://fpoimg.com/263x378?text=Doctor Portrait Photo"
                                      border="0"
                                      alt="Dr. Lorem Ipsum  at your dental practice "
                                      title="Dr. Lorem Ipsum  at your dental practice "
                                    />
                                    <div class="TPcaption TPoverlay TPstyle3">
                                      <b>Dr. Lorem Ipsum </b>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <br title="b11" />
                            <br title="b11" />
                            <br title="b11" />
                            <br title="b11" />
                            <div class="TProw">
                              <div class="TPcol-md-12">
                                <div
                                  data-aos="fade-up"
                                  data-aos-duration="800"
                                  data-aos-delay="2000"
                                  class="aos-init"
                                >
                                  <h2 class="H2">Meet Our Doctors</h2>
                                  <br title="b11" />
                                  <hr />
                                  Lorem ipsum dolor sit, amet consectetur adipisicing elit.
                                  Nesciunt laborum soluta obcaecati dolor quae eaque debitis
                                  ullam, beatae id dicta praesentium perferendis repudiandae
                                  maxime libero, minima eius? Assumenda, architecto officiis.
                                  Lorem ipsum dolor, sit amet consectetur adipisicing elit.
                                  Quibusdam labore sunt mollitia facere expedita corporis
                                  cupiditate eaque minus quis ipsam, eveniet laboriosam doloribus.
                                  Dignissimos quam dolorum possimus ducimus, iure alias. Lorem
                                  ipsum dolor sit amet consectetur adipisicing elit. Enim dolores
                                  nesciunt aut sint doloremque, quaerat ipsam odit quos id
                                  repellat voluptatem voluptas dolorum. Tenetur dolor nobis ab
                                  nulla quam rerum.
                                </div>
                              </div>
                            </div>
                            <br title="b11" />
                            <div class="TProw">
                              <div class="TPcol-md-12 TPtext-center">
                                <a
                                  class="TPbtn TPbtn-primary"
                                  href="#"
                                  title="Meet Our Doctors your dental practice Tuscumbia, AL dentist Tuscumbia AL"
                                  >Learn More About Our Doctors</a
                                >
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                `
        || props.name === 'multi-locations-1' && html`
                  <style>
                    ${`
                      .${props.name} .TPdrop-shadow{
                        text-shadow:4px 4px 4px rgba(0,0,0,.3);
                      }
                    `}
                  </style>
                  <div class="TPbw TPBandCol ">
                    <table
                      width="100%"
                      class="TPartBox "
                      border="0"
                      cellspacing="0"
                      cellpadding="0"
                    >
                      <tbody>
                        <tr valign="top">
                          <td id="" class="TParticle">
                            <div class="TProw">
                              <div class="TPcol-md-8 TPcol-md-offset-2">
                                <div
                                  data-aos="fade-up"
                                  data-aos-duration="800"
                                  data-aos-delay="0"
                                  class="aos-init aos-animate"
                                >
                                  <center>
                                    <h2 class="TPtext-white TPdrop-shadow">
                                      Multiple Locations to Serve You
                                    </h2>
                                    <center></center>
                                  </center>
                                </div>
                                <br title="b11" />
                                <div class="TProw">
                                  <div
                                    data-aos="fade-up"
                                    data-aos-duration="800"
                                    data-aos-delay="250"
                                    class="aos-init aos-animate"
                                  >
                                    <div class="TPcol-md-6">
                                      <div class="TPwell"
                                        ><h2 class="H2">SW Portland</h2>
                                        <br title="b11" />1234 SW Multnomah blvd, suite 120,
                                        Portland Or, 97123</div
                                      >
                                    </div>
                                  </div>
                                  <br class="TPvisible-sm TPvisible-xs" />
                                  <div
                                    data-aos="fade-up"
                                    data-aos-duration="800"
                                    data-aos-delay="500"
                                    class="aos-init aos-animate"
                                  >
                                    <div class="TPcol-md-6">
                                      <div class="TPwell"
                                        ><h2 class="H2">pearl district</h2>
                                        <br title="b11" />1234 NW 16th, suite 120, Portland Or,
                                        97123</div
                                      >
                                    </div>
                                  </div>
                                </div>
                                <br title="b11" />
                                <div class="TProw">
                                  <div
                                    data-aos="fade-up"
                                    data-aos-duration="800"
                                    data-aos-delay="750"
                                    class="aos-init aos-animate"
                                  >
                                    <div class="TPcol-md-6">
                                      <div class="TPwell"
                                        ><h2 class="H2">Hawthorn</h2>
                                        <br title="b11" />111 SE Hawthorn st suite 1, Portland, Or
                                        97123</div
                                      >
                                    </div>
                                  </div>
                                  <br class="TPvisible-sm TPvisible-xs" />
                                  <div
                                    data-aos="fade-up"
                                    data-aos-duration="800"
                                    data-aos-delay="1000"
                                    class="aos-init aos-animate"
                                  >
                                    <div class="TPcol-md-6">
                                      <div class="TPwell"
                                        ><h2 class="H2">Gresham</h2>
                                        <br title="b11" />121 SE 181st Ave suite 2, Gresham, OR
                                        97123</div
                                      >
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <br title="b11" />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                `
        }
        </div>
      `)
    }

    // PopUpWidget for drag drop stuff. holds the thumbnails
    const InsertBand = (props) => {
      const insertBandHeading = html`<h5> To add a component:<br /> <strong>Click</strong> and <strong>Drag</strong> one onto the design,<br />between two main sections. </h5>`;
      return (html`
        <${PopUpWidget} buttonContent="Insert a new band" heading=${insertBandHeading}>
          <${DroppableThumbnail} name="smile-gallery-1" height="302" draggable />
          <${DroppableThumbnail} name="logo-and-socials-1" height="328" draggable />
          <${DroppableThumbnail} name="specials-1" height="926" draggable />
          <${DroppableThumbnail} name="specials-2" height="466" draggable />
          <${DroppableThumbnail} name="associations-1" height="337" draggable />
          <${DroppableThumbnail} name="video-reviews-1" height="612" bkgImg draggable />
          <${DroppableThumbnail} name="services-1" height="543" bkgImg draggable />
          <${DroppableThumbnail} name="technology-1" height="578" bkgImg draggable />
          <${DroppableThumbnail} name="call-to-action-1" height="723" fullWidth draggable />
          <${DroppableThumbnail} name="photos-1" height="376" fullWidth draggable />
          <${DroppableThumbnail} name="multi-doctors-1" height="1696" draggable />
          <${DroppableThumbnail} name="multi-locations-1" height="400" bkgImg draggable />
        <//>
      `)
    }

    // empty
    const DropReciever = (props) => {
      const recieverRef = useRef(null);
      const [stateData, stateSetData] = useState('');
      // change style of dropzone when dragging component across it
      const allowDrop = (e) => {
        recieverRef.current.style.padding = '2em';
        recieverRef.current.style.background = '#eeeeee';
        // allows drop even to fire 
        e.preventDefault();
      }
      const cancelEvent = (e) => {
        // allows drop event to fire
        e.preventDefault();
      }
      // when dragging out of dropzone, reset padding and color of dropzone
      const endDrop = () => {
        recieverRef.current.style = recieverRef.current.childElementCount > 0 ? 'padding: 60px 0' : 'padding: .1em';
      }
      // finish drop event and set padding
      // putting drag drop data transfer stuff back into react state
      const doDrop = (e) => {
        stateSetData(JSON.parse(e.dataTransfer.getData('text/plain')));
        recieverRef.current.style = 'padding: 60px 0;';
        e.preventDefault();
      }
      // if dropped prop is true, all css for minimizing to thumbnail is discarded
      return (html`
        <div onDrop="${(e) => doDrop(e)}" onDragEnter=${e => allowDrop(e)} onDragOver=${e => cancelEvent(e)} onDragLeave=${endDrop} ref=${recieverRef} class="TPBand drop-recieve ${stateData.bkgImg && 'bkgImg'}" style=${{ padding: '.1em' }} >
          <${DroppableThumbnail} name=${stateData.name} fullWidth=${stateData.fullWidth} bkgImg=${stateData.bkgImg} dropped=${stateData ? true : false} /> 
        </div>
      `)
    }

    // main widget that holds all the features as buttons. color swap feature button, drag drop feature button, etc.
    const CustomizeWidget = (props) => {
      const [state, setState] = useState({
        styles: processedStyles,
        theme: '0'
      });
      // toggle for gear button sets CustomizeWidget div to display none so that the styles that live in the component still render if you toggle the widget closed. That way the drag and drop elements still have access to the styles they need.
      const [toggle, setToggle] = useState(false);
      const toggleWidget = () => {
        setToggle(() => !toggle);
      }
      return (html`
        <div 
        style=${{
          position: 'fixed',
          bottom: '15px',
          right: '15px',
          zIndex: '1000',
          display: 'flex',
          flexFlow: 'row nowrap',
          alignItems: 'flex-end'
        }}
        >
          <${GearSVGBtn} 
            onClick=${toggleWidget}
            style=${{
          width: '50px',
          height: '50px',
          lineHeight: '0',
          border: '0',
          backgroundColor: 'rgba(255,255,255,.7)',
          boxShadow: '2px 2px 2px rgb(0 0 0 / 25%)'
        }}
          />
          <div 
            class="CustomizeWidget"
            style=${{
          display: toggle ? 'flex' : 'none',
          flexFlow: 'column nowrap',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          background: 'rgba(255,255,255,.8)',
          boxShadow: '4px 4px 14px rgba(0,0,0,.5)'
        }}
          >
            <${ColorSwapWidget} state=${state} setState=${setState} />
            <${LogoUpload} />
            <${LogoUpload} mobile />
            <${CopyStylesToClipboard} state=${state} />
            <${InsertBand} />
          </div>
        </div>
      `)
    }

    // ****************
    // helper functions
    // ****************
    function rgba(rgbColor) {
      const r = rgbColor && rgbColor.match(/rgba?\((\d{1,3}),\s?\d{1,3},\s?\d{1,3}(,\s?[\d\.]{1,})?\)/) !== null
        ? rgbColor.match(/rgba?\((\d{1,3}),\s?\d{1,3},\s?\d{1,3}(,\s?[\d\.]{1,})?\)/)[1]
        : 0;
      const g = rgbColor && rgbColor.match(/rgba?\(\d{1,3},\s?(\d{1,3}),\s?\d{1,3}(,\s?[\d\.]{1,})?\)/) !== null
        ? rgbColor.match(/rgba?\(\d{1,3},\s?(\d{1,3}),\s?\d{1,3}(,\s?[\d\.]{1,})?\)/)[1]
        : 0;
      const b = rgbColor && rgbColor.match(/rgba?\(\d{1,3},\s?\d{1,3},\s?(\d{1,3})(,\s?[\d\.]{1,})?\)/) !== null
        ? rgbColor.match(/rgba?\(\d{1,3},\s?\d{1,3},\s?(\d{1,3})(,\s?[\d\.]{1,})?\)/)[1]
        : 0;
      const a = rgbColor && rgbColor.match(/rgba\(\d{1,3},\s?\d{1,3},\s?\d{1,3},\s?([\d\.]{1,})\)/) !== null
        ? rgbColor.match(/rgba\(\d{1,3},\s?\d{1,3},\s?\d{1,3},\s?([\d\.]{1,})\)/)[1]
        : 1;
      const aRes = a.toString().match(/^\s?\./) && a.toString().match(/^\s?\./)[0] !== null ? `0${a}` : a;
      return { r: r, g: g, b: b, a: aRes }
    };
    function rgbToHex(r, g, b, a) {
      if (a) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b) + componentToHex(Math.floor((+a / 100) * 255));
      }
      return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
      function componentToHex(c) {
        if (c === undefined || c === null) {
          c = 0;
        }
        typeof c === "string" ? c = Number(c) : c;
        var hex = c.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      }
    }
    function colorAndAlpha2rgba(hex, alpha) {
      const { red: r, green: g, blue: b } = hexToRgba(hex);
      const alphaPercent = Number(alpha) / 100;
      return `rgba(${r}, ${g} ${b}, ${alphaPercent})`;
    }
    function colorAndAlpha2rgbaHex(hex, alpha) {
      const { red: r, green: g, blue: b } = hexToRgba(hex);
      return rgbToHex(r, g, b, alpha);
    }
    function hexToRgba(hex) {
      var result = /#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{0,2})$/i.exec(hex);
      return result ? {
        red: parseInt(result[1], 16),
        green: parseInt(result[2], 16),
        blue: parseInt(result[3], 16),
        alpha: parseInt(result[4], 16)
      } : null;
    }
    function titleCaseAndRemoveDash(str) {
      return str.split('-').map(word => word.toString().charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }


    // Renders html
    render(html`
    <${CustomizeWidget} />
    `, document.querySelector('#color-swap'));

    [...document.querySelectorAll('.drop-recieve')].forEach((dr) => render(html`
      <${DropReciever}><//>
    `, document.body, dr));
  }
})();