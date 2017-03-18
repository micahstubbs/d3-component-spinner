/* global d3 */
    // This function simulates fetching with a 2 second delay.
    // You can replace stuff here with e.g. d3.csv.
    function fetchData(callback) {
      setTimeout(() => {
        callback([6, 5, 4, 3, 2, 1]);
      }, 2000);
    }

    // This function visualizes the data.
    function visualize(selection, data) {
      const rects = selection
        .selectAll('rect')
        .data(data);
      rects.exit().remove();
      rects
        .enter().append('rect')
          .attr('x', (d, i) => (i * 100) + 182)
          .attr('y', d => 400)
          .attr('width', 50)
          .attr('height', 0)
        .merge(rects)
        .transition().duration(1000).ease(d3.easeBounce)
          .delay((d, i) => i * 500)
          .attr('y', d => 400 - (d * 50))
          .attr('height', d => d * 50);
    }

    // The stuff below uses d3-component to display a spinner
    // while the data loads, then render the visualization after loading.

    // This stateless component renders a static "wheel" made of circles,
    // and rotates it depending on the value of props.angle.
    const wheel = d3.component('g')
      .create(function () {
        const minRadius = 4;
        const maxRadius = 10;
        const numDots = 10;
        const wheelRadius = 40;
        const rotation = 0;
        const rotationIncrement = 3;

        const radius = d3.scaleLinear()
        .domain([0, numDots - 1])
        .range([maxRadius, minRadius]);

        const angle = d3.scaleLinear()
        .domain([0, numDots])
        .range([0, Math.PI * 2]);

        d3.select(this)
        .selectAll('circle').data(d3.range(numDots))
        .enter().append('circle')
          .attr('cx', d => Math.sin(angle(d)) * wheelRadius)
          .attr('cy', d => Math.cos(angle(d)) * wheelRadius)
          .attr('r', radius);
      })
      .render(function (d) {
        d3.select(this).attr('transform', `rotate(${d})`);
      });

    // This component with a local timer makes the wheel spin.
    const spinner = ((() => {
      const timer = d3.local();
      return d3.component('g')
        .create(function (d) {
          timer.set(this, d3.timer((elapsed) => {
            d3.select(this).call(wheel, elapsed * d.speed);
          }));
        })
        .render(function (d) {
          d3.select(this).attr('transform', `translate(${d.x},${d.y})`);
        })
        .destroy(function (d) {
          timer.get(this).stop();
          return d3.select(this)
              .attr('fill-opacity', 1)
            .transition().duration(3000)
              .attr('transform', `translate(${d.x},${d.y}) scale(10)`)
              .attr('fill-opacity', 0);
        });
    })());

    // This component displays the visualization.
    const visualization = d3.component('g')
      .render(function (d) {
        d3.select(this).call(visualize, d.data);
      });

    // This component manages an svg element, and
    // either displays a spinner or text,
    // depending on the value of the `loading` state.
    const app = d3.component('g')
      .render(function (d) {
        d3.select(this)
            .call(spinner, !d.loading ? [] : {
              x: d.width / 2,
              y: d.height / 2,
              speed: 0.2,
            })
            .call(visualization, d.loading ? [] : d);
      });

    // Kick off the app.
    function main() {
      const svg = d3.select('svg');
      const width = svg.attr('width');
      const height = svg.attr('height');

      // Initialize the app to be "loading".
      svg.call(app, {
        width,
        height,
        loading: true,
      });

      // Invoke the data fetching logic.
      fetchData((data) => {
        svg.call(app, {
          width,
          height,
          loading: false,
          data,
        });
      });
    }
    main();
