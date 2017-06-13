const {h, Component} = require('preact');

const renderSpy = require('./preact-render-spy');

it('renders into scratch', async () => {
  class Node extends Component {
    render() {
      return <div />;
    }
  }
  const context = renderSpy(<Node />);
  expect(context.output).toEqual(<div />);
});
