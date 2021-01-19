(() => {
  // check for preact then load/reload app
  if (this.preact === undefined) {
    loadPreact(App);
    function loadPreact(cb) {
      let s = document.createElement('script');
      s.src = "https://www.weo2.com/tpn/c/C777/docs/htm-preact-standalone.js";
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
    }
  } else {
    App();
  }

  function App() {
    // get preact functions
    const html = preact.html,
      render = preact.render,
      useState = preact.useState,
      useCallback = preact.useCallback;

    // demo
    function Counter() {
      const [value, setValue] = useState(0);
      const increment = useCallback(() => {
        setValue(value + 1);
      }, [value]);

      return html`
      <div>
        Counter: ${value}
        <button onClick=${increment}>Increment</button>
      </div>
    `;
    }

    // filter button
    const FilterButton = (props) => {
      return html`
      <button class="filter-button" name="${props.filterName}" active="${props.active}">${props.children}</button>
    `;
    }

    // filter sort component
    const FilterSort = (props) => {
      return html`
    <div>
      <${FilterButton} key="${props.filterName}">filter button</>
        <${Counter} />
        hello
    </div>
    `;
    };

    // Renders html
    render(html`<${FilterSort} />`, document.body);
  }
})();